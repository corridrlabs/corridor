package core

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
)

type AdminOverview struct {
	TotalTransactionVolume float64             `json:"total_transaction_volume"`
	TreasuryBalance        float64             `json:"treasury_balance"`
	ReserveBalance         float64             `json:"reserve_balance"`
	OpsBalance             float64             `json:"ops_balance"`
	TotalAccounts          int                 `json:"total_accounts"`
	ActiveUsers            int                 `json:"active_users"`
	LockedUsers            int                 `json:"locked_users"`
	TierDistribution       map[string]int      `json:"tier_distribution"`
	PendingSweeps          int                 `json:"pending_sweeps"`
	WalletCount            int                 `json:"wallet_count"`
	RecentRevenueSweeps    []AdminRevenueSweep `json:"recent_revenue_sweeps"`
	SystemHealth           map[string]any      `json:"system_health"`
}

type AdminAccountSummary struct {
	ID                 uuid.UUID `json:"id"`
	Email              string    `json:"email"`
	FullName           string    `json:"full_name"`
	Username           string    `json:"username"`
	AccountType        string    `json:"account_type"`
	AccountStatus      string    `json:"account_status"`
	UserTier           string    `json:"user_tier"`
	SubscriptionStatus string    `json:"subscription_status"`
	WhatsappPhone      string    `json:"whatsapp_phone"`
	Country            string    `json:"country"`
	WalletAddress      string    `json:"wallet_address"`
	WalletCount        int       `json:"wallet_count"`
	TotalWalletBalance float64   `json:"total_wallet_balance"`
	CreatedAt          time.Time `json:"created_at"`
}

type AdminTransactionSummary struct {
	ID                uuid.UUID `json:"id"`
	Reference         string    `json:"reference"`
	ProviderTxID      string    `json:"provider_tx_id"`
	SenderName        string    `json:"sender_name"`
	RecipientName     string    `json:"recipient_name"`
	SenderWalletID    string    `json:"sender_wallet_id"`
	RecipientWalletID string    `json:"recipient_wallet_id"`
	Amount            float64   `json:"amount"`
	Currency          string    `json:"currency"`
	Status            string    `json:"status"`
	Message           string    `json:"message"`
	CreatedAt         time.Time `json:"created_at"`
}

type AdminWalletSummary struct {
	ID           uuid.UUID `json:"id"`
	AccountID    uuid.UUID `json:"account_id"`
	AccountName  string    `json:"account_name"`
	Email        string    `json:"email"`
	Type         string    `json:"type"`
	Currency     string    `json:"currency"`
	Balance      float64   `json:"balance"`
	ChainAddress string    `json:"chain_address"`
	ChainNetwork string    `json:"chain_network"`
	IsPrimary    bool      `json:"is_primary"`
	CreatedAt    time.Time `json:"created_at"`
}

type AdminRevenueSweep struct {
	ID               uuid.UUID      `json:"id"`
	RevenueAccountID uuid.UUID      `json:"revenue_account_id"`
	RevenueAccount   string         `json:"revenue_account_name"`
	Amount           float64        `json:"amount"`
	BankDetails      map[string]any `json:"bank_details"`
	Status           string         `json:"status"`
	CreatedAt        time.Time      `json:"created_at"`
}

type AdminAuditLogEntry struct {
	ID         uuid.UUID      `json:"id"`
	ActorID    *uuid.UUID     `json:"actor_id,omitempty"`
	ActorEmail string         `json:"actor_email,omitempty"`
	Action     string         `json:"action"`
	EntityType string         `json:"entity_type,omitempty"`
	EntityID   string         `json:"entity_id,omitempty"`
	Metadata   map[string]any `json:"metadata,omitempty"`
	IPAddress  string         `json:"ip_address,omitempty"`
	UserAgent  string         `json:"user_agent,omitempty"`
	CreatedAt  time.Time      `json:"created_at"`
}

type FeatureFlag struct {
	Key         string         `json:"key"`
	Name        string         `json:"name"`
	Description string         `json:"description"`
	Enabled     bool           `json:"enabled"`
	Payload     map[string]any `json:"payload,omitempty"`
	UpdatedAt   time.Time      `json:"updated_at"`
}

