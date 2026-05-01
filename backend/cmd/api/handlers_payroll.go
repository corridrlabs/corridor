package main

import (
	"encoding/json"
	"net/http"

	"github.com/corridrlabs/corridor/backend/pkg/api"
	"github.com/google/uuid"
)

// runPayroll initiates payroll disbursement for a list of employees.
// POST /api/payroll/run
// Body: { "employee_ids": ["uuid1", "uuid2", ...] }
func (h *Handler) runPayroll(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		api.RespondWithError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	accountID := getAccountID(r.Context())

	var req struct {
		EmployeeIDs []uuid.UUID `json:"employee_ids"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	if len(req.EmployeeIDs) == 0 {
		api.RespondWithError(w, http.StatusBadRequest, "at least one employee_id is required")
		return
	}

	type result struct {
		EmployeeID uuid.UUID `json:"employee_id"`
		Status     string    `json:"status"`
		Error      string    `json:"error,omitempty"`
	}

	results := make([]result, 0, len(req.EmployeeIDs))

	for _, empID := range req.EmployeeIDs {
		// Fetch the employee's gross salary to use as the payroll amount
		var amount float64
		err := h.svc.DB().QueryRow(
			"SELECT gross_salary FROM ewa_employees WHERE id = $1 AND account_id = $2 AND is_active = true",
			empID, accountID,
		).Scan(&amount)

		if err != nil {
			results = append(results, result{EmployeeID: empID, Status: "failed", Error: "employee not found"})
			continue
		}

		_, err = h.svc.RequestEWA(r.Context(), accountID, empID, amount)
		if err != nil {
			results = append(results, result{EmployeeID: empID, Status: "failed", Error: err.Error()})
			continue
		}

		results = append(results, result{EmployeeID: empID, Status: "initiated"})
	}

	successCount := 0
	for _, r := range results {
		if r.Status == "initiated" {
			successCount++
		}
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"results":       results,
		"total":         len(req.EmployeeIDs),
		"success_count": successCount,
		"failed_count":  len(req.EmployeeIDs) - successCount,
	})
}

// deleteEWAEmployee deactivates an employee record (soft delete).
// DELETE /api/employees/delete?id=<uuid>
func (h *Handler) deleteEWAEmployee(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())

	empID, err := uuid.Parse(r.URL.Query().Get("id"))
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid employee id")
		return
	}

	_, err = h.svc.DB().Exec(
		"UPDATE ewa_employees SET is_active = false WHERE id = $1 AND account_id = $2",
		empID, accountID,
	)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, "failed to remove employee")
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]string{"message": "employee removed from payroll"})
}
