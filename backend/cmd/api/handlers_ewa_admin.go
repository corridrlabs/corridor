package main

import (
	"encoding/json"
	"net/http"
	"strconv"
)

func (h *Handler) handleEWAEmployeeUpload(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	orgID := r.Header.Get("X-Org-ID")
	if orgID == "" {
		http.Error(w, "Organization ID required", http.StatusBadRequest)
		return
	}

	file, _, err := r.FormFile("csv")
	if err != nil {
		http.Error(w, "Failed to read CSV file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	employees, err := h.svc.ImportEmployeesCSV(orgID, file)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": map[string]interface{}{
			"imported_count": len(employees),
			"employees":      employees,
		},
	})
}

func (h *Handler) handleEWASetAdvanceLimit(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		OrgID        string  `json:"org_id"`
		AdvanceLimit float64 `json:"advance_limit"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	query := `INSERT INTO ewa.org_settings (org_id, advance_limit) 
			  VALUES ($1, $2) ON CONFLICT (org_id) 
			  DO UPDATE SET advance_limit = EXCLUDED.advance_limit`

	_, err := h.svc.DB().Exec(query, req.OrgID, req.AdvanceLimit)
	if err != nil {
		http.Error(w, "Failed to update settings", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": map[string]string{"status": "updated"},
	})
}

func (h *Handler) handleEWAAdvanceHistory(w http.ResponseWriter, r *http.Request) {
	orgID := r.URL.Query().Get("org_id")
	if orgID == "" {
		http.Error(w, "Organization ID required", http.StatusBadRequest)
		return
	}

	query := `SELECT a.id, a.employee_id, e.name, a.amount, a.status, a.requested_at, a.repaid_at
			  FROM ewa.advances a
			  JOIN ewa.employees e ON a.employee_id = e.id
			  WHERE e.org_id = $1
			  ORDER BY a.requested_at DESC`

	rows, err := h.svc.DB().Query(query, orgID)
	if err != nil {
		http.Error(w, "Failed to fetch history", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var advances []map[string]interface{}
	for rows.Next() {
		var advance map[string]interface{} = make(map[string]interface{})
		var id, employeeID, name, status string
		var amount float64
		var requestedAt, repaidAt interface{}

		err := rows.Scan(&id, &employeeID, &name, &amount, &status, &requestedAt, &repaidAt)
		if err != nil {
			continue
		}

		advance["id"] = id
		advance["employee_id"] = employeeID
		advance["employee_name"] = name
		advance["amount"] = amount
		advance["status"] = status
		advance["requested_at"] = requestedAt
		advance["repaid_at"] = repaidAt

		advances = append(advances, advance)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": advances,
	})
}

func (h *Handler) handleEWAExportReport(w http.ResponseWriter, r *http.Request) {
	orgID := r.URL.Query().Get("org_id")
	startDate := r.URL.Query().Get("start_date")
	endDate := r.URL.Query().Get("end_date")

	query := `SELECT e.name, e.email, a.amount, a.status, a.requested_at
			  FROM ewa.advances a
			  JOIN ewa.employees e ON a.employee_id = e.id
			  WHERE e.org_id = $1 AND a.requested_at BETWEEN $2 AND $3
			  ORDER BY a.requested_at DESC`

	rows, err := h.svc.DB().Query(query, orgID, startDate, endDate)
	if err != nil {
		http.Error(w, "Failed to generate report", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	w.Header().Set("Content-Type", "text/csv")
	w.Header().Set("Content-Disposition", "attachment; filename=ewa_report.csv")
	w.Write([]byte("Employee Name,Email,Amount,Status,Requested At\n"))

	for rows.Next() {
		var name, email, status, requestedAt string
		var amount float64
		rows.Scan(&name, &email, &amount, &status, &requestedAt)
		
		line := name + "," + email + "," + strconv.FormatFloat(amount, 'f', 2, 64) + "," + status + "," + requestedAt + "\n"
		w.Write([]byte(line))
	}
}

func (h *Handler) handleEWADashboard(w http.ResponseWriter, r *http.Request) {
	orgID := r.URL.Query().Get("org_id")

	// Get summary stats
	var totalEmployees, activeAdvances int
	var totalAdvanced, totalRepaid float64

	h.svc.DB().QueryRow("SELECT COUNT(*) FROM ewa.employees WHERE org_id = $1", orgID).Scan(&totalEmployees)
	h.svc.DB().QueryRow("SELECT COUNT(*) FROM ewa.advances a JOIN ewa.employees e ON a.employee_id = e.id WHERE e.org_id = $1 AND a.status = 'pending'", orgID).Scan(&activeAdvances)
	h.svc.DB().QueryRow("SELECT COALESCE(SUM(amount), 0) FROM ewa.advances a JOIN ewa.employees e ON a.employee_id = e.id WHERE e.org_id = $1", orgID).Scan(&totalAdvanced)
	h.svc.DB().QueryRow("SELECT COALESCE(SUM(amount), 0) FROM ewa.advances a JOIN ewa.employees e ON a.employee_id = e.id WHERE e.org_id = $1 AND a.status = 'repaid'", orgID).Scan(&totalRepaid)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data": map[string]interface{}{
			"total_employees":  totalEmployees,
			"active_advances":  activeAdvances,
			"total_advanced":   totalAdvanced,
			"total_repaid":     totalRepaid,
			"outstanding":      totalAdvanced - totalRepaid,
		},
	})
}