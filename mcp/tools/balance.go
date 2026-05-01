package tools

import (
	"context"
	"fmt"
)

// BalanceTool handles wallet balance operations
type BalanceTool struct {
	apiClient APIClient
}

// NewBalanceTool creates a new balance tool instance
func NewBalanceTool(client APIClient) *BalanceTool {
	return &BalanceTool{apiClient: client}
}

// CheckBalance retrieves the balance for a specific currency
func (t *BalanceTool) CheckBalance(ctx context.Context, currency string) (interface{}, error) {
	wallets, err := t.apiClient.Call(ctx, "GET", "/api/wallets", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch wallets: %w", err)
	}

	if walletList, ok := wallets["wallets"].([]interface{}); ok {
		for _, w := range walletList {
			if wallet, ok := w.(map[string]interface{}); ok {
				if wallet["currency"] == currency {
					return wallet, nil
				}
			}
		}
	}

	return map[string]interface{}{
		"currency": currency,
		"balance":  0,
		"message":  "No wallet found for this currency",
	}, nil
}

// GetTreasuryBalance retrieves company treasury balances across all currencies
func (t *BalanceTool) GetTreasuryBalance(ctx context.Context) (interface{}, error) {
	return t.apiClient.Call(ctx, "GET", "/api/treasury/balance", nil)
}