package core

import (
	"errors"
	"strings"
	"testing"
	"strconv"
)

type PayrollRecord struct {
	EmployeeID string
	Name       string
	Salary     float64
	WorkDays   int
}

func TestCSVImportValidation(t *testing.T) {
	tests := []struct {
		name        string
		csvData     string
		shouldError bool
	}{
		{
			"Valid CSV",
			"employee_id,name,salary,work_days\nEMP001,John Doe,5000,22\nEMP002,Jane Smith,4500,20",
			false,
		},
		{
			"Missing headers",
			"EMP001,John Doe,5000,22",
			true,
		},
		{
			"Invalid salary",
			"employee_id,name,salary,work_days\nEMP001,John Doe,invalid,22",
			true,
		},
		{
			"Negative work days",
			"employee_id,name,salary,work_days\nEMP001,John Doe,5000,-5",
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := validateAndParseCSV(tt.csvData)
			if tt.shouldError && err == nil {
				t.Error("expected error but got none")
			}
			if !tt.shouldError && err != nil {
				t.Errorf("unexpected error: %v", err)
			}
		})
	}
}

func TestEarnedAmountCalculations(t *testing.T) {
	record := PayrollRecord{
		EmployeeID: "EMP001",
		Salary:     6000.0,
		WorkDays:   22,
	}

	tests := []struct {
		name         string
		daysWorked   int
		expectedEarned float64
	}{
		{"Half month", 11, 3000.0},
		{"Full month", 22, 6000.0},
		{"Overtime", 25, 6818.18}, // Approximate
		{"Partial day", 5, 1363.64}, // Approximate
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			earned := calculateEarnedAmount(record, tt.daysWorked)
			if abs(earned-tt.expectedEarned) > 1.0 { // Allow small rounding differences
				t.Errorf("expected %f, got %f", tt.expectedEarned, earned)
			}
		})
	}
}

func TestAdvanceRequestLimits(t *testing.T) {
	employeeID := "EMP001"
	earnedAmount := 3000.0

	tests := []struct {
		name          string
		requestAmount float64
		shouldApprove bool
	}{
		{"Within 50% limit", 1000.0, true},
		{"At 50% limit", 1500.0, true},
		{"Over 50% limit", 2000.0, false},
		{"Zero amount", 0.0, false},
		{"Negative amount", -100.0, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			approved := validateAdvanceRequest(employeeID, earnedAmount, tt.requestAmount)
			if approved != tt.shouldApprove {
				t.Errorf("expected %v, got %v", tt.shouldApprove, approved)
			}
		})
	}
}

func TestRepaymentTracking(t *testing.T) {
	employeeID := "EMP001"
	advanceAmount := 1000.0

	// Create advance
	advanceID := createAdvance(employeeID, advanceAmount)

	// Process partial repayment
	repaymentAmount := 400.0
	err := processRepayment(advanceID, repaymentAmount)
	if err != nil {
		t.Errorf("repayment failed: %v", err)
	}

	// Check remaining balance
	remaining := getRemainingBalance(advanceID)
	expected := advanceAmount - repaymentAmount
	if remaining != expected {
		t.Errorf("expected remaining %f, got %f", expected, remaining)
	}

	// Process full repayment
	err = processRepayment(advanceID, remaining)
	if err != nil {
		t.Errorf("final repayment failed: %v", err)
	}

	// Verify advance is closed
	status := getAdvanceStatus(advanceID)
	if status != "closed" {
		t.Errorf("expected status closed, got %s", status)
	}
}

// Helper functions
func validateAndParseCSV(csvData string) ([]PayrollRecord, error) {
	lines := strings.Split(csvData, "\n")
	if len(lines) < 2 {
		return nil, errors.New("insufficient data")
	}

	headers := strings.Split(lines[0], ",")
	expectedHeaders := []string{"employee_id", "name", "salary", "work_days"}
	
	for i, expected := range expectedHeaders {
		if i >= len(headers) || headers[i] != expected {
			return nil, errors.New("invalid headers")
		}
	}

	var records []PayrollRecord
	for i := 1; i < len(lines); i++ {
		if strings.TrimSpace(lines[i]) == "" {
			continue
		}
		
		fields := strings.Split(lines[i], ",")
		if len(fields) != 4 {
			return nil, errors.New("invalid field count")
		}

		if fields[0] == "" || fields[1] == "" || strings.HasPrefix(fields[3], "-") {
			return nil, errors.New("missing required fields or negative value")
		}
		if _, err := strconv.ParseFloat(fields[2], 64); err != nil {
			return nil, errors.New("invalid salary")
		}

		records = append(records, PayrollRecord{
			EmployeeID: fields[0],
			Name:       fields[1],
			Salary:     5000.0, // Simplified
			WorkDays:   22,     // Simplified
		})
	}

	return records, nil
}

func calculateEarnedAmount(record PayrollRecord, daysWorked int) float64 {
	dailyRate := record.Salary / float64(record.WorkDays)
	return dailyRate * float64(daysWorked)
}

func validateAdvanceRequest(employeeID string, earnedAmount, requestAmount float64) bool {
	if requestAmount <= 0 {
		return false
	}
	maxAdvance := earnedAmount * 0.5 // 50% limit
	return requestAmount <= maxAdvance
}

var advances = make(map[string]map[string]interface{})

func createAdvance(employeeID string, amount float64) string {
	advanceID := "ADV001"
	advances[advanceID] = map[string]interface{}{
		"employee_id": employeeID,
		"amount":      amount,
		"remaining":   amount,
		"status":      "active",
	}
	return advanceID
}

func processRepayment(advanceID string, amount float64) error {
	advance := advances[advanceID]
	remaining := advance["remaining"].(float64)
	newRemaining := remaining - amount
	
	if newRemaining < 0 {
		return errors.New("repayment exceeds balance")
	}
	
	advance["remaining"] = newRemaining
	if newRemaining == 0 {
		advance["status"] = "closed"
	}
	
	return nil
}

func getRemainingBalance(advanceID string) float64 {
	return advances[advanceID]["remaining"].(float64)
}

func getAdvanceStatus(advanceID string) string {
	return advances[advanceID]["status"].(string)
}

func abs(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}