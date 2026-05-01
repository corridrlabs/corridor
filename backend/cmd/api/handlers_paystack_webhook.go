package main

import (
	"context"
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/corridrlabs/corridor/backend/internal/paystack"
	"github.com/google/uuid"
)

func (h *Handler) handlePaystackWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Cannot read body", http.StatusBadRequest)
		return
	}

	// Verify webhook signature
	signature := r.Header.Get("X-Paystack-Signature")
	if !h.verifyPaystackSignature(body, signature) {
		http.Error(w, "Invalid signature", http.StatusUnauthorized)
		return
	}

	var event paystack.WebhookEvent
	if err := json.Unmarshal(body, &event); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Check idempotency
	eventID := derivePaystackEventID(event)
	if eventID == "" {
		http.Error(w, "Missing event ID", http.StatusBadRequest)
		return
	}

	if h.isEventProcessed(eventID) {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Process event
	if err := h.processPaystackEvent(r.Context(), event); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Mark as processed
	h.markEventProcessed(eventID)

	w.WriteHeader(http.StatusOK)
}

func (h *Handler) verifyPaystackSignature(body []byte, signature string) bool {
	secret := h.config.Paystack.SecretKey
	if secret == "" {
		return false
	}

	mac := hmac.New(sha512.New, []byte(secret))
	mac.Write(body)
	expectedSignature := hex.EncodeToString(mac.Sum(nil))

	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}

func (h *Handler) processPaystackEvent(ctx context.Context, event paystack.WebhookEvent) error {
	switch event.Event {
	case "charge.success":
		return h.handlePaystackChargeSuccess(ctx, event.Data)
	case "transfer.success":
		return h.handlePaystackTransferSuccess(ctx, event.Data)
	case "transfer.failed":
		return h.handlePaystackTransferFailed(ctx, event.Data)
	case "subscription.create":
		return h.handlePaystackSubscriptionCreate(ctx, event.Data)
	case "subscription.disable":
		return h.handlePaystackSubscriptionDisable(ctx, event.Data)
	default:
		// Ignore unknown events
		return nil
	}
}

func (h *Handler) handlePaystackChargeSuccess(ctx context.Context, data map[string]interface{}) error {
	metadata, _ := data["metadata"].(map[string]interface{})
	kind, _ := metadata["kind"].(string)
	if strings.EqualFold(kind, "subscription_upgrade") {
		return h.handlePaystackSubscriptionState(ctx, data, "active")
	}

	reference, ok := data["reference"].(string)
	if !ok {
		return fmt.Errorf("missing reference")
	}

	amount, ok := data["amount"].(float64)
	if !ok {
		return fmt.Errorf("missing amount")
	}

	// Convert from subunits to main currency
	amount = amount / 100

	// Credit user wallet
	metadata, ok = data["metadata"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("missing metadata")
	}
	accountIDStr, ok := metadata["account_id"].(string)
	if !ok {
		return fmt.Errorf("missing account_id in metadata")
	}
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		return err
	}

	// Find or create wallet and credit (Defaulting to USD as per user request)
	currency := "USD"
	if c, ok := data["currency"].(string); ok && c != "" {
		currency = strings.ToUpper(c)
	}

	return h.svc.CreditWallet(ctx, accountID, amount, currency, "Paystack deposit: "+reference)
}

func (h *Handler) handlePaystackSubscriptionState(ctx context.Context, data map[string]interface{}, status string) error {
	metadata, _ := data["metadata"].(map[string]interface{})
	accountIDStr, _ := metadata["account_id"].(string)
	planSlug, _ := metadata["plan_slug"].(string)
	reference, _ := data["reference"].(string)

	if accountIDStr == "" {
		if customer, ok := data["customer"].(map[string]interface{}); ok {
			if customerMeta, ok := customer["metadata"].(map[string]interface{}); ok {
				if accountValue, ok := customerMeta["account_id"].(string); ok {
					accountIDStr = accountValue
				}
			}
		}
	}

	if strings.TrimSpace(accountIDStr) == "" {
		return fmt.Errorf("missing account_id in paystack metadata")
	}
	accountID, err := uuid.Parse(accountIDStr)
	if err != nil {
		return err
	}

	if strings.TrimSpace(planSlug) == "" {
		planSlug = "pro"
	}

	return h.svc.SyncSubscriptionFromPlan(ctx, accountID, planSlug, reference, status, nil)
}

func (h *Handler) handlePaystackSubscriptionCreate(ctx context.Context, data map[string]interface{}) error {
	subscriptionCode, ok := data["subscription_code"].(string)
	if !ok {
		return fmt.Errorf("missing subscription_code")
	}

	customer, ok := data["customer"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("missing customer data")
	}
	email, ok := customer["email"].(string)
	if !ok {
		return fmt.Errorf("missing customer email")
	}

	plan, ok := data["plan"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("missing plan data")
	}
	planCode, ok := plan["plan_code"].(string)
	if !ok {
		return fmt.Errorf("missing plan_code")
	}

	planSlug := "free"
	if strings.Contains(strings.ToLower(planCode), "pro") {
		planSlug = "pro"
	} else if strings.Contains(strings.ToLower(planCode), "premium") {
		planSlug = "premium"
	}

	accountID, err := h.svc.GetAccountIDByEmail(ctx, email)
	if err != nil {
		return err
	}

	return h.svc.SyncSubscriptionFromPlan(ctx, accountID, planSlug, subscriptionCode, "active", nil)
}

func (h *Handler) handlePaystackSubscriptionDisable(ctx context.Context, data map[string]interface{}) error {
	subscriptionCode, ok := data["subscription_code"].(string)
	if !ok {
		return fmt.Errorf("missing subscription_code")
	}

	customer, ok := data["customer"].(map[string]interface{})
	if !ok {
		return fmt.Errorf("missing customer data")
	}
	email, ok := customer["email"].(string)
	if !ok {
		return fmt.Errorf("missing customer email")
	}

	accountID, err := h.svc.GetAccountIDByEmail(ctx, email)
	if err != nil {
		return err
	}

	return h.svc.SyncSubscriptionFromPlan(ctx, accountID, "free", subscriptionCode, "inactive", nil)
}

func (h *Handler) handlePaystackTransferSuccess(ctx context.Context, data map[string]interface{}) error {
	// Handle successful withdrawal
	return nil
}

func (h *Handler) handlePaystackTransferFailed(ctx context.Context, data map[string]interface{}) error {
	// Handle failed withdrawal - refund user
	return nil
}

func (h *Handler) isEventProcessed(eventID string) bool {
	// Check Redis for processed events
	var dummy int
	err := h.svc.GetDB().Pool.QueryRow(context.Background(),
		"SELECT 1 FROM processed_events WHERE event_id = $1", eventID).Scan(&dummy)
	return err == nil
}

func (h *Handler) markEventProcessed(eventID string) {
	// Mark event as processed in database
	h.svc.GetDB().Pool.Exec(context.Background(),
		"INSERT INTO processed_events (event_id, processed_at) VALUES ($1, NOW()) ON CONFLICT DO NOTHING",
		eventID)
}

func derivePaystackEventID(event paystack.WebhookEvent) string {
	if v, ok := event.Data["id"].(string); ok && strings.TrimSpace(v) != "" {
		return v
	}
	if v, ok := event.Data["id"].(float64); ok {
		return fmt.Sprintf("%s:%0.f", event.Event, v)
	}
	if ref, ok := event.Data["reference"].(string); ok && strings.TrimSpace(ref) != "" {
		return fmt.Sprintf("%s:%s", event.Event, ref)
	}
	return ""
}
