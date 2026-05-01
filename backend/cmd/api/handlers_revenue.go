package main

import (
	"net/http"

	"github.com/google/uuid"
)

func (h *Handler) handleGetRevenueAccounts(w http.ResponseWriter, r *http.Request) {
	// Admin check
	accountID := getAccountID(r.Context())
	acc, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil || !acc.IsAdmin() {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	rows, err := h.svc.GetDB().Pool.Query(r.Context(), "SELECT id, name, balance, currency FROM revenue_accounts")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var accounts []any
	for rows.Next() {
		var acc struct {
			ID       uuid.UUID `json:"id"`
			Name     string    `json:"name"`
			Balance  float64   `json:"balance"`
			Currency string    `json:"currency"`
		}
		rows.Scan(&acc.ID, &acc.Name, &acc.Balance, &acc.Currency)
		accounts = append(accounts, acc)
	}

	writeJSON(w, http.StatusOK, accounts)
}
