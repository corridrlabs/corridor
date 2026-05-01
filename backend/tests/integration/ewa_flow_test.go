package integration

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestEWAPayrollUpload(t *testing.T) {
	server := setupTestServer()
	defer server.Close()

	adminToken := createTestUser(t, server, "enterprise")

	// Create CSV content
	csvContent := `employee_id,name,salary,work_days
EMP001,John Doe,6000,22
EMP002,Jane Smith,5500,20
EMP003,Bob Johnson,4800,22`

	// Upload payroll CSV
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	
	part, err := writer.CreateFormFile("payroll", "payroll.csv")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	
	part.Write([]byte(csvContent))
	writer.Close()

	req, err := http.NewRequest("POST", server.URL+"/api/ewa/payroll", &body)
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}
	
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+adminToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var result map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&result)

	processed := result["processed"].(float64)
	if processed != 3 {
		t.Errorf("expected 3 records processed, got %f", processed)
	}
}

func TestEWAAdvanceRequest(t *testing.T) {
	server := setupTestServer()
	defer server.Close()

	// Create employee user
	employeeToken := createTestUser(t, server, "pro")

	// First upload payroll data (as admin)
	adminToken := createTestUser(t, server, "enterprise")
	uploadPayrollData(t, server, adminToken)

	// Employee requests advance
	advanceData := map[string]interface{}{
		"amount": 1500.0, // 50% of 3000 earned
		"reason": "Emergency expense",
	}

	resp := makeAuthenticatedRequest(t, server, "POST", "/api/ewa/advance", advanceData, employeeToken)
	if resp.StatusCode != http.StatusCreated {
		t.Errorf("expected 201, got %d", resp.StatusCode)
	}

	var advance map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&advance)

	advanceID := advance["id"].(string)
	if advanceID == "" {
		t.Error("expected advance ID")
	}

	if advance["status"] != "approved" {
		t.Errorf("expected approved status, got %s", advance["status"])
	}

	// Verify advance appears in employee's list
	resp = makeAuthenticatedRequest(t, server, "GET", "/api/ewa/advances", nil, employeeToken)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var advances []map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&advances)

	if len(advances) != 1 {
		t.Errorf("expected 1 advance, got %d", len(advances))
	}
}

func TestEWAAdvanceLimits(t *testing.T) {
	server := setupTestServer()
	defer server.Close()

	employeeToken := createTestUser(t, server, "pro")
	adminToken := createTestUser(t, server, "enterprise")
	
	uploadPayrollData(t, server, adminToken)

	tests := []struct {
		name           string
		amount         float64
		expectedStatus int
	}{
		{"Within limit", 1000.0, http.StatusCreated},
		{"At 50% limit", 1500.0, http.StatusCreated},
		{"Over limit", 2000.0, http.StatusBadRequest},
		{"Zero amount", 0.0, http.StatusBadRequest},
		{"Negative amount", -100.0, http.StatusBadRequest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			advanceData := map[string]interface{}{
				"amount": tt.amount,
				"reason": "Test advance",
			}

			resp := makeAuthenticatedRequest(t, server, "POST", "/api/ewa/advance", advanceData, employeeToken)
			if resp.StatusCode != tt.expectedStatus {
				t.Errorf("expected %d, got %d", tt.expectedStatus, resp.StatusCode)
			}
		})
	}
}

func TestEWARepaymentFlow(t *testing.T) {
	server := setupTestServer()
	defer server.Close()

	employeeToken := createTestUser(t, server, "pro")
	adminToken := createTestUser(t, server, "enterprise")
	
	uploadPayrollData(t, server, adminToken)

	// Create advance
	advanceData := map[string]interface{}{
		"amount": 1000.0,
		"reason": "Test advance",
	}

	resp := makeAuthenticatedRequest(t, server, "POST", "/api/ewa/advance", advanceData, employeeToken)
	var advance map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&advance)
	advanceID := advance["id"].(string)

	// Process partial repayment
	repaymentData := map[string]interface{}{
		"advance_id": advanceID,
		"amount":     400.0,
	}

	resp = makeAuthenticatedRequest(t, server, "POST", "/api/ewa/repayment", repaymentData, adminToken)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// Check remaining balance
	resp = makeAuthenticatedRequest(t, server, "GET", "/api/ewa/advances/"+advanceID, nil, employeeToken)
	var updatedAdvance map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&updatedAdvance)

	remaining := updatedAdvance["remaining"].(float64)
	if remaining != 600.0 {
		t.Errorf("expected remaining 600, got %f", remaining)
	}

	// Process full repayment
	repaymentData["amount"] = 600.0
	resp = makeAuthenticatedRequest(t, server, "POST", "/api/ewa/repayment", repaymentData, adminToken)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// Verify advance is closed
	resp = makeAuthenticatedRequest(t, server, "GET", "/api/ewa/advances/"+advanceID, nil, employeeToken)
	json.NewDecoder(resp.Body).Decode(&updatedAdvance)

	if updatedAdvance["status"] != "closed" {
		t.Errorf("expected closed status, got %s", updatedAdvance["status"])
	}
}

