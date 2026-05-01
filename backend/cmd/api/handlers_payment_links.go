package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/corridrlabs/corridor/backend/pkg/api"
	"github.com/google/uuid"
)

func (h *Handler) createPaymentLink(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, "failed to read body")
		return
	}

	var req struct {
		Title    string  `json:"title"`
		Amount   float64 `json:"amount"`
		Currency string  `json:"currency"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	link, err := h.svc.CreatePaymentLink(r.Context(), accountID, req.Title, req.Amount, req.Currency)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusCreated, link)
}

func (h *Handler) listPaymentLinks(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	links, err := h.svc.GetPaymentLinks(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}
	api.RespondWithJSON(w, http.StatusOK, links)
}

func (h *Handler) getPaymentLinkBySlug(w http.ResponseWriter, r *http.Request) {
	slug := r.URL.Query().Get("slug")
	if slug == "" {
		api.RespondWithError(w, http.StatusBadRequest, "slug required")
		return
	}

	link, err := h.svc.GetPaymentLinkBySlug(r.Context(), slug)
	if err != nil {
		api.RespondWithError(w, http.StatusNotFound, "payment link not found")
		return
	}

	api.RespondWithJSON(w, http.StatusOK, link)
}

func (h *Handler) updatePaymentLink(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		ID       uuid.UUID `json:"id"`
		IsActive bool      `json:"is_active"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if err := h.svc.UpdatePaymentLink(r.Context(), accountID, req.ID, req.IsActive); err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *Handler) deletePaymentLink(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	idStr := r.URL.Query().Get("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid id")
		return
	}

	if err := h.svc.DeletePaymentLink(r.Context(), accountID, id); err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

// handlePayPaymentLink initiates a payment for a payment link
func (h *Handler) handlePayPaymentLink(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Slug         string                 `json:"slug"`
		PaymentMethod string                 `json:"payment_method"` // 'mpesa', 'card', 'crypto'
		PayerEmail   string                 `json:"payer_email,omitempty"`
		PayerName    string                 `json:"payer_name,omitempty"`
		Phone        string                 `json:"phone,omitempty"` // For M-Pesa
		Metadata     map[string]interface{} `json:"metadata,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if req.Slug == "" || req.PaymentMethod == "" {
		api.RespondWithError(w, http.StatusBadRequest, "slug and payment_method are required")
		return
	}

	ctx := r.Context()

	// Initiate the payment transaction
	tx, err := h.svc.InitiatePaymentLinkPayment(ctx, req.Slug, req.PaymentMethod, req.PayerEmail, req.PayerName, req.Metadata)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// Handle different payment methods
	switch req.PaymentMethod {
	case "mpesa":
		if req.Phone == "" {
			api.RespondWithError(w, http.StatusBadRequest, "phone number is required for M-Pesa")
			return
		}

		// Get the payment link to get amount
		link, err := h.svc.GetPaymentLinkBySlug(ctx, req.Slug)
		if err != nil {
			api.RespondWithError(w, http.StatusInternalServerError, "failed to get payment link")
			return
		}

		// Trigger M-Pesa STK Push
		checkoutRequestID, err := h.svc.TriggerMpesaSTKPush(ctx, req.Phone, link.Amount)
		if err != nil {
			api.RespondWithError(w, http.StatusInternalServerError, fmt.Sprintf("failed to initiate M-Pesa payment: %v", err))
			return
		}

		// Update the payment link transaction with the checkout_request_id
		_, _ = h.svc.GetDB().Pool.Exec(ctx, `
			UPDATE payment_link_transactions 
			SET checkout_request_id = $1 
			WHERE id = $2 AND status = 'PENDING'
		`, checkoutRequestID, tx.ID)

		api.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"status":         "INITIATED",
			"message":        "STK Push sent. Please check your phone.",
			"transaction_id": tx.ID,
		})

	case "card":
		// For card payments, we would integrate with Circle or Stripe
		// For now, return a payment intent or similar
		link, err := h.svc.GetPaymentLinkBySlug(ctx, req.Slug)
		if err != nil {
			api.RespondWithError(w, http.StatusInternalServerError, "failed to get payment link")
			return
		}

		api.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"status":         "INITIATED",
			"message":        "Redirecting to card payment...",
			"transaction_id": tx.ID,
			"amount":         link.Amount,
			"currency":       link.Currency,
			"payment_method": "card",
		})

	case "crypto":
		// For crypto payments, return the deposit address
		link, err := h.svc.GetPaymentLinkBySlug(ctx, req.Slug)
		if err != nil {
			api.RespondWithError(w, http.StatusInternalServerError, "failed to get payment link")
			return
		}

		api.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
			"status":         "WAITING_FOR_PAYMENT",
			"message":        "Send payment to the address below",
			"transaction_id": tx.ID,
			"amount":         link.Amount,
			"currency":       "USDC",
			"address":        "PAYMENT_LINK_CRYPTO_ADDRESS", // TODO: Implement proper crypto payment
		})

	default:
		api.RespondWithError(w, http.StatusBadRequest, "unsupported payment method")
	}
}

// handlePaymentLinkStatus checks the status of a payment link transaction
func (h *Handler) handlePaymentLinkStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	transactionIDStr := r.URL.Query().Get("transaction_id")
	if transactionIDStr == "" {
		api.RespondWithError(w, http.StatusBadRequest, "transaction_id is required")
		return
	}

	transactionID, err := uuid.Parse(transactionIDStr)
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid transaction_id")
		return
	}

	ctx := r.Context()

	// Get transaction status from payment_link_transactions
	var status string
	var completedAt *time.Time
	err = h.svc.GetDB().Pool.QueryRow(ctx, `
		SELECT status, completed_at
		FROM payment_link_transactions
		WHERE id = $1
	`, transactionID).Scan(&status, &completedAt)

	if err != nil {
		api.RespondWithError(w, http.StatusNotFound, "transaction not found")
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"transaction_id": transactionID,
		"status":         status,
		"completed_at":   completedAt,
	})
}
