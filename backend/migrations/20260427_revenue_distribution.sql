-- Migration: Revenue Distribution & Transaction Branding
-- Handles distributed revenue accounts and branding schema

-- 1. Revenue Accounts (Distributed Ledger)
CREATE TABLE IF NOT EXISTS revenue_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'TREASURY', 'RESERVE', 'STAKING_REWARDS'
    balance DECIMAL(18, 2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Weekly Revenue Sweeps
CREATE TABLE IF NOT EXISTS revenue_sweeps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    revenue_account_id UUID REFERENCES revenue_accounts(id),
    amount DECIMAL(18, 2) NOT NULL,
    bank_details JSONB, -- Bank name, account number, swift
    status VARCHAR(20) DEFAULT 'PENDING', -- 'PENDING', 'PROCESSED', 'FAILED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Revenue Accounts
INSERT INTO revenue_accounts (name) VALUES 
('TREASURY'), ('RESERVE'), ('OPERATIONAL_EXPENSE')
ON CONFLICT (name) DO NOTHING;
