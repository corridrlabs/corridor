-- Migration: Corridor Admin Portal
-- Adds admin security, audit logging, and system configuration tables.

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'ACTIVE';

CREATE TABLE IF NOT EXISTS system_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address VARCHAR(100),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feature_flags (
    key VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT false,
    payload JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fx_overrides (
    pair VARCHAR(50) PRIMARY KEY,
    rate NUMERIC(20, 8) NOT NULL,
    source VARCHAR(255) DEFAULT '',
    is_override BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_action_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    requested_by UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    approved_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payload JSONB DEFAULT '{}'::jsonb,
    rejection_reason TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO feature_flags (key, name, description, enabled, payload)
VALUES
    ('mpesa_maintenance_mode', 'M-Pesa Maintenance Mode', 'Temporarily disable M-Pesa rail availability', false, '{}'::jsonb),
    ('treasury_controls', 'Treasury Controls', 'Enable treasury desk controls', true, '{}'::jsonb),
    ('admin_portal', 'Admin Portal', 'Master admin command center', true, '{}'::jsonb),
    ('admin_double_approval', 'Admin Double Approval', 'Require second-admin approval for risky actions', false, '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO fx_overrides (pair, rate, source, is_override)
VALUES
    ('USDC_KES', 129.00000000, 'seed', false),
    ('USDC_NGN', 1550.00000000, 'seed', false),
    ('USDC_GHS', 14.00000000, 'seed', false)
ON CONFLICT (pair) DO NOTHING;
