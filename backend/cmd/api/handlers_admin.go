package main

import (
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/corridrlabs/corridor/backend/internal/core"
	"github.com/google/uuid"
)

func (h *Handler) AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		acc, err := h.ensureAdminAccount(r)
		if err != nil || acc == nil {
			http.Error(w, "Administrative access required", http.StatusForbidden)
			return
		}
		next.ServeHTTP(w, r)
	}
}

func (h *Handler) ensureAdminAccount(r *http.Request) (*core.Account, error) {
	accountID := getAccountID(r.Context())
	if accountID == uuid.Nil {
		return nil, errors.New("admin required")
	}
	acc, err := h.svc.GetAccountByID(r.Context(), accountID)
	if err != nil {
		return nil, err
	}
	if !acc.IsAdmin() {
		return nil, errors.New("admin required")
	}
	return acc, nil
}

func adminActorIP(r *http.Request) string {
	for _, header := range []string{"X-Forwarded-For", "X-Real-IP"} {
		if raw := strings.TrimSpace(r.Header.Get(header)); raw != "" {
			if idx := strings.Index(raw, ","); idx >= 0 {
				return strings.TrimSpace(raw[:idx])
			}
			return raw
		}
	}
	host := strings.TrimSpace(r.RemoteAddr)
	if idx := strings.LastIndex(host, ":"); idx > 0 {
		return host[:idx]
	}
	return host
}

func (h *Handler) recordAdminAction(r *http.Request, actorID uuid.UUID, action, entityType, entityID string, metadata map[string]any) {
	if err := h.svc.RecordAuditLog(r.Context(), actorID, action, entityType, entityID, metadata, adminActorIP(r), r.UserAgent()); err != nil {
		log.Printf("admin audit log failed: %v", err)
	}
}

func (h *Handler) adminDoubleApprovalEnabled(r *http.Request) bool {
	enabled, err := h.svc.IsFeatureFlagEnabled(r.Context(), "admin_double_approval")
	return err == nil && enabled
}

func (h *Handler) queueOrApplyAdminAction(w http.ResponseWriter, r *http.Request, acc *core.Account, actionType, entityType, entityID string, payload map[string]any, apply func() error) bool {
	if h.adminDoubleApprovalEnabled(r) {
		approval, err := h.svc.QueueAdminActionApproval(r.Context(), acc.ID, actionType, entityType, entityID, payload)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return true
		}
		h.recordAdminAction(r, acc.ID, "admin_action_approval_requested", entityType, entityID, map[string]any{
			"action_type": actionType,
			"approval_id": approval.ID.String(),
		})
		writeJSON(w, http.StatusAccepted, map[string]any{
			"status":   "pending_approval",
			"approval": approval,
		})
		return true
	}
	if err := apply(); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return true
	}
	return false
}

func parsePageLimit(r *http.Request, defaultLimit, maxLimit int) (int, int) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	if page <= 0 {
		page = 1
	}
	if limit <= 0 {
		limit = defaultLimit
	}
	if limit > maxLimit {
		limit = maxLimit
	}
	return page, limit
}

func (h *Handler) handleGetAdminOverview(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}

	overview, err := h.svc.GetAdminOverview(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.recordAdminAction(r, acc.ID, "admin_overview_viewed", "system", "", map[string]any{
		"route": "/api/v1/admin/overview",
	})
	writeJSON(w, http.StatusOK, overview)
}

func (h *Handler) handleGetAdminRevenueStats(w http.ResponseWriter, r *http.Request) {
	overview, err := h.svc.GetAdminOverview(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"treasury_balance": overview.TreasuryBalance,
		"reserve_balance":  overview.ReserveBalance,
		"ops_balance":      overview.OpsBalance,
		"total_volume":     overview.TotalTransactionVolume,
	})
}

func (h *Handler) handleSearchAdminUsers(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}

	query := r.URL.Query().Get("query")
	page, limit := parsePageLimit(r, 25, 100)
	users, err := h.svc.ListAdminAccountsPage(r.Context(), query, page, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.recordAdminAction(r, acc.ID, "admin_users_searched", "account", query, map[string]any{"query": query, "page": page, "limit": limit})
	writeJSON(w, http.StatusOK, users)
}

func (h *Handler) handleGetAdminUserDetail(w http.ResponseWriter, r *http.Request) {
	_, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}

	userID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid account id", http.StatusBadRequest)
		return
	}
	detail, err := h.svc.GetAdminAccountDetail(r.Context(), userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, detail)
}

