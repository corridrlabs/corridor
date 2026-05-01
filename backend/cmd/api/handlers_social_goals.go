package main

import (
	"encoding/json"
	"net/http"

	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

type CreateGoalRequest struct {
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
	Currency    string  `json:"currency"`
	IsPublic    bool    `json:"is_public"`
	Template    string  `json:"template,omitempty"`
}

type GoalResponse struct {
	ID          string  `json:"id"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Amount      float64 `json:"amount"`
	Raised      float64 `json:"raised"`
	Currency    string  `json:"currency"`
	IsPublic    bool    `json:"is_public"`
	ShareLink   string  `json:"share_link"`
	Progress    float64 `json:"progress"`
}

func (h *Handler) handleSocialGoals(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.getGoals(w, r)
	case http.MethodPost:
		h.createGoal(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (h *Handler) createGoal(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		http.Error(w, `{"error": "unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req CreateGoalRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "invalid request"}`, http.StatusBadRequest)
		return
	}

	// Apply template defaults
	if req.Template != "" {
		applyTemplate(&req)
	}

	goal, err := h.svc.CreateSocialGoal(r.Context(), accountID, req.Title, req.Description, req.Amount, req.Currency, "", req.IsPublic)
	if err != nil {
		http.Error(w, `{"error": "failed to create goal"}`, http.StatusInternalServerError)
		return
	}

	response := GoalResponse{
		ID:          goal.ID.String(),
		Title:       goal.Title,
		Description: goal.Description,
		Amount:      goal.TargetAmount,
		Raised:      goal.CurrentAmount,
		Currency:    goal.Currency,
		IsPublic:    goal.IsPublic,
		ShareLink:   goal.ShareLink,
		Progress:    (goal.CurrentAmount / goal.TargetAmount) * 100,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) getGoals(w http.ResponseWriter, r *http.Request) {
	publicOnly := r.URL.Query().Get("public") == "true"
	
	goals, err := h.svc.GetPublicGoals(r.Context(), publicOnly)
	if err != nil {
		http.Error(w, `{"error": "failed to fetch goals"}`, http.StatusInternalServerError)
		return
	}

	var responses []GoalResponse
	for _, goal := range goals {
		responses = append(responses, GoalResponse{
			ID:          goal.ID.String(),
			Title:       goal.Title,
			Description: goal.Description,
			Amount:      goal.TargetAmount,
			Raised:      goal.CurrentAmount,
			Currency:    goal.Currency,
			IsPublic:    goal.IsPublic,
			ShareLink:   goal.ShareLink,
			Progress:    (goal.CurrentAmount / goal.TargetAmount) * 100,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(responses)
}

func (h *Handler) handleGoalDetail(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	goalID, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, `{"error": "invalid goal ID"}`, http.StatusBadRequest)
		return
	}

	goal, err := h.svc.GetGoalByID(r.Context(), goalID)
	if err != nil {
		http.Error(w, `{"error": "goal not found"}`, http.StatusNotFound)
		return
	}

	response := GoalResponse{
		ID:          goal.ID.String(),
		Title:       goal.Title,
		Description: goal.Description,
		Amount:      goal.TargetAmount,
		Raised:      goal.CurrentAmount,
		Currency:    goal.Currency,
		IsPublic:    goal.IsPublic,
		ShareLink:   goal.ShareLink,
		Progress:    (goal.CurrentAmount / goal.TargetAmount) * 100,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *Handler) handleContributeGoal(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	vars := mux.Vars(r)
	goalID, err := uuid.Parse(vars["id"])
	if err != nil {
		http.Error(w, `{"error": "invalid goal ID"}`, http.StatusBadRequest)
		return
	}

	var req struct {
		Amount       float64 `json:"amount"`
		Currency     string  `json:"currency"`
		Contributor  string  `json:"contributor"`
		AutoConvert  bool    `json:"auto_convert"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "invalid request"}`, http.StatusBadRequest)
		return
	}

	// Auto-convert currency if needed
	if req.AutoConvert {
		goal, err := h.svc.GetGoalByID(r.Context(), goalID)
		if err != nil {
			http.Error(w, `{"error": "goal not found"}`, http.StatusNotFound)
			return
		}
		req.Amount, err = h.svc.ConvertCurrency(r.Context(), req.Amount, req.Currency, goal.Currency)
		if err != nil {
			http.Error(w, `{"error": "currency conversion failed"}`, http.StatusBadRequest)
			return
		}
		req.Currency = goal.Currency
	}

	contribution, err := h.svc.ContributeToGoal(r.Context(), goalID, req.Contributor, req.Amount, req.Currency)
	if err != nil {
		http.Error(w, `{"error": "contribution failed"}`, http.StatusInternalServerError)
		return
	}

	// Trigger webhook for real-time updates
	go h.svc.TriggerGoalWebhook(goalID, "contribution_added", contribution)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"contribution_id": contribution.ID,
	})
}

func applyTemplate(req *CreateGoalRequest) {
	templates := map[string]struct {
		title       string
		description string
		currency    string
	}{
		"birthday": {
			"Birthday Gift Fund",
			"Help us celebrate with a special gift!",
			"USD",
		},
		"group_gift": {
			"Group Gift Collection",
			"Let's pool together for an amazing gift!",
			"USD",
		},
		"emergency": {
			"Emergency Fund",
			"Support needed for unexpected expenses",
			"USD",
		},
	}

	if template, exists := templates[req.Template]; exists {
		if req.Title == "" {
			req.Title = template.title
		}
		if req.Description == "" {
			req.Description = template.description
		}
		if req.Currency == "" {
			req.Currency = template.currency
		}
	}
}