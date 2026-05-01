package core

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

	"github.com/google/uuid"
)

// WorkflowStepDefinition represents a single step in a workflow DAG
type WorkflowStepDefinition struct {
	ID     string                 `json:"id"`
	Type   string                 `json:"type"`   // "ACTION", "CONDITION", "WAIT"
	Action string                 `json:"action"` // "PAYMENT_PAYOUT", "EMAIL_SEND"
	Config map[string]interface{} `json:"config"`
	Next   string                 `json:"next"` // ID of next step
}

// ExecuteWorkflow starts a workflow instance
func (s *Service) ExecuteWorkflow(ctx context.Context, templateID, accountID uuid.UUID, inputData map[string]interface{}) (uuid.UUID, error) {
	// 1. Fetch Template
	var definitionJSON []byte
	err := s.db.Pool.QueryRow(ctx, `SELECT definition FROM workflow_templates WHERE id = $1`, templateID).Scan(&definitionJSON)
	if err != nil {
		return uuid.Nil, fmt.Errorf("template not found: %w", err)
	}

	// 2. Create Execution Record
	var execID uuid.UUID
	err = s.db.Pool.QueryRow(ctx, `
		INSERT INTO workflow_executions (template_id, trigger_account_id, status, context_data)
		VALUES ($1, $2, 'RUNNING', $3)
		RETURNING id
	`, templateID, accountID, inputData).Scan(&execID)
	if err != nil {
		return uuid.Nil, err
	}

	// 3. Async Execution (Mocked for now - would be a Go routine or Worker Queue)
	go s.runWorkflow(execID, definitionJSON)

	return execID, nil
}

// runWorkflow is the execution engine
func (s *Service) runWorkflow(execID uuid.UUID, definitionJSON []byte) {
	ctx := context.Background()
	
	// Parse Definition
	var steps []WorkflowStepDefinition
	if err := json.Unmarshal(definitionJSON, &steps); err != nil {
		log.Printf("Workflow %s failed to parse: %v", execID, err)
		return
	}

	// Map for O(1) Access
	stepMap := make(map[string]WorkflowStepDefinition)
	for _, step := range steps {
		stepMap[step.ID] = step
	}

	// Fetch Execution Context to get the Triggering Account and Input Data
	var triggerAccountID uuid.UUID
	var contextData map[string]interface{}
	err := s.db.Pool.QueryRow(ctx, `SELECT trigger_account_id, context_data FROM workflow_executions WHERE id = $1`, execID).Scan(&triggerAccountID, &contextData)
	if err != nil {
		log.Printf("Failed to fetch execution context: %v", err)
		return
	}

	// Start at first step
	currentStepID := steps[0].ID

	for currentStepID != "" {
		step, exists := stepMap[currentStepID]
		if !exists {
			log.Printf("Step %s not found, aborting", currentStepID)
			break
		}
		
		log.Printf("Executing Step %s: %s (Type: %s)", step.ID, step.Action, step.Type)

		// Execute Step Logic
		var nextStepID string
		var execErr error

		switch step.Type {
		case "ACTION":
			nextStepID = step.Next
			execErr = s.executeAction(ctx, step, triggerAccountID, contextData)
		case "CONDITION":
			// For conditions, Next is "true_step_id", Config may have "false_step_id"
			result, err := s.evaluateCondition(step, contextData)
			if err != nil {
				execErr = err
			} else if result {
				nextStepID = step.Next // True path
			} else {
				if f, ok := step.Config["false_next"].(string); ok {
					nextStepID = f
				} else {
					nextStepID = "" // End if false path not defined
				}
			}
		default:
			nextStepID = step.Next
			log.Printf("Unknown step type %s, skipping", step.Type)
		}

		// Log Result
		status := "COMPLETED"
		msg := "Step executed successfully"
		if execErr != nil {
			status = "FAILED"
			msg = execErr.Error()
		}

		s.db.Pool.Exec(ctx, `
			INSERT INTO workflow_logs (execution_id, step_id, action_type, status, message)
			VALUES ($1, $2, $3, $4, $5)
		`, execID, step.ID, step.Action, status, msg)

		if execErr != nil {
			log.Printf("Workflow failed at step %s: %v", step.ID, execErr)
			s.db.Pool.Exec(ctx, `UPDATE workflow_executions SET status = 'FAILED' WHERE id = $1`, execID)
			return
		}
		
		// Move Next
		currentStepID = nextStepID
	}
	
	// Mark Complete
	s.db.Pool.Exec(ctx, `UPDATE workflow_executions SET status = 'COMPLETED', completed_at = NOW() WHERE id = $1`, execID)
}