type FXOverride struct {
	Pair       string    `json:"pair"`
	Rate       float64   `json:"rate"`
	Source     string    `json:"source"`
	IsOverride bool      `json:"is_override"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (s *Service) RecordAuditLog(ctx context.Context, actorID uuid.UUID, action, entityType, entityID string, metadata map[string]any, ipAddress, userAgent string) error {
	if actorID == uuid.Nil {
		return fmt.Errorf("missing actor")
	}
	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO system_audit_logs (actor_id, action, entity_type, entity_id, metadata, ip_address, user_agent)
		VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
	`, actorID, action, entityType, entityID, jsonbString(metadata), ipAddress, userAgent)
	return err
}

func (s *Service) GetAdminOverview(ctx context.Context) (*AdminOverview, error) {
	overview := &AdminOverview{
		TierDistribution: make(map[string]int),
		SystemHealth:     make(map[string]any),
	}

	if err := s.db.Pool.QueryRow(ctx, `
		SELECT 
			COALESCE(SUM(amount) FILTER (WHERE status = 'COMPLETED'), 0),
			COALESCE((SELECT balance FROM revenue_accounts WHERE name = 'TREASURY' LIMIT 1), 0),
			COALESCE((SELECT balance FROM revenue_accounts WHERE name = 'RESERVE' LIMIT 1), 0),
			COALESCE((SELECT balance FROM revenue_accounts WHERE name = 'OPERATIONAL_EXPENSE' LIMIT 1), 0),
			COALESCE((SELECT COUNT(*) FROM accounts), 0),
			COALESCE((SELECT COUNT(*) FROM accounts WHERE COALESCE(account_status, 'ACTIVE') = 'ACTIVE'), 0),
			COALESCE((SELECT COUNT(*) FROM accounts WHERE COALESCE(account_status, 'ACTIVE') IN ('LOCKED', 'SUSPENDED')), 0),
			COALESCE((SELECT COUNT(*) FROM wallets), 0)
		FROM transactions
	`).Scan(&overview.TotalTransactionVolume, &overview.TreasuryBalance, &overview.ReserveBalance, &overview.OpsBalance, &overview.TotalAccounts, &overview.ActiveUsers, &overview.LockedUsers, &overview.WalletCount); err != nil {
		return nil, err
	}

	rows, err := s.db.Pool.Query(ctx, `
		SELECT COALESCE(user_tier, 'FREE') AS tier, COUNT(*)
		FROM accounts
		GROUP BY tier
		ORDER BY tier
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var tier string
			var count int
			if err := rows.Scan(&tier, &count); err == nil {
				overview.TierDistribution[strings.ToUpper(tier)] = count
			}
		}
	}

	overview.PendingSweeps, _ = s.countRevenueSweepsByStatus(ctx, "PENDING")
	sweeps, _ := s.ListRevenueSweeps(ctx, 5)
	overview.RecentRevenueSweeps = sweeps
	overview.SystemHealth = s.GetSystemHealth(ctx)
	return overview, nil
}

func (s *Service) countRevenueSweepsByStatus(ctx context.Context, status string) (int, error) {
	var count int
	err := s.db.Pool.QueryRow(ctx, `SELECT COUNT(*) FROM revenue_sweeps WHERE status = $1`, status).Scan(&count)
	return count, err
}

func (s *Service) SearchAdminAccounts(ctx context.Context, query string, limit int) ([]AdminAccountSummary, error) {
	if limit <= 0 || limit > 100 {
		limit = 25
	}
	q := strings.TrimSpace(query)
	if q == "" {
		q = "%"
	} else {
		q = "%" + strings.ToLower(q) + "%"
	}

	rows, err := s.db.Pool.Query(ctx, `
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
		ORDER BY a.created_at DESC
		LIMIT $2
	`, q, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var accounts []AdminAccountSummary
	for rows.Next() {
		var acc AdminAccountSummary
		if err := rows.Scan(&acc.ID, &acc.Email, &acc.FullName, &acc.Username, &acc.AccountType, &acc.AccountStatus, &acc.UserTier, &acc.SubscriptionStatus, &acc.WhatsappPhone, &acc.Country, &acc.WalletAddress, &acc.WalletCount, &acc.TotalWalletBalance, &acc.CreatedAt); err != nil {
			return nil, err
		}
		accounts = append(accounts, acc)
	}
	return accounts, nil
}

func (s *Service) UpdateAdminAccountTier(ctx context.Context, accountID uuid.UUID, tier string) error {
	tier = strings.ToUpper(strings.TrimSpace(tier))
	if tier == "" {
		return fmt.Errorf("tier is required")
	}
	var expiresAt time.Time
	if tier == "FREE" {
		expiresAt = time.Now().AddDate(1, 0, 0)
	} else {
		expiresAt = time.Now().AddDate(1, 0, 0)
	}
	if err := s.SyncSubscriptionFromPlan(ctx, accountID, tier, "admin-override", "active", &expiresAt); err != nil {
		return err
	}
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE accounts
		SET user_tier = $1, subscription_status = 'active', subscription_expires_at = $2, updated_at = NOW()
		WHERE id = $3
	`, tier, expiresAt, accountID)
	return err
}

