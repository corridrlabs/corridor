-- Migration: Add provider_tx_id to transactions table
-- This allows tracking external payment provider IDs (Circle, Helius, Paystack)

ALTER TABLE transactions ADD COLUMN IF NOT EXISTS provider_tx_id VARCHAR(255) UNIQUE;
CREATE INDEX IF NOT EXISTS idx_transactions_provider_tx_id ON transactions(provider_tx_id);