func TestEWAAdminDashboard(t *testing.T) {
	server := setupTestServer()
	defer server.Close()

	adminToken := createTestUser(t, server, "enterprise")
	uploadPayrollData(t, server, adminToken)

	// Create some advances
	employeeToken1 := createTestUser(t, server, "pro")
	employeeToken2 := createTestUser(t, server, "pro")

	advanceData1 := map[string]interface{}{
		"amount": 1000.0,
		"reason": "Advance 1",
	}
	makeAuthenticatedRequest(t, server, "POST", "/api/ewa/advance", advanceData1, employeeToken1)

	advanceData2 := map[string]interface{}{
		"amount": 800.0,
		"reason": "Advance 2",
	}
	makeAuthenticatedRequest(t, server, "POST", "/api/ewa/advance", advanceData2, employeeToken2)

	// Get admin dashboard data
	resp := makeAuthenticatedRequest(t, server, "GET", "/api/ewa/dashboard", nil, adminToken)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var dashboard map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&dashboard)

	totalAdvances := dashboard["total_advances"].(float64)
	if totalAdvances != 1800.0 {
		t.Errorf("expected total advances 1800, got %f", totalAdvances)
	}

	activeAdvances := dashboard["active_advances"].(float64)
	if activeAdvances != 2 {
		t.Errorf("expected 2 active advances, got %f", activeAdvances)
	}
}

func TestEWAEarnedAmountCalculation(t *testing.T) {
	server := setupTestServer()
	defer server.Close()

	adminToken := createTestUser(t, server, "enterprise")
	employeeToken := createTestUser(t, server, "pro")

	// Upload payroll with specific work days
	csvContent := `employee_id,name,salary,work_days
EMP001,Test Employee,6600,22`

	uploadCSV(t, server, adminToken, csvContent)

	// Update work days (simulate mid-month)
	updateData := map[string]interface{}{
		"employee_id": "EMP001",
		"days_worked": 11, // Half month
	}

	resp := makeAuthenticatedRequest(t, server, "POST", "/api/ewa/update-days", updateData, adminToken)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	// Check earned amount
	resp = makeAuthenticatedRequest(t, server, "GET", "/api/ewa/earned", nil, employeeToken)
	if resp.StatusCode != http.StatusOK {
		t.Errorf("expected 200, got %d", resp.StatusCode)
	}

	var earned map[string]interface{}
	json.NewDecoder(resp.Body).Decode(&earned)

	earnedAmount := earned["amount"].(float64)
	expected := 3300.0 // Half of 6600
	
	if earnedAmount != expected {
		t.Errorf("expected earned amount %f, got %f", expected, earnedAmount)
	}
}

// Helper functions
func uploadPayrollData(t *testing.T, server *httptest.Server, token string) {
	csvContent := `employee_id,name,salary,work_days
EMP001,Test Employee,6000,22`
	uploadCSV(t, server, token, csvContent)
}

func uploadCSV(t *testing.T, server *httptest.Server, token, csvContent string) {
	var body bytes.Buffer
	writer := multipart.NewWriter(&body)
	
	part, err := writer.CreateFormFile("payroll", "payroll.csv")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	
	part.Write([]byte(csvContent))
	writer.Close()

	req, err := http.NewRequest("POST", server.URL+"/api/ewa/payroll", &body)
	if err != nil {
		t.Fatalf("failed to create request: %v", err)
	}
	
	req.Header.Set("Content-Type", writer.FormDataContentType())
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("CSV upload failed with status %d", resp.StatusCode)
	}
}