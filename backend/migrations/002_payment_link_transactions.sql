-- Migration: Add payment link transactions tracking
-- This allows us to track payments made to payment links

-- Table to track pending and completed payment link payments
CREATE TABLE IF NOT EXISTS payment_link_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_link_id UUID NOT NULL REFERENCES payment_links(id) ON DELETE CASCADE,
    payer_email VARCHAR(255),
    payer_name VARCHAR(255),
    amount DECIMAL(20, 6) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'mpesa', 'card', 'crypto'
    status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'COMPLETED', 'FAILED'
    transaction_id UUID REFERENCES transactions(id),
    merchant_request_id VARCHAR(255), -- For M-Pesa tracking
    checkout_request_id VARCHAR(255), -- For M-Pesa tracking
    metadata JSONB, -- Store additional payment details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for faster lookups
CREATE INDEX idx_payment_link_transactions_link_id ON payment_link_transactions(payment_link_id);
CREATE INDEX idx_payment_link_transactions_status ON payment_link_transactions(status);
CREATE INDEX idx_payment_link_transactions_merchant_request ON payment_link_transactions(merchant_request_id);
CREATE INDEX idx_payment_link_transactions_checkout_request ON payment_link_transactions(checkout_request_id);

-- Add column to payment_links to track total revenue
ALTER TABLE payment_links ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(20, 6) DEFAULT 0.0;
