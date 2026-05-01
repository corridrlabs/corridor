package main

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/corridrlabs/corridor/backend/internal/core"
)

func (h *Handler) getAccountSettings(w http.ResponseWriter, r *http.Request) {
	accountID, err := getAccountIDFromRequest(r, h.svc)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	account, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(account)
}

func (h *Handler) updateAccountSettings(w http.ResponseWriter, r *http.Request) {
	accountID, err := getAccountIDFromRequest(r, h.svc)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	var req core.UpdateAccountInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	updatedAccount, err := h.svc.UpdateAccountProfile(r.Context(), accountID, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(updatedAccount)
}

func (h *Handler) getAccountFeatureAccess(w http.ResponseWriter, r *http.Request) {
	accountID, err := getAccountIDFromRequest(r, h.svc)
	if err != nil {
		http.Error(w, "unauthorized", http.StatusUnauthorized)
		return
	}

	type featureSpec struct {
		Key          string `json:"key"`
		Label        string `json:"label"`
		RequiredPlan string `json:"required_plan"`
	}

	features := []featureSpec{
		{Key: "invoicing", Label: "Invoice Factory", RequiredPlan: "free"},
		{Key: "payouts", Label: "Mass Payouts", RequiredPlan: "pro"},
		{Key: "treasury", Label: "Treasury Management", RequiredPlan: "premium"},
		{Key: "cards", Label: "Virtual Cards", RequiredPlan: "pro"},
		{Key: "ewa", Label: "EWA Dashboard", RequiredPlan: "pro"},
		{Key: "team", Label: "Team Management", RequiredPlan: "free"},
		{Key: "payroll", Label: "Payroll Processing", RequiredPlan: "pro"},
		{Key: "social_goals", Label: "Global Onboarding", RequiredPlan: "free"},
		{Key: "workflows", Label: "Scoped Workflows", RequiredPlan: "pro"},
		{Key: "api_access", Label: "Developer Sandbox", RequiredPlan: "pro"},
		{Key: "analytics", Label: "Advanced Analytics", RequiredPlan: "premium"},
	}

	response := make(map[string]any, len(features))
	for _, f := range features {
		allowed, _, accessErr := h.svc.HasFeatureAccess(r.Context(), accountID, f.Key)
		if accessErr != nil {
			allowed = strings.EqualFold(f.RequiredPlan, "free")
		}
		response[f.Key] = map[string]any{
			"allowed":       allowed || strings.EqualFold(f.RequiredPlan, "free"),
			"required_plan": f.RequiredPlan,
			"label":         f.Label,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
