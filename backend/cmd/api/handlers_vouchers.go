package main

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

func (h *Handler) handleCreateVoucher(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Amount   float64 `json:"amount"`
		Currency string  `json:"currency"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	voucher, err := h.svc.CreateWithdrawalVoucher(r.Context(), accountID, req.Amount, req.Currency)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusCreated, voucher)
}

func (h *Handler) handleRedeemVoucher(w http.ResponseWriter, r *http.Request) {
	// This would likely be an authenticated AGENT endpoint
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "code required", http.StatusBadRequest)
		return
	}

	voucher, err := h.svc.RedeemVoucher(r.Context(), code)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	writeJSON(w, http.StatusOK, voucher)
}
