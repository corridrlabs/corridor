package core

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	"github.com/google/uuid"
)

type OnboardingAIInput struct {
	AccountID         uuid.UUID `json:"account_id"`
	AccountType       string    `json:"account_type"`
	Country           string    `json:"country"`
	Timezone          string    `json:"timezone"`
	DefaultCurrency   string    `json:"default_currency"`
	NotificationEmail string    `json:"notification_email"`
	BusinessName      string    `json:"business_name"`
	Industry          string    `json:"industry"`
	EmployeeCount     int       `json:"employee_count"`
	CompanyStage      string    `json:"company_stage"`
	PrimaryGoal       string    `json:"primary_goal"`
	PrimaryUseCase    string    `json:"primary_use_case"`
	Website           string    `json:"website"`
}

type OnboardingAIRecommendation struct {
	Features        []string `json:"features"`
	Apps            []string `json:"apps"`
	Workflows       []string `json:"workflows"`
	DashboardLayout string   `json:"dashboard_layout"`
	DefaultView     string   `json:"default_view"`
	Summary         string   `json:"summary"`
	Reasoning       string   `json:"reasoning"`
}

type openAIChatCompletionResponse struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (s *Service) GenerateOnboardingRecommendations(ctx context.Context, input OnboardingAIInput) (*OnboardingAIRecommendation, error) {
	if strings.TrimSpace(s.openAI.APIKey) == "" {
		return s.fallbackOnboardingRecommendations(input), nil
	}

	schema := map[string]any{
		"type": "object",
		"properties": map[string]any{
			"features": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "string",
					"enum": []string{"ewa", "social_payments", "treasury", "invoicing", "analytics", "api_access"},
				},
			},
			"apps": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "string",
					"enum": []string{"dashboard", "payments", "social", "developers", "people"},
				},
			},
			"workflows": map[string]any{
				"type": "array",
				"items": map[string]any{
					"type": "string",
					"enum": []string{"auto_reconcile", "smart_sweep", "kyc_auto", "scheduled_payouts", "social_goal_automation"},
				},
			},
			"dashboard_layout": map[string]any{
				"type": "string",
				"enum": []string{"full_platform", "social_focused", "ewa_focused", "developer_focused"},
			},
			"default_view": map[string]any{
				"type": "string",
				"enum": []string{"overview_dashboard", "social_dashboard", "employee_dashboard", "developer_dashboard"},
			},
			"summary": map[string]any{
				"type": "string",
			},
			"reasoning": map[string]any{
				"type": "string",
			},
		},
		"required":             []string{"features", "apps", "workflows", "dashboard_layout", "default_view", "summary", "reasoning"},
		"additionalProperties": false,
	}

	userPrompt := fmt.Sprintf(
		`Recommend an onboarding configuration for Corridor.
Business profile:
- account_type: %s
- country: %s
- timezone: %s
- default_currency: %s
- business_name: %s
- industry: %s
- employee_count: %d
- company_stage: %s
- primary_goal: %s
- primary_use_case: %s
- website: %s

Rules:
- Return only the JSON object matching the schema.
- Prefer a compact but useful workspace.
- If the use case is API integration, prioritize developer tools.
- If the use case is EWA, prioritize people/payroll/workflow automation.
- If the use case is social payments or crowdfunding, prioritize social workflows.
- If the business is growth-stage or enterprise, include treasury and analytics.
- Keep the dashboard layout and default view aligned with the primary use case.
`,
		normalizeForPrompt(input.AccountType),
		normalizeForPrompt(input.Country),
		normalizeForPrompt(input.Timezone),
		normalizeForPrompt(input.DefaultCurrency),
		normalizeForPrompt(input.BusinessName),
		normalizeForPrompt(input.Industry),
		input.EmployeeCount,
		normalizeForPrompt(input.CompanyStage),
		normalizeForPrompt(input.PrimaryGoal),
		normalizeForPrompt(input.PrimaryUseCase),
		normalizeForPrompt(input.Website),
	)

	payload := map[string]any{
		"model":       s.openAI.Model,
		"temperature": 0.2,
		"messages": []map[string]any{
			{
				"role":    "system",
				"content": "You are Corridor's onboarding orchestrator. Produce recommendations that are directly usable by the product and obey the provided JSON schema.",
			},
			{
				"role":    "user",
				"content": userPrompt,
			},
		},
		"response_format": map[string]any{
			"type": "json_schema",
			"json_schema": map[string]any{
				"name":   "onboarding_recommendations",
				"strict": true,
				"schema": schema,
			},
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, strings.TrimRight(s.openAI.BaseURL, "/")+"/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+s.openAI.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return s.fallbackOnboardingRecommendations(input), nil
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return s.fallbackOnboardingRecommendations(input), nil
	}

	var completion openAIChatCompletionResponse
	if err := json.NewDecoder(resp.Body).Decode(&completion); err != nil {
		return s.fallbackOnboardingRecommendations(input), nil
	}
	if len(completion.Choices) == 0 {
		return s.fallbackOnboardingRecommendations(input), nil
	}

	content := strings.TrimSpace(completion.Choices[0].Message.Content)
	if content == "" {
		return s.fallbackOnboardingRecommendations(input), nil
	}

	var recommendation OnboardingAIRecommendation
	if err := json.Unmarshal([]byte(content), &recommendation); err != nil {
		return s.fallbackOnboardingRecommendations(input), nil
	}
	if len(recommendation.Features) == 0 || len(recommendation.Apps) == 0 || len(recommendation.Workflows) == 0 {
		return s.fallbackOnboardingRecommendations(input), nil
	}

	return &recommendation, nil
}

