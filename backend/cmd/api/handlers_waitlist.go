package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"github.com/corridrlabs/corridor/backend/internal/core"
	"github.com/google/uuid"
)

func (h *Handler) handleCreateWaitlistEntry(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req core.CreateWaitlistInput
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	entry, err := h.svc.CreateWaitlistEntry(r.Context(), req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	writeJSON(w, http.StatusCreated, entry)
}

func (h *Handler) handleListWaitlistEntries(w http.ResponseWriter, r *http.Request) {
	if _, err := h.ensureAdminAccount(r); err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	query := strings.TrimSpace(r.URL.Query().Get("query"))
	status := strings.TrimSpace(r.URL.Query().Get("status"))
	resp, err := h.svc.ListWaitlistEntries(r.Context(), query, status, page, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, resp)
}

func (h *Handler) handleUpdateWaitlistEntryStatus(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	if r.Method != http.MethodPatch {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	id, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid waitlist id", http.StatusBadRequest)
		return
	}
	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if err := h.svc.UpdateWaitlistStatus(r.Context(), id, req.Status); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_waitlist_status_updated", "waitlist_entry", id.String(), map[string]any{"status": strings.ToUpper(strings.TrimSpace(req.Status))})
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleSendWaitlistCampaign(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Subject      string `json:"subject"`
		Message      string `json:"message"`
		StatusFilter string `json:"status_filter"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	count, err := h.svc.SendWaitlistCampaign(r.Context(), acc.ID, req.Subject, req.Message, req.StatusFilter)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_waitlist_campaign_sent", "waitlist_campaign", "", map[string]any{"subject": req.Subject, "recipient_count": count, "status_filter": req.StatusFilter})
	writeJSON(w, http.StatusOK, map[string]any{"status": "sent", "recipients": count})
}
