package tools

import (
	"context"
	"fmt"
)

// PaymentTool handles payment operations
type PaymentTool struct {
	apiClient APIClient
}

// NewPaymentTool creates a new payment tool instance
func NewPaymentTool(client APIClient) *PaymentTool {
	return &PaymentTool{apiClient: client}
}

// SendPayment sends a payment to another user
func (t *PaymentTool) SendPayment(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	return t.apiClient.Call(ctx, "POST", "/api/social/pay", args)
}

// CreateSplitPayment starts a group purchase with split payment functionality
func (t *PaymentTool) CreateSplitPayment(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	return t.apiClient.Call(ctx, "POST", "/api/social/split-payment", args)
}

// CreateInvoice creates an invoice for a customer
func (t *PaymentTool) CreateInvoice(ctx context.Context, args map[string]interface{}) (interface{}, error) {
	return t.apiClient.Call(ctx, "POST", "/api/invoices", args)
}

// GetExchangeRate gets current exchange rate between two currencies
func (t *PaymentTool) GetExchangeRate(ctx context.Context, fromCurrency, toCurrency string) (interface{}, error) {
	endpoint := fmt.Sprintf("/api/social/exchange-rate?from=%s&to=%s", fromCurrency, toCurrency)
	return t.apiClient.Call(ctx, "GET", endpoint, nil)
}