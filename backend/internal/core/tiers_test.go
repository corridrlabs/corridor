package core

import (
	"testing"
)

func TestTierLimitEnforcement(t *testing.T) {
	tests := []struct {
		name     string
		tier     string
		usage    int
		limit    int
		expected bool
	}{
		{"Free tier under limit", "free", 5, 10, true},
		{"Free tier at limit", "free", 10, 10, false},
		{"Pro tier under limit", "pro", 50, 100, true},
		{"Enterprise unlimited", "enterprise", 1000, -1, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := checkTierLimit(tt.tier, tt.usage, tt.limit)
			if result != tt.expected {
				t.Errorf("expected %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestUsageTracking(t *testing.T) {
	userID := "test-user"
	
	// Reset usage
	resetUsage(userID)
	
	// Track usage
	incrementUsage(userID, "api_calls")
	incrementUsage(userID, "api_calls")
	
	usage := getUsage(userID, "api_calls")
	if usage != 2 {
		t.Errorf("expected usage 2, got %d", usage)
	}
}

func TestUpgradeFlow(t *testing.T) {
	userID := "test-user"
	
	// Start with free tier
	setUserTier(userID, "free")
	
	// Upgrade to pro
	err := upgradeUserTier(userID, "pro")
	if err != nil {
		t.Errorf("upgrade failed: %v", err)
	}
	
	tier := getUserTier(userID)
	if tier != "pro" {
		t.Errorf("expected pro tier, got %s", tier)
	}
}

var mockUsages = make(map[string]map[string]int)
var mockTiers = make(map[string]string)

// Helper functions (minimal implementation)
func checkTierLimit(tier string, usage, limit int) bool {
	if limit == -1 { return true }
	return usage < limit
}

func resetUsage(userID string) {
	mockUsages[userID] = make(map[string]int)
}
func incrementUsage(userID, metric string) {
	if mockUsages[userID] == nil {
		mockUsages[userID] = make(map[string]int)
	}
	mockUsages[userID][metric]++
}
func getUsage(userID, metric string) int {
	return mockUsages[userID][metric]
}
func setUserTier(userID, tier string) {
	mockTiers[userID] = tier
}
func upgradeUserTier(userID, tier string) error {
	mockTiers[userID] = tier
	return nil
}
func getUserTier(userID string) string {
	if tier, ok := mockTiers[userID]; ok {
		return tier
	}
	return "free"
}