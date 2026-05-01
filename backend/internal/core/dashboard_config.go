package core

import (
	"context"

	"github.com/google/uuid"
)

type DashboardConfig struct {
	AccountID       uuid.UUID `json:"account_id"`
	Layout          string    `json:"layout"`
	EnabledFeatures []string  `json:"enabled_features"`
	DefaultView     string    `json:"default_view"`
	CustomWidgets   []string  `json:"custom_widgets"`
}

type FeatureAccess struct {
	EWA            bool `json:"ewa"`
	SocialPayments bool `json:"social_payments"`
	Payroll        bool `json:"payroll"`
	Invoicing      bool `json:"invoicing"`
	Treasury       bool `json:"treasury"`
	APIKeys        bool `json:"api_keys"`
	Analytics      bool `json:"analytics"`
}

func (s *Service) GetDashboardConfig(ctx context.Context, accountID uuid.UUID) (*DashboardConfig, error) {
	profile, err := s.GetOnboardingProfile(ctx, accountID)
	if err != nil {
		// Return default config if no onboarding profile
		return &DashboardConfig{
			AccountID:       accountID,
			Layout:          "full_platform",
			EnabledFeatures: []string{"ewa", "social_payments", "payroll"},
			DefaultView:     "overview_dashboard",
			CustomWidgets:   []string{},
		}, nil
	}

	return &DashboardConfig{
		AccountID:       accountID,
		Layout:          profile.Preferences.DashboardLayout,
		EnabledFeatures: profile.Preferences.EnabledFeatures,
		DefaultView:     profile.Preferences.DefaultView,
		CustomWidgets:   s.getCustomWidgets(profile.Intent),
	}, nil
}

func (s *Service) GetFeatureAccess(ctx context.Context, accountID uuid.UUID) (*FeatureAccess, error) {
	config, err := s.GetDashboardConfig(ctx, accountID)
	if err != nil {
		return nil, err
	}

	access := &FeatureAccess{}
	for _, feature := range config.EnabledFeatures {
		switch feature {
		case "ewa":
			access.EWA = true
		case "social_payments":
			access.SocialPayments = true
		case "payroll":
			access.Payroll = true
		case "invoicing":
			access.Invoicing = true
		case "treasury":
			access.Treasury = true
		case "api_keys":
			access.APIKeys = true
		case "analytics":
			access.Analytics = true
		}
	}

	return access, nil
}

func (s *Service) getCustomWidgets(intent UserIntent) []string {
	switch intent {
	case IntentEWAOnly:
		return []string{"employee_list", "advance_requests", "payroll_summary"}
	case IntentSocialOnly:
		return []string{"active_goals", "recent_splits", "social_feed"}
	case IntentAPIPartner:
		return []string{"api_usage", "webhook_logs", "rate_limits"}
	default:
		return []string{"balance_overview", "recent_transactions", "quick_actions"}
	}
}