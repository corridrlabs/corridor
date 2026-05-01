-- ============================================
-- Production Migration: RLS Policies & Updates
-- ============================================
-- This migration adds Row Level Security (RLS) policies
-- and ensures all tables have proper indexes and constraints
-- Run this after 001_create_tables.sql

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. Ensure business table has all required columns
-- ============================================
DO $$ 
BEGIN
    -- Add email_verified if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE business ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add verification_code if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business' AND column_name = 'verification_code'
    ) THEN
        ALTER TABLE business ADD COLUMN verification_code VARCHAR(10);
    END IF;

    -- Add verification_code_expires_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business' AND column_name = 'verification_code_expires_at'
    ) THEN
        ALTER TABLE business ADD COLUMN verification_code_expires_at TIMESTAMP;
    END IF;

    -- Add trial_ends_at if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business' AND column_name = 'trial_ends_at'
    ) THEN
        ALTER TABLE business ADD COLUMN trial_ends_at TIMESTAMP;
    END IF;

    -- Add subscription_status if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business' AND column_name = 'subscription_status'
    ) THEN
        ALTER TABLE business ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'trial';
    END IF;

    -- Add is_admin if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'business' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE business ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- ============================================
-- 2. Create use_cases table if not exists (for waitlist)
-- ============================================
CREATE TABLE IF NOT EXISTS use_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    submitted_by VARCHAR(255),
    is_approved BOOLEAN DEFAULT FALSE,
    votes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_use_cases_submitted_by ON use_cases(submitted_by);
CREATE INDEX IF NOT EXISTS idx_use_cases_category ON use_cases(category);
CREATE INDEX IF NOT EXISTS idx_use_cases_created_at ON use_cases(created_at DESC);

-- ============================================
-- 3. Create waiting_list_entries table if not exists
-- ============================================
CREATE TABLE IF NOT EXISTS waiting_list_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    customer_type VARCHAR(100),
    use_case VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_waiting_list_email ON waiting_list_entries(email);
CREATE INDEX IF NOT EXISTS idx_waiting_list_created_at ON waiting_list_entries(created_at DESC);

-- ============================================
-- 4. Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_business_email ON business(email);
CREATE INDEX IF NOT EXISTS idx_business_whatsapp_phone ON business(whatsapp_phone);
CREATE INDEX IF NOT EXISTS idx_business_email_verified ON business(email_verified);
CREATE INDEX IF NOT EXISTS idx_business_subscription_status ON business(subscription_status);

-- ============================================
-- 5. Enable Row Level Security (RLS)
-- ============================================

-- Enable RLS on business table
ALTER TABLE business ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own business record
CREATE POLICY "Users can view own business"
    ON business FOR SELECT
    USING (auth.uid()::text = id::text OR is_admin = true);

-- Policy: Users can update their own business record
CREATE POLICY "Users can update own business"
    ON business FOR UPDATE
    USING (auth.uid()::text = id::text OR is_admin = true);

-- Policy: Allow insert for new businesses (public registration)
CREATE POLICY "Allow business registration"
    ON business FOR INSERT
    WITH CHECK (true);

-- Enable RLS on customers table
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see customers belonging to their business
CREATE POLICY "Users can view own business customers"
    ON customers FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM business WHERE id::text = auth.uid()::text
        )
        OR business_id IN (
            SELECT business_id FROM business WHERE is_admin = true
        )
    );

-- Policy: Users can manage customers for their business
CREATE POLICY "Users can manage own business customers"
    ON customers FOR ALL
    USING (
        business_id IN (
            SELECT id FROM business WHERE id::text = auth.uid()::text
        )
    );

-- Enable RLS on invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see invoices belonging to their business
CREATE POLICY "Users can view own business invoices"
    ON invoices FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM business WHERE id::text = auth.uid()::text
        )
    );

-- Policy: Users can manage invoices for their business
CREATE POLICY "Users can manage own business invoices"
    ON invoices FOR ALL
    USING (
        business_id IN (
            SELECT id FROM business WHERE id::text = auth.uid()::text
        )
    );

-- Enable RLS on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see payments belonging to their business
CREATE POLICY "Users can view own business payments"
    ON payments FOR SELECT
    USING (
        business_id IN (
            SELECT id FROM business WHERE id::text = auth.uid()::text
        )
    );

-- Enable RLS on use_cases table (waitlist entries)
ALTER TABLE use_cases ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert (for waitlist submissions)
CREATE POLICY "Allow waitlist submissions"
    ON use_cases FOR INSERT
    WITH CHECK (true);

-- Policy: Only admins can view all waitlist entries
CREATE POLICY "Admins can view all waitlist entries"
    ON use_cases FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM business 
            WHERE id::text = auth.uid()::text AND is_admin = true
        )
    );

-- Policy: Users can view their own submissions
CREATE POLICY "Users can view own waitlist submissions"
    ON use_cases FOR SELECT
    USING (submitted_by = auth.email());

-- Enable RLS on waiting_list_entries table
ALTER TABLE waiting_list_entries ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert (for waitlist submissions)
CREATE POLICY "Allow waiting list submissions"
    ON waiting_list_entries FOR INSERT
    WITH CHECK (true);

-- Policy: Only admins can view all waiting list entries
CREATE POLICY "Admins can view all waiting list entries"
    ON waiting_list_entries FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM business 
            WHERE id::text = auth.uid()::text AND is_admin = true
        )
    );

-- ============================================
-- 6. Create function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to business table
DROP TRIGGER IF EXISTS update_business_updated_at ON business;
CREATE TRIGGER update_business_updated_at
    BEFORE UPDATE ON business
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply updated_at trigger to use_cases table
DROP TRIGGER IF EXISTS update_use_cases_updated_at ON use_cases;
CREATE TRIGGER update_use_cases_updated_at
    BEFORE UPDATE ON use_cases
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. Create function for email verification cleanup
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_expired_verification_codes()
RETURNS void AS $$
BEGIN
    UPDATE business
    SET verification_code = NULL,
        verification_code_expires_at = NULL
    WHERE verification_code_expires_at < NOW()
    AND email_verified = FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. Grant necessary permissions
-- ============================================
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant select/insert/update on tables
GRANT SELECT, INSERT, UPDATE ON business TO authenticated;
GRANT SELECT, INSERT, UPDATE ON customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON invoices TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;
GRANT INSERT, SELECT ON use_cases TO authenticated, anon;
GRANT INSERT, SELECT ON waiting_list_entries TO authenticated, anon;

-- ============================================
-- 9. Comments for documentation
-- ============================================
COMMENT ON TABLE business IS 'Business accounts with authentication and subscription tracking';
COMMENT ON TABLE use_cases IS 'Use case submissions and waitlist entries';
COMMENT ON TABLE waiting_list_entries IS 'Simple waitlist entries for early access';
COMMENT ON COLUMN business.email_verified IS 'Whether the business email has been verified';
COMMENT ON COLUMN business.verification_code IS 'Temporary code for email verification (expires in 10-15 minutes)';
COMMENT ON COLUMN business.subscription_status IS 'Current subscription status: trial, active, suspended';

-- ============================================
-- Migration Complete
-- ============================================
-- This migration:
-- 1. Adds missing columns to business table
-- 2. Creates use_cases and waiting_list_entries tables
-- 3. Creates performance indexes
-- 4. Enables Row Level Security (RLS) on all tables
-- 5. Creates RLS policies for secure data access
-- 6. Sets up triggers for updated_at timestamps
-- 7. Grants necessary permissions
-- 8. Adds documentation comments
