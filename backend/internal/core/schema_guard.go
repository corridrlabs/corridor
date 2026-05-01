package core

import (
	"context"
	"fmt"

	"github.com/corridrlabs/corridor/backend/internal/adapters/db"
)

// EnsureAuthSchema makes the auth-critical account columns available on older
// live databases. It is intentionally idempotent so it can run on startup.
func EnsureAuthSchema(ctx context.Context, database *db.Postgres) error {
	stmts := []string{
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS user_tier VARCHAR(20) DEFAULT 'FREE'`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive'`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255)`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'ACTIVE'`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS whatsapp_phone VARCHAR(50)`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'KE'`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS kyc_id_type VARCHAR(50)`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS kyc_id_number VARCHAR(120)`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS kyc_captured_at TIMESTAMP WITH TIME ZONE`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS onboarding_data JSONB DEFAULT '{}'::jsonb`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS avatar_url TEXT`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"company_name":"","logo_url":"","timezone":"UTC","default_currency":"USD","notification_email":""}'::jsonb`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(50) DEFAULT 'PENDING'`,
		`ALTER TABLE accounts ADD COLUMN IF NOT EXISTS kyc_level INTEGER DEFAULT 1`,
		`CREATE TABLE IF NOT EXISTS waitlist_entries (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(255) NOT NULL,
			email VARCHAR(255) NOT NULL UNIQUE,
			company VARCHAR(255) DEFAULT '',
			segment VARCHAR(255) DEFAULT '',
			use_case TEXT DEFAULT '',
			preferred_channel VARCHAR(50) DEFAULT '',
			volume VARCHAR(120) DEFAULT '',
			notes TEXT DEFAULT '',
			status VARCHAR(30) NOT NULL DEFAULT 'NEW',
			tags JSONB NOT NULL DEFAULT '[]'::jsonb,
			last_contacted_at TIMESTAMP WITH TIME ZONE,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS waitlist_campaigns (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			created_by UUID,
			subject VARCHAR(255) NOT NULL,
			message TEXT NOT NULL,
			recipient_count INTEGER NOT NULL DEFAULT 0,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS plans (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(50) NOT NULL UNIQUE,
			display_name VARCHAR(80) DEFAULT '',
			price DECIMAL(18, 2) NOT NULL DEFAULT 0,
			features JSONB DEFAULT '{}'::jsonb,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS subscriptions (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
			plan_id UUID NOT NULL REFERENCES plans(id),
			status VARCHAR(50) NOT NULL DEFAULT 'active',
			current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			current_period_end TIMESTAMP WITH TIME ZONE,
			cancel_at_period_end BOOLEAN DEFAULT FALSE,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
			UNIQUE(account_id)
		)`,
		`CREATE TABLE IF NOT EXISTS feature_usage (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
			feature VARCHAR(50) NOT NULL,
			usage_date DATE NOT NULL,
			count INTEGER DEFAULT 1,
			created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
			UNIQUE(account_id, feature, usage_date)
		)`,
		`CREATE INDEX IF NOT EXISTS idx_feature_usage_account_date ON feature_usage(account_id, usage_date)`,
		`CREATE INDEX IF NOT EXISTS idx_feature_usage_feature ON feature_usage(feature)`,
		`CREATE TABLE IF NOT EXISTS revenue_accounts (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			name VARCHAR(50) NOT NULL UNIQUE,
			balance DECIMAL(18, 2) NOT NULL DEFAULT 0,
			currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
			updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS revenue_sweeps (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			revenue_account_id UUID REFERENCES revenue_accounts(id),
			amount DECIMAL(18, 2) NOT NULL,
			bank_details JSONB,
			status VARCHAR(20) DEFAULT 'PENDING',
			created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS revenue_events (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
			event_type VARCHAR(80) NOT NULL,
			source_type VARCHAR(80) DEFAULT '',
			source_id VARCHAR(120) DEFAULT '',
			gross_amount DECIMAL(20, 6) NOT NULL DEFAULT 0,
			fee_rate DECIMAL(10, 6) NOT NULL DEFAULT 0,
			fee_amount DECIMAL(20, 6) NOT NULL DEFAULT 0,
			net_amount DECIMAL(20, 6) NOT NULL DEFAULT 0,
			currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
			metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
		)`,
		`CREATE INDEX IF NOT EXISTS idx_revenue_events_account_created ON revenue_events(account_id, created_at DESC)`,
		`CREATE INDEX IF NOT EXISTS idx_revenue_events_type_created ON revenue_events(event_type, created_at DESC)`,
		`CREATE TABLE IF NOT EXISTS ewa_billing_cycles (
			id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
			account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
			period_start DATE NOT NULL,
			period_end DATE NOT NULL,
			employee_count INTEGER NOT NULL DEFAULT 0,
			fee_amount DECIMAL(20, 6) NOT NULL DEFAULT 0,
			currency VARCHAR(10) NOT NULL DEFAULT 'USDC',
			status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
			created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
			charged_at TIMESTAMP WITH TIME ZONE
		)`,
		`CREATE UNIQUE INDEX IF NOT EXISTS idx_ewa_billing_cycles_account_period ON ewa_billing_cycles(account_id, period_start)`,
		`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS platform_fee_rate DECIMAL(10, 6) DEFAULT 0`,
		`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(20, 6) DEFAULT 0`,
		`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS net_amount DECIMAL(20, 6) DEFAULT 0`,
		`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_amount DECIMAL(20, 6) DEFAULT 0`,
		`ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS platform_fee_rate DECIMAL(10, 6) DEFAULT 0`,
		`ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(20, 6) DEFAULT 0`,
		`ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS net_amount DECIMAL(20, 6) DEFAULT 0`,
		`ALTER TABLE plans ADD COLUMN IF NOT EXISTS display_name VARCHAR(80) DEFAULT ''`,
	}

	for _, stmt := range stmts {
		if _, err := database.Pool.Exec(ctx, stmt); err != nil {
			return fmt.Errorf("schema guard failed: %w", err)
		}
	}

	// Ensure 'ADMIN' exists in account_type enum
	_, _ = database.Pool.Exec(ctx, `ALTER TYPE account_type ADD VALUE IF NOT EXISTS 'ADMIN'`)
	_, _ = database.Pool.Exec(ctx, `UPDATE plans SET name = 'BUSINESS', display_name = 'Business' WHERE name = 'PREMIUM'`)
	_, _ = database.Pool.Exec(ctx, `
		INSERT INTO plans (name, display_name, price, features)
		VALUES
			('FREE', 'Free', 0, '{"api_access": false, "ewa": false, "payouts": true, "max_wallets": 2}'),
			('PRO', 'Pro', 29, '{"api_access": true, "ewa": true, "payouts": true, "max_wallets": 10, "treasury": true}'),
			('BUSINESS', 'Business', 99, '{"api_access": true, "ewa": true, "payouts": true, "max_wallets": 25, "treasury": true, "advanced_controls": true}'),
			('ENTERPRISE', 'Enterprise', 299, '{"api_access": true, "ewa": true, "payouts": true, "max_wallets": 50, "treasury": true, "white_label": true}')
		ON CONFLICT (name) DO UPDATE SET
			display_name = EXCLUDED.display_name,
			price = EXCLUDED.price,
			features = EXCLUDED.features
	`)

	_, _ = database.Pool.Exec(ctx, `
		UPDATE accounts
		SET account_status = 'ACTIVE'
		WHERE account_status IS NULL OR TRIM(account_status) = ''
	`)

	return nil
}
