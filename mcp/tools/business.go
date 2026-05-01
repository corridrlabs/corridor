package tools

import (
	"context"
)

// BusinessTool handles business operations like EWA, tier limits, and reporting
type BusinessTool struct {
	apiClient APIClient
}

// NewBusinessTool creates a new business tool instance
func NewBusinessTool(client APIClient) *BusinessTool {
	return &BusinessTool{apiClient: client}
}

// CheckTierLimits views current usage and tier limits for the account
func (t *BusinessTool) CheckTierLimits(ctx context.Context) (interface{}, error) {
	return t.apiClient.Call(ctx, "GET", "/api/account/tier-limits", nil)
}

// ListEmployees views EWA employee roster and their advance eligibility
func (t *BusinessTool) ListEmployees(ctx context.Context) (interface{}, error) {
	return t.apiClient.Call(ctx, "GET", "/api/ewa/employees", nil)
}

// ExportTransactions downloads transaction history
func (t *BusinessTool) ExportTransactions(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	return t.apiClient.Call(ctx, "POST", "/api/transactions/export", args)
}

// GetTransactionFeed retrieves recent transaction history
func (t *BusinessTool) GetTransactionFeed(ctx context.Context) (interface{}, error) {
	return t.apiClient.Call(ctx, "GET", "/api/social/feed", nil)
}