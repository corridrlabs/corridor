-- Corridor Supabase schema upsert
-- Idempotent patch for the live Supabase database.
-- Safe to rerun: CREATE TABLE IF NOT EXISTS / ALTER TABLE IF EXISTS / seed ON CONFLICT.

BEGIN;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enum patching
-- -----------------------------------------------------------------------------
ALTER TYPE currency_code ADD VALUE IF NOT EXISTS 'NGN';
ALTER TYPE currency_code ADD VALUE IF NOT EXISTS 'GHS';
ALTER TYPE currency_code ADD VALUE IF NOT EXISTS 'SOL';

-- -----------------------------------------------------------------------------
-- Core account patches
-- -----------------------------------------------------------------------------
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_tier VARCHAR(20) DEFAULT 'FREE';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_id VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'ACTIVE';
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS kyc_id_type VARCHAR(50);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS kyc_id_number VARCHAR(120);
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS kyc_captured_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'accounts_user_tier_check'
    ) THEN
        ALTER TABLE accounts
            ADD CONSTRAINT accounts_user_tier_check
            CHECK (user_tier IN ('FREE', 'PRO', 'PREMIUM'));
    END IF;
END $$;

-- -----------------------------------------------------------------------------
-- Social / goals patches
-- -----------------------------------------------------------------------------
ALTER TABLE social_goals ADD COLUMN IF NOT EXISTS amount NUMERIC(18,2) DEFAULT 0;
ALTER TABLE social_goals ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS chain_address VARCHAR(255);
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS chain_network VARCHAR(50);
ALTER TABLE wallets ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;
ALTER TABLE IF EXISTS invoices ADD COLUMN IF NOT EXISTS reference VARCHAR(255);
ALTER TABLE IF EXISTS invoices ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS marketing_points JSONB DEFAULT '[]'::jsonb;
ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS product_mapping JSONB DEFAULT '{}'::jsonb;

-- -----------------------------------------------------------------------------
-- Tables that are missing in the live database but used by the backend
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    price NUMERIC(20, 6) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    interval VARCHAR(20) DEFAULT 'monthly',
    description TEXT DEFAULT '',
    features JSONB DEFAULT '[]'::jsonb,
    limits JSONB DEFAULT '{}'::jsonb,
    marketing_points JSONB DEFAULT '[]'::jsonb,
    product_mapping JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    number VARCHAR(50) UNIQUE NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    subtotal NUMERIC(20, 6) NOT NULL,
    tax NUMERIC(20, 6) DEFAULT 0,
    total NUMERIC(20, 6) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    reference VARCHAR(255),
    notes TEXT,
    pay_link TEXT,
    payment_session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(20, 6) NOT NULL,
    line_total NUMERIC(20, 6) NOT NULL
);

CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES kyc_submissions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_data BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_submission_id ON kyc_documents(submission_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_account_id ON kyc_documents(account_id);

CREATE TABLE IF NOT EXISTS managed_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL UNIQUE REFERENCES wallets(id) ON DELETE CASCADE,
    public_key TEXT NOT NULL UNIQUE,
    encrypted_private_key TEXT NOT NULL,
    network VARCHAR(50) NOT NULL DEFAULT 'solana',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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

CREATE TABLE IF NOT EXISTS feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    feature VARCHAR(50) NOT NULL,
    usage_date DATE NOT NULL,
    count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, feature, usage_date)
);

CREATE TABLE IF NOT EXISTS processed_events (
    event_id TEXT PRIMARY KEY,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    events TEXT[] NOT NULL,
    secret VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    attempts INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    delivered_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS workflow_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
    step_id VARCHAR(50),
    action_type VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS treasury_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    source_wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    target_wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    sweep_threshold NUMERIC(20,6) NOT NULL DEFAULT 0,
    keep_buffer NUMERIC(20,6) NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(account_id, source_wallet_id)
);

