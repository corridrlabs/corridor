package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
)

// MpesaCallbackRequest represents the M-Pesa STK Push callback structure
type MpesaCallbackRequest struct {
	Body struct {
		StkCallback struct {
			MerchantRequestID string `json:"MerchantRequestID"`
			CheckoutRequestID string `json:"CheckoutRequestID"`
			ResultCode        int    `json:"ResultCode"`
			ResultDesc        string `json:"ResultDesc"`
			CallbackMetadata  *struct {
				Item []struct {
					Name  string      `json:"Name"`
					Value interface{} `json:"Value"`
				} `json:"Item"`
			} `json:"CallbackMetadata,omitempty"`
		} `json:"stkCallback"`
	} `json:"Body"`
}

// MpesaTransaction stores M-Pesa transaction details
type MpesaTransaction struct {
	ID                string    `json:"id"`
	MerchantRequestID string    `json:"merchant_request_id"`
	CheckoutRequestID string    `json:"checkout_request_id"`
	Amount            float64   `json:"amount"`
	MpesaReceiptNo    string    `json:"mpesa_receipt_no"`
	TransactionDate   string    `json:"transaction_date"`
	PhoneNumber       string    `json:"phone_number"`
	ResultCode        int       `json:"result_code"`
	ResultDesc        string    `json:"result_desc"`
	Status            string    `json:"status"`
	UserID            string    `json:"user_id,omitempty"`
	ContributionID    string    `json:"contribution_id,omitempty"`
	ProcessedAt       time.Time `json:"processed_at"`
}

// handleMpesaCallback processes M-Pesa STK Push callbacks with idempotency
func (h *Handler) handleMpesaCallback(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var callback MpesaCallbackRequest
	if err := json.NewDecoder(r.Body).Decode(&callback); err != nil {
		log.Printf("Error decoding M-Pesa callback: %v", err)
		http.Error(w, "Invalid callback body", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	stkCallback := callback.Body.StkCallback

	log.Printf("M-Pesa Callback: MerchantRequestID=%s, CheckoutRequestID=%s, ResultCode=%d, ResultDesc=%s",
		stkCallback.MerchantRequestID,
		stkCallback.CheckoutRequestID,
		stkCallback.ResultCode,
		stkCallback.ResultDesc)

	// Idempotency check: Check if we've already processed this callback
	var existingID string
	err := h.svc.GetDB().Pool.QueryRow(ctx,
		"SELECT id FROM mpesa_transactions WHERE checkout_request_id = $1",
		stkCallback.CheckoutRequestID).Scan(&existingID)
	if err == nil && existingID != "" {
		// Already processed - return success to M-Pesa
		log.Printf("M-Pesa callback already processed: %s", stkCallback.CheckoutRequestID)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"ResultCode": "0", "ResultDesc": "Accepted"})
		return
	}

	// Extract callback metadata
	var mpesaTx MpesaTransaction
	mpesaTx.ID = uuid.New().String()
	mpesaTx.MerchantRequestID = stkCallback.MerchantRequestID
	mpesaTx.CheckoutRequestID = stkCallback.CheckoutRequestID
	mpesaTx.ResultCode = stkCallback.ResultCode
	mpesaTx.ResultDesc = stkCallback.ResultDesc
	mpesaTx.ProcessedAt = time.Now()

	if stkCallback.ResultCode == 0 && stkCallback.CallbackMetadata != nil {
		// Successful transaction - extract details
		for _, item := range stkCallback.CallbackMetadata.Item {
			switch item.Name {
			case "Amount":
				if v, ok := item.Value.(float64); ok {
					mpesaTx.Amount = v
				}
			case "MpesaReceiptNumber":
				if v, ok := item.Value.(string); ok {
					mpesaTx.MpesaReceiptNo = v
				}
			case "TransactionDate":
				if v, ok := item.Value.(float64); ok {
					mpesaTx.TransactionDate = fmt.Sprintf("%.0f", v)
				}
			case "PhoneNumber":
				if v, ok := item.Value.(float64); ok {
					mpesaTx.PhoneNumber = fmt.Sprintf("%.0f", v)
				}
			}
		}
		mpesaTx.Status = "COMPLETED"
	} else {
		// Failed transaction
		mpesaTx.Status = "FAILED"
	}

	// Store the transaction record
	_, err = h.svc.GetDB().Pool.Exec(ctx, `
		INSERT INTO mpesa_transactions 
		(id, merchant_request_id, checkout_request_id, amount, mpesa_receipt_no, 
		 transaction_date, phone_number, result_code, result_desc, status, processed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`, mpesaTx.ID, mpesaTx.MerchantRequestID, mpesaTx.CheckoutRequestID, mpesaTx.Amount,
		mpesaTx.MpesaReceiptNo, mpesaTx.TransactionDate, mpesaTx.PhoneNumber,
		mpesaTx.ResultCode, mpesaTx.ResultDesc, mpesaTx.Status, mpesaTx.ProcessedAt)
	if err != nil {
		log.Printf("Error storing M-Pesa transaction: %v", err)
		// Still return success to M-Pesa to prevent retries
	}

	// If successful, process the payment
	if stkCallback.ResultCode == 0 {
		go h.processMpesaPayment(context.Background(), &mpesaTx)
		// Also check for payment link transactions
		go h.processPaymentLinkMpesaPayment(context.Background(), &mpesaTx)
	}

	// Return success response to M-Pesa
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"ResultCode": "0",
		"ResultDesc": "Accepted",
	})
}

