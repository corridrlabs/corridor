package main

import (
	"encoding/json"
	"net/http"

	"github.com/corridrlabs/corridor/backend/pkg/api"
	"github.com/google/uuid"
)

type CreateChamaRequest struct {
	Name            string  `json:"name"`
	Description     string  `json:"description"`
	TotalPayoutGoal float64 `json:"total_payout_goal"`
	Currency        string  `json:"currency"`
}

func (h *Handler) handleGetChamas(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	chamas, err := h.svc.GetChamasByAccount(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, "Failed to fetch chamas")
		return
	}

	api.RespondWithJSON(w, http.StatusOK, chamas)
}

func (h *Handler) handleCreateChama(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateChamaRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	if req.Currency == "" {
		req.Currency = "KES"
	}

	chama, err := h.svc.CreateChama(r.Context(), accountID, req.Name, req.Description, req.TotalPayoutGoal, req.Currency)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, "Failed to create chama")
		return
	}

	api.RespondWithJSON(w, http.StatusCreated, chama)
}

func (h *Handler) handleJoinChama(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req struct {
		ChamaID string `json:"chama_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "Invalid request")
		return
	}

	chamaID, err := uuid.Parse(req.ChamaID)
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "Invalid chama ID")
		return
	}

	if err := h.svc.JoinChama(r.Context(), chamaID, accountID); err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, "Failed to join chama")
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}
