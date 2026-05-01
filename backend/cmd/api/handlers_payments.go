package main

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/corridrlabs/corridor/backend/internal/core"
)

// Payment handlers route through internal rails ONLY
// External processors (Paystack/Circle) used only for deposit/withdrawal

func (h *Handler) handlePayments(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		h.processInternalPayment(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) handleDeposit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req core.DepositRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	rails := core.NewPaymentRailsService(h.svc)
	result, err := rails.ProcessDeposit(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": map[string]string{"reference": result},
	})
}

func (h *Handler) handleWithdraw(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req core.WithdrawRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	rails := core.NewPaymentRailsService(h.svc)
	if err := rails.ProcessWithdraw(r.Context(), req); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": map[string]string{"status": "initiated"},
	})
}

func (h *Handler) processInternalPayment(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FromWallet  uuid.UUID `json:"from_wallet"`
		ToWallet    uuid.UUID `json:"to_wallet"`
		Amount      float64   `json:"amount"`
		Description string    `json:"description"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	rails := core.NewPaymentRailsService(h.svc)
	txnID, err := rails.InternalTransfer(r.Context(), req.FromWallet, req.ToWallet, req.Amount, req.Description)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": map[string]uuid.UUID{"transaction_id": txnID.ID},
	})
}