// processMpesaPayment handles the business logic after a successful M-Pesa payment
func (h *Handler) processMpesaPayment(ctx context.Context, tx *MpesaTransaction) {
	// Find pending transaction by phone number or merchant request ID
	var userID string
	var walletID string
	var pendingTxID string
	var txType string // "wallet_topup", "goal_contribution", etc.

	// Check for pending wallet topup
	err := h.svc.GetDB().Pool.QueryRow(ctx, `
		SELECT pt.id, pt.user_id, pt.wallet_id, 'wallet_topup'
		FROM pending_mpesa_transactions pt
		WHERE pt.merchant_request_id = $1 AND pt.status = 'PENDING'
	`, tx.MerchantRequestID).Scan(&pendingTxID, &userID, &walletID, &txType)

	if err != nil {
		// Check for pending goal contribution
		err = h.svc.GetDB().Pool.QueryRow(ctx, `
			SELECT pc.id, '', '', 'goal_contribution'
			FROM pending_contributions pc
			WHERE pc.payment_method = 'mpesa' AND pc.status = 'PENDING'
			ORDER BY pc.created_at DESC
			LIMIT 1
		`).Scan(&pendingTxID, &userID, &walletID, &txType)
	}

	if err != nil {
		log.Printf("No pending transaction found for M-Pesa receipt: %s", tx.MpesaReceiptNo)
		return
	}

	switch txType {
	case "wallet_topup":
		// Credit the user's wallet with conversion
		walletUUID, _ := uuid.Parse(walletID)

		// 1. Convert Fiat (KES) to Stablecoin (USDC)
		// This handles the user's requirement for cross-border/cross-currency support
		stableAmount, err := h.svc.ConvertCurrency(ctx, tx.Amount, "KES", "USDC")
		if err != nil {
			log.Printf("Conversion failed for M-Pesa deposit: %v. Defaulting to 1:1 if parity or failing.", err)
			// For safety in this demo, if KES conversion fails, we log and stop
			return
		}

		// 2. Create internal transaction in USDC
		_, err = h.svc.GetDB().Pool.Exec(ctx, `
			INSERT INTO transactions (recipient_wallet_id, amount, currency, status, message)
			VALUES ($1, $2, 'USDC', 'COMPLETED', $3)
		`, walletUUID, stableAmount, h.svc.BrandedMessage(ctx, fmt.Sprintf("M-Pesa deposit (converted from %.2f KES): %s", tx.Amount, tx.MpesaReceiptNo)))
		if err != nil {
			log.Printf("Error creating transaction for M-Pesa payment: %v", err)
			return
		}

		// 3. Update wallet balance in USDC
		_, err = h.svc.GetDB().Pool.Exec(ctx,
			"UPDATE wallets SET balance = balance + $1 WHERE id = $2",
			stableAmount, walletUUID)
		if err != nil {
			log.Printf("Error updating wallet balance: %v", err)
			return
		}

	case "goal_contribution":
		// Process goal contribution
		_, _ = h.svc.GetDB().Pool.Exec(ctx,
			"UPDATE pending_contributions SET status = 'COMPLETED' WHERE id = $1",
			pendingTxID)
		log.Printf("Processed M-Pesa goal contribution: %s", tx.MpesaReceiptNo)
	}

	// Update the M-Pesa transaction with user info
	_, _ = h.svc.GetDB().Pool.Exec(ctx,
		"UPDATE mpesa_transactions SET user_id = $1 WHERE id = $2",
		userID, tx.ID)
}

