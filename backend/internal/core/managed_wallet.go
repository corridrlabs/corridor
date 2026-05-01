package core

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/gagliardetto/solana-go"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (s *Service) CreateManagedWallet(ctx context.Context, accountID uuid.UUID) (*ManagedWallet, error) {
	if accountID == uuid.Nil {
		return nil, fmt.Errorf("invalid account id")
	}

	var existing ManagedWallet
	var existingSecret string
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, account_id, wallet_id, public_key, network, encrypted_private_key, created_at
		FROM managed_wallets
		WHERE account_id = $1
	`, accountID).Scan(
		&existing.ID,
		&existing.AccountID,
		&existing.WalletID,
		&existing.PublicKey,
		&existing.Network,
		&existingSecret,
		&existing.CreatedAt,
	)
	if err == nil {
		_, _ = s.db.Pool.Exec(ctx, "UPDATE accounts SET wallet_address = COALESCE(NULLIF(wallet_address, ''), $1) WHERE id = $2", existing.PublicKey, accountID)
		return &existing, nil
	}
	if err != nil && !errors.Is(err, pgx.ErrNoRows) {
		return nil, fmt.Errorf("failed to check managed wallet: %w", err)
	}

	wallet := solana.NewWallet()
	publicKey := wallet.PublicKey().String()
	secretKey := wallet.PrivateKey.String()
	encryptedSecret, err := s.encryptWalletSecret(secretKey)
	if err != nil {
		return nil, fmt.Errorf("failed to encrypt wallet secret: %w", err)
	}

	tx, err := s.db.Pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var walletID uuid.UUID
	err = tx.QueryRow(ctx, `
		INSERT INTO wallets (account_id, type, currency, balance, chain_address, chain_network, is_primary)
		VALUES ($1, 'ONCHAIN_STABLE', 'USDC', 0, $2, $3, true)
		ON CONFLICT (account_id, currency, type) DO UPDATE SET
			chain_address = EXCLUDED.chain_address,
			chain_network = EXCLUDED.chain_network,
			is_primary = true
		RETURNING id
	`, accountID, publicKey, "solana").Scan(&walletID)
	if err != nil {
		return nil, fmt.Errorf("failed to persist on-chain wallet: %w", err)
	}

	var managedID uuid.UUID
	var createdAt time.Time
	err = tx.QueryRow(ctx, `
		INSERT INTO managed_wallets (account_id, wallet_id, public_key, encrypted_private_key, network)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (account_id) DO UPDATE SET
			wallet_id = EXCLUDED.wallet_id,
			public_key = EXCLUDED.public_key,
			encrypted_private_key = EXCLUDED.encrypted_private_key,
			network = EXCLUDED.network,
			updated_at = NOW()
		RETURNING id, created_at
	`, accountID, walletID, publicKey, encryptedSecret, "solana").Scan(&managedID, &createdAt)
	if err != nil {
		return nil, fmt.Errorf("failed to persist managed wallet metadata: %w", err)
	}

	_, err = tx.Exec(ctx, "UPDATE accounts SET wallet_address = $1 WHERE id = $2", publicKey, accountID)
	if err != nil {
		return nil, fmt.Errorf("failed to update account wallet address: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &ManagedWallet{
		ID:        managedID,
		AccountID: accountID,
		WalletID:  walletID,
		PublicKey: publicKey,
		Network:   "solana",
		CreatedAt: createdAt,
	}, nil
}

func (s *Service) GetManagedWallet(ctx context.Context, accountID uuid.UUID) (*ManagedWallet, error) {
	var wallet ManagedWallet
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, account_id, wallet_id, public_key, network, created_at
		FROM managed_wallets
		WHERE account_id = $1
	`, accountID).Scan(
		&wallet.ID,
		&wallet.AccountID,
		&wallet.WalletID,
		&wallet.PublicKey,
		&wallet.Network,
		&wallet.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &wallet, nil
}

func decodeManagedWalletSecret(payload string) ([]byte, error) {
	raw, err := base64.StdEncoding.DecodeString(strings.TrimSpace(payload))
	if err != nil {
		return nil, err
	}
	return raw, nil
}