func (s *Service) UpdateAdminAccountStatus(ctx context.Context, accountID uuid.UUID, status string) error {
	status = strings.ToUpper(strings.TrimSpace(status))
	switch status {
	case AccountStatusActive, AccountStatusLocked, AccountStatusSuspended:
	default:
		return fmt.Errorf("invalid account status")
	}
	_, err := s.db.Pool.Exec(ctx, `
		UPDATE accounts
		SET account_status = $1, updated_at = NOW()
		WHERE id = $2
	`, status, accountID)
	return err
}

func (s *Service) SearchAdminTransactions(ctx context.Context, query string, limit int) ([]AdminTransactionSummary, error) {
	if limit <= 0 || limit > 100 {
		limit = 25
	}
	q := "%" + strings.ToLower(strings.TrimSpace(query)) + "%"
	if q == "%%" {
		q = "%"
	}
	rows, err := s.db.Pool.Query(ctx, `
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
		ORDER BY t.created_at DESC
		LIMIT $2
	`, q, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txs []AdminTransactionSummary
	for rows.Next() {
		var tx AdminTransactionSummary
		if err := rows.Scan(&tx.ID, &tx.Reference, &tx.ProviderTxID, &tx.SenderName, &tx.RecipientName, &tx.SenderWalletID, &tx.RecipientWalletID, &tx.Amount, &tx.Currency, &tx.Status, &tx.Message, &tx.CreatedAt); err != nil {
			return nil, err
		}
		txs = append(txs, tx)
	}
	return txs, nil
}

func (s *Service) ListAdminWallets(ctx context.Context, limit int) ([]AdminWalletSummary, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	rows, err := s.db.Pool.Query(ctx, `
		SELECT w.id, w.account_id, COALESCE(a.full_name, ''), COALESCE(a.email, ''),
		       w.type::text, w.currency::text, w.balance, COALESCE(w.chain_address, ''), COALESCE(w.chain_network, ''), COALESCE(w.is_primary, false), w.created_at
		FROM wallets w
		JOIN accounts a ON a.id = w.account_id
		ORDER BY w.created_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var wallets []AdminWalletSummary
	for rows.Next() {
		var wallet AdminWalletSummary
		if err := rows.Scan(&wallet.ID, &wallet.AccountID, &wallet.AccountName, &wallet.Email, &wallet.Type, &wallet.Currency, &wallet.Balance, &wallet.ChainAddress, &wallet.ChainNetwork, &wallet.IsPrimary, &wallet.CreatedAt); err != nil {
			return nil, err
		}
		wallets = append(wallets, wallet)
	}
	return wallets, nil
}

func (s *Service) AdjustAdminWalletBalance(ctx context.Context, accountID, walletID uuid.UUID, amount float64, direction, memo string, actorID uuid.UUID) error {
	if amount <= 0 {
		return fmt.Errorf("amount must be greater than zero")
	}
	direction = strings.ToUpper(strings.TrimSpace(direction))
	if direction != "CREDIT" && direction != "DEBIT" {
		return fmt.Errorf("direction must be CREDIT or DEBIT")
	}
	memo = strings.TrimSpace(memo)
	if memo == "" {
		return fmt.Errorf("audit memo is required")
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var currentBalance float64
	var walletOwner uuid.UUID
	if err := tx.QueryRow(ctx, `SELECT balance, account_id FROM wallets WHERE id = $1 FOR UPDATE`, walletID).Scan(&currentBalance, &walletOwner); err != nil {
		return err
	}
	if walletOwner != accountID {
		return fmt.Errorf("wallet does not belong to requested account")
	}

	newBalance := currentBalance + amount
	if direction == "DEBIT" {
		newBalance = currentBalance - amount
		if newBalance < 0 {
			return fmt.Errorf("insufficient balance")
		}
	}

	if _, err := tx.Exec(ctx, `UPDATE wallets SET balance = $1 WHERE id = $2`, newBalance, walletID); err != nil {
		return err
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO ledger_entries (wallet_id, amount, balance_after, description)
		VALUES ($1, $2, $3, $4)
	`, walletID, func() float64 {
		if direction == "DEBIT" {
			return -amount
		}
		return amount
	}(), newBalance, memo); err != nil {
		return err
	}

	var senderID any
	var recipientID any
	if direction == "DEBIT" {
		senderID = walletID
		recipientID = nil
	} else {
		senderID = nil
		recipientID = walletID
	}

	if _, err := tx.Exec(ctx, `
		INSERT INTO transactions (sender_wallet_id, recipient_wallet_id, amount, currency, status, message, context)
		VALUES ($1, $2, $3, (SELECT currency FROM wallets WHERE id = $3), 'COMPLETED', $4, $5::jsonb)
	`, senderID, recipientID, walletID, amount, s.BrandedMessage(ctx, memo), jsonbString(map[string]any{
		"source":    "admin_adjustment",
		"direction": direction,
		"memo":      memo,
		"actor_id":  actorID.String(),
	})); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *Service) ListRevenueSweeps(ctx context.Context, limit int) ([]AdminRevenueSweep, error) {
	if limit <= 0 || limit > 100 {
		limit = 25
	}
	rows, err := s.db.Pool.Query(ctx, `
		SELECT rs.id, rs.revenue_account_id, COALESCE(ra.name, ''), rs.amount, COALESCE(rs.bank_details, '{}'::jsonb), rs.status, rs.created_at
		FROM revenue_sweeps rs
		LEFT JOIN revenue_accounts ra ON ra.id = rs.revenue_account_id
		ORDER BY rs.created_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sweeps []AdminRevenueSweep
	for rows.Next() {
		var sweep AdminRevenueSweep
		var bankDetails []byte
		if err := rows.Scan(&sweep.ID, &sweep.RevenueAccountID, &sweep.RevenueAccount, &sweep.Amount, &bankDetails, &sweep.Status, &sweep.CreatedAt); err != nil {
			return nil, err
		}
		if len(bankDetails) > 0 {
			_ = json.Unmarshal(bankDetails, &sweep.BankDetails)
		}
		sweeps = append(sweeps, sweep)
	}
	return sweeps, nil
}

func (s *Service) ListAuditLogs(ctx context.Context, limit int) ([]AdminAuditLogEntry, error) {
	if limit <= 0 || limit > 200 {
		limit = 50
	}
	rows, err := s.db.Pool.Query(ctx, `
		SELECT l.id, l.actor_id, COALESCE(a.email, ''), l.action, COALESCE(l.entity_type, ''), COALESCE(l.entity_id, ''),
		       COALESCE(l.metadata, '{}'::jsonb), COALESCE(l.ip_address, ''), COALESCE(l.user_agent, ''), l.created_at
		FROM system_audit_logs l
		LEFT JOIN accounts a ON a.id = l.actor_id
		ORDER BY l.created_at DESC
		LIMIT $1
	`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []AdminAuditLogEntry
	for rows.Next() {
		var entry AdminAuditLogEntry
		var actorID uuid.NullUUID
		var metadata []byte
		if err := rows.Scan(&entry.ID, &actorID, &entry.ActorEmail, &entry.Action, &entry.EntityType, &entry.EntityID, &metadata, &entry.IPAddress, &entry.UserAgent, &entry.CreatedAt); err != nil {
			return nil, err
		}
		if actorID.Valid {
			id := actorID.UUID
			entry.ActorID = &id
		}
		if len(metadata) > 0 {
			_ = json.Unmarshal(metadata, &entry.Metadata)
		}
		logs = append(logs, entry)
	}
	return logs, nil
}

func (s *Service) ListFeatureFlags(ctx context.Context) ([]FeatureFlag, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT key, COALESCE(name, ''), COALESCE(description, ''), enabled, COALESCE(payload, '{}'::jsonb), updated_at
		FROM feature_flags
		ORDER BY key ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var flags []FeatureFlag
	for rows.Next() {
		var flag FeatureFlag
		var payload []byte
		if err := rows.Scan(&flag.Key, &flag.Name, &flag.Description, &flag.Enabled, &payload, &flag.UpdatedAt); err != nil {
			return nil, err
		}
		if len(payload) > 0 {
			_ = json.Unmarshal(payload, &flag.Payload)
		}
		flags = append(flags, flag)
	}
	return flags, nil
}

func (s *Service) UpsertFeatureFlag(ctx context.Context, key, name, description string, enabled bool, payload map[string]any) error {
	key = strings.ToLower(strings.TrimSpace(key))
	if key == "" {
		return fmt.Errorf("feature flag key is required")
	}
	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO feature_flags (key, name, description, enabled, payload)
		VALUES ($1, $2, $3, $4, $5::jsonb)
		ON CONFLICT (key) DO UPDATE SET
			name = EXCLUDED.name,
			description = EXCLUDED.description,
			enabled = EXCLUDED.enabled,
			payload = EXCLUDED.payload,
			updated_at = NOW()
	`, key, name, description, enabled, jsonbString(payload))
	return err
}

func (s *Service) IsFeatureFlagEnabled(ctx context.Context, key string) (bool, error) {
	var enabled bool
	err := s.db.Pool.QueryRow(ctx, `SELECT enabled FROM feature_flags WHERE key = $1`, strings.ToLower(strings.TrimSpace(key))).Scan(&enabled)
	if err != nil {
		return false, err
	}
	return enabled, nil
}

func (s *Service) ListFXOverrides(ctx context.Context) ([]FXOverride, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT pair, rate, COALESCE(source, ''), COALESCE(is_override, true), updated_at
		FROM fx_overrides
		ORDER BY pair ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var overrides []FXOverride
	for rows.Next() {
		var item FXOverride
		if err := rows.Scan(&item.Pair, &item.Rate, &item.Source, &item.IsOverride, &item.UpdatedAt); err != nil {
			return nil, err
		}
		overrides = append(overrides, item)
	}
	return overrides, nil
}

func (s *Service) UpsertFXOverride(ctx context.Context, pair string, rate float64, source string, isOverride bool) error {
	pair = strings.ToUpper(strings.TrimSpace(pair))
	if pair == "" {
		return fmt.Errorf("pair is required")
	}
	if rate <= 0 {
		return fmt.Errorf("rate must be greater than zero")
	}
	_, err := s.db.Pool.Exec(ctx, `
		INSERT INTO fx_overrides (pair, rate, source, is_override)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (pair) DO UPDATE SET
			rate = EXCLUDED.rate,
			source = EXCLUDED.source,
			is_override = EXCLUDED.is_override,
			updated_at = NOW()
	`, pair, rate, source, isOverride)
	return err
}

func (s *Service) GetSystemHealth(ctx context.Context) map[string]any {
	health := map[string]any{}
	if err := s.db.Pool.Ping(ctx); err != nil {
		health["database"] = "down"
	} else {
		health["database"] = "healthy"
	}
	if s.redis != nil {
		if err := s.redis.Ping(ctx).Err(); err != nil {
			health["redis"] = "down"
		} else {
			health["redis"] = "healthy"
		}
	}
	health["circle"] = map[string]any{
		"configured": s.circle != nil,
	}
	health["solana"] = map[string]any{
		"configured":    s.solanaConfig.MasterWallet != "",
		"ws_configured": s.solanaConfig.WSURL != "",
	}
	health["billing_engine"] = map[string]any{
		"native":                    true,
		"hosted_checkout_available": true,
	}
	if enabled, err := s.IsFeatureFlagEnabled(ctx, "admin_double_approval"); err == nil {
		health["admin_double_approval"] = enabled
	}
	health["intersend"] = map[string]any{
		"configured": s.intersend.FromEmail != "",
	}
	return health
}

func (s *Service) lookupFXOverride(ctx context.Context, pair string) (float64, bool) {
	var rate float64
	err := s.db.Pool.QueryRow(ctx, `SELECT rate FROM fx_overrides WHERE pair = $1 AND is_override = true`, strings.ToUpper(strings.TrimSpace(pair))).Scan(&rate)
	if err != nil {
		return 0, false
	}
	return rate, true
}
