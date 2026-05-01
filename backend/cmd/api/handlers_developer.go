package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

// API Key tiers and their limits
type APIKeyTier string

const (
	TierOne   APIKeyTier = "tier_1"
	TierTwo   APIKeyTier = "tier_2"
	TierThree APIKeyTier = "tier_3"
)

type TierLimits struct {
	RequestsPerMonth int      `json:"requests_per_month"`
	Features         []string `json:"features"`
	Price            float64  `json:"price"`
}

var tierLimits = map[APIKeyTier]TierLimits{
	TierOne: {
		RequestsPerMonth: 1000,
		Features:         []string{"Basic payments", "Social goals", "Wallets"},
		Price:            0.0,
	},
	TierTwo: {
		RequestsPerMonth: 5000,
		Features:         []string{"EWA admin", "Advanced payments", "Webhooks", "Split payments"},
		Price:            99.0,
	},
	TierThree: {
		RequestsPerMonth: 10000,
		Features:         []string{"Treasury access", "All endpoints", "Priority support", "Custom limits"},
		Price:            299.0,
	},
}

type CreateAPIKeyRequest struct {
	Name        string     `json:"name" validate:"required"`
	Tier        APIKeyTier `json:"tier" validate:"required"`
	Permissions []string   `json:"permissions"`
}

type APIKeyResponse struct {
	ID          string     `json:"id"`
	Name        string     `json:"name"`
	Key         string     `json:"key,omitempty"` // Only returned on creation
	KeyPrefix   string     `json:"key_prefix"`
	Tier        APIKeyTier `json:"tier"`
	Permissions []string   `json:"permissions"`
	Usage       Usage      `json:"usage"`
	CreatedAt   time.Time  `json:"created_at"`
	LastUsedAt  *time.Time `json:"last_used_at"`
	Status      string     `json:"status"`
}

type Usage struct {
	Requests int    `json:"requests"`
	Limit    int    `json:"limit"`
	Period   string `json:"period"`
}

type UsageStats struct {
	TotalRequests    int                    `json:"total_requests"`
	SuccessRate      float64                `json:"success_rate"`
	AvgResponseTime  int                    `json:"avg_response_time_ms"`
	TopEndpoints     []EndpointUsage        `json:"top_endpoints"`
	UsageByDay       []DailyUsage           `json:"usage_by_day"`
	ErrorBreakdown   map[string]int         `json:"error_breakdown"`
}

type EndpointUsage struct {
	Endpoint string `json:"endpoint"`
	Count    int    `json:"count"`
	AvgTime  int    `json:"avg_response_time_ms"`
}

type DailyUsage struct {
	Date     string `json:"date"`
	Requests int    `json:"requests"`
	Errors   int    `json:"errors"`
}