func (h *Handler) handleUpdateAdminUserTier(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}

	userID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid account id", http.StatusBadRequest)
		return
	}

	var req struct {
		Tier string `json:"tier"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	payload := map[string]any{"account_id": userID.String(), "tier": req.Tier}
	if h.queueOrApplyAdminAction(w, r, acc, "tier_change", "account", userID.String(), payload, func() error {
		return h.svc.UpdateAdminAccountTier(r.Context(), userID, req.Tier)
	}) {
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_user_tier_updated", "account", userID.String(), map[string]any{"tier": req.Tier})
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleUpdateAdminUserStatus(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}

	userID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid account id", http.StatusBadRequest)
		return
	}

	var req struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	payload := map[string]any{"account_id": userID.String(), "status": req.Status}
	if h.queueOrApplyAdminAction(w, r, acc, "status_change", "account", userID.String(), payload, func() error {
		return h.svc.UpdateAdminAccountStatus(r.Context(), userID, req.Status)
	}) {
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_user_status_updated", "account", userID.String(), map[string]any{"status": req.Status})
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleSearchAdminTransactions(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}

	query := r.URL.Query().Get("query")
	page, limit := parsePageLimit(r, 25, 100)
	rows, err := h.svc.SearchAdminTransactionsPage(r.Context(), query, page, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	h.recordAdminAction(r, acc.ID, "admin_transactions_searched", "transaction", query, map[string]any{"query": query, "page": page, "limit": limit})
	writeJSON(w, http.StatusOK, rows)
}

func (h *Handler) handleGetAdminTransactionDetail(w http.ResponseWriter, r *http.Request) {
	_, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}

	txID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid transaction id", http.StatusBadRequest)
		return
	}
	detail, err := h.svc.GetAdminTransactionDetail(r.Context(), txID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}
	writeJSON(w, http.StatusOK, detail)
}

func (h *Handler) handleListAdminWallets(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	query := r.URL.Query().Get("query")
	page, limit := parsePageLimit(r, 25, 200)
	wallets, err := h.svc.ListAdminWalletsPage(r.Context(), query, page, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_wallets_viewed", "wallet", "", map[string]any{"query": query, "page": page, "limit": limit})
	writeJSON(w, http.StatusOK, wallets)
}

func (h *Handler) handleAdjustAdminWalletBalance(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}

	var req struct {
		AccountID string  `json:"account_id"`
		WalletID  string  `json:"wallet_id"`
		Amount    float64 `json:"amount"`
		Direction string  `json:"direction"`
		Memo      string  `json:"memo"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	accountID, err := uuid.Parse(req.AccountID)
	if err != nil {
		http.Error(w, "invalid account id", http.StatusBadRequest)
		return
	}
	walletID, err := uuid.Parse(req.WalletID)
	if err != nil {
		http.Error(w, "invalid wallet id", http.StatusBadRequest)
		return
	}

	payload := map[string]any{
		"account_id": accountID.String(),
		"wallet_id":  walletID.String(),
		"amount":     req.Amount,
		"direction":  req.Direction,
		"memo":       req.Memo,
	}
	if h.queueOrApplyAdminAction(w, r, acc, "wallet_adjustment", "wallet", walletID.String(), payload, func() error {
		return h.svc.AdjustAdminWalletBalance(r.Context(), accountID, walletID, req.Amount, req.Direction, req.Memo, acc.ID)
	}) {
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_wallet_adjusted", "wallet", walletID.String(), map[string]any{
		"account_id": accountID.String(),
		"amount":     req.Amount,
		"direction":  req.Direction,
		"memo":       req.Memo,
	})
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleListAdminRevenueSweeps(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	query := r.URL.Query().Get("query")
	page, limit := parsePageLimit(r, 25, 100)
	sweeps, err := h.svc.ListAdminSweepsPage(r.Context(), query, page, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_revenue_sweeps_viewed", "revenue_sweep", "", map[string]any{"query": query, "page": page, "limit": limit})
	writeJSON(w, http.StatusOK, sweeps)
}

func (h *Handler) handleAdminExecuteSweep(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}

	var body struct {
		SweepID uuid.UUID `json:"sweep_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	payload := map[string]any{"sweep_id": body.SweepID.String()}
	if h.queueOrApplyAdminAction(w, r, acc, "sweep_execute", "revenue_sweep", body.SweepID.String(), payload, func() error {
		return h.svc.ExecuteSweep(r.Context(), body.SweepID)
	}) {
		return
	}

	h.recordAdminAction(r, acc.ID, "admin_sweep_executed", "revenue_sweep", body.SweepID.String(), map[string]any{
		"sweep_id": body.SweepID.String(),
	})
	writeJSON(w, http.StatusAccepted, map[string]string{"status": "processing"})
}

func (h *Handler) handleCreateRevenueSweep(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}

	var req struct {
		AccountName string                 `json:"account_name"`
		Amount      float64                `json:"amount"`
		BankDetails map[string]interface{} `json:"bank_details"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	sweep, err := h.svc.CreateRevenueSweep(r.Context(), req.AccountName, req.Amount, req.BankDetails)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_revenue_sweep_created", "revenue_sweep", sweep.ID.String(), map[string]any{
		"account_name": req.AccountName,
		"amount":       req.Amount,
	})
	writeJSON(w, http.StatusCreated, sweep)
}

