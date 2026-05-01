package main

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/corridrlabs/corridor/backend/internal/core"
	"github.com/google/uuid"
)

const lemonSqueezyEntitlement = "Payday Pro"

type UpgradeRequest struct {
	PlanSlug    string `json:"plan_slug"`
	PackageID   string `json:"package_id"`
	Entitlement string `json:"entitlement"`
	CallbackURL string `json:"callback_url"`
}

type CheckoutResponse struct {
	CheckoutURL string `json:"checkout_url"`
	CheckoutID  string `json:"checkout_id,omitempty"`
	VariantID   string `json:"variant_id,omitempty"`
	PlanSlug    string `json:"plan_slug"`
	PackageID   string `json:"package_id"`
	Provider    string `json:"provider"`
}

type CustomerPortalResponse struct {
	PortalURL string `json:"portal_url"`
	Provider  string `json:"provider"`
}

type VerifyCheckoutRequest struct {
	Reference string `json:"reference"`
	PlanSlug  string `json:"plan_slug"`
}

func (h *Handler) handleUpgrade(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req UpgradeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	planSlug := normalizePlanSlug(req.PlanSlug)
	if planSlug == "" {
		planSlug = "PRO" // Default to PRO
	}

	// Corridor Internal Billing: Subscribe using wallet balance
	err := h.svc.SubscribeAccount(r.Context(), accountID, strings.ToUpper(planSlug))
	if err != nil {
		http.Error(w, fmt.Sprintf("Upgrade failed: %v", err), http.StatusPaymentRequired)
		return
	}

	writeJSON(w, http.StatusOK, CheckoutResponse{
		PlanSlug:  planSlug,
		PackageID: "monthly",
		Provider:  "corridor",
		CheckoutURL: "/dashboard", // Direct success redirect
	})
}

func (h *Handler) verifyCheckout(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil {
		http.Error(w, "account not found", http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"account_id":              accountID,
		"provider":                "lemon_squeezy",
		"user_tier":               account.UserTier,
		"subscription_status":     account.SubscriptionStatus,
		"subscription_expires_at": account.SubscriptionExpires,
		"entitlement":             lemonSqueezyEntitlement,
	})
}

func (h *Handler) handleCustomerPortal(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil {
		http.Error(w, "account not found", http.StatusNotFound)
		return
	}

	portalURL := h.resolveCustomerPortalURL(account)
	writeJSON(w, http.StatusOK, CustomerPortalResponse{
		PortalURL: portalURL,
		Provider:  "lemon_squeezy",
	})
}

func (h *Handler) getBillingFees(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	writeJSON(w, http.StatusOK, h.svc.GetPublicBillingFeeSchedule())
}

func (h *Handler) getSupportedCurrencies(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"currencies": h.svc.GetSupportedCurrencies(),
	})
}