type WebhookEndpoint struct {
	ID        string    `json:"id"`
	URL       string    `json:"url"`
	Events    []string  `json:"events"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
	Secret    string    `json:"secret,omitempty"` // Only returned on creation
}

type CreateWebhookRequest struct {
	URL    string   `json:"url" validate:"required,url"`
	Events []string `json:"events" validate:"required,min=1"`
}

type WebhookTestResult struct {
	Success        bool   `json:"success"`
	ResponseCode   int    `json:"response_code"`
	ResponseTime   int    `json:"response_time_ms"`
	Error          string `json:"error,omitempty"`
	ResponseBody   string `json:"response_body,omitempty"`
}

type SandboxData struct {
	Users    []SandboxUser    `json:"users"`
	Goals    []SandboxGoal    `json:"goals"`
	Payments []SandboxPayment `json:"payments"`
}

type SandboxUser struct {
	ID       string  `json:"id"`
	Email    string  `json:"email"`
	Name     string  `json:"name"`
	Balance  float64 `json:"balance"`
	Currency string  `json:"currency"`
}

type SandboxGoal struct {
	ID       string  `json:"id"`
	Title    string  `json:"title"`
	Target   float64 `json:"target"`
	Current  float64 `json:"current"`
	Currency string  `json:"currency"`
}

type SandboxPayment struct {
	ID       string  `json:"id"`
	From     string  `json:"from"`
	To       string  `json:"to"`
	Amount   float64 `json:"amount"`
	Currency string  `json:"currency"`
	Status   string  `json:"status"`
}

// Developer Portal Handlers

func handleCreateAPIKey(w http.ResponseWriter, r *http.Request) {
	var req CreateAPIKeyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate tier
	limits, exists := tierLimits[req.Tier]
	if !exists {
		http.Error(w, "Invalid tier", http.StatusBadRequest)
		return
	}

	// Generate API key
	keyID := generateUUID()
	fullKey := fmt.Sprintf("pk_%s_%s", req.Tier, generateRandomString(32))
	keyPrefix := fullKey[:16] + "..."

	// Create API key record (in real implementation, save to database)
	apiKey := APIKeyResponse{
		ID:          keyID,
		Name:        req.Name,
		Key:         fullKey, // Only returned on creation
		KeyPrefix:   keyPrefix,
		Tier:        req.Tier,
		Permissions: req.Permissions,
		Usage: Usage{
			Requests: 0,
			Limit:    limits.RequestsPerMonth,
			Period:   "monthly",
		},
		CreatedAt: time.Now(),
		Status:    "active",
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(apiKey)
}

func handleListAPIKeys(w http.ResponseWriter, r *http.Request) {
	// Mock data - in real implementation, fetch from database
	apiKeys := []APIKeyResponse{
		{
			ID:        "key_1",
			Name:      "Production API Key",
			KeyPrefix: "pk_tier_3_12345678...",
			Tier:      TierThree,
			Permissions: []string{"payments:read", "payments:write", "treasury:read"},
			Usage: Usage{
				Requests: 8750,
				Limit:    10000,
				Period:   "monthly",
			},
			CreatedAt:  time.Now().AddDate(0, -1, 0),
			LastUsedAt: timePtr(time.Now().Add(-2 * time.Hour)),
			Status:     "active",
		},
		{
			ID:        "key_2",
			Name:      "Development Key",
			KeyPrefix: "pk_tier_1_87654321...",
			Tier:      TierOne,
			Permissions: []string{"payments:read", "goals:read"},
			Usage: Usage{
				Requests: 245,
				Limit:    1000,
				Period:   "monthly",
			},
			CreatedAt:  time.Now().AddDate(0, 0, -10),
			LastUsedAt: timePtr(time.Now().Add(-1 * time.Hour)),
			Status:     "active",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(apiKeys)
}

func handleGetAPIKeyUsage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	_ = vars["keyId"]

	// Mock usage statistics
	stats := UsageStats{
		TotalRequests:   8995,
		SuccessRate:     99.2,
		AvgResponseTime: 145,
		TopEndpoints: []EndpointUsage{
			{Endpoint: "/api/payments/split", Count: 3420, AvgTime: 120},
			{Endpoint: "/api/goals", Count: 2150, AvgTime: 85},
			{Endpoint: "/api/wallets/balance", Count: 1890, AvgTime: 95},
			{Endpoint: "/api/ewa/requests", Count: 1535, AvgTime: 200},
		},
		UsageByDay: []DailyUsage{
			{Date: "2024-01-15", Requests: 450, Errors: 3},
			{Date: "2024-01-14", Requests: 520, Errors: 5},
			{Date: "2024-01-13", Requests: 380, Errors: 2},
			{Date: "2024-01-12", Requests: 610, Errors: 8},
			{Date: "2024-01-11", Requests: 490, Errors: 4},
		},
		ErrorBreakdown: map[string]int{
			"400": 15,
			"401": 3,
			"429": 8,
			"500": 2,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(stats)
}

func handleRevokeAPIKey(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	keyID := vars["keyId"]

	// In real implementation, update database to revoke key
	fmt.Printf("Revoking API key: %s\n", keyID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "API key revoked successfully",
	})
}

// Webhook Management Handlers

func handleCreateWebhook(w http.ResponseWriter, r *http.Request) {
	var req CreateWebhookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate events
	validEvents := map[string]bool{
		"payment.completed": true,
		"payment.failed":    true,
		"goal.completed":    true,
		"goal.cancelled":    true,
		"ewa.requested":     true,
		"ewa.approved":      true,
		"ewa.disbursed":     true,
		"invoice.paid":      true,
	}

	for _, event := range req.Events {
		if !validEvents[event] {
			http.Error(w, fmt.Sprintf("Invalid event: %s", event), http.StatusBadRequest)
			return
		}
	}

	// Create webhook endpoint
	webhook := WebhookEndpoint{
		ID:        generateUUID(),
		URL:       req.URL,
		Events:    req.Events,
		Status:    "active",
		CreatedAt: time.Now(),
		Secret:    generateRandomString(32), // Only returned on creation
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(webhook)
}

func handleListWebhooks(w http.ResponseWriter, r *http.Request) {
	// Mock data
	webhooks := []WebhookEndpoint{
		{
			ID:        "webhook_1",
			URL:       "https://api.example.com/webhooks/corridor",
			Events:    []string{"payment.completed", "payment.failed"},
			Status:    "active",
			CreatedAt: time.Now().AddDate(0, 0, -5),
		},
		{
			ID:        "webhook_2",
			URL:       "https://webhook.site/test-endpoint",
			Events:    []string{"goal.completed", "ewa.requested"},
			Status:    "active",
			CreatedAt: time.Now().AddDate(0, 0, -2),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(webhooks)
}

func handleTestWebhook(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	webhookID := vars["webhookId"]

	// Simulate webhook test
	time.Sleep(500 * time.Millisecond) // Simulate network delay

	// Mock test result
	result := WebhookTestResult{
		Success:      true,
		ResponseCode: 200,
		ResponseTime: 145,
		ResponseBody: `{"status": "received"}`,
	}

	// Randomly simulate failures for demo
	if time.Now().Unix()%5 == 0 {
		result.Success = false
		result.ResponseCode = 500
		result.Error = "Internal server error"
		result.ResponseBody = `{"error": "Internal server error"}`
	}

	fmt.Printf("Testing webhook: %s\n", webhookID)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// Sandbox Environment Handlers

func handleGetSandboxData(w http.ResponseWriter, r *http.Request) {
	// Mock sandbox data
	data := SandboxData{
		Users: []SandboxUser{
			{ID: "user_1", Email: "alice@example.com", Name: "Alice Johnson", Balance: 1250.00, Currency: "USDC"},
			{ID: "user_2", Email: "bob@example.com", Name: "Bob Smith", Balance: 850.50, Currency: "USDC"},
			{ID: "user_3", Email: "carol@example.com", Name: "Carol Davis", Balance: 2100.75, Currency: "USDC"},
		},
		Goals: []SandboxGoal{
			{ID: "goal_1", Title: "Team Lunch Fund", Target: 500.00, Current: 325.00, Currency: "USDC"},
			{ID: "goal_2", Title: "Office Equipment", Target: 2000.00, Current: 1450.00, Currency: "USDC"},
		},
		Payments: []SandboxPayment{
			{ID: "pay_1", From: "Alice Johnson", To: "Bob Smith", Amount: 50.00, Currency: "USDC", Status: "completed"},
			{ID: "pay_2", From: "Carol Davis", To: "Team Lunch Fund", Amount: 25.00, Currency: "USDC", Status: "completed"},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func handleResetSandbox(w http.ResponseWriter, r *http.Request) {
	// In real implementation, reset sandbox database to initial state
	fmt.Println("Resetting sandbox environment")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Sandbox environment reset successfully",
	})
}

func handleRunSandboxScenario(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	scenarioID := vars["scenarioId"]

	// Simulate scenario execution
	time.Sleep(1500 * time.Millisecond)

	var result interface{}
	switch scenarioID {
	case "split_payment":
		result = map[string]interface{}{
			"id":           "split_" + strconv.FormatInt(time.Now().Unix(), 10),
			"status":       "completed",
			"total_amount": 100.00,
			"recipients": []map[string]interface{}{
				{"wallet_id": "user_1", "amount": 60.00, "status": "completed"},
				{"wallet_id": "user_2", "amount": 40.00, "status": "completed"},
			},
		}
	case "create_goal":
		result = map[string]interface{}{
			"id":            "goal_" + strconv.FormatInt(time.Now().Unix(), 10),
			"title":         "New Project Fund",
			"target_amount": 1000.00,
			"current_amount": 0,
			"currency":      "USDC",
			"status":        "active",
		}
	default:
		result = map[string]interface{}{
			"success": true,
			"message": "Test completed successfully",
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(result)
}

// Tier Management Handlers

func handleGetTiers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tierLimits)
}

func handleUpgradeTier(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	keyID := vars["keyId"]
	
	var req struct {
		NewTier APIKeyTier `json:"new_tier"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// In real implementation, update database and handle billing
	fmt.Printf("Upgrading API key %s to %s\n", keyID, req.NewTier)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Tier upgraded successfully",
		"new_tier": string(req.NewTier),
	})
}

