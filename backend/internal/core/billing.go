package core

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

func (s *Service) GetFundingSources(ctx context.Context, accountID uuid.UUID) ([]FundingSource, error) {
	var sources []FundingSource
	rows, err := s.db.Pool.Query(ctx, "SELECT id, account_id, type, last4, expiry, brand, status, created_at FROM funding_sources WHERE account_id = $1", accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var fs FundingSource
		if err := rows.Scan(&fs.ID, &fs.AccountID, &fs.Type, &fs.Last4, &fs.Expiry, &fs.Brand, &fs.Status, &fs.CreatedAt); err != nil {
			return nil, err
		}
		sources = append(sources, fs)
	}
	return sources, nil
}

func (s *Service) CreateCirclePayment(ctx context.Context, accountID uuid.UUID, amount float64, currency string) (string, error) {
	sources, err := s.GetFundingSources(ctx, accountID)
	if err != nil || len(sources) == 0 {
		return "", fmt.Errorf("no funding source found")
	}
	return s.TopUpWalletWithFundingSource(ctx, accountID, sources[0].ID, amount, currency)
}

func (s *Service) SyncSubscriptionFromPlan(ctx context.Context, accountID uuid.UUID, planName, providerID, status string, expiresAt *time.Time) error {
	planLookup := normalizeBillingPlanName(planName)
	var planID uuid.UUID
	err := s.db.Pool.QueryRow(ctx, "SELECT id FROM plans WHERE name = $1", planLookup).Scan(&planID)
	if err != nil {
		return fmt.Errorf("plan %s not found", planLookup)
	}

	_, err = s.db.Pool.Exec(ctx, `
		INSERT INTO subscriptions (account_id, plan_id, status, current_period_end)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (account_id) DO UPDATE SET 
			plan_id = EXCLUDED.plan_id, 
			status = EXCLUDED.status,
			current_period_end = EXCLUDED.current_period_end
	`, accountID, planID, status, expiresAt)
	if err != nil {
		return err
	}

	// Also update accounts table user_tier for fast lookup
	_, err = s.db.Pool.Exec(ctx, "UPDATE accounts SET user_tier = $1 WHERE id = $2", planLookup, accountID)
	return err
}

func (s *Service) SubscribeAccount(ctx context.Context, accountID uuid.UUID, planName string) error {
	planLookup := normalizeBillingPlanName(planName)
	var plan Plan
	err := s.db.Pool.QueryRow(ctx, "SELECT id, name, price, features FROM plans WHERE name = $1", planLookup).Scan(&plan.ID, &plan.Name, &plan.Price, &plan.Features)
	if err != nil {
		return fmt.Errorf("plan %s not found", planLookup)
	}

	var currentSub Subscription
	err = s.db.Pool.QueryRow(ctx, "SELECT id, status FROM subscriptions WHERE account_id = $1 AND plan_id = $2", accountID, plan.ID).Scan(&currentSub.ID, &currentSub.Status)
	if err == nil && currentSub.Status == "active" {
		return nil 
	}

	if plan.Price > 0 {
		if err := s.ChargeAccountForService(ctx, accountID, plan.Price, string(CurrencyUSD), fmt.Sprintf("Subscription: %s", plan.Name)); err != nil {
			return fmt.Errorf("subscription payment failed: %w", err)
		}
		if err := s.DistributeRevenue(ctx, plan.Price, string(CurrencyUSDC)); err != nil {
			return fmt.Errorf("subscription revenue capture failed: %w", err)
		}
	}

	expiry := time.Now().AddDate(0, 1, 0)
	return s.SyncSubscriptionFromPlan(ctx, accountID, planLookup, "INTERNAL", "active", &expiry)
}

func (s *Service) GetPayoutFeeRate(ctx context.Context, accountID uuid.UUID) (float64, error) {
	var tier string
	err := s.db.Pool.QueryRow(ctx, "SELECT COALESCE(user_tier, 'FREE') FROM accounts WHERE id = $1", accountID).Scan(&tier)
	if err != nil {
		return 0.015, nil // Default 1.5% for FREE if error
	}

	switch strings.ToUpper(tier) {
	case "PRO":
		return 0.01, nil // 1.0%
	case "PREMIUM":
		return 0.005, nil // 0.5%
	case "ENTERPRISE":
		return 0.005, nil // 0.5%
	default:
		return 0.015, nil // 1.5% for FREE
	}
}

