package integration

import (
	"encoding/json"
	"net/http"
	"testing"
	"time"
)

func TestDepositFlow(t *testing.T) {
	server := setupTestServer()
	defer server.Close()

	token := createTestUser(t, server, "pro")

	tests := []struct {
		name   string
		method string
		amount float64
	}{
		{"Paystack deposit", "paystack", 100.0},
		{"M-Pesa deposit", "mpesa", 50.0},
		{"Circle USDC deposit", "circle", 1000.0},
		{"Solana deposit", "solana", 500.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Initiate deposit
			depositData := map[string]interface{}{
				"method": tt.method,
				"amount": tt.amount,
			}

			resp := makeAuthenticatedRequest(t, server, "POST", "/api/deposits", depositData, token)
			if resp.StatusCode != http.StatusCreated {
				t.Errorf("expected 201, got %d", resp.StatusCode)
			}

			var deposit map[string]interface{}
			json.NewDecoder(resp.Body).Decode(&deposit)
			
			depositID := deposit["id"].(string)
			if depositID == "" {
				t.Error("expected deposit ID")
			}

			// Simulate webhook confirmation
			webhookData := map[string]interface{}{
				"deposit_id": depositID,
				"status":     "completed",
				"amount":     tt.amount,
			}

			resp = makeRequest(t, server, "POST", "/api/webhooks/"+tt.method, webhookData)
			if resp.StatusCode != http.StatusOK {
				t.Errorf("webhook failed with status %d", resp.StatusCode)
			}

			// Verify balance updated
			resp = makeAuthenticatedRequest(t, server, "GET", "/api/balance", nil, token)
			var balance map[string]interface{}
			json.NewDecoder(resp.Body).Decode(&balance)

			if balance["amount"].(float64) < tt.amount {
				t.Errorf("balance not updated correctly")
			}
		})
	}
}

func TestWithdrawalFlow(t *testing.T) {
	server := setupTestServer()
	defer server.Close()

	token := createTestUser(t, server, "pro")

	// First deposit funds
	depositData := map[string]interface{}{
		"method": "paystack",
		"amount": 1000.0,
	}
	makeAuthenticatedRequest(t, server, "POST", "/api/deposits", depositData, token)

	// Simulate deposit completion
	webhookData := map[string]interface{}{
		"deposit_id": "dep_123",
		"status":     "completed",
		"amount":     1000.0,
	}
	makeRequest(t, server, "POST", "/api/webhooks/paystack", webhookData)

	// Now test withdrawal
	withdrawalData := map[string]interface{}{
		"method":      "bank",
		"amount":      500.0,
		"destination": "acc_123456",
	}

	resp := makeAuthenticatedRequest(t, server, "POST", "/api/withdrawals", withdrawalData, token)
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("expected 201, got %d", resp.StatusCode)
	}

	var withdrawal map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&withdrawal)

	if withdrawal["status"] != "pending" {
		t.Errorf("expected pending status, got %s", withdrawal["status"])
	}
}

func TestP2PTransfer(t *testing.T) {
	server := setupTestServer()
	defer server.Close()

	// Create two users
	senderToken := createTestUser(t, server, "pro")
	receiverToken := createTestUser(t, server, "pro")

	// Fund sender account
	depositData := map[string]interface{}{
		"method": "paystack",
		"amount": 500.0,
	}
	makeAuthenticatedRequest(t, server, "POST", "/api/deposits", depositData, senderToken)

	// Simulate deposit completion
	webhookData := map[string]interface{}{
		"deposit_id": "dep_123",
		"status":     "completed",
		"amount":     500.0,
	}
	makeRequest(t, server, "POST", "/api/webhooks/paystack", webhookData)

	// Transfer funds
	transferData := map[string]interface{}{
		"recipient": "test2@example.com",
		"amount":    200.0,
		"message":   "Test transfer",
	}

	resp := makeAuthenticatedRequest(t, server, "POST", "/api/transfers", transferData, senderToken)
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("expected 201, got %d", resp.StatusCode)
	}

	// Verify sender balance decreased
	resp = makeAuthenticatedRequest(t, server, "GET", "/api/balance", nil, senderToken)
	var senderBalance map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&senderBalance)

	if senderBalance["amount"].(float64) != 300.0 {
		t.Errorf("expected sender balance 300, got %f", senderBalance["amount"])
	}

	// Verify receiver balance increased
	resp = makeAuthenticatedRequest(t, server, "GET", "/api/balance", nil, receiverToken)
	var receiverBalance map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&receiverBalance)

	if receiverBalance["amount"].(float64) != 200.0 {
		t.Errorf("expected receiver balance 200, got %f", receiverBalance["amount"])
	}
}

func TestPaymentFailureHandling(t *testing.T) {
	server := setupTestServer()
	defer server.Close()

	token := createTestUser(t, server, "pro")

	// Attempt withdrawal with insufficient funds
	withdrawalData := map[string]interface{}{
		"method":      "bank",
		"amount":      1000.0,
		"destination": "acc_123456",
	}

	resp := makeAuthenticatedRequest(t, server, "POST", "/api/withdrawals", withdrawalData, token)
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400, got %d", resp.StatusCode)
	}

	var errorResp map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&errorResp)

	if errorResp["error"] == "" {
		t.Error("expected error message")
	}
}

func TestConcurrentTransactions(t *testing.T) {
	server := setupTestServer()
	defer server.Close()

	token := createTestUser(t, server, "pro")

	// Fund account
	depositData := map[string]interface{}{
		"method": "paystack",
		"amount": 1000.0,
	}
	makeAuthenticatedRequest(t, server, "POST", "/api/deposits", depositData, token)

	// Simulate deposit completion
	webhookData := map[string]interface{}{
		"deposit_id": "dep_123",
		"status":     "completed",
		"amount":     1000.0,
	}
	makeRequest(t, server, "POST", "/api/webhooks/paystack", webhookData)

	// Make concurrent transfers
	done := make(chan bool, 5)
	
	for i := 0; i < 5; i++ {
		go func(i int) {
			transferData := map[string]interface{}{
				"recipient": "test2@example.com",
				"amount":    100.0,
				"message":   "Concurrent transfer",
			}

			resp := makeAuthenticatedRequest(t, server, "POST", "/api/transfers", transferData, token)
			
			// Some should succeed, some should fail due to insufficient funds
			if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusBadRequest {
				t.Errorf("unexpected status code: %d", resp.StatusCode)
			}
			
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 5; i++ {
		select {
		case <-done:
		case <-time.After(5 * time.Second):
			t.Fatal("timeout waiting for concurrent transfers")
		}
	}

	// Verify final balance is consistent
	resp := makeAuthenticatedRequest(t, server, "GET", "/api/balance", nil, token)
	var balance map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&balance)

	// Balance should be between 0 and 1000 depending on how many transfers succeeded
	finalBalance := balance["amount"].(float64)
	if finalBalance < 0 || finalBalance > 1000 {
		t.Errorf("invalid final balance: %f", finalBalance)
	}
}