package core

import (
	"github.com/corridrlabs/corridor/backend/internal/adapters/db"
)

type UserTier string

const (
	TierFree       UserTier = "FREE"
	TierPro        UserTier = "PRO"
	TierBusiness   UserTier = "BUSINESS"
	TierPremium    UserTier = "PREMIUM"
	TierEnterprise UserTier = "ENTERPRISE"
)

type TierLimits struct {
	SocialGoalsPerMonth int
	EWAEmployeeLimit    int
	APIRequestsPerDay   int
	HasAPIAccess        bool
	HasPrioritySupport  bool
}

var TierConfig = map[UserTier]TierLimits{
	TierFree: {
		SocialGoalsPerMonth: 5,
		EWAEmployeeLimit:    0, // View-only
		APIRequestsPerDay:   0,
		HasAPIAccess:        false,
		HasPrioritySupport:  false,
	},
	TierPro: {
		SocialGoalsPerMonth: 50,
		EWAEmployeeLimit:    50,
		APIRequestsPerDay:   1000,
		HasAPIAccess:        true,
		HasPrioritySupport:  false,
	},
	TierBusiness: {
		SocialGoalsPerMonth: -1,
		EWAEmployeeLimit:    -1,
		APIRequestsPerDay:   10000,
		HasAPIAccess:        true,
		HasPrioritySupport:  true,
	},
	TierPremium: {
		SocialGoalsPerMonth: -1, // Unlimited
		EWAEmployeeLimit:    -1, // Unlimited
		APIRequestsPerDay:   10000,
		HasAPIAccess:        true,
		HasPrioritySupport:  true,
	},
	TierEnterprise: {
		SocialGoalsPerMonth: -1,
		EWAEmployeeLimit:    -1,
		APIRequestsPerDay:   100000,
		HasAPIAccess:        true,
		HasPrioritySupport:  true,
	},
}

func (s *Service) GetUserTierLimits(accountID string) (TierLimits, error) {
	tier, err := s.GetUserTier(accountID)
	if err != nil {
		return TierConfig[TierFree], err
	}
	return TierConfig[tier], nil
}

func (s *Service) GetUserTier(accountID string) (UserTier, error) {
	var tier string
	err := s.db.QueryRow(`
		SELECT COALESCE(user_tier, 'FREE') 
		FROM accounts 
		WHERE id = $1
	`, accountID).Scan(&tier)
	
	if err != nil {
		return TierFree, err
	}
	return UserTier(tier), nil
}

func (s *Service) DB() *db.Postgres {
	return s.db
}
