-- Corridor Production Schema: Unified & Optimized
-- This file contains the complete database structure for the Corridor platform.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==========================================
-- 1. Identity & Accounts
-- ==========================================

CREATE TYPE account_type AS ENUM ('PERSONAL', 'BUSINESS', 'ENTERPRISE', 'ADMIN');

CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    account_type account_type NOT NULL DEFAULT 'PERSONAL',
    
    -- KYC / Compliance
    kyc_status VARCHAR(50) DEFAULT 'PENDING',
    kyc_level INTEGER DEFAULT 1,
    account_status VARCHAR(20) DEFAULT 'ACTIVE',
    
    -- Identity Info
    whatsapp_phone VARCHAR(50),
    country VARCHAR(10) DEFAULT 'KE',
    kyc_id_type VARCHAR(50),
    kyc_id_number VARCHAR(120),
    kyc_captured_at TIMESTAMP WITH TIME ZONE,
    
    -- Onboarding
    onboarding_completed BOOLEAN DEFAULT false,
    onboarding_data JSONB DEFAULT '{}',
    wallet_address VARCHAR(255),
    
    -- Settings
    avatar_url TEXT,
    settings JSONB DEFAULT '{
      "company_name": "",
      "logo_url": "",
      "timezone": "UTC",
      "default_currency": "USD",
      "notification_email": ""
    }',
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Onboarding Profiles (Personalization)
CREATE TABLE IF NOT EXISTS onboarding_profiles (
    user_id UUID PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
    intent VARCHAR(50) DEFAULT 'full_platform',
    current_step VARCHAR(50) DEFAULT 'welcome',
    completed_steps JSONB DEFAULT '[]'::jsonb,
    preferences JSONB DEFAULT '{}'::jsonb,
    business_info JSONB DEFAULT '{}'::jsonb,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_complete ON onboarding_profiles(is_complete);

CREATE INDEX idx_accounts_username ON accounts(username);

-- ==========================================
-- 2. Wallets & Ledger
-- ==========================================

CREATE TYPE wallet_type AS ENUM ('INTERNAL_FIAT', 'ONCHAIN_STABLE');
CREATE TYPE currency_code AS ENUM ('USD', 'KES', 'USDC', 'EUR');

CREATE TABLE wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    type wallet_type NOT NULL,
    currency currency_code NOT NULL,
    balance DECIMAL(20, 6) DEFAULT 0.000000,
    frozen_balance DECIMAL(20, 6) DEFAULT 0.000000,
    chain_address VARCHAR(255),
    chain_network VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id, currency, type)
);

CREATE TABLE ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    transaction_id UUID,
    amount DECIMAL(20, 6) NOT NULL,
    balance_after DECIMAL(20, 6) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. Payments & Transactions
-- ==========================================

CREATE TYPE transaction_visibility AS ENUM ('PUBLIC', 'FRIENDS', 'PRIVATE');
CREATE TYPE transaction_status AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_wallet_id UUID REFERENCES wallets(id),
    recipient_wallet_id UUID REFERENCES wallets(id),
    amount DECIMAL(20, 6) NOT NULL,
    currency currency_code NOT NULL,
    fee DECIMAL(20, 6) DEFAULT 0,
    status transaction_status DEFAULT 'PENDING',
    onchain_tx_hash VARCHAR(255),
    settled_at TIMESTAMP WITH TIME ZONE,
    message TEXT,
    visibility transaction_visibility DEFAULT 'PUBLIC',
    context JSONB DEFAULT '{}',
    split_type VARCHAR(20) DEFAULT 'single',
    total_amount DECIMAL(20, 6),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE transaction_splits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id),
    amount DECIMAL(20, 6) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    direction VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE funding_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    last4 VARCHAR(4),
    expiry VARCHAR(10),
    brand VARCHAR(50),
    external_id VARCHAR(255),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. Invoices & Customers
