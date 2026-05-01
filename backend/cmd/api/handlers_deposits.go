package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"

	"github.com/google/uuid"
	"github.com/corridrlabs/corridor/backend/internal/circle"
)

type InitializeCardDepositRequest struct {
	Amount         string                `json:"amount"`
	Currency       string                `json:"currency"`
	UserID         string                `json:"userId"`
	KeyID          string                `json:"keyId"`
	EncryptedData  string                `json:"encryptedData"`
	ExpMonth       int                   `json:"expMonth"`
	ExpYear        int                   `json:"expYear"`
	BillingDetails circle.BillingDetails `json:"billingDetails"`
}

// CircleWebhookNotification represents the structure of a notification from Circle.
type CircleWebhookNotification struct {
	NotificationType string         `json:"notificationType"`
	Payment          circle.Payment `json:"payment"`
	// Other fields like Subscription, Payout, etc. might be present
}

type CryptoDepositAddressResponse struct {
	Address    string `json:"address"`
	Blockchain string `json:"blockchain"`
	Memo       string `json:"memo,omitempty"`
}

func (h *Handler) handleGetCircleKey(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	keyResp, err := h.circle.GetPublicKey(r.Context())
	if err != nil {
		log.Printf("Error fetching Circle public key: %v", err)
		http.Error(w, "Failed to fetch encryption key", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(keyResp)
}

func (h *Handler) initializeCardDeposit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req InitializeCardDepositRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	ctx := r.Context()

	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		http.Error(w, "Invalid user ID format", http.StatusBadRequest)
		return
	}

	acc, err := h.svc.GetAccountByID(ctx, userID)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	ip := r.RemoteAddr
	if host, _, err := net.SplitHostPort(ip); err == nil {
		ip = host
	}

	// 1. Register the encrypted card with Circle to get a SourceID
	cardReq := &circle.CreateCardRequest{
		IdempotencyKey: uuid.New().String(),
		KeyID:          req.KeyID,
		EncryptedData:  req.EncryptedData,
		BillingDetails: req.BillingDetails,
		ExpMonth:       req.ExpMonth,
		ExpYear:        req.ExpYear,
		Metadata: circle.PaymentMetadata{
			Email:     acc.Email,
			IPAddress: ip,
			SessionID: uuid.New().String(),
		},
	}

	cardResp, err := h.circle.CreateCard(ctx, cardReq)
	if err != nil {
		log.Printf("Error creating Circle card for user %s: %v", req.UserID, err)
		http.Error(w, "Failed to register card securely", http.StatusInternalServerError)
		return
	}

	// 2. Create the payment using the new SourceID
	circleReq := &circle.CreatePaymentRequest{
		IdempotencyKey: uuid.New().String(),
		Amount: circle.Amount{
			Amount:   req.Amount,
			Currency: req.Currency,
		},
		Source: circle.Source{
			ID:   cardResp.Data.ID,
			Type: "card",
		},
		Description: "Card deposit for user: " + req.UserID,
		Verification: &circle.Verification{
			AVS: "not_requested",
			CVV: "not_requested",
		},
		Metadata: circle.PaymentMetadata{
			Email:     acc.Email,
			IPAddress: ip,
			SessionID: uuid.New().String(),
		},
	}

	paymentResponse, err := h.circle.CreatePayment(ctx, circleReq)
	if err != nil {
		log.Printf("Error creating Circle payment for user %s: %v", req.UserID, err)
		http.Error(w, "Failed to process card payment", http.StatusInternalServerError)
		return
	}

	// 3. PERSIST the provider transaction ID so the webhook can find it
	// We use the account's primary wallet for the deposit
	wallet, err := h.svc.GetPrimaryWallet(ctx, userID, "USDC")
	if err != nil {
		log.Printf("Error getting wallet for user %s: %v", req.UserID, err)
		// Non-fatal for the response, but we might fail to auto-credit
	} else {
		_, err = h.svc.GetDB().Pool.Exec(ctx, 
			"INSERT INTO transactions (recipient_wallet_id, amount, currency, status, provider_tx_id, message) VALUES ($1, $2, $3, $4, $5, $6)",
			wallet.ID, req.Amount, req.Currency, "PENDING", paymentResponse.Data.ID, "Card deposit via Circle")
		if err != nil {
			log.Printf("Error saving pending transaction for user %s: %v", req.UserID, err)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(paymentResponse)
}

func (h *Handler) handleCircleWebhook(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Failed to read body", http.StatusInternalServerError)
		return
	}

	// 1. VERIFY SIGNATURE
	signature := r.Header.Get("X-Circle-Signature") // Assuming X-Circle-Signature or similar
	if h.config.Circle.WebhookSecret != "" {
		if !verifyCircleSignature(body, signature, h.config.Circle.WebhookSecret) {
			log.Printf("UNAUTHORIZED Circle Webhook attempt from %s", r.RemoteAddr)
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
	}

	var notification CircleWebhookNotification
	if err := json.Unmarshal(body, &notification); err != nil {
		log.Printf("Error decoding Circle webhook: %v", err)
		http.Error(w, "Invalid webhook body", http.StatusBadRequest)
		return
	}

	if notification.NotificationType == "payments" {
		providerTxID := notification.Payment.ID
		status := notification.Payment.Status

		log.Printf("Circle Payment Update: ID=%s, Status=%s", providerTxID, status)

		if status == "confirmed" || status == "paid" {
			// Find tx and credit user
			var walletID, txID uuid.UUID
			var amount float64
			var currency string
			err := h.svc.GetDB().Pool.QueryRow(r.Context(),
				"SELECT id, recipient_wallet_id, amount, currency FROM transactions WHERE provider_tx_id = $1 AND status = 'PENDING'",
				providerTxID).Scan(&txID, &walletID, &amount, &currency)
			
			if err == nil {
				// Get account ID from wallet
				var accountID uuid.UUID
				err = h.svc.GetDB().Pool.QueryRow(r.Context(), "SELECT account_id FROM wallets WHERE id = $1", walletID).Scan(&accountID)
				if err == nil {
					err = h.svc.CreditWallet(r.Context(), accountID, amount, currency, "Circle Deposit: "+providerTxID)
					if err == nil {
						h.svc.GetDB().Pool.Exec(r.Context(), "UPDATE transactions SET status = 'COMPLETED', settled_at = NOW() WHERE id = $1", txID)
						log.Printf("Successfully credited user for Circle payment %s", providerTxID)
					}
				}
			}
		} else if status == "failed" {
			h.svc.GetDB().Pool.Exec(r.Context(), "UPDATE transactions SET status = 'FAILED' WHERE provider_tx_id = $1", providerTxID)
		}
	}

	w.WriteHeader(http.StatusOK)
}

func verifyCircleSignature(body []byte, signature, secret string) bool {
	h := hmac.New(sha256.New, []byte(secret))
	h.Write(body)
	expected := hex.EncodeToString(h.Sum(nil))
	return signature == expected
}

func (h *Handler) getCryptoDepositAddress(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// In a real app, UserID should be retrieved from a session/token.
	userIDStr := r.URL.Query().Get("userId")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		http.Error(w, "Invalid or missing user ID", http.StatusBadRequest)
		return
	}

	// 1. Check if an address already exists for this user for the Solana blockchain.
	// wallet, err := h.app.DB.GetUserWalletByChain(r.Context(), userID, "SOLANA")
	// if err == nil && wallet != nil {
	//    // Address exists, return it.
	//    resp := CryptoDepositAddressResponse{
	// 		Address:    wallet.Address,
	//		Blockchain: "SOLANA",
	//		Memo:       wallet.Memo,
	//    }
	//    json.NewEncoder(w).Encode(resp)
	//    return
	// }

	// 2. If not, generate or assign a new address.
	// This is a complex step. A robust solution uses HD wallets to derive addresses.
	// A simpler, scalable model uses a main company wallet and assigns a unique memo/destination tag to each user.
	// This avoids creating thousands of on-chain wallets to manage.

	// Using the Memo-based approach:
	memo := userID.String() // Use the user's UUID as a unique, derivable memo.

	// The address is the company's master "settlement" wallet from config.
	depositAddress := h.config.Solana.MasterWallet

	// 3. Save this to the user_wallets table to record it.
	// _, err = h.app.DB.CreateUserWallet(r.Context(), userID, "SOLANA", depositAddress, memo)
	// if err != nil {
	//    http.Error(w, "Failed to assign deposit address", http.StatusInternalServerError)
	//    return
	// }

	// 4. Return the address and memo.
	resp := CryptoDepositAddressResponse{
		Address:    depositAddress,
		Blockchain: "SOLANA",
		Memo:       memo,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}
