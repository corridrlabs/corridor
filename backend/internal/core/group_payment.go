package core

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Enhanced group payment support

type GroupPaymentInput struct {
	Senders    []GroupSplitParticipant
	Recipients []GroupSplitParticipant
	TotalAmount float64
	Currency    string
	Message     string
	SplitType   string // "equal_split", "custom_split"
}

type GroupSplitParticipant struct {
	WalletID uuid.UUID
	Amount   float64 // For custom splits
}

// CreateGroupPayment handles many-to-many payments
func (s *Service) CreateGroupPayment(ctx context.Context, input GroupPaymentInput) (*Transaction, error) {
	// Validate split totals
	if input.SplitType == "custom_split" {
		var senderTotal, recipientTotal float64
		for _, s := range input.Senders {
			senderTotal += s.Amount
		}
		for _, r := range input.Recipients {
			recipientTotal += r.Amount
		}
		if senderTotal != input.TotalAmount || recipientTotal != input.TotalAmount {
			return nil, fmt.Errorf("custom split amounts do not match total amount")
		}
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	// Create main transaction record
	var txID uuid.UUID
	err = tx.QueryRow(ctx, `
		INSERT INTO transactions (sender_wallet_id, recipient_wallet_id, amount, currency, status, message, split_type, total_amount)
		VALUES ($1, $2, $3, $4, 'PENDING', $5, $6, $7)
		RETURNING id
	`, input.Senders[0].WalletID, input.Recipients[0].WalletID, input.TotalAmount, input.Currency, input.Message, input.SplitType, input.TotalAmount).Scan(&txID)

	if err != nil {
		return nil, fmt.Errorf("failed to create transaction: %w", err)
	}

	// Create sender splits
	for _, sender := range input.Senders {
		amount := sender.Amount
		if input.SplitType == "equal_split" {
			amount = input.TotalAmount / float64(len(input.Senders))
		}

		// Check balance
		var balance float64
		err := tx.QueryRow(ctx, `SELECT balance FROM wallets WHERE id = $1 FOR UPDATE`, sender.WalletID).Scan(&balance)
		if err != nil {
			return nil, fmt.Errorf("wallet not found: %w", err)
		}
		if balance < amount {
			return nil, fmt.Errorf("insufficient funds in wallet %s", sender.WalletID)
		}

		// Debit sender
		_, err = tx.Exec(ctx, `UPDATE wallets SET balance = balance - $1 WHERE id = $2`, amount, sender.WalletID)
		if err != nil {
			return nil, err
		}

		// Record split
		_, err = tx.Exec(ctx, `
			INSERT INTO transaction_splits (transaction_id, wallet_id, amount, direction, status)
			VALUES ($1, $2, $3, 'sender', 'completed')
		`, txID, sender.WalletID, amount)
		if err != nil {
			return nil, err
		}
	}

	// Create recipient splits
	for _, recipient := range input.Recipients {
		amount := recipient.Amount
		if input.SplitType == "equal_split" {
			amount = input.TotalAmount / float64(len(input.Recipients))
		}

		// Credit recipient
		_, err = tx.Exec(ctx, `UPDATE wallets SET balance = balance + $1 WHERE id = $2`, amount, recipient.WalletID)
		if err != nil {
			return nil, err
		}

		// Record split
		_, err = tx.Exec(ctx, `
			INSERT INTO transaction_splits (transaction_id, wallet_id, amount, direction, status)
			VALUES ($1, $2, $3, 'recipient', 'completed')
		`, txID, recipient.WalletID, amount)
		if err != nil {
			return nil, err
		}
	}

	// Update transaction status
	_, err = tx.Exec(ctx, `UPDATE transactions SET status = 'COMPLETED' WHERE id = $1`, txID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &Transaction{
		ID:                txID,
		SenderWalletID:    input.Senders[0].WalletID,
		RecipientWalletID: input.Recipients[0].WalletID,
		Amount:            input.TotalAmount,
		Currency:          CurrencyCode(input.Currency),
		Status:            TxStatusCompleted,
		Message:           input.Message,
	}, nil
}

// GetTransactionSplits retrieves split details for a transaction
func (s *Service) GetTransactionSplits(ctx context.Context, transactionID uuid.UUID) ([]TransactionSplit, error) {
	rows, err := s.db.Pool.Query(ctx, `
		SELECT id, transaction_id, wallet_id, amount, status, direction, created_at, completed_at
		FROM transaction_splits
		WHERE transaction_id = $1
		ORDER BY created_at ASC
	`, transactionID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var splits []TransactionSplit
	for rows.Next() {
		var split TransactionSplit
		err := rows.Scan(&split.ID, &split.TransactionID, &split.WalletID, &split.Amount, &split.Status, &split.Direction, &split.CreatedAt, &split.CompletedAt)
		if err != nil {
			return nil, err
		}
		splits = append(splits, split)
	}
	return splits, nil
}

type TransactionSplit struct {
	ID            uuid.UUID  `json:"id"`
	TransactionID uuid.UUID  `json:"transaction_id"`
	WalletID      uuid.UUID  `json:"wallet_id"`
	Amount        float64    `json:"amount"`
	Status        string     `json:"status"`
	Direction     string     `json:"direction"`
	CreatedAt     time.Time  `json:"created_at"`
	CompletedAt   *time.Time `json:"completed_at,omitempty"`
}
