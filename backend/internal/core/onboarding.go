package core

import (
	"context"
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type UserIntent string

const (
	IntentEWAOnly      UserIntent = "ewa_only"
	IntentSocialOnly   UserIntent = "social_only"
	IntentFullPlatform UserIntent = "full_platform"
	IntentAPIPartner   UserIntent = "api_partner"
)

type OnboardingStep string

const (
	StepWelcome          OnboardingStep = "welcome"
	StepUseCase          OnboardingStep = "use_case"
	StepBusinessInfo     OnboardingStep = "business_info"
	StepFeatureSelection OnboardingStep = "feature_selection"
	StepWorkflowSetup    OnboardingStep = "workflow_setup"
	StepPaymentSetup     OnboardingStep = "payment_setup"
	StepComplete         OnboardingStep = "complete"
)

type FeaturePreferences struct {
	Features        []string `json:"features"`
	EnabledFeatures []string `json:"enabled_features"`
	Apps            []string `json:"apps"`
	Workflows       []string `json:"workflows"`
	BusinessName    string   `json:"businessName"`
	Industry        string   `json:"industry"`
	EmployeeCount   int      `json:"employeeCount"`
	OnboardingPath  string   `json:"onboardingPath"`
	WalletSetup     bool     `json:"walletSetup"`
	DashboardLayout string   `json:"dashboard_layout"`
	DefaultView     string   `json:"default_view"`
}

func (fp FeaturePreferences) Value() (driver.Value, error) {
	return json.Marshal(fp)
}

func (fp *FeaturePreferences) Scan(value interface{}) error {
	if value == nil {
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("cannot scan %T into FeaturePreferences", value)
	}
	return json.Unmarshal(bytes, fp)
}

type OnboardingProfile struct {
	AccountID      uuid.UUID          `json:"account_id"`
	Intent         UserIntent         `json:"intent"`
	CurrentStep    OnboardingStep     `json:"current_step"`
	CompletedSteps []OnboardingStep   `json:"completed_steps"`
	Preferences    FeaturePreferences `json:"preferences"`
	BusinessInfo   map[string]string  `json:"business_info,omitempty"`
	IsComplete     bool               `json:"is_complete"`
	CreatedAt      time.Time          `json:"created_at"`
	UpdatedAt      time.Time          `json:"updated_at"`
}

func (s *Service) CreateOnboardingProfile(ctx context.Context, accountID uuid.UUID, intent UserIntent) (*OnboardingProfile, error) {
	preferences := s.getDefaultPreferences(intent)

	profile := &OnboardingProfile{
		AccountID:      accountID,
		Intent:         intent,
		CurrentStep:    StepWelcome,
		CompletedSteps: []OnboardingStep{},
		Preferences:    preferences,
		BusinessInfo:   make(map[string]string),
		IsComplete:     false,
		CreatedAt:      time.Now(),
		UpdatedAt:      time.Now(),
	}

	query := `
		INSERT INTO onboarding_profiles (user_id, intent, current_step, completed_steps, preferences, business_info, is_complete, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING user_id`

	completedStepsJSON, _ := json.Marshal(profile.CompletedSteps)
	businessInfoJSON, _ := json.Marshal(profile.BusinessInfo)

	err := s.db.Pool.QueryRow(ctx, query,
		profile.AccountID, profile.Intent, profile.CurrentStep,
		completedStepsJSON, profile.Preferences, businessInfoJSON,
		profile.IsComplete, profile.CreatedAt, profile.UpdatedAt,
	).Scan(&profile.AccountID)

	return profile, err
}

func (s *Service) UpdateOnboardingStep(ctx context.Context, accountID uuid.UUID, step OnboardingStep, data map[string]string) error {
	profile, err := s.GetOnboardingProfile(ctx, accountID)
	if err != nil {
		return err
	}

	// Add current step to completed if not already there
	found := false
	for _, completed := range profile.CompletedSteps {
		if completed == profile.CurrentStep {
			found = true
			break
		}
	}
	if !found {
		profile.CompletedSteps = append(profile.CompletedSteps, profile.CurrentStep)
	}

	profile.CurrentStep = step
	profile.UpdatedAt = time.Now()

	// Store business info if provided
	if data != nil {
		for k, v := range data {
			profile.BusinessInfo[k] = v
		}
	}

	// Mark complete if final step
	if step == StepComplete {
		profile.IsComplete = true
	}

	completedStepsJSON, _ := json.Marshal(profile.CompletedSteps)
	businessInfoJSON, _ := json.Marshal(profile.BusinessInfo)

	query := `
		UPDATE onboarding_profiles 
		SET current_step = $1, completed_steps = $2, business_info = $3, is_complete = $4, updated_at = $5
		WHERE user_id = $6`

	_, err = s.db.Pool.Exec(ctx, query, step, completedStepsJSON, businessInfoJSON, profile.IsComplete, profile.UpdatedAt, accountID)
	if err != nil {
		return err
	}

	// Sync with accounts table
	if profile.IsComplete {
		_, err = s.db.Pool.Exec(ctx, "UPDATE accounts SET onboarding_completed = true WHERE id = $1", accountID)
	}

	return err
}

func (s *Service) GetOnboardingProfile(ctx context.Context, accountID uuid.UUID) (*OnboardingProfile, error) {
	profile := &OnboardingProfile{}
	var completedStepsJSON, businessInfoJSON []byte

	query := `
		SELECT user_id, intent, current_step, completed_steps, preferences, business_info, is_complete, created_at, updated_at
		FROM onboarding_profiles WHERE user_id = $1`

	err := s.db.Pool.QueryRow(ctx, query, accountID).Scan(
		&profile.AccountID, &profile.Intent, &profile.CurrentStep,
		&completedStepsJSON, &profile.Preferences, &businessInfoJSON,
		&profile.IsComplete, &profile.CreatedAt, &profile.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	json.Unmarshal(completedStepsJSON, &profile.CompletedSteps)
	json.Unmarshal(businessInfoJSON, &profile.BusinessInfo)

	return profile, nil
}

func (s *Service) getDefaultPreferences(intent UserIntent) FeaturePreferences {
	switch intent {
	case IntentEWAOnly:
		return FeaturePreferences{
			Features:        []string{"ewa", "payroll", "employees"},
			EnabledFeatures: []string{"ewa", "payroll", "employees"},
			DashboardLayout: "ewa_focused",
			DefaultView:     "employee_dashboard",
		}
	case IntentSocialOnly:
		return FeaturePreferences{
			Features:        []string{"social_payments", "goals", "split_payments"},
			EnabledFeatures: []string{"social_payments", "goals", "split_payments"},
			DashboardLayout: "social_focused",
			DefaultView:     "social_dashboard",
		}
	case IntentAPIPartner:
		return FeaturePreferences{
			Features:        []string{"api_keys", "webhooks", "documentation"},
			EnabledFeatures: []string{"api_keys", "webhooks", "documentation"},
			DashboardLayout: "developer_focused",
			DefaultView:     "developer_dashboard",
		}
	default: // IntentFullPlatform
		return FeaturePreferences{
			Features:        []string{"ewa", "social_payments", "payroll", "invoicing", "treasury"},
			EnabledFeatures: []string{"ewa", "social_payments", "payroll", "invoicing", "treasury"},
			DashboardLayout: "full_platform",
			DefaultView:     "overview_dashboard",
		}
	}
}
