package main

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
)

// processPublicInvoicePayment handles the public payment simulation flow
func (h *Handler) processPublicInvoicePayment(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		InvoiceID string `json:"invoice_id"`
		Session   string `json:"session"`
		Method    string `json:"method"`
		Email     string `json:"email"`
		Phone     string `json:"phone"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	invID, err := uuid.Parse(req.InvoiceID)
	if err != nil {
		http.Error(w, "Invalid invoice ID", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	invoice, err := h.svc.GetPublicInvoice(ctx, invID, req.Session, req.Email, req.Phone)
	if err != nil {
		http.Error(w, "Invoice access denied or not found", http.StatusUnauthorized)
		return
	}

	if invoice.Status == "paid" {
		http.Error(w, "Invoice is already paid", http.StatusBadRequest)
		return
	}
	
	err = h.svc.ProcessPublicPayment(ctx, invID)
	if err != nil {
		http.Error(w, "Failed to process payment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
		"message": "Payment successful. Invoice marked as paid.",
	})
}

