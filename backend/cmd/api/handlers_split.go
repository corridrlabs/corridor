package main

import (
	"encoding/json"
	"net/http"

	"github.com/corridrlabs/corridor/backend/pkg/api"
	"github.com/google/uuid"
)

type CreateSplitRequestData struct {
	Title        string   `json:"title"`
	Description  string   `json:"description"`
	TotalAmount  float64  `json:"total_amount"`
	Currency     string   `json:"currency"`
	ItemLink     string   `json:"item_link"`
	Participants []string `json:"participants"`
}

func (h *Handler) handleSplitAction(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		h.createSplitRequest(w, r)
		return
	}
	h.getSplitRequests(w, r)
}

func (h *Handler) createSplitRequest(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req CreateSplitRequestData
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	split, err := h.svc.CreateSplitRequest(r.Context(), accountID, req.Title, req.Description, req.TotalAmount, req.Currency, req.ItemLink, req.Participants)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusCreated, split)
}

func (h *Handler) getSplitRequests(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	splits, err := h.svc.GetSplitRequestsByAccount(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, splits)
}

func (h *Handler) handleSplitDetail(w http.ResponseWriter, r *http.Request) {
	splitIDStr := r.URL.Query().Get("id")
	splitID, err := uuid.Parse(splitIDStr)
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid split id")
		return
	}

	split, participants, err := h.svc.GetSplitRequest(r.Context(), splitID)
	if err != nil {
		api.RespondWithError(w, http.StatusNotFound, "split request not found")
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"split":        split,
		"participants": participants,
	})
}

func (h *Handler) handlePaySplit(w http.ResponseWriter, r *http.Request) {
	type PayReq struct {
		Token string `json:"token"`
		Email string `json:"email"`
	}

	var req PayReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid request")
		return
	}

	err := h.svc.PaySplitShare(r.Context(), req.Token, req.Email)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]string{"status": "paid"})
}