// CreateWorkflowTemplate saves a new workflow definition
func (s *Service) CreateWorkflowTemplate(ctx context.Context, name string, description string, definitionJSON []byte) (uuid.UUID, error) {
	var id uuid.UUID
	err := s.db.Pool.QueryRow(ctx, `
		INSERT INTO workflow_templates (name, description, definition)
		VALUES ($1, $2, $3)
		RETURNING id
	`, name, description, definitionJSON).Scan(&id)
	if err != nil {
		return uuid.Nil, fmt.Errorf("failed to create template: %w", err)
	}
	return id, nil
}

// executeAction handles side effects like Payments
func (s *Service) executeAction(ctx context.Context, step WorkflowStepDefinition, accountID uuid.UUID, contextData map[string]interface{}) error {
	switch step.Action {
	case "PAYMENT_PAYOUT":
		// Expects config: amount (number), currency (string), to_wallet_id (string)
		// Usually 'to_wallet_id' might come from context or be hardcoded. 
		// For demo, let's assume hardcoded or simple resolve.
		
		amount, _ := step.Config["amount"].(float64)
		currency, _ := step.Config["currency"].(string)
		// For demo simplicity, we send FROM the trigger account's first wallet of that currency
		
		wallets, err := s.GetWallets(ctx, accountID)
		if err != nil {
			return err
		}
		var fromWalletID uuid.UUID
		for _, w := range wallets {
			if w.Currency == CurrencyCode(currency) {
				fromWalletID = w.ID
				break
			}
		}
		if fromWalletID == uuid.Nil {
			return fmt.Errorf("no wallet found for currency %s", currency)
		}

		// Dest: For demo, let's just pick a random other wallet not owned by user? 
		// Or assume config has 'to_account_id'
		// WE WILL MOCK THE DESTINATION for safety in this demo if not provided
		toWalletID := fromWalletID // Self-transfer if not specified (Loopback) to prove logic works w/o error
		
		if targetStr, ok := step.Config["to_wallet_id"].(string); ok && targetStr != "" {
			parsedID, err := uuid.Parse(targetStr)
			if err != nil {
				return fmt.Errorf("invalid to_wallet_id: %w", err)
			}
			toWalletID = parsedID
		}

		// Perform Transfer
		_, err = s.InternalTransfer(ctx, fromWalletID, toWalletID, amount, "Workflow Automated Payment")
		return err

	case "EMAIL_SEND":
		// Mock Email
		log.Printf(">>> MOCK EMAIL SENT: %v", step.Config)
		return nil
		
	default:
		return fmt.Errorf("unknown action: %s", step.Action)
	}
}

// evaluateCondition checks logic against context
func (s *Service) evaluateCondition(step WorkflowStepDefinition, contextData map[string]interface{}) (bool, error) {
	// Simple logic: key, operator, value
	// e.g. "amount", ">", 1000
	
	key, _ := step.Config["key"].(string)
	// operator, _ := step.Config["operator"].(string) 
	val, _ := step.Config["value"].(float64)
	
	// Get actual value from context
	// For demo, assuming inputData has specific keys
	actualVal, ok := contextData[key].(float64)
	if !ok {
		return false, nil // Default to false if key missing
	}

	// Hardcoded ">" check for demo
	return actualVal > val, nil
}
