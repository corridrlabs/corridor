// Package mcp implements a Model Context Protocol (MCP) server for Corridor.
// This allows AI agents to interact with Corridor's payment and account APIs.
package mcp

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"sync"
	"strings"
)

var fallbackCurrencyCodes = []string{"USD", "USDC", "SOL", "KES", "NGN", "GHS", "KWD"}

// MCPServer implements the MCP protocol for Corridor.
type MCPServer struct {
	apiBaseURL string
	apiKey     string
	reader     *bufio.Reader
	writer     io.Writer
	currencyOnce sync.Once
	currencyCodes []string
}

// NewMCPServer creates a new MCP server instance.
func NewMCPServer(apiBaseURL, apiKey string) *MCPServer {
	return &MCPServer{
		apiBaseURL: strings.TrimRight(apiBaseURL, "/"),
		apiKey:     apiKey,
		reader:     bufio.NewReader(os.Stdin),
		writer:     os.Stdout,
	}
}

// JSONRPCRequest represents an incoming JSON-RPC request.
type JSONRPCRequest struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      interface{}     `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params,omitempty"`
}

// JSONRPCResponse represents an outgoing JSON-RPC response.
type JSONRPCResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	ID      interface{} `json:"id"`
	Result  interface{} `json:"result,omitempty"`
	Error   *RPCError   `json:"error,omitempty"`
}

// RPCError represents a JSON-RPC error.
type RPCError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// Tool represents an MCP tool definition.
type Tool struct {
	Name        string      `json:"name"`
	Description string      `json:"description"`
	InputSchema InputSchema `json:"inputSchema"`
}

// InputSchema defines the JSON Schema for tool inputs.
type InputSchema struct {
	Type       string              `json:"type"`
	Properties map[string]Property `json:"properties"`
	Required   []string            `json:"required,omitempty"`
}

// Property defines a single property in the schema.
type Property struct {
	Type        string   `json:"type"`
	Description string   `json:"description"`
	Enum        []string `json:"enum,omitempty"`
}

// Resource represents an MCP resource.
type Resource struct {
	URI         string `json:"uri"`
	Name        string `json:"name"`
	Description string `json:"description,omitempty"`
	MimeType    string `json:"mimeType,omitempty"`
}

func emptySchema() InputSchema {
	return InputSchema{Type: "object", Properties: map[string]Property{}}
}

func (s *MCPServer) supportedCurrencyEnums() []string {
	s.currencyOnce.Do(func() {
		codes, err := s.fetchSupportedCurrencies()
		if err != nil || len(codes) == 0 {
			s.currencyCodes = append([]string(nil), fallbackCurrencyCodes...)
			return
		}
		s.currencyCodes = codes
	})
	return append([]string(nil), s.currencyCodes...)
}