func (s *Service) fallbackOnboardingRecommendations(input OnboardingAIInput) *OnboardingAIRecommendation {
	useCase := strings.ToLower(strings.TrimSpace(input.PrimaryUseCase))
	stage := strings.ToLower(strings.TrimSpace(input.CompanyStage))

	features := []string{"invoicing"}
	apps := []string{"dashboard", "payments"}
	workflows := []string{"scheduled_payouts", "auto_reconcile"}
	layout := "full_platform"
	defaultView := "overview_dashboard"
	reasoning := "Fallback recommendation used because the AI service was unavailable."

	switch useCase {
	case "api_partner":
		features = append(features, "api_access", "analytics")
		apps = append(apps, "developers")
		workflows = append(workflows, "kyc_auto")
		layout = "developer_focused"
		defaultView = "developer_dashboard"
		reasoning = "API integrations should lead with developer tools, API access, and operational visibility."
	case "ewa_only":
		features = append(features, "ewa", "analytics")
		apps = append(apps, "people")
		workflows = append(workflows, "kyc_auto")
		layout = "ewa_focused"
		defaultView = "employee_dashboard"
		reasoning = "EWA teams need payroll, employee management, and automated verification workflows."
	case "social_only":
		features = append(features, "social_payments")
		apps = append(apps, "social")
		workflows = append(workflows, "social_goal_automation")
		layout = "social_focused"
		defaultView = "social_dashboard"
		reasoning = "Social payments work best when the workspace foregrounds campaigns, contributions, and sharing."
	default:
		features = append(features, "social_payments", "ewa")
		apps = append(apps, "social", "people")
		workflows = append(workflows, "social_goal_automation", "kyc_auto")
	}

	if stage == "growth" || stage == "enterprise" {
		features = append(features, "treasury", "analytics")
		workflows = append(workflows, "smart_sweep")
	}

	features = uniqueStrings(features)
	apps = uniqueStrings(apps)
	workflows = uniqueStrings(workflows)

	return &OnboardingAIRecommendation{
		Features:        features,
		Apps:            apps,
		Workflows:       workflows,
		DashboardLayout: layout,
		DefaultView:     defaultView,
		Summary:         "Fallback recommendation generated locally.",
		Reasoning:       reasoning,
	}
}

func normalizeForPrompt(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "unspecified"
	}
	return value
}

func uniqueStrings(values []string) []string {
	seen := make(map[string]struct{}, len(values))
	result := make([]string, 0, len(values))
	for _, value := range values {
		normalized := strings.TrimSpace(value)
		if normalized == "" {
			continue
		}
		if _, ok := seen[normalized]; ok {
			continue
		}
		seen[normalized] = struct{}{}
		result = append(result, normalized)
	}
	return result
}