func (s *Service) HasFeatureAccess(ctx context.Context, accountID uuid.UUID, feature string) (bool, string, error) {
	var hasAccess bool
	err := s.db.Pool.QueryRow(ctx, `
		SELECT COALESCE((p.features->>$2)::boolean, false)
		FROM subscriptions s
		JOIN plans p ON s.plan_id = p.id
		WHERE s.account_id = $1 AND s.status = 'active'
	`, accountID, feature).Scan(&hasAccess)
	
	if err != nil {
		return false, "No active subscription found", nil
	}
	
	if !hasAccess {
		return false, fmt.Sprintf("Feature '%s' not included in your current plan", feature), nil
	}
	
	return true, "", nil
}

func (s *Service) GetPublicBillingFeeSchedule() map[string]interface{} {
	return map[string]interface{}{
		"market_focus": "Kenya first",
		"rails": map[string]interface{}{
			"stablecoins": map[string]interface{}{
				"rate":    "0.1%",
				"cap":     "$1.00",
				"details": "Instant Settlement, Global Reach",
			},
			"mobile_money": map[string]interface{}{
				"rate":    "1.0%",
				"details": "M-PESA, Airtel, MTN",
			},
			"bank_transfers": map[string]interface{}{
				"rate":    "0.5%",
				"min":     "$0.50",
				"max":     "$50.00",
				"details": "Local & SWIFT",
			},
			"cards": map[string]interface{}{
				"rate":  "2.9%",
				"fixed": "$0.30",
			},
		},
		"platform": map[string]interface{}{
			"transaction_link_fee": "1.5%",
			"invoice_fee":        "1.5%",
			"fx_spread":          "1.75%",
			"bank_sweep_fee":     "0.25%",
			"ewa_monthly_fee":    "$2.00 / employee",
			"ewa_advance_fee":    "KES 200",
			"social_goal_fee":    "1.0%",
			"payout_fees": map[string]string{
				"FREE":       "1.5%",
				"PRO":        "1.0%",
				"BUSINESS":   "0.5%",
				"PREMIUM":    "0.5%",
				"ENTERPRISE": "0.5%",
			},
			"developer_api_overage": "$0.001 / call beyond included quota",
		},
		"plans": []map[string]interface{}{
			{"name": "FREE", "price_monthly": 0, "price_yearly": 0},
			{"name": "PRO", "price_monthly": 29, "price_yearly": 290},
			{"name": "BUSINESS", "price_monthly": 99, "price_yearly": 990},
			{"name": "ENTERPRISE", "price_monthly": 299, "price_yearly": 2990},
		},
	}
}

func (s *Service) GetSupportedCurrencies() []string {
	codes := SupportedCurrencyCodes()
	out := make([]string, 0, len(codes))
	for _, code := range codes {
		out = append(out, string(code))
	}
	return out
}

func (s *Service) GetSubscriptionPlans(ctx context.Context) ([]Plan, error) {
	rows, err := s.db.Pool.Query(ctx, "SELECT id, name, COALESCE(display_name, '') AS display_name, price, features FROM plans ORDER BY price ASC")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var plans []Plan
	for rows.Next() {
		var p Plan
		var displayName string
		if err := rows.Scan(&p.ID, &p.Name, &displayName, &p.Price, &p.Features); err != nil {
			return nil, err
		}
		if strings.EqualFold(p.Name, "PREMIUM") {
			p.Name = "BUSINESS"
		}
		if strings.TrimSpace(displayName) != "" {
			p.Name = strings.ToUpper(strings.TrimSpace(displayName))
		}
		plans = append(plans, p)
	}
	return plans, nil
}

func normalizeBillingPlanName(planName string) string {
	switch strings.ToUpper(strings.TrimSpace(planName)) {
	case "BUSINESS", "PREMIUM":
		return "BUSINESS"
	case "PRO", "FREE", "ENTERPRISE":
		return strings.ToUpper(strings.TrimSpace(planName))
	default:
		return strings.ToUpper(strings.TrimSpace(planName))
	}
}

