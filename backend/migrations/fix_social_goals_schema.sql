-- Migration: fix_social_goals_schema.sql
-- Fixes missing columns for Social Goals feature

-- Add is_public column if missing
ALTER TABLE social_goals ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- Add amount column if missing  
ALTER TABLE social_goals ADD COLUMN IF NOT EXISTS amount NUMERIC(18,2);

-- Ensure goal_contributions table exists with all required columns
CREATE TABLE IF NOT EXISTS goal_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    goal_id UUID REFERENCES social_goals(id),
    contributor_name VARCHAR(255),
    contributor_info JSONB,
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    transaction_id UUID REFERENCES transactions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add any missing columns to existing tables
ALTER TABLE goal_contributions ADD COLUMN IF NOT EXISTS contributor_info JSONB;