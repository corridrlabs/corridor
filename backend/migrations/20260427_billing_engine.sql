-- Migration: Corridor Billing Engine & Generic Bridge
-- This creates the schema for internal subscriptions and fiat/stable tracking

-- 1. Plans (Tiers)
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'FREE', 'PRO', 'ENTERPRISE'
    price DECIMAL(18, 2) NOT NULL DEFAULT 0, -- Monthly price in USDC
    features JSONB DEFAULT '{}', -- feature flags and limits
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'expired'
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id)
);

-- 3. Voucher System (Fiat Out-ramp)
CREATE TABLE IF NOT EXISTS withdrawal_vouchers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id),
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL, -- e.g., 'KES', 'NGN'
    code VARCHAR(12) NOT NULL UNIQUE, -- Secure code for agent withdrawal
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'redeemed', 'expired'
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Initial Plans
INSERT INTO plans (name, price, features) VALUES 
('FREE', 0, '{"api_access": false, "ewa": false, "payouts": true, "max_wallets": 2}'),
('PRO', 49.00, '{"api_access": true, "ewa": true, "payouts": true, "max_wallets": 10, "treasury": true}'),
('PREMIUM', 99.00, '{"api_access": true, "ewa": true, "payouts": true, "max_wallets": 25, "treasury": true, "advanced_controls": true}'),
('ENTERPRISE', 199.00, '{"api_access": true, "ewa": true, "payouts": true, "max_wallets": 50, "treasury": true, "white_label": true}')
ON CONFLICT (name) DO NOTHING;
