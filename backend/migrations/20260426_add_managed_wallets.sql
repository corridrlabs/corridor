-- Migration: 20260426_add_managed_wallets.sql
-- Purpose: add missing managed_wallets table required by POST /api/wallets/managed
-- Safe to run multiple times.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS managed_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL UNIQUE REFERENCES wallets(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    network VARCHAR(50) NOT NULL DEFAULT 'solana',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_managed_wallets_account_id
    ON managed_wallets(account_id);

CREATE INDEX IF NOT EXISTS idx_managed_wallets_wallet_id
    ON managed_wallets(wallet_id);

COMMIT;
