package main

import (
	"encoding/json"
	"net/http"
)

func (h *Handler) handleEWAEmployeeEarnings(w http.ResponseWriter, r *http.Request) {
	employeeID := r.URL.Query().Get("employee_id")
	if employeeID == "" {
		http.Error(w, "Employee ID required", http.StatusBadRequest)
		return
	}

	earnedAmount, err := h.svc.CalculateEarnedAmount(employeeID)
	if err != nil {
		http.Error(w, "Failed to calculate earnings", http.StatusInternalServerError)
		return
	}

	// Get advance limit for org
	var advanceLimit float64
	query := `SELECT os.advance_limit FROM ewa.org_settings os 
			  JOIN ewa.employees e ON os.org_id = e.org_id 
			  WHERE e.id = $1`
	
	err = h.svc.DB().QueryRow(query, employeeID).Scan(&advanceLimit)
	if err != nil {
		advanceLimit = 50.0 // Default 50%
	}

	maxAdvance := earnedAmount * (advanceLimit / 100)

	// Get current outstanding advances
	var outstanding float64
	h.svc.DB().QueryRow("SELECT COALESCE(SUM(amount), 0) FROM ewa.advances WHERE employee_id = $1 AND status = 'pending'", employeeID).Scan(&outstanding)

	availableAdvance := maxAdvance - outstanding
	if availableAdvance < 0 {
		availableAdvance = 0
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": map[string]interface{}{
			"earned_amount":     earnedAmount,
			"advance_limit":     advanceLimit,
			"max_advance":       maxAdvance,
			"outstanding":       outstanding,
			"available_advance": availableAdvance,
		},
	})
}

func (h *Handler) handleEWARequestAdvance(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		EmployeeID string  `json:"employee_id"`
		Amount     float64 `json:"amount"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Get advance limit
	var advanceLimit float64
	query := `SELECT os.advance_limit FROM ewa.org_settings os 
			  JOIN ewa.employees e ON os.org_id = e.org_id 
			  WHERE e.id = $1`
	
	err := h.svc.DB().QueryRow(query, req.EmployeeID).Scan(&advanceLimit)
	if err != nil {
		advanceLimit = 50.0
	}

	advance, err := h.svc.RequestAdvance(req.EmployeeID, req.Amount, advanceLimit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": advance,
	})
}

func (h *Handler) handleEWAEmployeeHistory(w http.ResponseWriter, r *http.Request) {
	employeeID := r.URL.Query().Get("employee_id")
	if employeeID == "" {
		http.Error(w, "Employee ID required", http.StatusBadRequest)
		return
	}

	advances, err := h.svc.GetAdvanceHistory(employeeID)
	if err != nil {
		http.Error(w, "Failed to fetch history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": advances,
	})
}

func (h *Handler) handleEWARepaymentSchedule(w http.ResponseWriter, r *http.Request) {
	employeeID := r.URL.Query().Get("employee_id")
	if employeeID == "" {
		http.Error(w, "Employee ID required", http.StatusBadRequest)
		return
	}

	query := `SELECT a.id, a.amount, a.requested_at, 
			  (a.requested_at + INTERVAL '14 days') as due_date
			  FROM ewa.advances a 
			  WHERE a.employee_id = $1 AND a.status = 'pending'
			  ORDER BY a.requested_at`

	rows, err := h.svc.DB().Query(query, employeeID)
	if err != nil {
		http.Error(w, "Failed to fetch schedule", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var schedule []map[string]interface{}
	for rows.Next() {
		var id, requestedAt, dueDate string
		var amount float64

		err := rows.Scan(&id, &amount, &requestedAt, &dueDate)
		if err != nil {
			continue
		}

		schedule = append(schedule, map[string]interface{}{
			"advance_id":   id,
			"amount":       amount,
			"requested_at": requestedAt,
			"due_date":     dueDate,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": schedule,
	})
}

func (h *Handler) handleEWAVerifyBank(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		EmployeeID    string `json:"employee_id"`
		AccountNumber string `json:"account_number"`
		RoutingNumber string `json:"routing_number"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Simple verification - in production, use Plaid or similar
	if len(req.AccountNumber) < 8 || len(req.RoutingNumber) != 9 {
		http.Error(w, "Invalid account details", http.StatusBadRequest)
		return
	}

	query := `UPDATE ewa.employees SET bank_verified = true, 
			  bank_account = $1, bank_routing = $2 
			  WHERE id = $3`

	_, err := h.svc.DB().Exec(query, req.AccountNumber, req.RoutingNumber, req.EmployeeID)
	if err != nil {
		http.Error(w, "Failed to verify bank", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": map[string]string{"status": "verified"},
	})
}