CREATE TABLE IF NOT EXISTS split_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_amount NUMERIC(20,6) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    item_link TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS split_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    split_id UUID NOT NULL REFERENCES split_requests(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    amount NUMERIC(20,6) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'INVITED',
    invite_token VARCHAR(64) NOT NULL UNIQUE,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_handle VARCHAR(100),
    amount NUMERIC(20,6) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    claim_token VARCHAR(128) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pending_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID NOT NULL REFERENCES social_goals(id) ON DELETE CASCADE,
    contributor_name VARCHAR(255) NOT NULL,
    contributor_info JSONB DEFAULT '{}'::jsonb,
    amount NUMERIC(18,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS social_connections (
    follower_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_social_connections_follower_id ON social_connections(follower_id);
CREATE INDEX IF NOT EXISTS idx_social_connections_following_id ON social_connections(following_id);

CREATE TABLE IF NOT EXISTS pending_mpesa_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    wallet_id UUID REFERENCES wallets(id) ON DELETE SET NULL,
    merchant_request_id TEXT NOT NULL,
    checkout_request_id TEXT NOT NULL UNIQUE,
    amount NUMERIC(20,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    phone_number VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    mpesa_receipt VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS mpesa_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_request_id TEXT,
    checkout_request_id TEXT NOT NULL UNIQUE,
    amount NUMERIC(20,2) NOT NULL DEFAULT 0,
    mpesa_receipt_no TEXT,
    transaction_date TEXT,
    phone_number TEXT,
    result_code INTEGER,
    result_desc TEXT,
    status VARCHAR(20) NOT NULL,
    user_id UUID,
    contribution_id UUID,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kyc_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    documents JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    reviewer_id UUID REFERENCES accounts(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount NUMERIC(20,6) NOT NULL,
    fee_charged NUMERIC(20,6) DEFAULT 0,
    total_debited NUMERIC(20,6),
    currency VARCHAR(10) NOT NULL,
    destination_bank VARCHAR(255),
    account_number_last4 VARCHAR(10),
    account_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS onboarding_profiles (
    user_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    intent VARCHAR(50) NOT NULL CHECK (intent IN ('ewa_only', 'social_only', 'full_platform', 'api_partner')),
    current_step VARCHAR(50) NOT NULL CHECK (current_step IN ('welcome', 'use_case', 'business_info', 'payment_setup', 'complete')),
    completed_steps JSONB DEFAULT '[]'::jsonb,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    business_info JSONB DEFAULT '{}'::jsonb,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Public EWA tables currently present in the live DB are left intact.
-- This patch adds the separate legacy ewa schema used by older handlers.
CREATE SCHEMA IF NOT EXISTS ewa;

CREATE TABLE IF NOT EXISTS ewa.org_settings (
    org_id VARCHAR(255) PRIMARY KEY,
    advance_limit DECIMAL(5,2) DEFAULT 50.00,
    pay_frequency VARCHAR(20) DEFAULT 'weekly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ewa.employees (
    id VARCHAR(255) PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    hourly_rate DECIMAL(10,2) NOT NULL,
    bank_verified BOOLEAN DEFAULT FALSE,
    bank_account VARCHAR(255),
    bank_routing VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(org_id, external_id)
);

CREATE TABLE IF NOT EXISTS ewa.attendance (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(255) NOT NULL REFERENCES ewa.employees(id),
    date DATE NOT NULL,
    hours_worked DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS ewa.advances (
    id VARCHAR(255) PRIMARY KEY,
    employee_id VARCHAR(255) NOT NULL REFERENCES ewa.employees(id),
    amount DECIMAL(10,2) NOT NULL,
    earned_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_at TIMESTAMP,
    disbursed_at TIMESTAMP,
    repaid_at TIMESTAMP,
    repayment_due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ewa.erp_integrations (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    system_type VARCHAR(50) NOT NULL,
    api_key_encrypted TEXT,
    config JSONB,
    webhook_secret VARCHAR(255),
    last_sync TIMESTAMP,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ewa.payroll_periods (
    id SERIAL PRIMARY KEY,
    org_id VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    pay_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ewa.repayments (
    id VARCHAR(255) PRIMARY KEY,
    advance_id VARCHAR(255) NOT NULL REFERENCES ewa.advances(id),
    payroll_period_id INTEGER REFERENCES ewa.payroll_periods(id),
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(20) DEFAULT 'payroll_deduction',
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- Indexes
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_feature_usage_account_date ON feature_usage(account_id, usage_date);
CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage(feature);
CREATE INDEX IF NOT EXISTS idx_webhooks_account_id ON webhooks(account_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_execution_id ON workflow_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_treasury_configs_account_id ON treasury_configs(account_id);
CREATE INDEX IF NOT EXISTS idx_split_requests_creator_id ON split_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_split_participants_split_id ON split_participants(split_id);
CREATE INDEX IF NOT EXISTS idx_pending_payments_sender_id ON pending_payments(sender_id);
CREATE INDEX IF NOT EXISTS idx_pending_contributions_goal_id ON pending_contributions(goal_id);
CREATE INDEX IF NOT EXISTS idx_pending_contributions_status ON pending_contributions(status);
CREATE INDEX IF NOT EXISTS idx_pending_mpesa_transactions_checkout_request_id ON pending_mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_checkout_request_id ON mpesa_transactions(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_mpesa_transactions_merchant_request_id ON mpesa_transactions(merchant_request_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_account_id ON kyc_submissions(account_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);
CREATE INDEX IF NOT EXISTS idx_withdrawals_account_id ON withdrawals(account_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_account_id ON subscriptions(account_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_intent ON onboarding_profiles(intent);
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_complete ON onboarding_profiles(is_complete);
CREATE INDEX IF NOT EXISTS idx_ewa_employees_account_id ON public.ewa_employees(account_id);
CREATE INDEX IF NOT EXISTS idx_ewa_requests_employee_id ON public.ewa_requests(employee_id);

-- -----------------------------------------------------------------------------
-- Updated-at trigger helper
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- accounts
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- customers
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- social goals
DROP TRIGGER IF EXISTS update_social_goals_updated_at ON social_goals;
CREATE TRIGGER update_social_goals_updated_at
    BEFORE UPDATE ON social_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- subscriptions
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ewa settings / requests
DROP TRIGGER IF EXISTS update_ewa_settings_updated_at ON ewa_settings;
CREATE TRIGGER update_ewa_settings_updated_at
    BEFORE UPDATE ON ewa_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ewa_requests_updated_at ON ewa_requests;
CREATE TRIGGER update_ewa_requests_updated_at
    BEFORE UPDATE ON ewa_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- withdrawals
DROP TRIGGER IF EXISTS update_withdrawals_updated_at ON withdrawals;
CREATE TRIGGER update_withdrawals_updated_at
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- treasury configs
DROP TRIGGER IF EXISTS update_treasury_configs_updated_at ON treasury_configs;
CREATE TRIGGER update_treasury_configs_updated_at
    BEFORE UPDATE ON treasury_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- onboarding profiles
DROP TRIGGER IF EXISTS update_onboarding_profiles_updated_at ON onboarding_profiles;
CREATE TRIGGER update_onboarding_profiles_updated_at
    BEFORE UPDATE ON onboarding_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- Seed billing plans with ON CONFLICT upsert semantics
-- -----------------------------------------------------------------------------
INSERT INTO subscription_plans (name, slug, price, currency, interval, description, features, limits, marketing_points, product_mapping)
VALUES
    (
        'Free',
        'free',
        0,
        'USD',
        'monthly',
        'Starter tier for individuals and small teams launching with core wallets and social payments.',
        '["wallet","payments","social_goals"]'::jsonb,
        '{"wallet_limit":1,"api_access":false,"webhooks":false,"payouts":false,"ewa":false,"treasury":false,"payout_fee_rate":0.015}'::jsonb,
        '["1 managed wallet","Core payments and social goals","Community support"]'::jsonb,
        '{}'::jsonb
    ),
    (
        'Pro',
        'pro',
        29,
        'USD',
        'monthly',
        'Automation, payouts, API access, and webhooks for growing teams running production payment flows.',
        '["wallet","payments","social_goals","api_access","webhooks","payouts","ewa"]'::jsonb,
        '{"wallet_limit":3,"api_access":true,"webhooks":true,"payouts":true,"ewa":true,"treasury":false,"payout_fee_rate":0.01}'::jsonb,
        '["API and webhook access","Payouts and EWA","Priority support"]'::jsonb,
        '{"payday_pro_entitlement":"Payday Pro","monthly":"monthly","yearly":"yearly","lifetime":"lifetime"}'::jsonb
    ),
    (
        'Premium',
        'premium',
        99,
        'USD',
        'monthly',
        'Advanced treasury controls and higher-scale operations for teams with complex payout flows.',
        '["wallet","payments","social_goals","api_access","webhooks","payouts","ewa","treasury"]'::jsonb,
        '{"wallet_limit":-1,"api_access":true,"webhooks":true,"payouts":true,"ewa":true,"treasury":true,"payout_fee_rate":0.005}'::jsonb,
        '["Unlimited wallets","Treasury automation","Advanced controls"]'::jsonb,
        '{}'::jsonb
    ),
    (
        'Enterprise',
        'enterprise',
        299,
        'USD',
        'monthly',
        'Dedicated support, custom SLA, and high-volume optimization for platform and enterprise rollouts.',
        '["wallet","payments","social_goals","api_access","webhooks","payouts","ewa","treasury","analytics"]'::jsonb,
        '{"wallet_limit":-1,"api_access":true,"webhooks":true,"payouts":true,"ewa":true,"treasury":true,"payout_fee_rate":0.005}'::jsonb,
        '["Dedicated support","Custom SLA","High-volume optimization"]'::jsonb,
        '{}'::jsonb
    )
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    interval = EXCLUDED.interval,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    marketing_points = EXCLUDED.marketing_points,
    product_mapping = EXCLUDED.product_mapping;

COMMIT;
