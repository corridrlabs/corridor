package core

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type AdminPage[T any] struct {
	Items   []T  `json:"items"`
	Page    int  `json:"page"`
	Limit   int  `json:"limit"`
	Total   int  `json:"total"`
	HasMore bool `json:"has_more"`
}

type AdminAccountDetail struct {
	AdminAccountSummary
	SubscriptionExpires *time.Time                `json:"subscription_expires_at,omitempty"`
	OnboardingCompleted bool                      `json:"onboarding_completed"`
	OnboardingData      any                       `json:"onboarding_data,omitempty"`
	Settings            map[string]any            `json:"settings,omitempty"`
	Wallets             []AdminWalletSummary      `json:"wallets"`
	RecentTransactions  []AdminTransactionSummary `json:"recent_transactions,omitempty"`
}

type AdminTransactionDetail struct {
	AdminTransactionSummary
	Fee                float64        `json:"fee"`
	OnchainTxHash      string         `json:"onchain_tx_hash,omitempty"`
	Visibility         string         `json:"visibility,omitempty"`
	SplitType          string         `json:"split_type,omitempty"`
	TotalAmount        float64        `json:"total_amount,omitempty"`
	SettledAt          *time.Time     `json:"settled_at,omitempty"`
	Context            map[string]any `json:"context,omitempty"`
	SenderAccountID    string         `json:"sender_account_id,omitempty"`
	RecipientAccountID string         `json:"recipient_account_id,omitempty"`
}

type AdminActionApproval struct {
	ID               uuid.UUID      `json:"id"`
	ActionType       string         `json:"action_type"`
	EntityType       string         `json:"entity_type,omitempty"`
	EntityID         string         `json:"entity_id,omitempty"`
	RequestedByID    uuid.UUID      `json:"requested_by_id"`
	RequestedByEmail string         `json:"requested_by_email,omitempty"`
	ApprovedByID     *uuid.UUID     `json:"approved_by_id,omitempty"`
	Status           string         `json:"status"`
	Payload          map[string]any `json:"payload,omitempty"`
	RejectionReason  string         `json:"rejection_reason,omitempty"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	ApprovedAt       *time.Time     `json:"approved_at,omitempty"`
	RejectedAt       *time.Time     `json:"rejected_at,omitempty"`
	ExecutedAt       *time.Time     `json:"executed_at,omitempty"`
}

func normalizeAdminPagination(page, limit, defaultLimit, maxLimit int) (int, int) {
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

func adminPageOffset(page, limit int) int {
	if page <= 1 {
		return 0
	}
	return (page - 1) * limit
}

func jsonMapFromBytes(raw []byte) map[string]any {
	if len(raw) == 0 {
		return map[string]any{}
	}
	var out map[string]any
	if err := json.Unmarshal(raw, &out); err != nil || out == nil {
		return map[string]any{}
	}
	return out
}

func adminTextSearch(query string) string {
	q := strings.TrimSpace(strings.ToLower(query))
	if q == "" {
		return "%"
	}
	return "%" + q + "%"
}

func (s *Service) adminDoubleApprovalEnabled(ctx context.Context) bool {
	enabled, err := s.IsFeatureFlagEnabled(ctx, "admin_double_approval")
	return err == nil && enabled
}

func (s *Service) ListAdminAccountsPage(ctx context.Context, query string, page, limit int) (*AdminPage[AdminAccountSummary], error) {
	page, limit = normalizeAdminPagination(page, limit, 25, 100)
	q := adminTextSearch(query)
	offset := adminPageOffset(page, limit)

	rows, err := s.db.Pool.Query(ctx, `
		WITH filtered AS (
			SELECT a.id, a.email, COALESCE(a.full_name, ''), COALESCE(a.username, ''),
			       COALESCE(a.account_type::text, 'PERSONAL'), COALESCE(a.account_status, 'ACTIVE'),
			       COALESCE(a.user_tier, 'FREE'), COALESCE(a.subscription_status, 'inactive'),
			       COALESCE(a.whatsapp_phone, ''), COALESCE(a.country, ''), COALESCE(a.wallet_address, ''),
			       COALESCE(COUNT(w.id), 0), COALESCE(SUM(w.balance), 0), a.created_at
			FROM accounts a
			LEFT JOIN wallets w ON w.account_id = a.id
			WHERE lower(a.email) LIKE $1
			   OR lower(a.full_name) LIKE $1
			   OR lower(COALESCE(a.username, '')) LIKE $1
			   OR lower(COALESCE(a.whatsapp_phone, '')) LIKE $1
			   OR lower(COALESCE(a.wallet_address, '')) LIKE $1
			   OR EXISTS (
			      SELECT 1 FROM wallets ww
			      WHERE ww.account_id = a.id
			        AND lower(COALESCE(ww.chain_address, '')) LIKE $1
			   )
			GROUP BY a.id
		)
		SELECT id, email, full_name, username, account_type, account_status, user_tier, subscription_status,
		       whatsapp_phone, country, wallet_address, wallet_count, total_wallet_balance, created_at,
		       COUNT(*) OVER() AS total_count
		FROM filtered
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, q, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resp := &AdminPage[AdminAccountSummary]{Page: page, Limit: limit}
	for rows.Next() {
		var item AdminAccountSummary
		var totalCount int
		if err := rows.Scan(&item.ID, &item.Email, &item.FullName, &item.Username, &item.AccountType, &item.AccountStatus, &item.UserTier, &item.SubscriptionStatus, &item.WhatsappPhone, &item.Country, &item.WalletAddress, &item.WalletCount, &item.TotalWalletBalance, &item.CreatedAt, &totalCount); err != nil {
			return nil, err
		}
		resp.Items = append(resp.Items, item)
		resp.Total = totalCount
	}
	resp.HasMore = resp.Page*resp.Limit < resp.Total
	return resp, nil
}

