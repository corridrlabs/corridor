package core

import (
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
)

type Withdrawal struct {
	ID                 uuid.UUID `json:"id"`
	AccountID          uuid.UUID `json:"account_id"`
	WalletID           uuid.UUID `json:"wallet_id"`
	Amount             float64   `json:"amount"`
	FeeCharged         float64   `json:"fee_charged"`
	TotalDebited       float64   `json:"total_debited"`
	Currency           string    `json:"currency"`
	DestinationBank    string    `json:"destination_bank"`
	AccountNumberLast4 string    `json:"account_number_last4"`
	AccountName        string    `json:"account_name"`
	Status             string    `json:"status"`
	CreatedAt          time.Time `json:"created_at"`
}

func (s *Service) RequestPayout(ctx context.Context, accountID uuid.UUID, amount float64, currency, bank, accountNum, accountName string) (*Withdrawal, error) {
	// 0. Validate Account Number
	if len(accountNum) < 4 {
		return nil, errors.New("invalid account number: must be at least 4 digits")
	}

	// 1. Start Transaction
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// 2. Get Wallet & Check Balance
	var walletID uuid.UUID
	var balance float64
	err = tx.QueryRow(ctx, "SELECT id, balance FROM wallets WHERE account_id = $1 AND currency = $2 FOR UPDATE", accountID, currency).Scan(&walletID, &balance)
	if err != nil {
		return nil, errors.New("wallet not found or insufficient funds")
	}

	if balance < amount {
		return nil, errors.New("insufficient funds")
	}

	// 2b. Compute platform fee and total debit.
	feeRate, _ := s.GetPayoutFeeRate(ctx, accountID)
	fee := amount * feeRate
	if fee < 0.10 {
		fee = 0.10 // minimum payout fee
	}
	totalDebit := amount + fee
	if balance < totalDebit {
		return nil, fmt.Errorf("insufficient funds to cover payout and fees (required: %.2f)", totalDebit)
	}

	// 3. Debit Wallet
	newBalance := balance - totalDebit
	_, err = tx.Exec(ctx, `UPDATE wallets SET balance = $1 WHERE id = $2`, newBalance, walletID)
	if err != nil {
		return nil, fmt.Errorf("failed to debit wallet: %w", err)
	}

	// 4. Create Withdrawal Record
	last4 := accountNum[len(accountNum)-4:]
	withdrawal := &Withdrawal{
		AccountID:          accountID,
		WalletID:           walletID,
		Amount:             amount,
		FeeCharged:         fee,
		TotalDebited:       totalDebit,
		Currency:           currency,
		DestinationBank:    bank,
		AccountNumberLast4: last4,
		AccountName:        accountName,
		Status:             "PENDING",
	}

	err = tx.QueryRow(ctx, `
		INSERT INTO withdrawals (account_id, wallet_id, amount, currency, destination_bank, account_number_last4, account_name, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING id, created_at
	`, withdrawal.AccountID, withdrawal.WalletID, withdrawal.Amount, withdrawal.Currency, withdrawal.DestinationBank, withdrawal.AccountNumberLast4, withdrawal.AccountName, withdrawal.Status).Scan(&withdrawal.ID, &withdrawal.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create withdrawal record: %w", err)
	}

	// 5. Create Ledger Entry (Branded)
	_, err = tx.Exec(ctx, `
		INSERT INTO ledger_entries (wallet_id, amount, balance_after, description)
		VALUES ($1, $2, $3, $4)
	`, walletID, -totalDebit, newBalance, s.BrandedMessage(ctx, fmt.Sprintf("Payout request to %s ending in %s (fee: %.2f %s)", bank, withdrawal.AccountNumberLast4, fee, currency)))

	if err != nil {
		return nil, fmt.Errorf("failed to create ledger entry: %w", err)
	}

	// 6. Distribute Revenue (Platform Fee)
	if err := s.DistributeRevenue(ctx, fee, currency); err != nil {
		log.Printf("ERROR: Failed to distribute revenue for payout %s: %v", withdrawal.ID, err)
		// We don't rollback the whole payout just because revenue distribution failed, 
		// but in a production system we might want stricter consistency.
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return withdrawal, nil
}

func (s *Service) GetPayouts(ctx context.Context, accountID uuid.UUID) ([]Withdrawal, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, wallet_id, amount, currency, destination_bank, account_number_last4, status, created_at 
		FROM withdrawals 
		WHERE account_id = $1 
		ORDER BY created_at DESC
	`, accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var withdrawals []Withdrawal
	for rows.Next() {
		var w Withdrawal
		if err := rows.Scan(&w.ID, &w.WalletID, &w.Amount, &w.Currency, &w.DestinationBank, &w.AccountNumberLast4, &w.Status, &w.CreatedAt); err != nil {
			return nil, err
		}
		// Historical rows don't store fee fields; keep them 0 in list responses.
		withdrawals = append(withdrawals, w)
	}
	return withdrawals, nil
}
