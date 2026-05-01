package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/corridrlabs/corridor/backend/internal/core"
	"github.com/corridrlabs/corridor/backend/pkg/api"
	"github.com/google/uuid"
)

// 1. Auth & Accounts
func (h *Handler) registerUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email         string `json:"email"`
		Name          string `json:"name"`
		Type          string `json:"type"`
		Password      string `json:"password"`
		Phone         string `json:"phone"`
		Country       string `json:"country"`
		IDType        string `json:"id_type"`
		IDNumber      string `json:"id_number"`
		AcceptTerms   bool   `json:"accept_terms"`
		AcceptPrivacy bool   `json:"accept_privacy"`
		AcceptKYC     bool   `json:"accept_kyc"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if strings.TrimSpace(req.Email) == "" || strings.TrimSpace(req.Name) == "" || strings.TrimSpace(req.Password) == "" {
		api.RespondWithError(w, http.StatusBadRequest, "email, name, and password are required")
		return
	}
	if strings.TrimSpace(req.Phone) == "" || strings.TrimSpace(req.Country) == "" || strings.TrimSpace(req.IDType) == "" || strings.TrimSpace(req.IDNumber) == "" {
		api.RespondWithError(w, http.StatusBadRequest, "phone, country, id_type, and id_number are required")
		return
	}
	if !req.AcceptTerms || !req.AcceptPrivacy || !req.AcceptKYC {
		api.RespondWithError(w, http.StatusBadRequest, "terms, privacy, and kyc consent are required")
		return
	}

	accType := core.AccountTypePersonal
	if req.Type == "BUSINESS" {
		accType = core.AccountTypeBusiness
	}

	resp, err := h.svc.CreateAccount(r.Context(), req.Email, req.Name, req.Password, req.Phone, req.Country, req.IDType, req.IDNumber, req.AcceptTerms, req.AcceptPrivacy, req.AcceptKYC, accType)
	if err != nil {
		if strings.Contains(strings.ToLower(err.Error()), "duplicate key value violates unique constraint") ||
			strings.Contains(strings.ToLower(err.Error()), "sqlstate 23505") {
			api.RespondWithError(w, http.StatusConflict, "email already exists")
			return
		}
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	h.setAuthCookie(w, resp.AccessToken)
	api.RespondWithJSON(w, http.StatusCreated, resp)
}

func (h *Handler) login(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp, err := h.svc.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		api.RespondWithError(w, http.StatusUnauthorized, err.Error())
		return
	}

	h.setAuthCookie(w, resp.AccessToken)
	api.RespondWithJSON(w, http.StatusOK, resp)
}

func (h *Handler) setAuthCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "corridor_session",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400, // 24 hours
	})
}

func (h *Handler) getMe(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	user, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusNotFound, "user not found")
		return
	}
	api.RespondWithJSON(w, http.StatusOK, user)
}

func (h *Handler) checkUserExists(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Phone    string `json:"phone"`
		IDNumber string `json:"id_number"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	exists, err := h.svc.CheckUserExists(r.Context(), req.Email, req.Phone, req.IDNumber)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]bool{"exists": exists})
}

func (h *Handler) sendVerificationCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Channel string `json:"channel"`
		Contact string `json:"contact"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if err := h.svc.SendVerificationCode(r.Context(), req.Channel, req.Contact); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "sent"})
}

func (h *Handler) verifyCode(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Contact string `json:"contact"`
		Code    string `json:"code"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	valid, err := h.svc.VerifyCode(r.Context(), req.Contact, req.Code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]bool{"valid": valid})
}

