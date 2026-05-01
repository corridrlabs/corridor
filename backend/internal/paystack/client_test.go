package paystack

import (
	"crypto/hmac"
	"crypto/sha512"
	"encoding/hex"
	"net/http"
	"net/http/httptest"
	"testing"
	"context"
)

func TestPaymentInitialization(t *testing.T) {
	// Mock Paystack server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != "POST" {
			t.Errorf("expected POST, got %s", r.Method)
		}
		
		if r.URL.Path != "/transaction/initialize" {
			t.Errorf("expected /transaction/initialize, got %s", r.URL.Path)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
			"status": true,
			"data": {
				"authorization_url": "https://checkout.paystack.com/test123",
				"reference": "ref_123456"
			}
		}`))
	}))
	defer server.Close()

	client := NewClient("test_key")
	client.baseURL = server.URL
	
	req := InitializePaymentRequest{
		Email:    "test@example.com",
		Amount:   10000, // 100 NGN in kobo
		Currency: "NGN",
	}

	resp, err := client.InitializePayment(context.Background(), req)
	if err != nil {
		t.Errorf("payment initialization failed: %v", err)
	}

	if !resp.Status {
		t.Error("expected status true")
	}

	if resp.Data.Reference != "ref_123456" {
		t.Errorf("expected reference ref_123456, got %s", resp.Data.Reference)
	}
}

func TestWebhookSignatureVerification(t *testing.T) {
	secret := "test_secret"
	payload := `{"event": "charge.success", "data": {"reference": "ref_123"}}`

	// Generate valid signature
	h := hmac.New(sha512.New, []byte(secret))
	h.Write([]byte(payload))
	validSignature := hex.EncodeToString(h.Sum(nil))

	tests := []struct {
		name        string
		signature   string
		payload     string
		shouldValid bool
	}{
		{"Valid signature", validSignature, payload, true},
		{"Invalid signature", "invalid_signature", payload, false},
		{"Empty signature", "", payload, false},
		{"Modified payload", validSignature, `{"event": "modified"}`, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			valid := verifyWebhookSignature(tt.signature, tt.payload, secret)
			if valid != tt.shouldValid {
				t.Errorf("expected %v, got %v", tt.shouldValid, valid)
			}
		})
	}
}

func TestTransferCreation(t *testing.T) {
	// Mock Paystack server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/transfer" {
			t.Errorf("expected /transfer, got %s", r.URL.Path)
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{
			"status": true,
			"data": {
				"reference": "transfer_123",
				"transfer_code": "TRF_123456",
				"status": "pending"
			}
		}`))
	}))
	defer server.Close()

	client := NewClient("test_key")
	client.baseURL = server.URL

	transfer := TransferRequest{
		Source:    "balance",
		Amount:    50000, // 500 NGN in kobo
		Recipient: "RCP_123456",
		Reason:    "Test transfer",
	}

	err := client.InitiateTransfer(context.Background(), transfer)
	if err != nil {
		t.Errorf("transfer creation failed: %v", err)
	}
}



func verifyWebhookSignature(signature, payload, secret string) bool {
	if signature == "" {
		return false
	}

	h := hmac.New(sha512.New, []byte(secret))
	h.Write([]byte(payload))
	expectedSignature := hex.EncodeToString(h.Sum(nil))

	return hmac.Equal([]byte(signature), []byte(expectedSignature))
}