func (h *Handler) handleListAdminAuditLogs(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	query := r.URL.Query().Get("query")
	page, limit := parsePageLimit(r, 50, 200)
	logs, err := h.svc.ListAdminAuditLogsPage(r.Context(), query, page, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_audit_logs_viewed", "audit_log", "", map[string]any{"query": query, "page": page, "limit": limit})
	writeJSON(w, http.StatusOK, logs)
}

func (h *Handler) handleListAdminApprovals(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	page, limit := parsePageLimit(r, 25, 100)
	status := r.URL.Query().Get("status")
	approvals, err := h.svc.ListAdminApprovalsPage(r.Context(), status, page, limit)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_approvals_viewed", "admin_action_approval", "", map[string]any{"status": status, "page": page, "limit": limit})
	writeJSON(w, http.StatusOK, approvals)
}

func (h *Handler) handleApproveAdminApproval(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	approvalID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid approval id", http.StatusBadRequest)
		return
	}
	approval, err := h.svc.ApproveAdminAction(r.Context(), approvalID, acc.ID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_action_approval_approved", "admin_action_approval", approvalID.String(), map[string]any{
		"action_type": approval.ActionType,
	})
	writeJSON(w, http.StatusOK, approval)
}

func (h *Handler) handleRejectAdminApproval(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	approvalID, err := uuid.Parse(r.PathValue("id"))
	if err != nil {
		http.Error(w, "invalid approval id", http.StatusBadRequest)
		return
	}
	var body struct {
		Reason string `json:"reason"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	approval, err := h.svc.RejectAdminAction(r.Context(), approvalID, acc.ID, body.Reason)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_action_approval_rejected", "admin_action_approval", approvalID.String(), map[string]any{
		"action_type": approval.ActionType,
		"reason":      body.Reason,
	})
	writeJSON(w, http.StatusOK, approval)
}

func (h *Handler) handleListAdminFeatureFlags(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	flags, err := h.svc.ListFeatureFlags(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_feature_flags_viewed", "feature_flag", "", nil)
	writeJSON(w, http.StatusOK, flags)
}

func (h *Handler) handleUpdateAdminFeatureFlag(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	var req struct {
		Key         string         `json:"key"`
		Name        string         `json:"name"`
		Description string         `json:"description"`
		Enabled     bool           `json:"enabled"`
		Payload     map[string]any `json:"payload"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if err := h.svc.UpsertFeatureFlag(r.Context(), req.Key, req.Name, req.Description, req.Enabled, req.Payload); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_feature_flag_updated", "feature_flag", req.Key, map[string]any{
		"enabled": req.Enabled,
	})
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleListAdminFXOverrides(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	overrides, err := h.svc.ListFXOverrides(r.Context())
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_fx_overrides_viewed", "fx_override", "", nil)
	writeJSON(w, http.StatusOK, overrides)
}

