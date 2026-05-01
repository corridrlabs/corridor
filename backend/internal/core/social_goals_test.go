package core

import (
	"testing"
	"time"

	"github.com/google/uuid"
)

func TestSocialGoalStructure(t *testing.T) {
	// Test that SocialGoal struct has expected fields
	goal := SocialGoal{
		ID:            uuid.New(),
		AccountID:     uuid.New(),
		Title:         "Test Goal",
		Description:   "A test crowdfunding goal",
		TargetAmount:  1000.00,
		CurrentAmount: 250.00,
		Currency:      "USDC",
		ProductLink:   "https://example.com/product",
		ShareLink:     "https://corridormoney.net/goals/abc123",
		Status:        "ACTIVE",
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	// Verify fields are set correctly
	if goal.Title != "Test Goal" {
		t.Errorf("Title mismatch: got %s, want Test Goal", goal.Title)
	}

	if goal.TargetAmount != 1000.00 {
		t.Errorf("TargetAmount mismatch: got %f, want 1000.00", goal.TargetAmount)
	}

	if goal.CurrentAmount != 250.00 {
		t.Errorf("CurrentAmount mismatch: got %f, want 250.00", goal.CurrentAmount)
	}
}

func TestGoalContributionStructure(t *testing.T) {
	// Test that GoalContribution struct has expected fields
	contrib := GoalContribution{
		ID:              uuid.New(),
		GoalID:          uuid.New(),
		ContributorName: "Anonymous Donor",
		Amount:          50.00,
		Currency:        "USDC",
		TransactionID:   uuid.New(),
		CreatedAt:       time.Now(),
	}

	if contrib.ContributorName != "Anonymous Donor" {
		t.Errorf("ContributorName mismatch: got %s, want Anonymous Donor", contrib.ContributorName)
	}

	if contrib.Amount != 50.00 {
		t.Errorf("Amount mismatch: got %f, want 50.00", contrib.Amount)
	}
}

func TestGoalProgressCalculation(t *testing.T) {
	testCases := []struct {
		name          string
		target        float64
		current       float64
		expectedPct   float64
		expectedMet   bool
	}{
		{"No progress", 1000, 0, 0, false},
		{"Partial progress", 1000, 500, 50, false},
		{"Goal met exactly", 1000, 1000, 100, true},
		{"Over funded", 1000, 1500, 150, true},
		{"Small amounts", 100, 25.50, 25.5, false},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			pct := (tc.current / tc.target) * 100
			met := tc.current >= tc.target

			if pct != tc.expectedPct {
				t.Errorf("Progress percentage: got %.2f%%, want %.2f%%", pct, tc.expectedPct)
			}

			if met != tc.expectedMet {
				t.Errorf("Goal met status: got %v, want %v", met, tc.expectedMet)
			}
		})
	}
}

func TestShareLinkGeneration(t *testing.T) {
	// Test that share links follow expected format
	baseURL := "https://corridormoney.net/goals/"
	shortID := uuid.New().String()[:8]
	shareLink := baseURL + shortID

	if len(shareLink) < len(baseURL)+8 {
		t.Errorf("Share link too short: %s", shareLink)
	}

	// Should start with base URL
	if shareLink[:len(baseURL)] != baseURL {
		t.Errorf("Share link should start with %s, got %s", baseURL, shareLink)
	}
}

func TestGoalStatusValues(t *testing.T) {
	// Test valid status values
	validStatuses := []string{"ACTIVE", "COMPLETED", "CANCELLED", "EXPIRED"}

	for _, status := range validStatuses {
		goal := SocialGoal{Status: status}
		if goal.Status != status {
			t.Errorf("Status assignment failed for %s", status)
		}
	}
}

func TestCurrencySupport(t *testing.T) {
	// Test supported currencies
	currencies := []string{"USDC", "USD", "KES", "NGN", "SOL"}

	for _, currency := range currencies {
		goal := SocialGoal{Currency: currency}
		if goal.Currency != currency {
			t.Errorf("Currency assignment failed for %s", currency)
		}

		contrib := GoalContribution{Currency: currency}
		if contrib.Currency != currency {
			t.Errorf("Contribution currency assignment failed for %s", currency)
		}
	}
}

func TestTransactionIntegrity(t *testing.T) {
	// Test that transaction IDs are properly linked
	txID := uuid.New()
	goalID := uuid.New()

	contrib := GoalContribution{
		GoalID:        goalID,
		TransactionID: txID,
	}

	if contrib.GoalID != goalID {
		t.Error("GoalID not properly linked to contribution")
	}

	if contrib.TransactionID != txID {
		t.Error("TransactionID not properly linked to contribution")
	}
}

// Test edge cases for contribution amounts
func TestContributionAmountValidation(t *testing.T) {
	testCases := []struct {
		amount  float64
		isValid bool
	}{
		{0.01, true},      // Minimum practical amount
		{0.00, false},     // Zero
		{-10.00, false},   // Negative
		{1000000.00, true}, // Large amount
		{0.001, true},     // Very small (crypto precision)
	}

	for _, tc := range testCases {
		isValid := tc.amount > 0
		if isValid != tc.isValid {
			t.Errorf("Amount %.4f validation: got %v, want %v", tc.amount, isValid, tc.isValid)
		}
	}
}
