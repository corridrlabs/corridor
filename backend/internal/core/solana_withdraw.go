package core

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"
)

// WithdrawToSolana transfers USDC from a user's Corridor wallet to an external Solana address.
func (s *Service) WithdrawToSolana(ctx context.Context, accountID uuid.UUID, amount float64, destAddress string) (string, error) {
	// 1. Fee Calculation (Sustainability)
	// Network Transaction Cost: ~0.000005 SOL (negligible) + Rent (negligible)
	// Platform Fee: 0.5% or min $0.10
	fee := amount * 0.005
	if fee < 0.10 {
		fee = 0.10
	}
	totalDeduction := amount + fee

	// 2. Debit User Wallet (Internal Ledger)
	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return "", err
	}
	defer tx.Rollback(ctx)

	var walletID uuid.UUID
	var balance float64
	// Lock wallet
	err = tx.QueryRow(ctx, "SELECT id, balance FROM wallets WHERE account_id = $1 AND currency = 'USDC' FOR UPDATE", accountID).Scan(&walletID, &balance)
	if err != nil {
		return "", fmt.Errorf("wallet not found or error locking: %w", err)
	}

	if balance < totalDeduction {
		return "", fmt.Errorf("insufficient funds (available: %.2f, required: %.2f inclusive of %.2f fee)", balance, totalDeduction, fee)
	}

	// Update Balance
	_, err = tx.Exec(ctx, "UPDATE wallets SET balance = balance - $1 WHERE id = $2", totalDeduction, walletID)
	if err != nil {
		return "", fmt.Errorf("failed to deduct funds: %w", err)
	}

	// Record Ledger Entry
	_, err = tx.Exec(ctx, `
		INSERT INTO transactions (sender_wallet_id, amount, currency, status, message)
		VALUES ($1, $2, 'USDC', 'PENDING', $3)
		RETURNING id
	`, walletID, totalDeduction, s.BrandedMessage(ctx, fmt.Sprintf("Withdrawal to %s (Fee: %.2f)", destAddress, fee)))
	if err != nil {
		return "", err
	}

	if err := tx.Commit(ctx); err != nil {
		return "", err
	}

	// 3. Execute On-Chain Transfer (Actual Logic)
	// We do this AFTER commit to ensure we debited the user first.
	// If this fails, we must refund (or have a background job retry).
	// For "Fast" demo, we do it synchronously.

	log.Printf("Executing On-Chain Solana Transfer: %.2f USDC to %s", amount, destAddress)
	signature, err := s.solanaClient.SendUSDC(ctx, destAddress, amount)
	if err != nil {
		log.Printf("CRITICAL: On-chain transfer failed after debit: %v. Manual refund required for Account %s", err, accountID)
		// Todo: Auto-Refund logic
		return "", fmt.Errorf("on-chain transfer failed, support notified: %w", err)
	}

	// 4. Update Transaction Status (Async best, but here sync)
	// We'd update the 'transactions' table to 'COMPLETED' with signature info.

	return signature, nil
}
