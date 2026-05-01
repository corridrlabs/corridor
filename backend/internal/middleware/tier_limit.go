package middleware

import (
	"encoding/json"
	"net/http"

	"github.com/corridrlabs/corridor/backend/internal/core"
)

type TierLimitMiddleware struct {
	service *core.Service
}

func NewTierLimitMiddleware(service *core.Service) *TierLimitMiddleware {
	return &TierLimitMiddleware{service: service}
}

func (m *TierLimitMiddleware) CheckFeatureAccess(feature string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			accountID := r.Header.Get("X-Account-ID")
			if accountID == "" {
				http.Error(w, "Account ID required", http.StatusUnauthorized)
				return
			}

			allowed, err := m.checkFeatureLimit(accountID, feature)
			if err != nil {
				http.Error(w, "Error checking limits", http.StatusInternalServerError)
				return
			}

			if !allowed {
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusPaymentRequired)
				json.NewEncoder(w).Encode(map[string]interface{}{
					"error": "Feature limit exceeded. Please upgrade your plan.",
					"upgrade_required": true,
				})
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

func (m *TierLimitMiddleware) checkFeatureLimit(accountID, feature string) (bool, error) {
	limits, err := m.service.GetUserTierLimits(accountID)
	if err != nil {
		return false, err
	}

	switch feature {
	case "social_goals":
		return m.checkSocialGoalsLimit(accountID, limits.SocialGoalsPerMonth)
	case "ewa_employees":
		return m.checkEWAEmployeeLimit(accountID, limits.EWAEmployeeLimit)
	case "api_access":
		return limits.HasAPIAccess, nil
	default:
		return true, nil
	}
}

func (m *TierLimitMiddleware) checkSocialGoalsLimit(accountID string, limit int) (bool, error) {
	if limit == -1 {
		return true, nil // Unlimited
	}

	var count int
	err := m.service.DB().QueryRow(`
		SELECT COUNT(*) 
		FROM social_goals 
		WHERE account_id = $1 
		AND created_at >= date_trunc('month', CURRENT_DATE)
	`, accountID).Scan(&count)

	return count < limit, err
}

func (m *TierLimitMiddleware) checkEWAEmployeeLimit(accountID string, limit int) (bool, error) {
	if limit == -1 {
		return true, nil // Unlimited
	}
	if limit == 0 {
		return false, nil // View-only
	}

	var count int
	err := m.service.DB().QueryRow(`
		SELECT COUNT(*) 
		FROM ewa_employees 
		WHERE account_id = $1 
		AND is_active = true
	`, accountID).Scan(&count)

	return count < limit, err
}

func (m *TierLimitMiddleware) TrackUsage(feature string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			accountID := ""
			if raw := r.Context().Value(core.AccountContextKey); raw != nil {
				switch id := raw.(type) {
				case string:
					accountID = id
				case interface{ String() string }:
					accountID = id.String()
				}
			}
			if accountID == "" {
				accountID = r.Header.Get("X-Account-ID")
			}
			if accountID != "" {
				go m.recordUsage(accountID, feature)
			}
			next.ServeHTTP(w, r)
		})
	}
}

func (m *TierLimitMiddleware) recordUsage(accountID, feature string) {
	_, err := m.service.DB().Exec(`
		INSERT INTO feature_usage (account_id, feature, usage_date, count)
		VALUES ($1, $2, CURRENT_DATE, 1)
		ON CONFLICT (account_id, feature, usage_date)
		DO UPDATE SET count = feature_usage.count + 1
	`, accountID, feature)
	
	if err != nil {
		// Log error but don't fail the request
		return
	}
}
