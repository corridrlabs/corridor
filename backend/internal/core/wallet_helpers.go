package core

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/corridrlabs/corridor/backend/internal/email"
)

// GetEmailService returns the email service
func (s *Service) GetEmailService() *email.Service {
	return s.email
}

// DebitWallet debits an amount from a wallet with branding
func (s *Service) DebitWallet(ctx context.Context, walletID uuid.UUID, amount float64, message string) error {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var balance float64
	var currency string
	err = tx.QueryRow(ctx, "UPDATE wallets SET balance = balance - $1 WHERE id = $2 AND balance >= $1 RETURNING balance, currency", amount, walletID).Scan(&balance, &currency)
	if err != nil {
		return fmt.Errorf("insufficient funds or wallet not found")
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO transactions (sender_wallet_id, amount, currency, status, message)
		VALUES ($1, $2, $3, 'COMPLETED', $4)
	`, walletID, amount, currency, s.BrandedMessage(ctx, message))
	if err != nil {
		return fmt.Errorf("failed to record debit transaction: %w", err)
	}

	return tx.Commit(ctx)
}

// CreditWallet adds funds to an account's wallet for a specific currency
func (s *Service) CreditWallet(ctx context.Context, accountID uuid.UUID, amount float64, currency string, message string) error {
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx)

	var walletID uuid.UUID
	err = tx.QueryRow(ctx, "SELECT id FROM wallets WHERE account_id = $1 AND currency = $2", accountID, currency).Scan(&walletID)
	if err != nil {
		if strings.EqualFold(currency, "USDC") {
			vault, vaultErr := s.ensureStablecoinVault(ctx, accountID)
			if vaultErr != nil {
				return fmt.Errorf("failed to ensure stablecoin vault: %w", vaultErr)
			}
			walletID = vault.ID
		} else {
			// Create fiat wallet
			err = tx.QueryRow(ctx, `
				INSERT INTO wallets (account_id, type, currency, balance)
				VALUES ($1, 'INTERNAL_FIAT', $2, 0)
				RETURNING id
			`, accountID, currency).Scan(&walletID)
			if err != nil {
				return fmt.Errorf("failed to create wallet: %w", err)
			}
		}
	}

	_, err = tx.Exec(ctx, "UPDATE wallets SET balance = balance + $1 WHERE id = $2", amount, walletID)
	if err != nil {
		return fmt.Errorf("failed to update balance: %w", err)
	}

	_, err = tx.Exec(ctx, `
		INSERT INTO transactions (recipient_wallet_id, amount, currency, status, message)
		VALUES ($1, $2, $3, 'COMPLETED', $4)
	`, walletID, amount, currency, s.BrandedMessage(ctx, message))
	if err != nil {
		return fmt.Errorf("failed to record transaction: %w", err)
	}

	return tx.Commit(ctx)
}