func (s *Service) ChargeAccountForService(ctx context.Context, accountID uuid.UUID, amount float64, currency, memo string) error {
	if amount <= 0 {
		return nil
	}

	walletCurrency := BillingWalletCurrency(currency)

	if wallet, err := s.GetPrimaryWallet(ctx, accountID, string(walletCurrency)); err == nil && wallet.Balance >= amount {
		return s.DebitWallet(ctx, wallet.ID, amount, memo)
	}

	return fmt.Errorf("insufficient balance in %s wallet", walletCurrency)
}

func (s *Service) GetUsageStats(ctx context.Context, accountID uuid.UUID) (map[string]interface{}, error) {
	var walletCount int
	err := s.db.Pool.QueryRow(ctx, "SELECT COUNT(*) FROM wallets WHERE account_id = $1", accountID).Scan(&walletCount)
	if err != nil {
		return nil, err
	}

	var apiUsageToday int
	_ = s.db.Pool.QueryRow(ctx, `
		SELECT COALESCE(SUM(count), 0)
		FROM feature_usage
		WHERE account_id = $1 AND feature = 'api_access' AND usage_date = CURRENT_DATE
	`, accountID).Scan(&apiUsageToday)

	limits, _ := s.GetUserTierLimits(accountID.String())
	billableAPIUsage := apiUsageToday - limits.APIRequestsPerDay
	if billableAPIUsage < 0 {
		billableAPIUsage = 0
	}

	return map[string]interface{}{
		"wallets_count":      walletCount,
		"api_usage_today":    apiUsageToday,
		"api_billable_calls": billableAPIUsage,
		"status":             "active",
	}, nil
}

type UsageChargeResult struct {
	Feature           string  `json:"feature"`
	UsageCount        int     `json:"usage_count"`
	IncludedQuota     int     `json:"included_quota"`
	BillableCalls     int     `json:"billable_calls"`
	ChargePerCallUSD  float64 `json:"charge_per_call_usd"`
	ChargeAppliedUSD  float64 `json:"charge_applied_usd"`
	Currency          string  `json:"currency"`
}

func normalizeUsageFeature(feature string) string {
	switch {
	case strings.HasPrefix(strings.ToLower(strings.TrimSpace(feature)), "mcp_tool_"):
		return "api_access"
	case strings.EqualFold(strings.TrimSpace(feature), ""):
		return "api_access"
	default:
		return strings.ToLower(strings.TrimSpace(feature))
	}
}

func (s *Service) TrackUsageAndBill(ctx context.Context, accountID uuid.UUID, feature string) (*UsageChargeResult, error) {
	feature = normalizeUsageFeature(feature)
	if feature == "" {
		feature = "api_access"
	}

	var usageCount int
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO feature_usage (account_id, feature, usage_date, count)
		VALUES ($1, $2, CURRENT_DATE, 1)
		ON CONFLICT (account_id, feature, usage_date)
		DO UPDATE SET count = feature_usage.count + 1
		RETURNING count
	`, accountID, feature).Scan(&usageCount)
	if err != nil {
		return nil, fmt.Errorf("failed to record usage: %w", err)
	}

	limits, err := s.GetUserTierLimits(accountID.String())
	if err != nil {
		limits = TierConfig[TierFree]
	}

	includedQuota := 0
	switch feature {
	case "api_access":
		includedQuota = limits.APIRequestsPerDay
	}

	billableCalls := usageCount - includedQuota
	if billableCalls < 0 {
		billableCalls = 0
	}

	chargeApplied := 0.0
	if feature == "api_access" && billableCalls > 0 {
		chargeApplied = roundMoney(0.001)
		if err := s.ChargeAccountForService(ctx, accountID, chargeApplied, string(CurrencyUSDC), fmt.Sprintf("Developer API overage (%d calls)", billableCalls)); err != nil {
			return nil, fmt.Errorf("failed to charge usage overage: %w", err)
		}
		if err := s.DistributeRevenue(ctx, chargeApplied, string(CurrencyUSDC)); err != nil {
			return nil, fmt.Errorf("failed to charge usage overage: %w", err)
		}
	}

	return &UsageChargeResult{
		Feature:          feature,
		UsageCount:       usageCount,
		IncludedQuota:    includedQuota,
		BillableCalls:    billableCalls,
		ChargePerCallUSD: 0.001,
		ChargeAppliedUSD: chargeApplied,
		Currency:         string(CurrencyUSD),
	}, nil
}