func (h *Handler) trackBillingUsage(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Feature string `json:"feature"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	result, err := h.svc.TrackUsageAndBill(r.Context(), accountID, req.Feature)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, result)
}

type lemonCheckoutRequest struct {
	AccountID    string
	AccountName  string
	AccountEmail string
	PlanSlug     string
	PackageID    string
	VariantID    string
	CallbackURL  string
	Entitlement  string
}

type lemonCheckoutAPIResponse struct {
	Data struct {
		ID         string `json:"id"`
		Attributes struct {
			URL string `json:"url"`
		} `json:"attributes"`
	} `json:"data"`
}

func (h *Handler) createLemonSqueezyCheckout(ctx context.Context, req lemonCheckoutRequest) (string, string, error) {
	if strings.TrimSpace(h.config.LemonSqueezy.ApiKey) == "" || strings.TrimSpace(h.config.LemonSqueezy.StoreID) == "" {
		return "", "", fmt.Errorf("lemonsqueezy api key and store id are required")
	}

	storeID, err := strconv.Atoi(strings.TrimSpace(h.config.LemonSqueezy.StoreID))
	if err != nil {
		return "", "", fmt.Errorf("invalid lemonsqueezy store id: %w", err)
	}

	relationships := map[string]any{
		"store": map[string]any{
			"data": map[string]any{
				"type": "stores",
				"id":   strconv.Itoa(storeID),
			},
		},
		"variant": map[string]any{
			"data": map[string]any{
				"type": "variants",
				"id":   req.VariantID,
			},
		},
	}

	payload := map[string]any{
		"data": map[string]any{
			"type": "checkouts",
			"attributes": map[string]any{
				"checkout_data": map[string]any{
					"email": req.AccountEmail,
					"name":  req.AccountName,
					"custom": map[string]any{
						"account_id":  req.AccountID,
						"plan_slug":   req.PlanSlug,
						"package_id":  req.PackageID,
						"entitlement": req.Entitlement,
					},
				},
				"product_options": map[string]any{
					"redirect_url": req.CallbackURL,
				},
				"preview":   true,
				"test_mode": false,
			},
			"relationships": relationships,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return "", "", err
	}

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.lemonsqueezy.com/v1/checkouts", bytes.NewReader(body))
	if err != nil {
		return "", "", err
	}
	request.Header.Set("Accept", "application/vnd.api+json")
	request.Header.Set("Content-Type", "application/vnd.api+json")
	request.Header.Set("Authorization", "Bearer "+strings.TrimSpace(h.config.LemonSqueezy.ApiKey))

	resp, err := http.DefaultClient.Do(request)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", "", err
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return "", "", fmt.Errorf("lemonsqueezy checkout creation failed: %s", strings.TrimSpace(string(responseBody)))
	}

	var checkoutResp lemonCheckoutAPIResponse
	if err := json.Unmarshal(responseBody, &checkoutResp); err != nil {
		return "", "", err
	}

	return strings.TrimSpace(checkoutResp.Data.Attributes.URL), strings.TrimSpace(checkoutResp.Data.ID), nil
}

func (h *Handler) resolveLemonVariantID(packageID string) (string, error) {
	switch normalizeBillingPackageID(packageID) {
	case "monthly":
		if strings.TrimSpace(h.config.LemonSqueezy.MonthlyVariantID) != "" {
			return h.config.LemonSqueezy.MonthlyVariantID, nil
		}
	case "yearly":
		if strings.TrimSpace(h.config.LemonSqueezy.YearlyVariantID) != "" {
			return h.config.LemonSqueezy.YearlyVariantID, nil
		}
	case "lifetime":
		if strings.TrimSpace(h.config.LemonSqueezy.LifetimeVariantID) != "" {
			return h.config.LemonSqueezy.LifetimeVariantID, nil
		}
	}
	return "", fmt.Errorf("missing lemonsqueezy variant id for package %s", packageID)
}

func (h *Handler) resolveCustomerPortalURL(account *core.Account) string {
	if settings := account.Settings; settings != nil {
		if raw, ok := settings["billing_portal_url"].(string); ok && strings.TrimSpace(raw) != "" {
			return strings.TrimSpace(raw)
		}
	}

	if portal := strings.TrimSpace(h.config.LemonSqueezy.PortalURL); portal != "" {
		return portal
	}

	subdomain := strings.TrimSpace(h.config.LemonSqueezy.StoreSubdomain)
	if subdomain != "" {
		return fmt.Sprintf("https://%s.lemonsqueezy.com/billing", subdomain)
	}

	return ""
}

func normalizePlanSlug(planSlug string) string {
	return strings.ToLower(strings.TrimSpace(planSlug))
}

func normalizeBillingPackageID(packageID string) string {
	switch strings.ToLower(strings.TrimSpace(packageID)) {
	case "", "monthly", "month", "m":
		return "monthly"
	case "yearly", "annual", "year", "y":
		return "yearly"
	case "lifetime", "one_time", "one-time", "l":
		return "lifetime"
	default:
		return ""
	}
}

func normalizeCallbackURL(callbackURL string, r *http.Request) string {
	if trimmed := strings.TrimSpace(callbackURL); trimmed != "" {
		return trimmed
	}
	if origin := strings.TrimSpace(r.Header.Get("Origin")); origin != "" {
		return strings.TrimRight(origin, "/") + "/subscription"
	}
	return strings.TrimRight(getAppBaseURL(r), "/") + "/subscription"
}

func getAppBaseURL(r *http.Request) string {
	if r == nil || r.URL == nil {
		return ""
	}
	if r.Host == "" {
		return ""
	}
	scheme := "https"
	if r.TLS == nil {
		scheme = "http"
	}
	return scheme + "://" + r.Host
}

func buildHostedCheckoutURL(storeSubdomain, variantID string, customData map[string]string) string {
	storeSubdomain = strings.TrimSpace(storeSubdomain)
	variantID = strings.TrimSpace(variantID)
	if storeSubdomain == "" || variantID == "" {
		return ""
	}

	baseURL := fmt.Sprintf("https://%s.lemonsqueezy.com/checkout/buy/%s", storeSubdomain, variantID)
	parsed, err := url.Parse(baseURL)
	if err != nil {
		return ""
	}

	query := parsed.Query()
	for key, value := range customData {
		if strings.TrimSpace(value) == "" {
			continue
		}
		query.Set(fmt.Sprintf("checkout[custom][%s]", key), value)
	}
	parsed.RawQuery = query.Encode()
	return parsed.String()
}

func parseLemonTimestamp(raw any) *time.Time {
	value := strings.TrimSpace(stringifyAny(raw))
	if value == "" {
		return nil
	}
	for _, layout := range []string{time.RFC3339Nano, time.RFC3339} {
		if parsed, err := time.Parse(layout, value); err == nil {
			tm := parsed.UTC()
			return &tm
		}
	}
	return nil
}

func stringifyAny(v any) string {
	switch t := v.(type) {
	case string:
		return t
	case fmt.Stringer:
		return t.String()
	case float64:
		return strconv.FormatFloat(t, 'f', -1, 64)
	case float32:
		return strconv.FormatFloat(float64(t), 'f', -1, 32)
	case int:
		return strconv.Itoa(t)
	case int64:
		return strconv.FormatInt(t, 10)
	case json.Number:
		return t.String()
	default:
		if v == nil {
			return ""
		}
		return fmt.Sprintf("%v", v)
	}
}

func writeJSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

// Lemon Squeezy webhook handling.
type lemonWebhookEnvelope struct {
	Meta struct {
		EventName  string         `json:"event_name"`
		CustomData map[string]any `json:"custom_data"`
	} `json:"meta"`
	Data struct {
		ID         string         `json:"id"`
		Type       string         `json:"type"`
		Attributes map[string]any `json:"attributes"`
	} `json:"data"`
}

func (h *Handler) handleLemonSqueezyWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Cannot read body", http.StatusBadRequest)
		return
	}

	if err := h.verifyLemonSqueezySignature(body, r.Header.Get("X-Signature")); err != nil {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	var event lemonWebhookEnvelope
	if err := json.Unmarshal(body, &event); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	eventName := strings.ToLower(strings.TrimSpace(event.Meta.EventName))
	if eventName == "" {
		http.Error(w, "Missing event name", http.StatusBadRequest)
		return
	}

	eventID := deriveLemonEventID(eventName, event)
	if eventID == "" {
		http.Error(w, "Missing event id", http.StatusBadRequest)
		return
	}

	if h.isEventProcessed(eventID) {
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
		return
	}

	if err := h.processLemonSqueezyEvent(r.Context(), eventName, event); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.markEventProcessed(eventID)
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) verifyLemonSqueezySignature(body []byte, signature string) error {
	secret := strings.TrimSpace(h.config.LemonSqueezy.WebhookSecret)
	if secret == "" {
		return nil
	}

	signature = strings.TrimSpace(signature)
	if signature == "" {
		return fmt.Errorf("missing signature")
	}

	mac := hmac.New(sha256.New, []byte(secret))
	if _, err := mac.Write(body); err != nil {
		return err
	}
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(signature), []byte(expected)) {
		return fmt.Errorf("signature mismatch")
	}
	return nil
}

func (h *Handler) processLemonSqueezyEvent(ctx context.Context, eventName string, event lemonWebhookEnvelope) error {
	switch eventName {
	case "subscription_created", "subscription_updated", "subscription_cancelled", "subscription_expired", "subscription_paused", "subscription_unpaused", "subscription_resumed", "subscription_plan_changed", "subscription_payment_success", "subscription_payment_failed", "subscription_payment_recovered":
		// supported
	default:
		return nil
	}

	accountID, err := h.extractLemonAccountID(event)
	if err != nil {
		return err
	}

	packageID := h.resolveLemonPackageID(event)
	status := lemonProviderStatus(eventName, event.Data.Attributes)
	expiresAt := h.resolveLemonExpiry(eventName, event.Data.Attributes, packageID)

	if status != "expired" {
		status = "active"
	}

	if err := h.svc.SyncSubscriptionFromPlan(ctx, accountID, "pro", deriveLemonEventID(eventName, event), status, expiresAt); err != nil {
		return err
	}

	metadata := map[string]any{
		"billing_provider":            "lemon_squeezy",
		"billing_event_name":          eventName,
		"billing_package_id":          packageID,
		"billing_variant_id":          stringifyAny(event.Data.Attributes["variant_id"]),
		"billing_subscription_status": strings.ToLower(strings.TrimSpace(stringifyAny(event.Data.Attributes["status"]))),
		"billing_subscription_id":     event.Data.ID,
	}
	if expiresAt != nil {
		metadata["billing_expires_at"] = expiresAt.UTC().Format(time.RFC3339)
	}
	if portal := lemonCustomerPortalFromAttributes(event.Data.Attributes); portal != "" {
		metadata["billing_portal_url"] = portal
	}

	return h.svc.UpdateAccountBillingMetadata(ctx, accountID, metadata)
}

func (h *Handler) extractLemonAccountID(event lemonWebhookEnvelope) (uuid.UUID, error) {
	if raw, ok := event.Meta.CustomData["account_id"]; ok {
		if accountID, err := uuid.Parse(strings.TrimSpace(stringifyAny(raw))); err == nil {
			return accountID, nil
		}
	}
	if raw, ok := event.Meta.CustomData["user_id"]; ok {
		if accountID, err := uuid.Parse(strings.TrimSpace(stringifyAny(raw))); err == nil {
			return accountID, nil
		}
	}

	if email := lemonEventEmail(event.Data.Attributes); email != "" {
		return h.svc.GetAccountIDByEmail(context.Background(), email)
	}

	return uuid.Nil, fmt.Errorf("missing account_id in lemon custom data")
}

func (h *Handler) resolveLemonPackageID(event lemonWebhookEnvelope) string {
	variantID := normalizeVariantID(stringifyAny(event.Data.Attributes["variant_id"]))
	switch variantID {
	case normalizeVariantID(h.config.LemonSqueezy.MonthlyVariantID):
		return "monthly"
	case normalizeVariantID(h.config.LemonSqueezy.YearlyVariantID):
		return "yearly"
	case normalizeVariantID(h.config.LemonSqueezy.LifetimeVariantID):
		return "lifetime"
	default:
		if packageID, ok := event.Meta.CustomData["package_id"]; ok {
			if normalized := normalizeBillingPackageID(stringifyAny(packageID)); normalized != "" {
				return normalized
			}
		}
		return "monthly"
	}
}

func (h *Handler) resolveLemonExpiry(eventName string, attrs map[string]any, packageID string) *time.Time {
	if packageID == "lifetime" {
		tm := time.Date(9999, time.December, 31, 23, 59, 59, 0, time.UTC)
		return &tm
	}

	switch eventName {
	case "subscription_expired":
		if tm := parseLemonTimestamp(attrs["ends_at"]); tm != nil {
			return tm
		}
		if tm := parseLemonTimestamp(attrs["renews_at"]); tm != nil {
			return tm
		}
	case "subscription_cancelled":
		if tm := parseLemonTimestamp(attrs["ends_at"]); tm != nil {
			return tm
		}
		if tm := parseLemonTimestamp(attrs["renews_at"]); tm != nil {
			return tm
		}
	default:
		if tm := parseLemonTimestamp(attrs["renews_at"]); tm != nil {
			return tm
		}
		if tm := parseLemonTimestamp(attrs["ends_at"]); tm != nil {
			return tm
		}
	}

	return nil
}

func lemonProviderStatus(eventName string, attrs map[string]any) string {
	switch strings.ToLower(strings.TrimSpace(eventName)) {
	case "subscription_expired":
		return "expired"
	case "subscription_cancelled":
		return "cancelled"
	case "subscription_paused":
		return "paused"
	case "subscription_payment_failed":
		return "past_due"
	case "subscription_payment_success":
		return "active"
	default:
		status := strings.ToLower(strings.TrimSpace(stringifyAny(attrs["status"])))
		if status == "" {
			return "active"
		}
		return status
	}
}

func lemonEventEmail(attrs map[string]any) string {
	for _, key := range []string{"user_email", "email"} {
		if raw, ok := attrs[key]; ok {
			if email := strings.TrimSpace(stringifyAny(raw)); email != "" {
				return email
			}
		}
	}
	return ""
}

func lemonCustomerPortalFromAttributes(attrs map[string]any) string {
	urls, _ := attrs["urls"].(map[string]any)
	if urls == nil {
		return ""
	}
	for _, key := range []string{"customer_portal", "update_payment_method"} {
		if raw, ok := urls[key]; ok {
			if portal := strings.TrimSpace(stringifyAny(raw)); portal != "" {
				return portal
			}
		}
	}
	return ""
}

func normalizeVariantID(raw string) string {
	return strings.TrimSpace(strings.ToLower(raw))
}

func deriveLemonEventID(eventName string, event lemonWebhookEnvelope) string {
	updatedAt := stringifyAny(event.Data.Attributes["updated_at"])
	if updatedAt == "" {
		updatedAt = stringifyAny(event.Data.Attributes["created_at"])
	}
	if updatedAt == "" {
		updatedAt = event.Data.ID
	}
	return strings.TrimSpace(strings.ToLower(eventName)) + ":" + strings.TrimSpace(event.Data.ID) + ":" + strings.TrimSpace(updatedAt)
}