// processPaymentLinkMpesaPayment handles M-Pesa payments for payment links
func (h *Handler) processPaymentLinkMpesaPayment(ctx context.Context, tx *MpesaTransaction) {
	// Check for pending payment link transaction with this checkout_request_id
	var pltID string
	err := h.svc.GetDB().Pool.QueryRow(ctx, `
		SELECT id FROM payment_link_transactions 
		WHERE checkout_request_id = $1 AND status = 'PENDING'
	`, tx.CheckoutRequestID).Scan(&pltID)

	if err != nil {
		// No payment link transaction found, that's okay
		log.Printf("No pending payment link transaction found for checkout: %s", tx.CheckoutRequestID)
		return
	}

	// Complete the payment link payment
	err = h.svc.CompletePaymentLinkPayment(ctx, tx.CheckoutRequestID)
	if err != nil {
		log.Printf("Failed to complete payment link payment: %v", err)
		return
	}

	log.Printf("Successfully processed payment link payment: %s", pltID)
}

// handleMpesaSTKStatus checks the status of an STK Push request
func (h *Handler) handleMpesaSTKStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	checkoutRequestID := r.URL.Query().Get("checkout_request_id")
	if checkoutRequestID == "" {
		http.Error(w, `{"error": "checkout_request_id required"}`, http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	var tx MpesaTransaction
	err := h.svc.GetDB().Pool.QueryRow(ctx, `
		SELECT id, merchant_request_id, checkout_request_id, amount, 
		       mpesa_receipt_no, status, result_desc
		FROM mpesa_transactions 
		WHERE checkout_request_id = $1
	`, checkoutRequestID).Scan(
		&tx.ID, &tx.MerchantRequestID, &tx.CheckoutRequestID,
		&tx.Amount, &tx.MpesaReceiptNo, &tx.Status, &tx.ResultDesc)

	if err != nil {
		// Transaction not yet processed
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status":  "PENDING",
			"message": "Transaction is being processed",
		})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":      tx.Status,
		"amount":      tx.Amount,
		"receipt":     tx.MpesaReceiptNo,
		"result_desc": tx.ResultDesc,
	})
}

// handleMpesaSTKPush initiates an STK Push for deposit
func (h *Handler) handleMpesaSTKPush(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Amount          float64 `json:"amount"`
		Phone           string  `json:"phone"`
		PaymentLinkTxID string  `json:"payment_link_tx_id,omitempty"` // For payment link payments
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, `{"error": "amount must be positive"}`, http.StatusBadRequest)
		return
	}

	if req.Phone == "" {
		http.Error(w, `{"error": "phone number required"}`, http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	if enabled, err := h.svc.IsFeatureFlagEnabled(ctx, "mpesa_maintenance_mode"); err == nil && enabled {
		http.Error(w, `{"error": "M-Pesa is temporarily unavailable"}`, http.StatusServiceUnavailable)
		return
	}

	checkoutRequestID, err := h.svc.TriggerMpesaSTKPush(ctx, req.Phone, req.Amount)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
		return
	}

	// If this is for a payment link, update the transaction with checkout_request_id
	if req.PaymentLinkTxID != "" {
		pltID, parseErr := uuid.Parse(req.PaymentLinkTxID)
		if parseErr == nil {
			_, _ = h.svc.GetDB().Pool.Exec(ctx, `
				UPDATE payment_link_transactions 
				SET checkout_request_id = $1 
				WHERE id = $2 AND status = 'PENDING'
			`, checkoutRequestID, pltID)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "INITIATED",
		"message": "STK Push initiated. Check your phone.",
		"amount":  req.Amount,
		"phone":   req.Phone,
	})
}

// handleMpesaB2C initiates a B2C payout (business to customer)
func (h *Handler) handleMpesaB2C(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Amount    float64 `json:"amount"`
		Phone     string  `json:"phone"`
		Reference string  `json:"reference"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, `{"error": "amount must be positive"}`, http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	err := h.svc.TriggerMpesaB2C(ctx, req.Phone, req.Amount, req.Reference)
	if err != nil {
		http.Error(w, fmt.Sprintf(`{"error": "%v"}`, err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":    "INITIATED",
		"message":   "B2C payment initiated",
		"amount":    req.Amount,
		"phone":     req.Phone,
		"reference": req.Reference,
	})
}
