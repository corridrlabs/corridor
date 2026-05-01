package main

import (
	"encoding/json"
	"net/http"

	"github.com/corridrlabs/corridor/backend/internal/core"
	"github.com/google/uuid"
)

type onboardingAIRecommendationRequest struct {
	AccountType       string `json:"account_type"`
	Country           string `json:"country"`
	Timezone          string `json:"timezone"`
	DefaultCurrency   string `json:"default_currency"`
	NotificationEmail string `json:"notification_email"`
	BusinessName      string `json:"business_name"`
	Industry          string `json:"industry"`
	EmployeeCount     int    `json:"employee_count"`
	CompanyStage      string `json:"company_stage"`
	PrimaryGoal       string `json:"primary_goal"`
	PrimaryUseCase    string `json:"primary_use_case"`
	Website           string `json:"website"`
}

func (h *Handler) getOnboardingAIRecommendations(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req onboardingAIRecommendationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	recommendation, err := h.svc.GenerateOnboardingRecommendations(r.Context(), core.OnboardingAIInput{
		AccountID:         accountID,
		AccountType:       req.AccountType,
		Country:           req.Country,
		Timezone:          req.Timezone,
		DefaultCurrency:   req.DefaultCurrency,
		NotificationEmail: req.NotificationEmail,
		BusinessName:      req.BusinessName,
		Industry:          req.Industry,
		EmployeeCount:     req.EmployeeCount,
		CompanyStage:      req.CompanyStage,
		PrimaryGoal:       req.PrimaryGoal,
		PrimaryUseCase:    req.PrimaryUseCase,
		Website:           req.Website,
	})
	if err != nil {
		http.Error(w, "failed to generate AI recommendations", http.StatusBadGateway)
		return
	}

	writeJSON(w, http.StatusOK, recommendation)
}