func (h *Handler) handleUpdateAdminFXOverride(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	var req struct {
		Pair       string  `json:"pair"`
		Rate       float64 `json:"rate"`
		Source     string  `json:"source"`
		IsOverride bool    `json:"is_override"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}

	payload := map[string]any{
		"pair":        req.Pair,
		"rate":        req.Rate,
		"source":      req.Source,
		"is_override": req.IsOverride,
	}
	if h.queueOrApplyAdminAction(w, r, acc, "fx_override", "fx_override", req.Pair, payload, func() error {
		return h.svc.UpsertFXOverride(r.Context(), req.Pair, req.Rate, req.Source, req.IsOverride)
	}) {
		return
	}
	h.recordAdminAction(r, acc.ID, "admin_fx_override_updated", "fx_override", req.Pair, map[string]any{
		"rate":        req.Rate,
		"source":      req.Source,
		"is_override": req.IsOverride,
	})
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (h *Handler) handleGetAdminSystemHealth(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	health := h.svc.GetSystemHealth(r.Context())
	h.recordAdminAction(r, acc.ID, "admin_system_health_viewed", "system", "", nil)
	writeJSON(w, http.StatusOK, health)
}

func (h *Handler) handleExportAdminUsers(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	query := r.URL.Query().Get("query")
	var users []core.AdminAccountSummary
	for page := 1; page < 1000; page++ {
		resp, err := h.svc.ListAdminAccountsPage(r.Context(), query, page, 100)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		users = append(users, resp.Items...)
		if !resp.HasMore {
			break
		}
	}
	h.recordAdminAction(r, acc.ID, "admin_users_exported", "account", "", map[string]any{"query": query})
	writeCSV(w, "admin_users.csv", []string{"id", "email", "full_name", "account_type", "account_status", "user_tier", "whatsapp_phone", "country", "wallet_count", "total_wallet_balance", "created_at"}, func(wr *csv.Writer) error {
		for _, user := range users {
			_ = wr.Write([]string{
				user.ID.String(),
				user.Email,
				user.FullName,
				user.AccountType,
				user.AccountStatus,
				user.UserTier,
				user.WhatsappPhone,
				user.Country,
				strconv.Itoa(user.WalletCount),
				fmt.Sprintf("%.2f", user.TotalWalletBalance),
				user.CreatedAt.Format(time.RFC3339),
			})
		}
		return nil
	})
}

func (h *Handler) handleExportAdminTransactions(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	query := r.URL.Query().Get("query")
	var items []core.AdminTransactionSummary
	for page := 1; page < 1000; page++ {
		resp, err := h.svc.SearchAdminTransactionsPage(r.Context(), query, page, 100)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, resp.Items...)
		if !resp.HasMore {
			break
		}
	}
	h.recordAdminAction(r, acc.ID, "admin_transactions_exported", "transaction", "", map[string]any{"query": query})
	writeCSV(w, "admin_transactions.csv", []string{"id", "reference", "provider_tx_id", "sender_name", "recipient_name", "amount", "currency", "status", "message", "created_at"}, func(wr *csv.Writer) error {
		for _, tx := range items {
			_ = wr.Write([]string{
				tx.ID.String(),
				tx.Reference,
				tx.ProviderTxID,
				tx.SenderName,
				tx.RecipientName,
				fmt.Sprintf("%.2f", tx.Amount),
				tx.Currency,
				tx.Status,
				tx.Message,
				tx.CreatedAt.Format(time.RFC3339),
			})
		}
		return nil
	})
}

func (h *Handler) handleExportAdminAuditLogs(w http.ResponseWriter, r *http.Request) {
	acc, err := h.ensureAdminAccount(r)
	if err != nil {
		http.Error(w, "Administrative access required", http.StatusForbidden)
		return
	}
	query := r.URL.Query().Get("query")
	var items []core.AdminAuditLogEntry
	for page := 1; page < 1000; page++ {
		resp, err := h.svc.ListAdminAuditLogsPage(r.Context(), query, page, 100)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		items = append(items, resp.Items...)
		if !resp.HasMore {
			break
		}
	}
	h.recordAdminAction(r, acc.ID, "admin_audit_logs_exported", "audit_log", "", map[string]any{"query": query})
	writeCSV(w, "admin_audit_logs.csv", []string{"id", "actor_email", "action", "entity_type", "entity_id", "ip_address", "created_at"}, func(wr *csv.Writer) error {
		for _, entry := range items {
			actor := entry.ActorEmail
			if actor == "" && entry.ActorID != nil {
				actor = entry.ActorID.String()
			}
			_ = wr.Write([]string{
				entry.ID.String(),
				actor,
				entry.Action,
				entry.EntityType,
				entry.EntityID,
				entry.IPAddress,
				entry.CreatedAt.Format(time.RFC3339),
			})
		}
		return nil
	})
}

func writeCSV(w http.ResponseWriter, filename string, headers []string, body func(*csv.Writer) error) {
	w.Header().Set("Content-Type", "text/csv; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf(`attachment; filename="%s"`, filename))
	writer := csv.NewWriter(w)
	_ = writer.Write(headers)
	_ = body(writer)
	writer.Flush()
}