func (s *Service) GetAdminAccountDetail(ctx context.Context, accountID uuid.UUID) (*AdminAccountDetail, error) {
	var detail AdminAccountDetail
	var settingsJSON []byte
	var onboardingData []byte
	var subscriptionExpires sql.NullTime

	err := s.db.Pool.QueryRow(ctx, `
		SELECT a.id, a.email, COALESCE(a.full_name, ''), COALESCE(a.username, ''),
		       COALESCE(a.account_type::text, 'PERSONAL'), COALESCE(a.account_status, 'ACTIVE'),
		       COALESCE(a.user_tier, 'FREE'), COALESCE(a.subscription_status, 'inactive'),
		       a.subscription_expires_at, COALESCE(a.whatsapp_phone, ''), COALESCE(a.country, ''),
		       COALESCE(a.wallet_address, ''), COALESCE(COUNT(w.id), 0), COALESCE(SUM(w.balance), 0),
		       COALESCE(a.onboarding_completed, false), COALESCE(a.onboarding_data, '{}'::jsonb),
		       COALESCE(a.settings, '{}'::jsonb), a.created_at
		FROM accounts a
		LEFT JOIN wallets w ON w.account_id = a.id
		WHERE a.id = $1
		GROUP BY a.id
	`, accountID).Scan(
		&detail.ID, &detail.Email, &detail.FullName, &detail.Username, &detail.AccountType, &detail.AccountStatus,
		&detail.UserTier, &detail.SubscriptionStatus, &subscriptionExpires, &detail.WhatsappPhone, &detail.Country,
		&detail.WalletAddress, &detail.WalletCount, &detail.TotalWalletBalance, &detail.OnboardingCompleted,
		&onboardingData, &settingsJSON, &detail.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	if subscriptionExpires.Valid {
		detail.SubscriptionExpires = &subscriptionExpires.Time
	}
	if len(onboardingData) > 0 {
		_ = json.Unmarshal(onboardingData, &detail.OnboardingData)
	}
	detail.Settings = jsonMapFromBytes(settingsJSON)

	walletRows, err := s.db.Pool.Query(ctx, `
		SELECT w.id, w.account_id, COALESCE(a.full_name, ''), COALESCE(a.email, ''),
		       w.type::text, w.currency::text, w.balance, COALESCE(w.chain_address, ''), COALESCE(w.chain_network, ''), COALESCE(w.is_primary, false), w.created_at
		FROM wallets w
		JOIN accounts a ON a.id = w.account_id
		WHERE w.account_id = $1
		ORDER BY w.created_at DESC
	`, accountID)
	if err == nil {
		defer walletRows.Close()
		for walletRows.Next() {
			var wallet AdminWalletSummary
			if err := walletRows.Scan(&wallet.ID, &wallet.AccountID, &wallet.AccountName, &wallet.Email, &wallet.Type, &wallet.Currency, &wallet.Balance, &wallet.ChainAddress, &wallet.ChainNetwork, &wallet.IsPrimary, &wallet.CreatedAt); err == nil {
				detail.Wallets = append(detail.Wallets, wallet)
			}
		}
	}

	txRows, err := s.db.Pool.Query(ctx, `
		SELECT t.id, COALESCE(t.context->>'reference', ''), COALESCE(t.provider_tx_id, ''),
		       COALESCE(sa.full_name, COALESCE(sa.email, '')), COALESCE(ra.full_name, COALESCE(ra.email, '')),
		       COALESCE(t.sender_wallet_id::text, ''), COALESCE(t.recipient_wallet_id::text, ''),
		       t.amount, t.currency::text, t.status::text, COALESCE(t.message, ''), t.created_at
		FROM transactions t
		LEFT JOIN wallets sw ON sw.id = t.sender_wallet_id
		LEFT JOIN accounts sa ON sa.id = sw.account_id
		LEFT JOIN wallets rw ON rw.id = t.recipient_wallet_id
		LEFT JOIN accounts ra ON ra.id = rw.account_id
		WHERE sw.account_id = $1 OR rw.account_id = $1
		ORDER BY t.created_at DESC
		LIMIT 5
	`, accountID)
	if err == nil {
		defer txRows.Close()
		for txRows.Next() {
			var tx AdminTransactionSummary
			if err := txRows.Scan(&tx.ID, &tx.Reference, &tx.ProviderTxID, &tx.SenderName, &tx.RecipientName, &tx.SenderWalletID, &tx.RecipientWalletID, &tx.Amount, &tx.Currency, &tx.Status, &tx.Message, &tx.CreatedAt); err == nil {
				detail.RecentTransactions = append(detail.RecentTransactions, tx)
			}
		}
	}

	return &detail, nil
}

func (s *Service) SearchAdminTransactionsPage(ctx context.Context, query string, page, limit int) (*AdminPage[AdminTransactionSummary], error) {
	page, limit = normalizeAdminPagination(page, limit, 25, 100)
	q := adminTextSearch(query)
	offset := adminPageOffset(page, limit)

	rows, err := s.db.Pool.Query(ctx, `
		WITH filtered AS (
			SELECT t.id, COALESCE(t.context->>'reference', ''), COALESCE(t.provider_tx_id, ''),
			       COALESCE(sa.full_name, COALESCE(sa.email, '')), COALESCE(ra.full_name, COALESCE(ra.email, '')),
			       COALESCE(t.sender_wallet_id::text, ''), COALESCE(t.recipient_wallet_id::text, ''),
			       t.amount, t.currency::text, t.status::text, COALESCE(t.message, ''), t.created_at
			FROM transactions t
			LEFT JOIN wallets sw ON sw.id = t.sender_wallet_id
			LEFT JOIN accounts sa ON sa.id = sw.account_id
			LEFT JOIN wallets rw ON rw.id = t.recipient_wallet_id
			LEFT JOIN accounts ra ON ra.id = rw.account_id
			WHERE lower(t.id::text) LIKE $1
			   OR lower(COALESCE(t.provider_tx_id, '')) LIKE $1
			   OR lower(COALESCE(t.message, '')) LIKE $1
			   OR lower(COALESCE(t.context->>'reference', '')) LIKE $1
			   OR lower(COALESCE(sa.full_name, sa.email, '')) LIKE $1
			   OR lower(COALESCE(ra.full_name, ra.email, '')) LIKE $1
		)
		SELECT id, reference, provider_tx_id, sender_name, recipient_name, sender_wallet_id, recipient_wallet_id,
		       amount, currency, status, message, created_at, COUNT(*) OVER() AS total_count
		FROM filtered
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, q, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resp := &AdminPage[AdminTransactionSummary]{Page: page, Limit: limit}
	for rows.Next() {
		var item AdminTransactionSummary
		var totalCount int
		if err := rows.Scan(&item.ID, &item.Reference, &item.ProviderTxID, &item.SenderName, &item.RecipientName, &item.SenderWalletID, &item.RecipientWalletID, &item.Amount, &item.Currency, &item.Status, &item.Message, &item.CreatedAt, &totalCount); err != nil {
			return nil, err
		}
		resp.Items = append(resp.Items, item)
		resp.Total = totalCount
	}
	resp.HasMore = resp.Page*resp.Limit < resp.Total
	return resp, nil
}

func (s *Service) GetAdminTransactionDetail(ctx context.Context, transactionID uuid.UUID) (*AdminTransactionDetail, error) {
	var detail AdminTransactionDetail
	var contextJSON []byte
	var settledAt sql.NullTime
	err := s.db.Pool.QueryRow(ctx, `
		SELECT t.id, COALESCE(t.context->>'reference', ''), COALESCE(t.provider_tx_id, ''),
		       COALESCE(sa.full_name, COALESCE(sa.email, '')), COALESCE(ra.full_name, COALESCE(ra.email, '')),
		       COALESCE(t.sender_wallet_id::text, ''), COALESCE(t.recipient_wallet_id::text, ''),
		       t.amount, t.currency::text, t.status::text, COALESCE(t.message, ''), t.created_at,
		       COALESCE(t.fee, 0), COALESCE(t.onchain_tx_hash, ''), COALESCE(t.visibility::text, ''),
		       COALESCE(t.split_type, ''), COALESCE(t.total_amount, 0), t.settled_at,
		       COALESCE(t.context, '{}'::jsonb)
		FROM transactions t
		LEFT JOIN wallets sw ON sw.id = t.sender_wallet_id
		LEFT JOIN accounts sa ON sa.id = sw.account_id
		LEFT JOIN wallets rw ON rw.id = t.recipient_wallet_id
		LEFT JOIN accounts ra ON ra.id = rw.account_id
		WHERE t.id = $1
	`, transactionID).Scan(
		&detail.ID, &detail.Reference, &detail.ProviderTxID, &detail.SenderName, &detail.RecipientName, &detail.SenderWalletID, &detail.RecipientWalletID,
		&detail.Amount, &detail.Currency, &detail.Status, &detail.Message, &detail.CreatedAt, &detail.Fee, &detail.OnchainTxHash, &detail.Visibility,
		&detail.SplitType, &detail.TotalAmount, &settledAt, &contextJSON,
	)
	if err != nil {
		return nil, err
	}
	if settledAt.Valid {
		detail.SettledAt = &settledAt.Time
	}
	detail.Context = jsonMapFromBytes(contextJSON)
	return &detail, nil
}

func (s *Service) ListAdminWalletsPage(ctx context.Context, query string, page, limit int) (*AdminPage[AdminWalletSummary], error) {
	page, limit = normalizeAdminPagination(page, limit, 25, 200)
	q := adminTextSearch(query)
	offset := adminPageOffset(page, limit)

	rows, err := s.db.Pool.Query(ctx, `
		WITH filtered AS (
			SELECT w.id, w.account_id, COALESCE(a.full_name, ''), COALESCE(a.email, ''),
			       w.type::text, w.currency::text, w.balance, COALESCE(w.chain_address, ''), COALESCE(w.chain_network, ''), COALESCE(w.is_primary, false), w.created_at
			FROM wallets w
			JOIN accounts a ON a.id = w.account_id
			WHERE lower(a.full_name) LIKE $1
			   OR lower(a.email) LIKE $1
			   OR lower(COALESCE(w.chain_address, '')) LIKE $1
			   OR lower(COALESCE(w.chain_network, '')) LIKE $1
			   OR lower(w.id::text) LIKE $1
		)
		SELECT id, account_id, account_name, email, type, currency, balance, chain_address, chain_network, is_primary, created_at,
		       COUNT(*) OVER() AS total_count
		FROM filtered
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, q, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resp := &AdminPage[AdminWalletSummary]{Page: page, Limit: limit}
	for rows.Next() {
		var item AdminWalletSummary
		var totalCount int
		if err := rows.Scan(&item.ID, &item.AccountID, &item.AccountName, &item.Email, &item.Type, &item.Currency, &item.Balance, &item.ChainAddress, &item.ChainNetwork, &item.IsPrimary, &item.CreatedAt, &totalCount); err != nil {
			return nil, err
		}
		resp.Items = append(resp.Items, item)
		resp.Total = totalCount
	}
	resp.HasMore = resp.Page*resp.Limit < resp.Total
	return resp, nil
}

func (s *Service) ListAdminSweepsPage(ctx context.Context, query string, page, limit int) (*AdminPage[AdminRevenueSweep], error) {
	page, limit = normalizeAdminPagination(page, limit, 25, 100)
	q := adminTextSearch(query)
	offset := adminPageOffset(page, limit)

	rows, err := s.db.Pool.Query(ctx, `
		WITH filtered AS (
			SELECT rs.id, rs.revenue_account_id, COALESCE(ra.name, ''), rs.amount, COALESCE(rs.bank_details, '{}'::jsonb), rs.status, rs.created_at
			FROM revenue_sweeps rs
			LEFT JOIN revenue_accounts ra ON ra.id = rs.revenue_account_id
			WHERE lower(COALESCE(ra.name, '')) LIKE $1
			   OR lower(rs.id::text) LIKE $1
			   OR lower(rs.status) LIKE $1
		)
		SELECT id, revenue_account_id, revenue_account_name, amount, bank_details, status, created_at, COUNT(*) OVER() AS total_count
		FROM filtered
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, q, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resp := &AdminPage[AdminRevenueSweep]{Page: page, Limit: limit}
	for rows.Next() {
		var item AdminRevenueSweep
		var bankDetails []byte
		var totalCount int
		if err := rows.Scan(&item.ID, &item.RevenueAccountID, &item.RevenueAccount, &item.Amount, &bankDetails, &item.Status, &item.CreatedAt, &totalCount); err != nil {
			return nil, err
		}
		item.BankDetails = jsonMapFromBytes(bankDetails)
		resp.Items = append(resp.Items, item)
		resp.Total = totalCount
	}
	resp.HasMore = resp.Page*resp.Limit < resp.Total
	return resp, nil
}

func (s *Service) ListAdminAuditLogsPage(ctx context.Context, query string, page, limit int) (*AdminPage[AdminAuditLogEntry], error) {
	page, limit = normalizeAdminPagination(page, limit, 50, 200)
	q := adminTextSearch(query)
	offset := adminPageOffset(page, limit)

	rows, err := s.db.Pool.Query(ctx, `
		WITH filtered AS (
			SELECT l.id, l.actor_id, COALESCE(a.email, ''), l.action, COALESCE(l.entity_type, ''), COALESCE(l.entity_id, ''),
			       COALESCE(l.metadata, '{}'::jsonb), COALESCE(l.ip_address, ''), COALESCE(l.user_agent, ''), l.created_at
			FROM system_audit_logs l
			LEFT JOIN accounts a ON a.id = l.actor_id
			WHERE lower(COALESCE(a.email, '')) LIKE $1
			   OR lower(l.action) LIKE $1
			   OR lower(COALESCE(l.entity_type, '')) LIKE $1
			   OR lower(COALESCE(l.entity_id, '')) LIKE $1
			   OR lower(COALESCE(l.ip_address, '')) LIKE $1
		)
		SELECT id, actor_id, actor_email, action, entity_type, entity_id, metadata, ip_address, user_agent, created_at, COUNT(*) OVER() AS total_count
		FROM filtered
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, q, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resp := &AdminPage[AdminAuditLogEntry]{Page: page, Limit: limit}
	for rows.Next() {
		var entry AdminAuditLogEntry
		var actorID uuid.NullUUID
		var metadata []byte
		var totalCount int
		if err := rows.Scan(&entry.ID, &actorID, &entry.ActorEmail, &entry.Action, &entry.EntityType, &entry.EntityID, &metadata, &entry.IPAddress, &entry.UserAgent, &entry.CreatedAt, &totalCount); err != nil {
			return nil, err
		}
		if actorID.Valid {
			id := actorID.UUID
			entry.ActorID = &id
		}
		entry.Metadata = jsonMapFromBytes(metadata)
		resp.Items = append(resp.Items, entry)
		resp.Total = totalCount
	}
	resp.HasMore = resp.Page*resp.Limit < resp.Total
	return resp, nil
}

func (s *Service) ListAdminApprovalsPage(ctx context.Context, status string, page, limit int) (*AdminPage[AdminActionApproval], error) {
	page, limit = normalizeAdminPagination(page, limit, 25, 100)
	status = strings.ToUpper(strings.TrimSpace(status))
	if status == "" {
		status = "%"
	}
	offset := adminPageOffset(page, limit)

	rows, err := s.db.Pool.Query(ctx, `
		WITH filtered AS (
			SELECT p.id, p.action_type, COALESCE(p.entity_type, ''), COALESCE(p.entity_id, ''),
			       p.requested_by, COALESCE(req.email, ''), p.approved_by, COALESCE(p.status, 'PENDING'),
			       COALESCE(p.payload, '{}'::jsonb), COALESCE(p.rejection_reason, ''), p.created_at, p.updated_at,
			       p.approved_at, p.rejected_at, p.executed_at
			FROM admin_action_approvals p
			LEFT JOIN accounts req ON req.id = p.requested_by
			WHERE upper(COALESCE(p.status, 'PENDING')) LIKE $1
		)
		SELECT id, action_type, entity_type, entity_id, requested_by, requested_by_email, approved_by, status,
		       payload, rejection_reason, created_at, updated_at, approved_at, rejected_at, executed_at,
		       COUNT(*) OVER() AS total_count
		FROM filtered
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, status, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	resp := &AdminPage[AdminActionApproval]{Page: page, Limit: limit}
	for rows.Next() {
		var item AdminActionApproval
		var approvedBy uuid.NullUUID
		var payload []byte
		var totalCount int
		var approvedAt, rejectedAt, executedAt sql.NullTime
		if err := rows.Scan(&item.ID, &item.ActionType, &item.EntityType, &item.EntityID, &item.RequestedByID, &item.RequestedByEmail, &approvedBy, &item.Status, &payload, &item.RejectionReason, &item.CreatedAt, &item.UpdatedAt, &approvedAt, &rejectedAt, &executedAt, &totalCount); err != nil {
			return nil, err
		}
		if approvedBy.Valid {
			id := approvedBy.UUID
			item.ApprovedByID = &id
		}
		if approvedAt.Valid {
			item.ApprovedAt = &approvedAt.Time
		}
		if rejectedAt.Valid {
			item.RejectedAt = &rejectedAt.Time
		}
		if executedAt.Valid {
			item.ExecutedAt = &executedAt.Time
		}
		item.Payload = jsonMapFromBytes(payload)
		resp.Items = append(resp.Items, item)
		resp.Total = totalCount
	}
	resp.HasMore = resp.Page*resp.Limit < resp.Total
	return resp, nil
}

func (s *Service) QueueAdminActionApproval(ctx context.Context, requestedBy uuid.UUID, actionType, entityType, entityID string, payload map[string]any) (*AdminActionApproval, error) {
	if requestedBy == uuid.Nil {
		return nil, fmt.Errorf("missing requester")
	}
	if strings.TrimSpace(actionType) == "" {
		return nil, fmt.Errorf("action type is required")
	}

	approval := &AdminActionApproval{
		ID:            uuid.New(),
		ActionType:    strings.TrimSpace(actionType),
		EntityType:    strings.TrimSpace(entityType),
		EntityID:      strings.TrimSpace(entityID),
		RequestedByID: requestedBy,
		Status:        "PENDING",
		Payload:       payload,
		CreatedAt:     time.Now().UTC(),
		UpdatedAt:     time.Now().UTC(),
	}

	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO admin_action_approvals (
			id, action_type, entity_type, entity_id, requested_by, status, payload, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6::jsonb, NOW(), NOW())
	`, approval.ID, approval.ActionType, approval.EntityType, approval.EntityID, approval.RequestedByID, jsonbString(payload))
	if err != nil {
		return nil, err
	}
	return approval, nil
}

func (s *Service) applyAdminApproval(ctx context.Context, approval *AdminActionApproval, approverID uuid.UUID) error {
	switch approval.ActionType {
	case "tier_change":
		accountID, err := uuid.Parse(fmt.Sprint(approval.Payload["account_id"]))
		if err != nil {
			return fmt.Errorf("invalid account id")
		}
		tier := fmt.Sprint(approval.Payload["tier"])
		return s.UpdateAdminAccountTier(ctx, accountID, tier)
	case "status_change":
		accountID, err := uuid.Parse(fmt.Sprint(approval.Payload["account_id"]))
		if err != nil {
			return fmt.Errorf("invalid account id")
		}
		status := fmt.Sprint(approval.Payload["status"])
		return s.UpdateAdminAccountStatus(ctx, accountID, status)
	case "wallet_adjustment":
		accountID, err := uuid.Parse(fmt.Sprint(approval.Payload["account_id"]))
		if err != nil {
			return fmt.Errorf("invalid account id")
		}
		walletID, err := uuid.Parse(fmt.Sprint(approval.Payload["wallet_id"]))
		if err != nil {
			return fmt.Errorf("invalid wallet id")
		}
		amount, _ := approval.Payload["amount"].(float64)
		direction := fmt.Sprint(approval.Payload["direction"])
		memo := fmt.Sprint(approval.Payload["memo"])
		return s.AdjustAdminWalletBalance(ctx, accountID, walletID, amount, direction, memo, approverID)
	case "sweep_execute":
		sweepID, err := uuid.Parse(fmt.Sprint(approval.Payload["sweep_id"]))
		if err != nil {
			return fmt.Errorf("invalid sweep id")
		}
		return s.ExecuteSweep(ctx, sweepID)
	case "fx_override":
		pair := fmt.Sprint(approval.Payload["pair"])
		rate, _ := approval.Payload["rate"].(float64)
		source := fmt.Sprint(approval.Payload["source"])
		isOverride, _ := approval.Payload["is_override"].(bool)
		return s.UpsertFXOverride(ctx, pair, rate, source, isOverride)
	default:
		return fmt.Errorf("unsupported approval action")
	}
}

func (s *Service) ApproveAdminAction(ctx context.Context, approvalID, approverID uuid.UUID) (*AdminActionApproval, error) {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var approval AdminActionApproval
	var payload []byte
	var approvedBy uuid.NullUUID
	var approvedAt, rejectedAt, executedAt sql.NullTime
	err = tx.QueryRow(ctx, `
		SELECT id, action_type, COALESCE(entity_type, ''), COALESCE(entity_id, ''), requested_by, approved_by,
		       COALESCE(status, 'PENDING'), COALESCE(payload, '{}'::jsonb), COALESCE(rejection_reason, ''),
		created_at, updated_at, approved_at, rejected_at, executed_at
		FROM admin_action_approvals
		WHERE id = $1
		FOR UPDATE
	`, approvalID).Scan(&approval.ID, &approval.ActionType, &approval.EntityType, &approval.EntityID, &approval.RequestedByID, &approvedBy, &approval.Status, &payload, &approval.RejectionReason, &approval.CreatedAt, &approval.UpdatedAt, &approvedAt, &rejectedAt, &executedAt)
	if err != nil {
		return nil, err
	}
	if approvedBy.Valid {
		id := approvedBy.UUID
		approval.ApprovedByID = &id
	}
	if approvedAt.Valid {
		approval.ApprovedAt = &approvedAt.Time
	}
	if rejectedAt.Valid {
		approval.RejectedAt = &rejectedAt.Time
	}
	if executedAt.Valid {
		approval.ExecutedAt = &executedAt.Time
	}
	approval.Payload = jsonMapFromBytes(payload)
	if strings.ToUpper(approval.Status) != "PENDING" {
		return nil, fmt.Errorf("approval is not pending")
	}
	if approverID == approval.RequestedByID {
		return nil, fmt.Errorf("a second admin must approve this action")
	}

	if err := s.applyAdminApproval(ctx, &approval, approverID); err != nil {
		_, _ = tx.Exec(ctx, `
			UPDATE admin_action_approvals
			SET status = 'FAILED', rejection_reason = $2, updated_at = NOW()
			WHERE id = $1
		`, approvalID, err.Error())
		return nil, err
	}

	now := time.Now().UTC()
	_, err = tx.Exec(ctx, `
		UPDATE admin_action_approvals
		SET status = 'APPROVED',
		    approved_by = $2,
		    approved_at = $3,
		    executed_at = $3,
		    updated_at = NOW()
		WHERE id = $1
	`, approvalID, approverID, now)
	if err != nil {
		return nil, err
	}
	approval.Status = "APPROVED"
	approval.ApprovedByID = &approverID
	approval.ApprovedAt = &now
	approval.ExecutedAt = &now
	return &approval, tx.Commit(ctx)
}

func (s *Service) RejectAdminAction(ctx context.Context, approvalID, approverID uuid.UUID, reason string) (*AdminActionApproval, error) {
	if strings.TrimSpace(reason) == "" {
		reason = "rejected by admin"
	}
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE admin_action_approvals
		SET status = 'REJECTED',
		    approved_by = $2,
		    rejection_reason = $3,
		    rejected_at = NOW(),
		    updated_at = NOW()
		WHERE id = $1 AND COALESCE(status, 'PENDING') = 'PENDING'
	`, approvalID, approverID, reason)
	if err != nil {
		return nil, err
	}
	var approval AdminActionApproval
	var payload []byte
	var approvedBy uuid.NullUUID
	var approvedAt, rejectedAt, executedAt sql.NullTime
	err = s.db.Pool.QueryRow(ctx, `
		SELECT id, action_type, COALESCE(entity_type, ''), COALESCE(entity_id, ''), requested_by, approved_by,
		       COALESCE(status, 'PENDING'), COALESCE(payload, '{}'::jsonb), COALESCE(rejection_reason, ''),
		created_at, updated_at, approved_at, rejected_at, executed_at
		FROM admin_action_approvals
		WHERE id = $1
	`, approvalID).Scan(&approval.ID, &approval.ActionType, &approval.EntityType, &approval.EntityID, &approval.RequestedByID, &approvedBy, &approval.Status, &payload, &approval.RejectionReason, &approval.CreatedAt, &approval.UpdatedAt, &approvedAt, &rejectedAt, &executedAt)
	if err != nil {
		return nil, err
	}
	if approvedBy.Valid {
		id := approvedBy.UUID
		approval.ApprovedByID = &id
	}
	if approvedAt.Valid {
		approval.ApprovedAt = &approvedAt.Time
	}
	if rejectedAt.Valid {
		approval.RejectedAt = &rejectedAt.Time
	}
	if executedAt.Valid {
		approval.ExecutedAt = &executedAt.Time
	}
	approval.Payload = jsonMapFromBytes(payload)
	return &approval, nil
}
