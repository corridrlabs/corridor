package core

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"strings"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/google/uuid"
)

type revenueWriter interface {
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
	QueryRow(ctx context.Context, sql string, arguments ...any) pgx.Row
}

type RevenueEventInput struct {
	AccountID  *uuid.UUID
	EventType  string
	SourceType string
	SourceID   string
	Gross      float64
	FeeRate    float64
	FeeAmount  float64
	NetAmount  float64
	Currency   string
	Metadata   map[string]any
}

func roundMoney(value float64) float64 {
	return math.Round(value*1_000_000) / 1_000_000
}

func (s *Service) recordRevenueEvent(ctx context.Context, q revenueWriter, input RevenueEventInput) error {
	if q == nil {
		return fmt.Errorf("missing revenue writer")
	}
	if input.EventType == "" {
		input.EventType = "platform_revenue"
	}
	if input.Currency == "" {
		input.Currency = string(CurrencyUSDC)
	}
	metadata := input.Metadata
	if metadata == nil {
		metadata = map[string]any{}
	}
	metadataJSON, err := json.Marshal(metadata)
	if err != nil {
		return fmt.Errorf("failed to marshal revenue metadata: %w", err)
	}

	_, err = q.Exec(ctx, `
		INSERT INTO revenue_events (
			account_id, event_type, source_type, source_id,
			gross_amount, fee_rate, fee_amount, net_amount, currency, metadata
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
	`, input.AccountID, input.EventType, input.SourceType, input.SourceID,
		roundMoney(input.Gross), roundMoney(input.FeeRate), roundMoney(input.FeeAmount), roundMoney(input.NetAmount), strings.ToUpper(strings.TrimSpace(input.Currency)), metadataJSON)
	if err != nil {
		return fmt.Errorf("failed to record revenue event: %w", err)
	}
	return nil
}

func (s *Service) ensureRevenueWallet(ctx context.Context, q revenueWriter, currency string) (uuid.UUID, error) {
	currency = strings.ToUpper(strings.TrimSpace(currency))
	if currency == "" {
		currency = string(CurrencyUSDC)
	}

	var adminAccountID uuid.UUID
	if err := q.QueryRow(ctx, `
		SELECT id
		FROM accounts
		WHERE account_type = 'ADMIN'
		ORDER BY created_at ASC
		LIMIT 1
	`).Scan(&adminAccountID); err != nil {
		return uuid.Nil, err
	}

	var walletID uuid.UUID
	err := q.QueryRow(ctx, `
		SELECT id
		FROM wallets
		WHERE account_id = $1 AND currency = $2 AND is_primary = true
		LIMIT 1
	`, adminAccountID, currency).Scan(&walletID)
	if err == nil {
		return walletID, nil
	}

	if err := q.QueryRow(ctx, `
		INSERT INTO wallets (account_id, type, currency, balance, is_primary)
		VALUES ($1, 'INTERNAL_FIAT', $2, 0, true)
		RETURNING id
	`, adminAccountID, currency).Scan(&walletID); err != nil {
		return uuid.Nil, err
	}

	return walletID, nil
}

func (s *Service) creditRevenue(ctx context.Context, q revenueWriter, amount float64, currency, memo string, metadata map[string]any) error {
	amount = roundMoney(amount)
	if amount <= 0 {
		return nil
	}

	walletID, err := s.ensureRevenueWallet(ctx, q, currency)
	if err != nil {
		return fmt.Errorf("failed to resolve revenue wallet: %w", err)
	}

	revenueMessage := s.BrandedMessage(ctx, memo)
	if _, err := q.Exec(ctx, `
		UPDATE wallets
		SET balance = balance + $1
		WHERE id = $2
	`, amount, walletID); err != nil {
		return fmt.Errorf("failed to credit revenue wallet: %w", err)
	}

	if _, err := q.Exec(ctx, `
		INSERT INTO transactions (recipient_wallet_id, amount, total_amount, currency, status, message)
		VALUES ($1, $2, $3, $4, 'COMPLETED', $5)
	`, walletID, amount, amount, strings.ToUpper(strings.TrimSpace(currency)), revenueMessage); err != nil {
		return fmt.Errorf("failed to record revenue transaction: %w", err)
	}

	if _, err := q.Exec(ctx, `
		INSERT INTO revenue_accounts (name, balance, currency, updated_at)
		VALUES ('TREASURY', $1, $2, NOW())
		ON CONFLICT (name) DO UPDATE SET
			balance = revenue_accounts.balance + EXCLUDED.balance,
			currency = EXCLUDED.currency,
			updated_at = NOW()
	`, amount, strings.ToUpper(strings.TrimSpace(currency))); err != nil {
		return fmt.Errorf("failed to update treasury balance: %w", err)
	}
	return nil
}

// DistributeRevenue credits platform revenue into the treasury wallet and ledger.
func (s *Service) DistributeRevenue(ctx context.Context, totalFee float64, currency string) error {
	if totalFee <= 0 {
		return nil
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	if err := s.DistributeRevenueTx(ctx, tx, nil, totalFee, currency, "platform", "", map[string]any{
		"source": "platform",
	}); err != nil {
		return err
	}

	return tx.Commit(ctx)
}

func (s *Service) DistributeRevenueTx(ctx context.Context, q revenueWriter, accountID *uuid.UUID, totalFee float64, currency, sourceType, sourceID string, metadata map[string]any) error {
	if totalFee <= 0 {
		return nil
	}

	if err := s.creditRevenue(ctx, q, totalFee, currency, fmt.Sprintf("Platform Revenue: %.2f %s", totalFee, strings.ToUpper(strings.TrimSpace(currency))), metadata); err != nil {
		return err
	}

	return s.recordRevenueEvent(ctx, q, RevenueEventInput{
		AccountID:  accountID,
		EventType:  "platform_revenue",
		SourceType: sourceType,
		SourceID:   sourceID,
		Gross:      totalFee,
		FeeRate:    1,
		FeeAmount:  totalFee,
		NetAmount:  totalFee,
		Currency:   currency,
		Metadata:   metadata,
	})
}
