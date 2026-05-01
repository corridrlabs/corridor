package main

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/google/uuid"
)

// ============================================
// PAYOUTS HANDLERS
// ============================================

func (h *Handler) requestPayout(w http.ResponseWriter, r *http.Request) {
	accountID, err := getAccountIDFromRequest(r, h.svc)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	body, err := io.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "failed to read body", http.StatusInternalServerError)
		return
	}

	var req struct {
		Amount          float64 `json:"amount"`
		Currency        string  `json:"currency"`
		DestinationBank string  `json:"destination_bank"`
		AccountNumber   string  `json:"account_number"`
		AccountName     string  `json:"account_name"`
	}
	if err := json.Unmarshal(body, &req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	idemKey := r.Header.Get("X-Idempotency-Key")
	if idemKey != "" {
		exists, rec, startErr := h.svc.StartIdempotentRequest(r.Context(), accountID, idemKey, r.URL.Path, body)
		if startErr != nil {
			if handleIdempotencyStartError(w, startErr) {
				return
			}
			http.Error(w, "idempotency error", http.StatusInternalServerError)
			return
		}
		if exists && rec.ResponseCode != nil {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(*rec.ResponseCode)
			w.Write([]byte(*rec.ResponseBody))
			return
		}
		if exists {
			http.Error(w, "request in progress", http.StatusConflict)
			return
		}
	}

	if req.DestinationBank == "SOLANA" || req.DestinationBank == "CRYPTO" {
		sig, err := h.svc.WithdrawToSolana(r.Context(), accountID, req.Amount, req.AccountNumber)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			if idemKey != "" {
				_ = h.svc.CompleteIdempotentRequest(r.Context(), idemKey, http.StatusInternalServerError, err.Error())
			}
			return
		}
		resp := map[string]interface{}{
			"id":             uuid.New(), // Generate a fake ID for frontend compatibility
			"status":         "COMPLETED",
			"transaction_id": sig,
			"message":        "Funds sent on-chain via Solana",
			"created_at":     "NOW",
		}
		respJSON, _ := json.Marshal(resp)
		if idemKey != "" {
			_ = h.svc.CompleteIdempotentRequest(r.Context(), idemKey, http.StatusOK, string(respJSON))
		}
		w.Header().Set("Content-Type", "application/json")
		w.Write(respJSON)
		return
	}

	withdrawal, err := h.svc.RequestPayout(r.Context(), accountID, req.Amount, req.Currency, req.DestinationBank, req.AccountNumber, req.AccountName)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		if idemKey != "" {
			_ = h.svc.CompleteIdempotentRequest(r.Context(), idemKey, http.StatusBadRequest, err.Error())
		}
		return
	}
	respJSON, _ := json.Marshal(withdrawal)
	if idemKey != "" {
		_ = h.svc.CompleteIdempotentRequest(r.Context(), idemKey, http.StatusOK, string(respJSON))
	}
	w.Header().Set("Content-Type", "application/json")
	w.Write(respJSON)
}

func (h *Handler) getPayouts(w http.ResponseWriter, r *http.Request) {
	accountID, err := getAccountIDFromRequest(r, h.svc)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	payouts, err := h.svc.GetPayouts(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(payouts)
}