func (h *Handler) googleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Token string `json:"token"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	resp, err := h.svc.GoogleLogin(r.Context(), req.Token)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	json.NewEncoder(w).Encode(resp)
}

// 2. Social Payments
func (h *Handler) createSocialRequest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FromWalletID uuid.UUID `json:"from_wallet"` // Optional if we infer from user + currency
		ToWalletID   uuid.UUID `json:"to_wallet"`   // Optional
		ToEmail      string    `json:"to_email"`    // Email for recipient
		ToHandle     string    `json:"to_handle"`   // @handle for recipient
		Amount       float64   `json:"amount"`
		Message      string    `json:"message"`
		Currency     string    `json:"currency"` // Needed if FromWalletID not provided
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Resolve Sender Wallet if missing
	if req.FromWalletID == uuid.Nil {
		userID, err := getAccountIDFromRequest(r, h.svc)
		if err != nil {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		// Find wallet for currency (default USDC)
		currency := req.Currency
		if currency == "" {
			currency = "USDC"
		}
		wallets, err := h.svc.GetWallets(r.Context(), userID)
		if err != nil {
			http.Error(w, "failed to fetch wallets", http.StatusInternalServerError)
			return
		}
		for _, w := range wallets {
			if string(w.Currency) == currency {
				req.FromWalletID = w.ID
				break
			}
		}
		if req.FromWalletID == uuid.Nil {
			// Auto-create wallet if missing? Or error?
			// For improved UX, we error for now.
			http.Error(w, "sender wallet not found for currency", http.StatusBadRequest)
			return
		}
	}

	// Resolve Recipient by @handle or email
	if req.ToWalletID == uuid.Nil {
		var recipientID uuid.UUID
		var err error
		var recipientEmail string
		var recipientName string

		// Try @handle first
		if req.ToHandle != "" {
			recipientID, err = h.svc.GetAccountIDByHandle(r.Context(), req.ToHandle)
			if err == nil {
				// Get recipient email for notification
				h.svc.GetAccountInfo(r.Context(), recipientID, &recipientEmail, &recipientName)
			}
		} else if req.ToEmail != "" {
			recipientID, err = h.svc.GetAccountIDByEmail(r.Context(), req.ToEmail)
			recipientEmail = req.ToEmail
			if err == nil {
				h.svc.GetAccountInfo(r.Context(), recipientID, nil, &recipientName)
			}
		}

		// If recipient not found, create pending payment and send invite
		if err != nil || recipientID == uuid.Nil {
			if req.ToEmail == "" {
				http.Error(w, "recipient email or handle required", http.StatusBadRequest)
				return
			}

			// Get sender info for email
			senderID, _ := getAccountIDFromRequest(r, h.svc)
			var senderName string
			h.svc.GetAccountInfo(r.Context(), senderID, nil, &senderName)
			if senderName == "" {
				senderName = "A Corridor user"
			}

			// Debit sender's wallet first
			currency := req.Currency
			if currency == "" {
				currency = "USDC"
			}

			err := h.svc.DebitWallet(r.Context(), req.FromWalletID, req.Amount, "P2P Payment to "+req.ToEmail)
			if err != nil {
				http.Error(w, "insufficient funds or invalid wallet", http.StatusBadRequest)
				return
			}

			// Create pending payment
			pp, err := h.svc.CreatePendingPayment(r.Context(), senderID, req.ToEmail, req.Amount, currency)
			if err != nil {
				http.Error(w, "failed to create pending payment", http.StatusInternalServerError)
				return
			}

			// Send invite email
			claimLink := fmt.Sprintf("%s/claim/%s", h.appBaseURL(r), pp.ClaimToken)
			if h.svc.GetEmailService() != nil {
				h.svc.GetEmailService().SendInviteToClaim(req.ToEmail, senderName, req.Amount, currency, claimLink)
			}

			json.NewEncoder(w).Encode(map[string]interface{}{
				"success":     true,
				"message":     "Invite sent to recipient",
				"pending":     true,
				"claim_token": pp.ClaimToken,
			})
			return
		}

		// Get recipient's wallet for currency
		currency := req.Currency
		if currency == "" {
			currency = "USDC"
		}

		wallets, err := h.svc.GetWallets(r.Context(), recipientID)
		if err != nil {
			http.Error(w, "failed to fetch recipient wallets", http.StatusInternalServerError)
			return
		}

		for _, w := range wallets {
			if string(w.Currency) == currency {
				req.ToWalletID = w.ID
				break
			}
		}

		if req.ToWalletID == uuid.Nil {
			http.Error(w, "recipient wallet not found for currency", http.StatusBadRequest)
			return
		}

		// Send notification email to Corridor user
		if h.svc.GetEmailService() != nil && recipientEmail != "" {
			// Get sender name
			senderID, _ := getAccountIDFromRequest(r, h.svc)
			var senderName string
			h.svc.GetAccountInfo(r.Context(), senderID, nil, &senderName)
			if senderName == "" {
				senderName = "A Corridor user"
			}
			h.svc.GetEmailService().SendPaymentNotification(recipientEmail, recipientName, senderName, req.Amount, currency)
		}
	}

	tx, err := h.svc.CreateSocialPayment(r.Context(), req.FromWalletID, req.ToWalletID, req.Amount, req.Message, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(tx)
}

func (h *Handler) getFeed(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	feed, err := h.svc.GetSocialFeed(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(feed)
}

func (h *Handler) getSocialNetwork(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	query := strings.TrimSpace(r.URL.Query().Get("q"))
	following, err := h.svc.GetFollowingAccounts(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	suggestions, err := h.svc.SearchSocialAccounts(r.Context(), accountID, query, 8)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]any{
		"following":       following,
		"suggestions":     suggestions,
		"following_count": len(following),
	})
}

func (h *Handler) followSocialAccount(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		AccountID string `json:"account_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	targetID, err := uuid.Parse(strings.TrimSpace(req.AccountID))
	if err != nil {
		http.Error(w, "invalid account id", http.StatusBadRequest)
		return
	}

	if err := h.svc.FollowAccount(r.Context(), accountID, targetID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func (h *Handler) unfollowSocialAccount(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		AccountID string `json:"account_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	targetID, err := uuid.Parse(strings.TrimSpace(req.AccountID))
	if err != nil {
		http.Error(w, "invalid account id", http.StatusBadRequest)
		return
	}

	if err := h.svc.UnfollowAccount(r.Context(), accountID, targetID); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func (h *Handler) executeWorkflow(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TemplateID uuid.UUID              `json:"template_id"`
		AccountID  uuid.UUID              `json:"account_id"`
		Input      map[string]interface{} `json:"input"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id, err := h.svc.ExecuteWorkflow(r.Context(), req.TemplateID, req.AccountID, req.Input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{"execution_id": id.String(), "status": "RUNNING"})
}

func (h *Handler) createWorkflowTemplate(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string          `json:"name"`
		Description string          `json:"description"`
		Definition  json.RawMessage `json:"definition"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	id, err := h.svc.CreateWorkflowTemplate(r.Context(), req.Name, req.Description, req.Definition)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"id": id.String()})
}

func (h *Handler) getWallets(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	wallets, err := h.svc.GetWallets(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, wallets)
}

func (h *Handler) createWallet(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		Currency core.CurrencyCode `json:"currency"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	wallet, err := h.svc.CreateWallet(r.Context(), accountID, req.Currency)
	if err != nil {
		if err.Error() == "upgrade_required: multiple wallets are a premium feature" {
			api.RespondWithError(w, http.StatusForbidden, err.Error())
			return
		}
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, wallet)
}

func (h *Handler) deleteWallet(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		WalletID string `json:"wallet_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	walletID, err := uuid.Parse(strings.TrimSpace(req.WalletID))
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid wallet ID")
		return
	}

	if err := h.svc.DeleteWallet(r.Context(), accountID, walletID); err != nil {
		if strings.Contains(err.Error(), "must be empty") {
			api.RespondWithError(w, http.StatusBadRequest, err.Error())
			return
		}
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "wallet deleted"})
}

func (h *Handler) createPaymentIntent(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Amount   int64  `json:"amount"`   // Amount in cents
		Currency string `json:"currency"` // e.g., "usd"
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	clientSecret, err := h.svc.CreateStripePaymentIntent(r.Context(), req.Amount, req.Currency)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"clientSecret": clientSecret})
}

func (h *Handler) stripeWebhook(w http.ResponseWriter, r *http.Request) {
	log.Println("Stripe webhook received!")
	w.WriteHeader(http.StatusOK)
}

// 3. Support
func (h *Handler) contactSupport(w http.ResponseWriter, r *http.Request) {
	var req map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	// Log the support request (Mocking email sending)
	log.Printf("SUPPORT REQUEST: %+v\n", req)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "received"})
}

// 4. Payment Requests
func (h *Handler) createPaymentRequest(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RequesterID uuid.UUID `json:"requester_id"`
		Amount      float64   `json:"amount"`
		Currency    string    `json:"currency"`
		Memo        string    `json:"memo"`
		PayerEmail  string    `json:"payer_email"` // Optional
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	pr, err := h.svc.CreatePaymentRequest(r.Context(), req.RequesterID, req.Amount, req.Currency, req.PayerEmail, req.Memo)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	resp := map[string]interface{}{
		"request": pr,
		"link":    fmt.Sprintf("%s/pay/%s", h.appBaseURL(r), pr.ID.String()),
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

func (h *Handler) getNotifications(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	notes := h.svc.GetNotifications(accountID)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notes)
}
