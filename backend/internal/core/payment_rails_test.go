package core

import (
	"testing"
	"errors"
)

func TestDepositRouting(t *testing.T) {
	tests := []struct {
		name     string
		method   string
		amount   float64
		expected string
	}{
		{"Paystack card", "card", 100.0, "paystack"},
		{"M-Pesa mobile", "mpesa", 50.0, "mpesa"},
		{"Circle USDC", "usdc", 1000.0, "circle"},
		{"Solana crypto", "sol", 500.0, "solana"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rail := routeDeposit(tt.method, tt.amount)
			if rail != tt.expected {
				t.Errorf("expected %s, got %s", tt.expected, rail)
			}
		})
	}
}

func TestWithdrawalRouting(t *testing.T) {
	tests := []struct {
		name        string
		destination string
		amount      float64
		expected    string
		shouldError bool
	}{
		{"Bank transfer", "bank", 100.0, "paystack", false},
		{"Mobile money", "mpesa", 50.0, "mpesa", false},
		{"Crypto wallet", "wallet", 1000.0, "solana", false},
		{"Invalid method", "invalid", 100.0, "", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			rail, err := routeWithdrawal(tt.destination, tt.amount)
			if tt.shouldError && err == nil {
				t.Error("expected error but got none")
			}
			if !tt.shouldError && rail != tt.expected {
				t.Errorf("expected %s, got %s", tt.expected, rail)
			}
		})
	}
}

func TestInternalLedgerTransfer(t *testing.T) {
	fromUser := "user1"
	toUser := "user2"
	amount := 100.0

	// Set initial balances
	setBalance(fromUser, 200.0)
	setBalance(toUser, 50.0)

	err := internalTransfer(fromUser, toUser, amount)
	if err != nil {
		t.Errorf("transfer failed: %v", err)
	}

	fromBalance := getBalance(fromUser)
	toBalance := getBalance(toUser)

	if fromBalance != 100.0 {
		t.Errorf("expected from balance 100, got %f", fromBalance)
	}
	if toBalance != 150.0 {
		t.Errorf("expected to balance 150, got %f", toBalance)
	}
}

func TestTreasuryBalanceValidation(t *testing.T) {
	// Set treasury balance
	setTreasuryBalance(1000.0)

	tests := []struct {
		name        string
		amount      float64
		shouldError bool
	}{
		{"Valid withdrawal", 500.0, false},
		{"Insufficient funds", 1500.0, true},
		{"Zero amount", 0.0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := validateTreasuryWithdrawal(tt.amount)
			if tt.shouldError && err == nil {
				t.Error("expected error but got none")
			}
			if !tt.shouldError && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

// Helper functions
func routeDeposit(method string, amount float64) string {
	switch method {
	case "card": return "paystack"
	case "mpesa": return "mpesa"
	case "usdc": return "circle"
	case "sol": return "solana"
	default: return ""
	}
}

func routeWithdrawal(destination string, amount float64) (string, error) {
	switch destination {
	case "bank": return "paystack", nil
	case "mpesa": return "mpesa", nil
	case "wallet": return "solana", nil
	default: return "", errors.New("invalid destination")
	}
}

func internalTransfer(from, to string, amount float64) error {
	fromBalance := getBalance(from)
	if fromBalance < amount {
		return errors.New("insufficient balance")
	}
	setBalance(from, fromBalance-amount)
	setBalance(to, getBalance(to)+amount)
	return nil
}

func validateTreasuryWithdrawal(amount float64) error {
	if amount <= 0 {
		return errors.New("invalid amount")
	}
	if getTreasuryBalance() < amount {
		return errors.New("insufficient treasury funds")
	}
	return nil
}

var balances = make(map[string]float64)
var treasuryBalance float64

func setBalance(userID string, amount float64) { balances[userID] = amount }
func getBalance(userID string) float64 { return balances[userID] }
func setTreasuryBalance(amount float64) { treasuryBalance = amount }
func getTreasuryBalance() float64 { return treasuryBalance }