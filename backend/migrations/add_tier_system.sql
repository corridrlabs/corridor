-- Add user tier and feature usage tracking
-- Migration: add_tier_system

-- Add user_tier column to accounts table
ALTER TABLE accounts 
ADD COLUMN user_tier VARCHAR(20) DEFAULT 'FREE' CHECK (user_tier IN ('FREE', 'PRO', 'PREMIUM'));

-- Create feature usage tracking table
CREATE TABLE feature_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    feature VARCHAR(50) NOT NULL,
    usage_date DATE NOT NULL,
    count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(account_id, feature, usage_date)
);

-- Create index for efficient queries
CREATE INDEX idx_feature_usage_account_date ON feature_usage(account_id, usage_date);
CREATE INDEX idx_feature_usage_feature ON feature_usage(feature);

-- Add billing-related columns to accounts
ALTER TABLE accounts 
ADD COLUMN subscription_id VARCHAR(255),
ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'inactive',
ADD COLUMN subscription_expires_at TIMESTAMP WITH TIME ZONE;