package core

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/google/uuid"
)

type Voucher struct {
	ID        uuid.UUID
	AccountID uuid.UUID
	Amount    float64
	Currency  string
	Code      string
	Status    string
	ExpiresAt time.Time
}

// CreateWithdrawalVoucher debits the user's wallet and creates a unique code for fiat withdrawal.
func (s *Service) CreateWithdrawalVoucher(ctx context.Context, accountID uuid.UUID, amount float64, currency string) (*Voucher, error) {
	// 1. Validate Amount
	if amount <= 0 {
		return nil, fmt.Errorf("invalid amount")
	}

	// 2. Generate Secure Code
	bytes := make([]byte, 6)
	if _, err := rand.Read(bytes); err != nil {
		return nil, err
	}
	code := hex.EncodeToString(bytes) // 12 character hex code

	// 3. Process Debit (Internal Lock)
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// In a real system, we might lock a specific "Stablecoin" wallet and convert to Fiat here
	// For the demo, we assume the user has a wallet in the requested currency or we convert it.
	
	// Record Transaction
	_, err = tx.Exec(ctx, `
		INSERT INTO transactions (sender_wallet_id, amount, currency, status, message)
		SELECT id, $1, $2, 'COMPLETED', $3
		FROM wallets WHERE account_id = $4 AND currency = 'USDC'
		LIMIT 1
	`, amount, "USDC", s.BrandedMessage(ctx, fmt.Sprintf("Voucher creation for %s withdrawal", currency)), accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to record voucher debit: %w", err)
	}

	// Create Voucher
	voucher := &Voucher{
		ID:        uuid.New(),
		AccountID: accountID,
		Amount:    amount,
		Currency:  currency,
		Code:      code,
		Status:    "active",
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	err = tx.QueryRow(ctx, `
		INSERT INTO withdrawal_vouchers (id, account_id, amount, currency, code, status, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at
	`, voucher.ID, voucher.AccountID, voucher.Amount, voucher.Currency, voucher.Code, voucher.Status, voucher.ExpiresAt).Scan(&time.Time{})
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return voucher, nil
}

// RedeemVoucher marks a voucher as used. This would be called by an agent API.
func (s *Service) RedeemVoucher(ctx context.Context, code string) (*Voucher, error) {
	var v Voucher
	err := s.db.Pool.QueryRow(ctx, `
		UPDATE withdrawal_vouchers 
		SET status = 'redeemed' 
		WHERE code = $1 AND status = 'active' AND (expires_at > NOW() OR expires_at IS NULL)
		RETURNING id, account_id, amount, currency, code, status
	`, code).Scan(&v.ID, &v.AccountID, &v.Amount, &v.Currency, &v.Code, &v.Status)
	
	if err != nil {
		return nil, fmt.Errorf("voucher not found, already redeemed, or expired")
	}
	
	return &v, nil
}
