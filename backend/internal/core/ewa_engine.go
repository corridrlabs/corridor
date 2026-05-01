package core

import (
	"encoding/csv"
	"fmt"
	"io"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/corridrlabs/corridor/backend/internal/adapters/db"
	"github.com/corridrlabs/corridor/backend/internal/circle"
)

type EWAEngine struct {
	db     *db.Postgres
	circle *circle.Client
}

func generateID() string {
	return uuid.New().String()
}

type Employee struct {
	ID           string    `json:"id" db:"id"`
	OrgID        string    `json:"org_id" db:"org_id"`
	ExternalID   string    `json:"external_id" db:"external_id"`
	Name         string    `json:"name" db:"name"`
	Email        string    `json:"email" db:"email"`
	HourlyRate   float64   `json:"hourly_rate" db:"hourly_rate"`
	BankVerified bool      `json:"bank_verified" db:"bank_verified"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
}

type Advance struct {
	ID           string    `json:"id" db:"id"`
	EmployeeID   string    `json:"employee_id" db:"employee_id"`
	Amount       float64   `json:"amount" db:"amount"`
	EarnedAmount float64   `json:"earned_amount" db:"earned_amount"`
	Status       string    `json:"status" db:"status"`
	RequestedAt  time.Time `json:"requested_at" db:"requested_at"`
	RepaidAt     *time.Time `json:"repaid_at" db:"repaid_at"`
}

type AttendanceRecord struct {
	EmployeeID string    `json:"employee_id" db:"employee_id"`
	Date       time.Time `json:"date" db:"date"`
	HoursWorked float64  `json:"hours_worked" db:"hours_worked"`
}

func (s *Service) ImportEmployeesCSV(orgID string, csvData io.Reader) ([]Employee, error) {
	reader := csv.NewReader(csvData)
	records, err := reader.ReadAll()
	if err != nil {
		return nil, fmt.Errorf("failed to parse CSV: %w", err)
	}

	if len(records) < 2 {
		return nil, fmt.Errorf("CSV must have header and at least one employee")
	}

	var employees []Employee
	for i, record := range records[1:] {
		if len(record) < 4 {
			return nil, fmt.Errorf("row %d: insufficient columns", i+2)
		}

		hourlyRate, err := strconv.ParseFloat(record[3], 64)
		if err != nil {
			return nil, fmt.Errorf("row %d: invalid hourly rate", i+2)
		}

		employee := Employee{
			ID:         generateID(),
			OrgID:      orgID,
			ExternalID: record[0],
			Name:       record[1],
			Email:      record[2],
			HourlyRate: hourlyRate,
			CreatedAt:  time.Now(),
		}
		employees = append(employees, employee)
	}

	// Bulk insert
	query := `INSERT INTO ewa.employees (id, org_id, external_id, name, email, hourly_rate, created_at) 
			  VALUES ($1, $2, $3, $4, $5, $6, $7)`
	
	for _, emp := range employees {
		_, err := s.db.Exec(query, emp.ID, emp.OrgID, emp.ExternalID, emp.Name, emp.Email, emp.HourlyRate, emp.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to insert employee %s: %w", emp.Name, err)
		}
	}

	return employees, nil
}

func (s *Service) SyncAttendance(orgID string, records []AttendanceRecord) error {
	query := `INSERT INTO ewa.attendance (employee_id, date, hours_worked) 
			  VALUES ($1, $2, $3) ON CONFLICT (employee_id, date) 
			  DO UPDATE SET hours_worked = EXCLUDED.hours_worked`

	for _, record := range records {
		_, err := s.db.Exec(query, record.EmployeeID, record.Date, record.HoursWorked)
		if err != nil {
			return fmt.Errorf("failed to sync attendance for %s: %w", record.EmployeeID, err)
		}
	}
	return nil
}

func (s *Service) CalculateEarnedAmount(employeeID string) (float64, error) {
	query := `SELECT e.hourly_rate, COALESCE(SUM(a.hours_worked), 0) as total_hours
			  FROM ewa.employees e
			  LEFT JOIN ewa.attendance a ON e.id = a.employee_id 
			  WHERE e.id = $1 AND a.date >= date_trunc('week', CURRENT_DATE)
			  GROUP BY e.hourly_rate`

	var hourlyRate, totalHours float64
	err := s.db.QueryRow(query, employeeID).Scan(&hourlyRate, &totalHours)
	if err != nil {
		return 0, fmt.Errorf("failed to calculate earned amount: %w", err)
	}

	return hourlyRate * totalHours, nil
}

func (s *Service) RequestAdvance(employeeID string, amount float64, advanceLimit float64) (*Advance, error) {
	earnedAmount, err := s.CalculateEarnedAmount(employeeID)
	if err != nil {
		return nil, err
	}

	maxAdvance := earnedAmount * (advanceLimit / 100)
	if amount > maxAdvance {
		return nil, fmt.Errorf("advance amount exceeds limit of %.2f", maxAdvance)
	}

	// Check bank verification
	var bankVerified bool
	err = s.db.QueryRow("SELECT bank_verified FROM ewa.employees WHERE id = $1", employeeID).Scan(&bankVerified)
	if err != nil || !bankVerified {
		return nil, fmt.Errorf("bank account not verified")
	}

	advance := &Advance{
		ID:           generateID(),
		EmployeeID:   employeeID,
		Amount:       amount,
		EarnedAmount: earnedAmount,
		Status:       "pending",
		RequestedAt:  time.Now(),
	}

	query := `INSERT INTO ewa.advances (id, employee_id, amount, earned_amount, status, requested_at) 
			  VALUES ($1, $2, $3, $4, $5, $6)`
	
	_, err = s.db.Exec(query, advance.ID, advance.EmployeeID, advance.Amount, advance.EarnedAmount, advance.Status, advance.RequestedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create advance: %w", err)
	}

	return advance, nil
}

func (s *Service) ProcessRepayment(advanceID string) error {
	now := time.Now()
	query := `UPDATE ewa.advances SET status = 'repaid', repaid_at = $1 WHERE id = $2`
	_, err := s.db.Exec(query, now, advanceID)
	return err
}

func (s *Service) GetAdvanceHistory(employeeID string) ([]Advance, error) {
	query := `SELECT id, employee_id, amount, earned_amount, status, requested_at, repaid_at 
			  FROM ewa.advances WHERE employee_id = $1 ORDER BY requested_at DESC`
	
	rows, err := s.db.Query(query, employeeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var advances []Advance
	for rows.Next() {
		var advance Advance
		err := rows.Scan(&advance.ID, &advance.EmployeeID, &advance.Amount, &advance.EarnedAmount, 
						&advance.Status, &advance.RequestedAt, &advance.RepaidAt)
		if err != nil {
			return nil, err
		}
		advances = append(advances, advance)
	}

	return advances, nil
}

// ERP webhook handler
func (s *Service) HandleERPWebhook(orgID string, payload map[string]interface{}) error {
	eventType := payload["event_type"].(string)
	
	switch eventType {
	case "employee_updated":
		return s.syncEmployeeFromERP(orgID, payload["employee"].(map[string]interface{}))
	case "attendance_updated":
		return s.syncAttendanceFromERP(orgID, payload["attendance"].([]interface{}))
	default:
		return fmt.Errorf("unknown event type: %s", eventType)
	}
}

func (s *Service) syncEmployeeFromERP(orgID string, empData map[string]interface{}) error {
	query := `UPDATE ewa.employees SET name = $1, email = $2, hourly_rate = $3 
			  WHERE org_id = $4 AND external_id = $5`
	
	_, err := s.db.Exec(query, empData["name"], empData["email"], empData["hourly_rate"], orgID, empData["id"])
	return err
}

func (s *Service) syncAttendanceFromERP(orgID string, attendanceData []interface{}) error {
	for _, record := range attendanceData {
		data := record.(map[string]interface{})
		date, _ := time.Parse("2006-01-02", data["date"].(string))
		
		_, err := s.db.Exec(`INSERT INTO ewa.attendance (employee_id, date, hours_worked) 
							VALUES ($1, $2, $3) ON CONFLICT (employee_id, date) 
							DO UPDATE SET hours_worked = EXCLUDED.hours_worked`,
							data["employee_id"], date, data["hours_worked"])
		if err != nil {
			return err
		}
	}
	return nil
}