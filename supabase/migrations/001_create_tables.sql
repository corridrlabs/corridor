-- Corridor Orchestration  & Infrastructure for modern businesses
-- Supabase Migration: Create all necessary tables
-- Updated to match FastAPI models with proper plural table names

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS businesses CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS message_logs CASCADE;

-- 1. Business table (matches your FastAPI Business model)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    whatsapp_phone VARCHAR(20) UNIQUE NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'Kenya',
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    timezone VARCHAR(50) NOT NULL DEFAULT 'Africa/Nairobi',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Customers table (matches your FastAPI Customer model)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(business_id, email),
    UNIQUE(business_id, phone)
);

-- 3. Invoices table (matches your FastAPI Invoice model)
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) DEFAULT 0.00,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    due_date DATE,
    notes TEXT,
    pay_link VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    paid_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(business_id, invoice_number),
    CONSTRAINT invoices_status_check CHECK (status IN ('pending', 'sent', 'paid', 'overdue', 'cancelled'))
);

-- 4. Invoice Items table (matches your FastAPI InvoiceItem model)
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description VARCHAR(500) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT invoice_items_quantity_check CHECK (quantity > 0),
    CONSTRAINT invoice_items_unit_price_check CHECK (unit_price >= 0),
    CONSTRAINT invoice_items_total_price_check CHECK (total_price >= 0)
);

-- 5. Payments table (matches your FastAPI Payment model)
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL,
    provider_transaction_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    raw_response JSONB DEFAULT '{}',
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payments_status_check CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    CONSTRAINT payments_method_check CHECK (payment_method IN ('stripe', 'mpesa', 'bank_transfer', 'cash')),
    CONSTRAINT payments_provider_check CHECK (payment_provider IN ('stripe', 'mpesa', 'manual'))
);

-- 6. Payment Methods table (for storing customer payment preferences)
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    method_type VARCHAR(50) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    provider_customer_id VARCHAR(255),
    is_default BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT payment_methods_type_check CHECK (method_type IN ('card', 'mobile_money', 'bank_account')),
    CONSTRAINT payment_methods_provider_check CHECK (provider IN ('stripe', 'mpesa'))
);

-- 7. Subscriptions table (matches your FastAPI Subscription model)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    plan_type VARCHAR(50) NOT NULL DEFAULT 'monthly',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'KES',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT subscriptions_status_check CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    CONSTRAINT subscriptions_plan_type_check CHECK (plan_type IN ('monthly', 'yearly', 'lifetime'))
);

-- 8. Message Logs table (for WhatsApp message tracking)
CREATE TABLE message_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    to_phone VARCHAR(20) NOT NULL,
    template_name VARCHAR(100),
    direction VARCHAR(20) NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'template',
    status VARCHAR(50) NOT NULL DEFAULT 'sent',
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT message_logs_direction_check CHECK (direction IN ('outbound', 'inbound')),
    CONSTRAINT message_logs_status_check CHECK (status IN ('sent', 'delivered', 'read', 'failed'))
);


-- Create indexes for better performance
CREATE INDEX idx_businesses_email ON businesses(email);
CREATE INDEX idx_businesses_whatsapp_phone ON businesses(whatsapp_phone);
CREATE INDEX idx_businesses_is_active ON businesses(is_active);

CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);

CREATE INDEX idx_invoices_business_id ON invoices(business_id);
CREATE INDEX idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_business_id ON payments(business_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_payment_method ON payments(payment_method);
CREATE INDEX idx_payments_provider_transaction_id ON payments(provider_transaction_id);
CREATE INDEX idx_payments_created_at ON payments(created_at);

CREATE INDEX idx_payment_methods_business_id ON payment_methods(business_id);
CREATE INDEX idx_payment_methods_customer_id ON payment_methods(customer_id);
CREATE INDEX idx_payment_methods_is_default ON payment_methods(is_default);

CREATE INDEX idx_subscriptions_business_id ON subscriptions(business_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

CREATE INDEX idx_message_logs_business_id ON message_logs(business_id);
CREATE INDEX idx_message_logs_invoice_id ON message_logs(invoice_id);
CREATE INDEX idx_message_logs_created_at ON message_logs(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply the trigger to tables with updated_at column
CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for multi-tenant data isolation
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses (users can only see their own business)
CREATE POLICY "Users can view own business" ON businesses
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own business" ON businesses
    FOR UPDATE USING (auth.uid()::text = id::text);

-- RLS Policies for customers (businesses can only see their own customers)
CREATE POLICY "Businesses can view own customers" ON customers
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = id::text));

-- RLS Policies for invoices (businesses can only see their own invoices)
CREATE POLICY "Businesses can view own invoices" ON invoices
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = id::text));

-- RLS Policies for invoice_items (through invoice ownership)
CREATE POLICY "Businesses can view own invoice items" ON invoice_items
    FOR ALL USING (
        invoice_id IN (
            SELECT id FROM invoices 
            WHERE business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = id::text)
        )
    );

-- RLS Policies for payments (businesses can only see their own payments)
CREATE POLICY "Businesses can view own payments" ON payments
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = id::text));

-- RLS Policies for payment_methods (businesses can only see their own payment methods)
CREATE POLICY "Businesses can view own payment methods" ON payment_methods
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = id::text));

-- RLS Policies for subscriptions (businesses can only see their own subscriptions)
CREATE POLICY "Businesses can view own subscriptions" ON subscriptions
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = id::text));

-- RLS Policies for message_logs (businesses can only see their own message logs)
CREATE POLICY "Businesses can view own message logs" ON message_logs
    FOR ALL USING (business_id IN (SELECT id FROM businesses WHERE auth.uid()::text = id::text));

-- Insert some sample data for testing (optional - remove if not needed)
-- Sample business (password is 'password123' hashed)
INSERT INTO businesses (id, business_name, email, password_hash, whatsapp_phone, country) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Demo Business Ltd',
    'demo@corridormoney.net',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewVTjL2UEvw5YFom', -- password123
    '+254700123456',
    'Kenya'
);

-- Sample customer
INSERT INTO customers (id, business_id, name, email, phone, address) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'John Doe',
    'john@example.com',
    '+254700654321',
    '123 Main Street, Nairobi, Kenya'
);

-- Sample invoice
INSERT INTO invoices (id, business_id, customer_id, invoice_number, amount, tax_amount, total_amount, status, due_date, notes) 
VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a716-446655440001',
    'INV-2024-001',
    1000.00,
    160.00,
    1160.00,
    'pending',
    CURRENT_DATE + INTERVAL '30 days',
    'Website development services'
);

-- Sample invoice items
INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total_price) 
VALUES 
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Website Development - Frontend',
    1,
    600.00,
    600.00
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'Website Development - Backend',
    1,
    400.00,
    400.00
);

-- Add table comments for documentation
COMMENT ON TABLE businesses IS 'Stores business/company information for invoice senders';
COMMENT ON TABLE customers IS 'Stores customer information for invoice recipients';
COMMENT ON TABLE invoices IS 'Main invoice records with totals and status';
COMMENT ON TABLE invoice_items IS 'Line items/details for each invoice';
COMMENT ON TABLE payments IS 'Payment transactions against invoices';
COMMENT ON TABLE payment_methods IS 'Customer saved payment methods';
COMMENT ON TABLE subscriptions IS 'Business subscription plans for premium features';
COMMENT ON TABLE message_logs IS 'WhatsApp message tracking and history';

-- Show table summary for verification
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