-- ==========================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id),
    number VARCHAR(50) UNIQUE NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    subtotal DECIMAL(20, 6) NOT NULL,
    tax DECIMAL(20, 6) DEFAULT 0,
    total DECIMAL(20, 6) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    due_date TIMESTAMP WITH TIME ZONE,
    reference VARCHAR(255),
    notes TEXT,
    pay_link TEXT,
    payment_session_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(20, 6) NOT NULL,
    line_total DECIMAL(20, 6) NOT NULL
);

-- ==========================================
-- 5. Social & Features
-- ==========================================

CREATE TABLE social_connections (
    follower_id UUID NOT NULL REFERENCES accounts(id),
    following_id UUID NOT NULL REFERENCES accounts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE social_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES accounts(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(18, 2) NOT NULL,
    current_amount DECIMAL(18, 2) DEFAULT 0,
    currency VARCHAR(10) NOT NULL,
    product_link TEXT,
    share_link TEXT UNIQUE,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES social_goals(id),
    contributor_name VARCHAR(255),
    contributor_info JSONB,
    amount DECIMAL(18, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE payment_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    amount DECIMAL(20, 6) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    views INTEGER DEFAULT 0,
    payments_count INTEGER DEFAULT 0,
    total_revenue DECIMAL(20, 6) DEFAULT 0.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE payment_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL,
    amount DECIMAL(20, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payer_email VARCHAR(255),
    memo TEXT,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- 6. Infrastructure & Compliance
-- ==========================================

CREATE TABLE verification_codes (
    contact VARCHAR(255) PRIMARY KEY,
    code VARCHAR(10) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'email',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    prefix VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_live BOOLEAN DEFAULT false,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_hash VARCHAR(64) UNIQUE NOT NULL,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    request_path TEXT NOT NULL,
    request_body_hash VARCHAR(64) NOT NULL,
    response_code INTEGER,
    response_body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

CREATE TABLE feature_flags (
    key VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL DEFAULT '',
    description TEXT DEFAULT '',
    enabled BOOLEAN NOT NULL DEFAULT false,
    payload JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE fx_overrides (
    pair VARCHAR(50) PRIMARY KEY,
    rate DECIMAL(20, 8) NOT NULL,
    source VARCHAR(255) DEFAULT '',
    is_override BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE admin_action_approvals (
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

CREATE TABLE system_audit_logs (
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

INSERT INTO feature_flags (key, name, description, enabled, payload) VALUES
    ('mpesa_maintenance_mode', 'M-Pesa Maintenance Mode', 'Temporarily disable M-Pesa rail availability', false, '{}'::jsonb),
    ('treasury_controls', 'Treasury Controls', 'Enable treasury desk controls', true, '{}'::jsonb),
    ('admin_portal', 'Admin Portal', 'Master admin command center', true, '{}'::jsonb),
    ('admin_double_approval', 'Admin Double Approval', 'Require second-admin approval for risky actions', false, '{}'::jsonb)
ON CONFLICT (key) DO NOTHING;

INSERT INTO fx_overrides (pair, rate, source, is_override) VALUES
    ('USDC_KES', 129.00000000, 'seed', false),
    ('USDC_NGN', 1550.00000000, 'seed', false),
    ('USDC_GHS', 14.00000000, 'seed', false)
ON CONFLICT (pair) DO NOTHING;

-- ==========================================
-- 7. Workflows & EWA
-- ==========================================

CREATE TABLE workflow_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    definition JSONB NOT NULL,
    owner_id UUID REFERENCES accounts(id),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE execution_status AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'WAITING_FOR_INPUT');

CREATE TABLE workflow_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_id UUID REFERENCES workflow_templates(id),
    trigger_account_id UUID REFERENCES accounts(id),
    status execution_status DEFAULT 'RUNNING',
    current_step_id VARCHAR(50),
    context_data JSONB DEFAULT '{}',
    duration_ms INTEGER,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE ewa_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT false,
    percentage_accessible DECIMAL(5, 2) DEFAULT 0.50,
    max_withdrawal_per_period DECIMAL(20, 6),
    transaction_fee DECIMAL(20, 6) DEFAULT 0,
    cooldown_period_days INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(account_id)
);

CREATE TABLE ewa_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    external_employee_id VARCHAR(100),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    gross_salary DECIMAL(20, 6) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    pay_day_of_month INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ewa_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES ewa_employees(id) ON DELETE CASCADE,
    amount_requested DECIMAL(20, 6) NOT NULL,
    amount_disbursed DECIMAL(20, 6) NOT NULL,
    fee_charged DECIMAL(20, 6) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    disbursement_tx_id UUID REFERENCES transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. Triggers & Functions
-- ==========================================

CREATE OR REPLACE FUNCTION generate_invoice_number() 
RETURNS VARCHAR AS $$
DECLARE
    seq_val BIGINT;
    new_num VARCHAR;
BEGIN
    -- This is a simple placeholder for more complex logic. 
    -- It generates INV- followed by a random 8-character string for uniqueness.
    -- In a real system, you might use a dedicated sequence or account-based numbering.
    new_num := 'INV-' || upper(substr(md5(random()::text), 1, 8));
    RETURN new_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- 9. Performance Optimization (Indexes)
-- ==========================================

-- Wallets
CREATE INDEX idx_wallets_account_id ON wallets(account_id);
CREATE INDEX idx_wallets_currency ON wallets(currency);

-- Transactions
CREATE INDEX idx_transactions_sender_wallet ON transactions(sender_wallet_id);
CREATE INDEX idx_transactions_recipient_wallet ON transactions(recipient_wallet_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Invoices & Customers
CREATE INDEX idx_invoices_account_id ON invoices(account_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_customers_account_id ON customers(account_id);

-- API Keys
CREATE INDEX idx_api_keys_account_id ON api_keys(account_id);

-- EWA
CREATE INDEX idx_ewa_employees_account_id ON ewa_employees(account_id);
CREATE INDEX idx_ewa_requests_employee_id ON ewa_requests(employee_id);

-- Webhooks
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

CREATE INDEX idx_webhooks_account_id ON webhooks(account_id);
CREATE INDEX idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);

-- ==========================================
-- 10. Added during Audit: Compliance & Billing
-- ==========================================

-- KYC Submissions
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
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_account_id ON kyc_submissions(account_id);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_status ON kyc_submissions(status);

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

-- Withdrawals (Payouts)
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
    amount DECIMAL(20, 6) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    destination_bank VARCHAR(255),
    account_number_last4 VARCHAR(10),
    account_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_withdrawals_account_id ON withdrawals(account_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- Billing & Subscriptions
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    price DECIMAL(20, 6) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    interval VARCHAR(20) DEFAULT 'monthly',
    description TEXT DEFAULT '',
    features JSONB DEFAULT '[]',
    limits JSONB DEFAULT '{}',
    marketing_points JSONB DEFAULT '[]',
    product_mapping JSONB DEFAULT '{}',
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
CREATE INDEX IF NOT EXISTS idx_subscriptions_account_id ON subscriptions(account_id);

-- ==========================================
-- Payment Link Transactions (for tracking payments to payment links)
-- ==========================================

CREATE TABLE IF NOT EXISTS payment_link_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_link_id UUID NOT NULL REFERENCES payment_links(id) ON DELETE CASCADE,
    payer_email VARCHAR(255),
    payer_name VARCHAR(255),
    amount DECIMAL(20, 6) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    transaction_id UUID REFERENCES transactions(id),
    merchant_request_id VARCHAR(255),
    checkout_request_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payment_link_transactions_link_id ON payment_link_transactions(payment_link_id);
CREATE INDEX IF NOT EXISTS idx_payment_link_transactions_status ON payment_link_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_link_transactions_merchant_request ON payment_link_transactions(merchant_request_id);
CREATE INDEX IF NOT EXISTS idx_payment_link_transactions_checkout_request ON payment_link_transactions(checkout_request_id);

-- Add total_revenue column to payment_links if not exists
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(20, 6) DEFAULT 0.0;