// Utility functions

func generateUUID() string {
	// Simple UUID generation for demo - use proper UUID library in production
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func generateRandomString(length int) string {
	// Simple random string generation for demo
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := make([]byte, length)
	for i := range result {
		result[i] = charset[time.Now().UnixNano()%int64(len(charset))]
	}
	return string(result)
}

func timePtr(t time.Time) *time.Time {
	return &t
}

// Route registration function
func RegisterDeveloperRoutes(r *mux.Router) {
	// API Key Management
	r.HandleFunc("/api/developer/keys", handleListAPIKeys).Methods("GET")
	r.HandleFunc("/api/developer/keys", handleCreateAPIKey).Methods("POST")
	r.HandleFunc("/api/developer/keys/{keyId}", handleRevokeAPIKey).Methods("DELETE")
	r.HandleFunc("/api/developer/keys/{keyId}/usage", handleGetAPIKeyUsage).Methods("GET")
	r.HandleFunc("/api/developer/keys/{keyId}/upgrade", handleUpgradeTier).Methods("POST")

	// Webhook Management
	r.HandleFunc("/api/developer/webhooks", handleListWebhooks).Methods("GET")
	r.HandleFunc("/api/developer/webhooks", handleCreateWebhook).Methods("POST")
	r.HandleFunc("/api/developer/webhooks/{webhookId}/test", handleTestWebhook).Methods("POST")

	// Sandbox Environment
	r.HandleFunc("/api/developer/sandbox/data", handleGetSandboxData).Methods("GET")
	r.HandleFunc("/api/developer/sandbox/reset", handleResetSandbox).Methods("POST")
	r.HandleFunc("/api/developer/sandbox/scenarios/{scenarioId}/run", handleRunSandboxScenario).Methods("POST")

	// Tier Information
	r.HandleFunc("/api/developer/tiers", handleGetTiers).Methods("GET")
}