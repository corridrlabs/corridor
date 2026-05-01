-- Migration: Add onboarding personalization tables
-- Created: 2024-01-XX

-- Create onboarding_profiles table
CREATE TABLE IF NOT EXISTS onboarding_profiles (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    intent VARCHAR(50) NOT NULL CHECK (intent IN ('ewa_only', 'social_only', 'full_platform', 'api_partner')),
    current_step VARCHAR(50) NOT NULL CHECK (current_step IN ('welcome', 'use_case', 'business_info', 'payment_setup', 'complete')),
    completed_steps JSONB DEFAULT '[]'::jsonb,
    preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
    business_info JSONB DEFAULT '{}'::jsonb,
    is_complete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_intent ON onboarding_profiles(intent);
CREATE INDEX IF NOT EXISTS idx_onboarding_profiles_complete ON onboarding_profiles(is_complete);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_onboarding_updated_at
    BEFORE UPDATE ON onboarding_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_onboarding_updated_at();