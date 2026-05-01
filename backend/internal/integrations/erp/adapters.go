package erp

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type ERPAdapter interface {
	SyncEmployees(orgID string) error
	SyncAttendance(orgID string, startDate, endDate time.Time) error
	HandleWebhook(payload []byte) error
}

type WorkdayAdapter struct {
	apiKey    string
	baseURL   string
	tenantID  string
}

type BambooHRAdapter struct {
	apiKey    string
	subdomain string
}

type SAPAdapter struct {
	clientID     string
	clientSecret string
	baseURL      string
}

// Workday Implementation
func NewWorkdayAdapter(apiKey, baseURL, tenantID string) *WorkdayAdapter {
	return &WorkdayAdapter{
		apiKey:   apiKey,
		baseURL:  baseURL,
		tenantID: tenantID,
	}
}

func (w *WorkdayAdapter) SyncEmployees(orgID string) error {
	url := fmt.Sprintf("%s/ccx/service/%s/Human_Resources/v1/workers", w.baseURL, w.tenantID)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	
	req.Header.Set("Authorization", "Bearer "+w.apiKey)
	req.Header.Set("Accept", "application/json")
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	var workdayResp struct {
		Workers []struct {
			ID       string `json:"Worker_ID"`
			Name     string `json:"Legal_Name"`
			Email    string `json:"Primary_Work_Email"`
			HourlyRate float64 `json:"Hourly_Rate"`
		} `json:"Report_Entry"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&workdayResp); err != nil {
		return err
	}
	
	// Convert to internal format and sync
	for _, worker := range workdayResp.Workers {
		// Call service to update employee
		fmt.Printf("Syncing employee: %s\n", worker.Name)
	}
	
	return nil
}

func (w *WorkdayAdapter) SyncAttendance(orgID string, startDate, endDate time.Time) error {
	url := fmt.Sprintf("%s/ccx/service/%s/Human_Resources/v1/time_tracking", w.baseURL, w.tenantID)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	
	q := req.URL.Query()
	q.Add("from", startDate.Format("2006-01-02"))
	q.Add("to", endDate.Format("2006-01-02"))
	req.URL.RawQuery = q.Encode()
	
	req.Header.Set("Authorization", "Bearer "+w.apiKey)
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	// Process attendance data
	return nil
}

func (w *WorkdayAdapter) HandleWebhook(payload []byte) error {
	var webhook struct {
		EventType string `json:"eventType"`
		Data      json.RawMessage `json:"data"`
	}
	
	if err := json.Unmarshal(payload, &webhook); err != nil {
		return err
	}
	
	switch webhook.EventType {
	case "worker.updated":
		return w.handleWorkerUpdate(webhook.Data)
	case "time.recorded":
		return w.handleTimeRecord(webhook.Data)
	default:
		return fmt.Errorf("unknown event type: %s", webhook.EventType)
	}
}

func (w *WorkdayAdapter) handleWorkerUpdate(data json.RawMessage) error {
	var worker struct {
		ID         string  `json:"Worker_ID"`
		Name       string  `json:"Legal_Name"`
		Email      string  `json:"Primary_Work_Email"`
		HourlyRate float64 `json:"Hourly_Rate"`
	}
	
	if err := json.Unmarshal(data, &worker); err != nil {
		return err
	}
	
	// Update employee in database
	fmt.Printf("Updating worker: %s\n", worker.Name)
	return nil
}

func (w *WorkdayAdapter) handleTimeRecord(data json.RawMessage) error {
	var timeRecord struct {
		WorkerID    string  `json:"Worker_ID"`
		Date        string  `json:"Date"`
		HoursWorked float64 `json:"Hours_Worked"`
	}
	
	if err := json.Unmarshal(data, &timeRecord); err != nil {
		return err
	}
	
	// Update attendance in database
	fmt.Printf("Recording time for worker %s: %.2f hours\n", timeRecord.WorkerID, timeRecord.HoursWorked)
	return nil
}

// BambooHR Implementation
func NewBambooHRAdapter(apiKey, subdomain string) *BambooHRAdapter {
	return &BambooHRAdapter{
		apiKey:    apiKey,
		subdomain: subdomain,
	}
}

func (b *BambooHRAdapter) SyncEmployees(orgID string) error {
	url := fmt.Sprintf("https://api.bamboohr.com/api/gateway.php/%s/v1/employees/directory", b.subdomain)
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	
	req.SetBasicAuth(b.apiKey, "x")
	req.Header.Set("Accept", "application/json")
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	var bambooResp struct {
		Employees []struct {
			ID         string `json:"id"`
			FirstName  string `json:"firstName"`
			LastName   string `json:"lastName"`
			WorkEmail  string `json:"workEmail"`
			PayRate    string `json:"payRate"`
		} `json:"employees"`
	}
	
	if err := json.NewDecoder(resp.Body).Decode(&bambooResp); err != nil {
		return err
	}
	
	// Process employees
	for _, emp := range bambooResp.Employees {
		fmt.Printf("Syncing BambooHR employee: %s %s\n", emp.FirstName, emp.LastName)
	}
	
	return nil
}

func (b *BambooHRAdapter) SyncAttendance(orgID string, startDate, endDate time.Time) error {
	// BambooHR time tracking API implementation
	return nil
}

func (b *BambooHRAdapter) HandleWebhook(payload []byte) error {
	var webhook map[string]interface{}
	if err := json.Unmarshal(payload, &webhook); err != nil {
		return err
	}
	
	// Process BambooHR webhook
	fmt.Printf("BambooHR webhook: %+v\n", webhook)
	return nil
}

// SAP SuccessFactors Implementation
func NewSAPAdapter(clientID, clientSecret, baseURL string) *SAPAdapter {
	return &SAPAdapter{
		clientID:     clientID,
		clientSecret: clientSecret,
		baseURL:      baseURL,
	}
}

func (s *SAPAdapter) SyncEmployees(orgID string) error {
	// SAP SuccessFactors Employee Central API
	url := s.baseURL + "/odata/v2/EmpEmployment"
	
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return err
	}
	
	// Add OAuth token (simplified)
	req.Header.Set("Authorization", "Bearer "+s.getAccessToken())
	req.Header.Set("Accept", "application/json")
	
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	
	// Process SAP response
	return nil
}

func (s *SAPAdapter) SyncAttendance(orgID string, startDate, endDate time.Time) error {
	// SAP Time Management API
	return nil
}

func (s *SAPAdapter) HandleWebhook(payload []byte) error {
	// SAP webhook processing
	return nil
}

func (s *SAPAdapter) getAccessToken() string {
	// OAuth 2.0 token exchange with SAP
	return "mock_token"
}

// Factory function
func NewERPAdapter(system, apiKey string, config map[string]string) ERPAdapter {
	switch system {
	case "workday":
		return NewWorkdayAdapter(apiKey, config["base_url"], config["tenant_id"])
	case "bamboohr":
		return NewBambooHRAdapter(apiKey, config["subdomain"])
	case "sap":
		return NewSAPAdapter(config["client_id"], config["client_secret"], config["base_url"])
	default:
		return nil
	}
}