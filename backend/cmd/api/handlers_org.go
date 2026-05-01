package main

import (
	"encoding/json"
	"net/http"

	"github.com/corridrlabs/corridor/backend/pkg/api"
	"github.com/google/uuid"
)

func (h *Handler) getMyOrganization(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	org, err := h.svc.GetOrganizationByOwner(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	members, err := h.svc.GetOrganizationMembers(r.Context(), org.ID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]interface{}{
		"organization": org,
		"members":      members,
	})
}

func (h *Handler) handleOrgMembersAction(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodPost {
		h.addOrgMember(w, r)
		return
	}
	api.RespondWithError(w, http.StatusMethodNotAllowed, "method not allowed")
}

func (h *Handler) addOrgMember(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	org, err := h.svc.GetOrganizationByOwner(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, "organization not found")
		return
	}

	var req struct {
		Email string `json:"email"`
		Role  string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid request")
		return
	}

	if err := h.svc.AddOrganizationMember(r.Context(), org.ID, req.Email, req.Role); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}

func (h *Handler) removeOrgMember(w http.ResponseWriter, r *http.Request) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		api.RespondWithError(w, http.StatusUnauthorized, "unauthorized")
		return
	}

	org, err := h.svc.GetOrganizationByOwner(r.Context(), accountID)
	if err != nil {
		api.RespondWithError(w, http.StatusInternalServerError, "organization not found")
		return
	}

	memberIDStr := r.URL.Query().Get("id")
	memberID, err := uuid.Parse(memberIDStr)
	if err != nil {
		api.RespondWithError(w, http.StatusBadRequest, "invalid member id")
		return
	}

	if err := h.svc.RemoveOrganizationMember(r.Context(), org.ID, memberID); err != nil {
		api.RespondWithError(w, http.StatusBadRequest, err.Error())
		return
	}

	api.RespondWithJSON(w, http.StatusOK, map[string]bool{"success": true})
}