func (s *MCPServer) fetchSupportedCurrencies() ([]string, error) {
	if strings.TrimSpace(s.apiBaseURL) == "" {
		return nil, fmt.Errorf("missing api base url")
	}

	req, err := http.NewRequest(http.MethodGet, s.apiBaseURL+"/api/currencies", nil)
	if err != nil {
		return nil, err
	}
	if strings.TrimSpace(s.apiKey) != "" {
		req.Header.Set("X-API-Key", s.apiKey)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("currency discovery failed: %s", resp.Status)
	}

	var payload struct {
		Currencies []string `json:"currencies"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, err
	}
	return payload.Currencies, nil
}

func idempotencyProperty() Property {
	return Property{Type: "string", Description: "Optional idempotency key for safe retries"}
}

// GetTools returns the list of available tools.
func (s *MCPServer) GetTools() []Tool {
	return []Tool{
		{
			Name:        "wallets_list",
			Description: "List wallets for the authenticated Corridor account",
			InputSchema: emptySchema(),
		},
		{
			Name:        "wallets_create",
			Description: "Create a wallet for a currency",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"currency": {Type: "string", Description: "Currency code", Enum: s.supportedCurrencyEnums()},
				},
				Required: []string{"currency"},
			},
		},
		{
			Name:        "funding_sources_list",
			Description: "List saved funding sources",
			InputSchema: emptySchema(),
		},
		{
			Name:        "funding_sources_add",
			Description: "Add a funding source (for example card or bank details)",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"type":            {Type: "string", Description: "Funding source type"},
					"provider":        {Type: "string", Description: "Provider name"},
					"last4":           {Type: "string", Description: "Last 4 digits"},
					"currency":        {Type: "string", Description: "Currency code"},
					"metadata":        {Type: "object", Description: "Provider-specific metadata"},
					"idempotency_key": idempotencyProperty(),
				},
				Required: []string{"type"},
			},
		},
		{
			Name:        "fund_wallet",
			Description: "Move funds from a saved source to wallet",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"source_id":       {Type: "string", Description: "Funding source UUID"},
					"amount":          {Type: "number", Description: "Amount to fund"},
					"currency":        {Type: "string", Description: "Currency code"},
					"idempotency_key": idempotencyProperty(),
				},
				Required: []string{"source_id", "amount", "currency"},
			},
		},
		{
			Name:        "payouts_list",
			Description: "List payout requests",
			InputSchema: emptySchema(),
		},
		{
			Name:        "payouts_create",
			Description: "Create a payout request to bank or crypto destination",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"amount":           {Type: "number", Description: "Payout amount"},
					"currency":         {Type: "string", Description: "Currency code"},
					"destination_bank": {Type: "string", Description: "Bank code/name or SOLANA/CRYPTO"},
					"account_number":   {Type: "string", Description: "Destination account number/address"},
					"account_name":     {Type: "string", Description: "Destination account holder"},
					"idempotency_key":  idempotencyProperty(),
				},
				Required: []string{"amount", "currency", "destination_bank", "account_number", "account_name"},
			},
		},
		{
			Name:        "payment_links_list",
			Description: "List payment links",
			InputSchema: emptySchema(),
		},
		{
			Name:        "payment_links_create",
			Description: "Create a payment link",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"title":           {Type: "string", Description: "Payment link title"},
					"amount":          {Type: "number", Description: "Amount to collect"},
					"currency":        {Type: "string", Description: "Currency code"},
					"idempotency_key": idempotencyProperty(),
				},
				Required: []string{"title", "amount", "currency"},
			},
		},
		{
			Name:        "customers_list",
			Description: "List customers",
			InputSchema: emptySchema(),
		},
		{
			Name:        "customers_create",
			Description: "Create a customer",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"name":  {Type: "string", Description: "Customer name"},
					"phone": {Type: "string", Description: "Customer phone"},
					"email": {Type: "string", Description: "Customer email"},
				},
				Required: []string{"name"},
			},
		},
		{
			Name:        "invoices_list",
			Description: "List invoices (optional status filter)",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"status": {Type: "string", Description: "Optional status filter"},
				},
			},
		},
		{
			Name:        "invoices_create",
			Description: "Create invoice",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"customer_id": {Type: "string", Description: "Customer UUID"},
					"currency":    {Type: "string", Description: "Currency code"},
					"items":       {Type: "array", Description: "Line items: [{description, qty, unit_price}]"},
					"due_date":    {Type: "string", Description: "Optional RFC3339 timestamp"},
				},
				Required: []string{"customer_id", "currency", "items"},
			},
		},
		{
			Name:        "invoice_get",
			Description: "Get invoice detail by ID",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"id": {Type: "string", Description: "Invoice UUID"},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "invoice_payment_link",
			Description: "Generate invoice payment link",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"id": {Type: "string", Description: "Invoice UUID"},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "invoice_send",
			Description: "Send invoice to customer",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"id": {Type: "string", Description: "Invoice UUID"},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "invoice_remind",
			Description: "Send invoice reminder",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"id": {Type: "string", Description: "Invoice UUID"},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "api_keys_list",
			Description: "List account API keys",
			InputSchema: emptySchema(),
		},
		{
			Name:        "api_keys_create",
			Description: "Create an API key (paid plans)",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"name":    {Type: "string", Description: "Key label"},
					"is_live": {Type: "boolean", Description: "Whether key is live/production"},
				},
				Required: []string{"name"},
			},
		},
		{
			Name:        "api_keys_revoke",
			Description: "Revoke an API key by ID",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"id": {Type: "string", Description: "API key UUID"},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "webhooks_list",
			Description: "List webhooks",
			InputSchema: emptySchema(),
		},
		{
			Name:        "webhooks_create",
			Description: "Create webhook endpoint (paid plans)",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"url":    {Type: "string", Description: "HTTPS endpoint URL"},
					"events": {Type: "array", Description: "Event names"},
				},
				Required: []string{"url", "events"},
			},
		},
		{
			Name:        "webhooks_delete",
			Description: "Delete webhook by ID",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"id": {Type: "string", Description: "Webhook UUID"},
				},
				Required: []string{"id"},
			},
		},
		{
			Name:        "account_settings_get",
			Description: "Fetch account settings/profile",
			InputSchema: emptySchema(),
		},
		{
			Name:        "account_settings_update",
			Description: "Update account settings/profile",
			InputSchema: InputSchema{
				Type:       "object",
				Properties: map[string]Property{"profile": {Type: "object", Description: "UpdateAccountInput payload"}},
				Required:   []string{"profile"},
			},
		},
		{
			Name:        "liquidity_get",
			Description: "Get account liquidity snapshot",
			InputSchema: emptySchema(),
		},
		{
			Name:        "notifications_list",
			Description: "List user notifications",
			InputSchema: emptySchema(),
		},
		{
			Name:        "social_goals_list",
			Description: "List social goals",
			InputSchema: emptySchema(),
		},
		{
			Name:        "social_goals_create",
			Description: "Create social goal",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"title":           {Type: "string", Description: "Goal title"},
					"description":     {Type: "string", Description: "Goal description"},
					"target_amount":   {Type: "number", Description: "Target amount"},
					"currency":        {Type: "string", Description: "Goal currency"},
					"product_link":    {Type: "string", Description: "Optional product link"},
					"idempotency_key": idempotencyProperty(),
				},
				Required: []string{"title", "target_amount", "currency"},
			},
		},
		{
			Name:        "social_goal_get",
			Description: "Get social goal by ID",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"goal_id": {Type: "string", Description: "Goal UUID"},
				},
				Required: []string{"goal_id"},
			},
		},
		{
			Name:        "social_goal_contributions",
			Description: "List contributions for a goal",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"goal_id": {Type: "string", Description: "Goal UUID"},
				},
				Required: []string{"goal_id"},
			},
		},
		{
			Name:        "social_goal_contribute",
			Description: "Contribute to goal",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"goal_id":          {Type: "string", Description: "Goal UUID"},
					"contributor_name": {Type: "string", Description: "Contributor name"},
					"amount":           {Type: "number", Description: "Contribution amount"},
					"currency":         {Type: "string", Description: "Currency"},
					"auto_convert":     {Type: "boolean", Description: "Auto convert to goal currency"},
					"idempotency_key":  idempotencyProperty(),
				},
				Required: []string{"goal_id", "amount", "currency"},
			},
		},
		{
			Name:        "social_goal_eject",
			Description: "Withdraw goal funds (owner only)",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"goal_id": {Type: "string", Description: "Goal UUID"},
				},
				Required: []string{"goal_id"},
			},
		},
		{
			Name:        "social_pay",
			Description: "Send social payment by recipient email or wallet",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"from_wallet":     {Type: "string", Description: "Optional sender wallet UUID"},
					"to_wallet":       {Type: "string", Description: "Optional recipient wallet UUID"},
					"to_email":        {Type: "string", Description: "Recipient email"},
					"to_handle":       {Type: "string", Description: "Recipient handle"},
					"amount":          {Type: "number", Description: "Amount"},
					"message":         {Type: "string", Description: "Payment note"},
					"currency":        {Type: "string", Description: "Currency"},
					"idempotency_key": idempotencyProperty(),
				},
				Required: []string{"amount"},
			},
		},
		{
			Name:        "exchange_rate_get",
			Description: "Get FX quote between two currencies",
			InputSchema: InputSchema{
				Type: "object",
				Properties: map[string]Property{
					"from_currency": {Type: "string", Description: "Source currency"},
					"to_currency":   {Type: "string", Description: "Target currency"},
				},
				Required: []string{"from_currency", "to_currency"},
			},
		},
	}
}

// GetResources returns the list of available resources.
func (s *MCPServer) GetResources() []Resource {
	return []Resource{
		{URI: "corridor://wallets", Name: "Wallets", Description: "Wallet balances", MimeType: "application/json"},
		{URI: "corridor://account/settings", Name: "Account Settings", Description: "Account profile/settings", MimeType: "application/json"},
		{URI: "corridor://notifications", Name: "Notifications", Description: "Recent notifications", MimeType: "application/json"},
		{URI: "corridor://social/goals", Name: "Social Goals", Description: "Social crowdfunding goals", MimeType: "application/json"},
		{URI: "corridor://invoices", Name: "Invoices", Description: "Invoice list", MimeType: "application/json"},
	}
}

// CallTool executes a tool and returns the result.
func (s *MCPServer) CallTool(ctx context.Context, name string, args map[string]interface{}) (interface{}, error) {
	// Track usage before execution
	go s.apiCall(ctx, http.MethodPost, "/api/billing/usage/track", map[string]string{"feature": "api_access"}, nil)

	switch name {
	case "wallets_list":
		return s.apiCall(ctx, http.MethodGet, "/api/wallets", nil, nil)
	case "wallets_create":
		return s.apiCall(ctx, http.MethodPost, "/api/wallets", args, nil)

	case "funding_sources_list":
		return s.apiCall(ctx, http.MethodGet, "/api/funding-sources", nil, nil)
	case "funding_sources_add":
		payload, headers := splitPayloadAndHeaders(args)
		return s.apiCall(ctx, http.MethodPost, "/api/funding-sources", payload, headers)
	case "fund_wallet":
		payload, headers := splitPayloadAndHeaders(args)
		return s.apiCall(ctx, http.MethodPost, "/api/fund-wallet", payload, headers)

	case "payouts_list":
		return s.apiCall(ctx, http.MethodGet, "/api/payouts", nil, nil)
	case "payouts_create":
		payload, headers := splitPayloadAndHeaders(args)
		return s.apiCall(ctx, http.MethodPost, "/api/payouts", payload, headers)

	case "payment_links_list":
		return s.apiCall(ctx, http.MethodGet, "/api/payment-links", nil, nil)
	case "payment_links_create":
		payload, headers := splitPayloadAndHeaders(args)
		return s.apiCall(ctx, http.MethodPost, "/api/payment-links", payload, headers)

	case "customers_list":
		return s.apiCall(ctx, http.MethodGet, "/api/customers", nil, nil)
	case "customers_create":
		return s.apiCall(ctx, http.MethodPost, "/api/customers", args, nil)

	case "invoices_list":
		endpoint := "/api/invoices"
		if status, _ := args["status"].(string); status != "" {
			endpoint += "?status=" + url.QueryEscape(status)
		}
		return s.apiCall(ctx, http.MethodGet, endpoint, nil, nil)
	case "invoices_create":
		return s.apiCall(ctx, http.MethodPost, "/api/invoices", args, nil)
	case "invoice_get":
		id, err := requiredStringArg(args, "id")
		if err != nil {
			return nil, err
		}
		return s.apiCall(ctx, http.MethodGet, "/api/invoices/detail?id="+url.QueryEscape(id), nil, nil)
	case "invoice_payment_link":
		id, err := requiredStringArg(args, "id")
		if err != nil {
			return nil, err
		}
		return s.apiCall(ctx, http.MethodPost, "/api/invoices/pay?id="+url.QueryEscape(id), nil, nil)
	case "invoice_send":
		id, err := requiredStringArg(args, "id")
		if err != nil {
			return nil, err
		}
		return s.apiCall(ctx, http.MethodPost, "/api/invoices/send?id="+url.QueryEscape(id), nil, nil)
	case "invoice_remind":
		id, err := requiredStringArg(args, "id")
		if err != nil {
			return nil, err
		}
		return s.apiCall(ctx, http.MethodPost, "/api/invoices/remind?id="+url.QueryEscape(id), nil, nil)

	case "api_keys_list":
		return s.apiCall(ctx, http.MethodGet, "/api/api-keys", nil, nil)
	case "api_keys_create":
		return s.apiCall(ctx, http.MethodPost, "/api/api-keys", args, nil)
	case "api_keys_revoke":
		id, err := requiredStringArg(args, "id")
		if err != nil {
			return nil, err
		}
		return s.apiCall(ctx, http.MethodPost, "/api/api-keys/revoke?id="+url.QueryEscape(id), nil, nil)

	case "webhooks_list":
		return s.apiCall(ctx, http.MethodGet, "/api/webhooks", nil, nil)
	case "webhooks_create":
		return s.apiCall(ctx, http.MethodPost, "/api/webhooks", args, nil)
	case "webhooks_delete":
		id, err := requiredStringArg(args, "id")
		if err != nil {
			return nil, err
		}
		return s.apiCall(ctx, http.MethodPost, "/api/webhooks/delete?id="+url.QueryEscape(id), nil, nil)

	case "account_settings_get":
		return s.apiCall(ctx, http.MethodGet, "/api/accounts/settings", nil, nil)
	case "account_settings_update":
		profile, ok := args["profile"]
		if !ok {
			return nil, fmt.Errorf("missing required argument: profile")
		}
		return s.apiCall(ctx, http.MethodPost, "/api/accounts/settings", profile, nil)

	case "liquidity_get":
		return s.apiCall(ctx, http.MethodGet, "/api/account/liquidity", nil, nil)
	case "notifications_list":
		return s.apiCall(ctx, http.MethodGet, "/api/notifications", nil, nil)

	case "social_goals_list":
		return s.apiCall(ctx, http.MethodGet, "/api/social/goals", nil, nil)
	case "social_goals_create":
		payload, headers := splitPayloadAndHeaders(args)
		return s.apiCall(ctx, http.MethodPost, "/api/social/goals", payload, headers)
	case "social_goal_get":
		goalID, err := requiredStringArg(args, "goal_id")
		if err != nil {
			return nil, err
		}
		return s.apiCall(ctx, http.MethodGet, "/api/social/goals/"+url.PathEscape(goalID), nil, nil)
	case "social_goal_contributions":
		goalID, err := requiredStringArg(args, "goal_id")
		if err != nil {
			return nil, err
		}
		return s.apiCall(ctx, http.MethodGet, "/api/social/goals/"+url.PathEscape(goalID)+"/contributions", nil, nil)
	case "social_goal_contribute":
		payload, headers := splitPayloadAndHeaders(args)
		return s.apiCall(ctx, http.MethodPost, "/api/social/goals/contribute", payload, headers)
	case "social_goal_eject":
		return s.apiCall(ctx, http.MethodPost, "/api/social/goals/eject", args, nil)
	case "social_pay":
		payload, headers := splitPayloadAndHeaders(args)
		return s.apiCall(ctx, http.MethodPost, "/api/social/pay", payload, headers)
	case "exchange_rate_get":
		from, err := requiredStringArg(args, "from_currency")
		if err != nil {
			return nil, err
		}
		to, err := requiredStringArg(args, "to_currency")
		if err != nil {
			return nil, err
		}
		endpoint := fmt.Sprintf("/api/social/exchange-rate?from=%s&to=%s", url.QueryEscape(from), url.QueryEscape(to))
		return s.apiCall(ctx, http.MethodGet, endpoint, nil, nil)
	default:
		return nil, fmt.Errorf("unknown tool: %s", name)
	}
}

// ReadResource reads a resource and returns its contents.
func (s *MCPServer) ReadResource(ctx context.Context, uri string) (interface{}, error) {
	switch {
	case uri == "corridor://wallets":
		return s.apiCall(ctx, http.MethodGet, "/api/wallets", nil, nil)
	case uri == "corridor://account/settings":
		return s.apiCall(ctx, http.MethodGet, "/api/accounts/settings", nil, nil)
	case uri == "corridor://notifications":
		return s.apiCall(ctx, http.MethodGet, "/api/notifications", nil, nil)
	case uri == "corridor://social/goals":
		return s.apiCall(ctx, http.MethodGet, "/api/social/goals", nil, nil)
	case uri == "corridor://invoices":
		return s.apiCall(ctx, http.MethodGet, "/api/invoices", nil, nil)
	default:
		return nil, fmt.Errorf("unknown resource: %s", uri)
	}
}

func requiredStringArg(args map[string]interface{}, key string) (string, error) {
	v, ok := args[key]
	if !ok {
		return "", fmt.Errorf("missing required argument: %s", key)
	}
	s, ok := v.(string)
	if !ok || strings.TrimSpace(s) == "" {
		return "", fmt.Errorf("invalid argument %s: expected non-empty string", key)
	}
	return s, nil
}

func splitPayloadAndHeaders(args map[string]interface{}) (map[string]interface{}, map[string]string) {
	payload := map[string]interface{}{}
	headers := map[string]string{}
	for k, v := range args {
		if k == "idempotency_key" {
			if s, ok := v.(string); ok && strings.TrimSpace(s) != "" {
				headers["X-Idempotency-Key"] = s
			}
			continue
		}
		payload[k] = v
	}
	return payload, headers
}

// apiCall makes an authenticated API request and returns decoded response payload.
func (s *MCPServer) apiCall(ctx context.Context, method, endpoint string, body interface{}, extraHeaders map[string]string) (interface{}, error) {
	var reqBody io.Reader
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to serialize request body: %w", err)
		}
		reqBody = strings.NewReader(string(jsonBody))
	}

	req, err := http.NewRequestWithContext(ctx, method, s.apiBaseURL+endpoint, reqBody)
	if err != nil {
		return nil, err
	}

	req.Header.Set("X-API-Key", s.apiKey)
	req.Header.Set("Content-Type", "application/json")
	for k, v := range extraHeaders {
		req.Header.Set(k, v)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var decoded interface{}
	if len(strings.TrimSpace(string(bodyBytes))) > 0 {
		if err := json.Unmarshal(bodyBytes, &decoded); err != nil {
			if resp.StatusCode >= 400 {
				return nil, fmt.Errorf("API error: status %d: %s", resp.StatusCode, strings.TrimSpace(string(bodyBytes)))
			}
			return map[string]interface{}{"raw": string(bodyBytes)}, nil
		}
	}

	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("API error (%d): %s", resp.StatusCode, extractAPIError(decoded, string(bodyBytes)))
	}

	return unwrapDataEnvelope(decoded), nil
}

func unwrapDataEnvelope(v interface{}) interface{} {
	m, ok := v.(map[string]interface{})
	if !ok {
		if v == nil {
			return map[string]interface{}{"status": "ok"}
		}
		return v
	}

	if data, has := m["data"]; has {
		return data
	}
	return m
}

func extractAPIError(decoded interface{}, fallback string) string {
	if m, ok := decoded.(map[string]interface{}); ok {
		if actionable, ok := m["actionable_error"].(string); ok && actionable != "" {
			return actionable
		}
		if errMsg, ok := m["error"].(string); ok && errMsg != "" {
			return errMsg
		}
		if msg, ok := m["message"].(string); ok && msg != "" {
			return msg
		}
	}
	if strings.TrimSpace(fallback) != "" {
		return strings.TrimSpace(fallback)
	}
	return "request failed"
}

// Run starts the MCP server and processes requests.
func (s *MCPServer) Run() error {
	for {
		line, err := s.reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				return nil
			}
			return err
		}

		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		var req JSONRPCRequest
		if err := json.Unmarshal([]byte(line), &req); err != nil {
			s.sendError(nil, -32700, "Parse error", err.Error())
			continue
		}

		s.handleRequest(&req)
	}
}

// ExecuteJSONRPC processes a single JSON-RPC request and returns the response.
func (s *MCPServer) ExecuteJSONRPC(req *JSONRPCRequest) JSONRPCResponse {
	ctx := context.Background()

	switch req.Method {
	case "initialize":
		return JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result: map[string]interface{}{
				"protocolVersion": "2024-11-05",
				"capabilities": map[string]interface{}{
					"tools":     map[string]interface{}{},
					"resources": map[string]interface{}{},
				},
				"serverInfo": map[string]interface{}{
					"name":    "corridor-mcp",
					"version": "2.0.0",
				},
			},
		}
	case "tools/list":
		return JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result:  map[string]interface{}{"tools": s.GetTools()},
		}
	case "tools/call":
		var params struct {
			Name      string                 `json:"name"`
			Arguments map[string]interface{} `json:"arguments"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			return JSONRPCResponse{JSONRPC: "2.0", ID: req.ID, Error: &RPCError{Code: -32602, Message: "Invalid params", Data: err.Error()}}
		}

		result, err := s.CallTool(ctx, params.Name, params.Arguments)
		if err != nil {
			return JSONRPCResponse{JSONRPC: "2.0", ID: req.ID, Error: &RPCError{Code: -32000, Message: "Tool execution failed", Data: err.Error()}}
		}

		return JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result: map[string]interface{}{
				"content": []map[string]interface{}{{"type": "text", "text": toJSON(result)}},
			},
		}
	case "resources/list":
		return JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result:  map[string]interface{}{"resources": s.GetResources()},
		}
	case "resources/read":
		var params struct {
			URI string `json:"uri"`
		}
		if err := json.Unmarshal(req.Params, &params); err != nil {
			return JSONRPCResponse{JSONRPC: "2.0", ID: req.ID, Error: &RPCError{Code: -32602, Message: "Invalid params", Data: err.Error()}}
		}

		result, err := s.ReadResource(ctx, params.URI)
		if err != nil {
			return JSONRPCResponse{JSONRPC: "2.0", ID: req.ID, Error: &RPCError{Code: -32000, Message: "Resource read failed", Data: err.Error()}}
		}

		return JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Result: map[string]interface{}{
				"contents": []map[string]interface{}{{
					"uri":      params.URI,
					"mimeType": "application/json",
					"text":     toJSON(result),
				}},
			},
		}
	default:
		return JSONRPCResponse{
			JSONRPC: "2.0",
			ID:      req.ID,
			Error:   &RPCError{Code: -32601, Message: "Method not found", Data: req.Method},
		}
	}
}

func (s *MCPServer) handleRequest(req *JSONRPCRequest) {
	resp := s.ExecuteJSONRPC(req)
	s.send(resp)
}

func (s *MCPServer) sendResult(id interface{}, result interface{}) {
	resp := JSONRPCResponse{JSONRPC: "2.0", ID: id, Result: result}
	s.send(resp)
}

func (s *MCPServer) sendError(id interface{}, code int, message, data string) {
	resp := JSONRPCResponse{
		JSONRPC: "2.0",
		ID:      id,
		Error: &RPCError{
			Code:    code,
			Message: message,
			Data:    data,
		},
	}
	s.send(resp)
}

func (s *MCPServer) send(resp JSONRPCResponse) {
	data, _ := json.Marshal(resp)
	fmt.Fprintln(s.writer, string(data))
}

func toJSON(v interface{}) string {
	data, _ := json.MarshalIndent(v, "", "  ")
	return string(data)
}
