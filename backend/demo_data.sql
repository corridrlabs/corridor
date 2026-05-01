-- Demo User & Sample Data for Testing (Fixed)

-- Get or create demo account
DO $$
DECLARE
    demo_account_id UUID;
    customer1_id UUID;
    customer2_id UUID;
    customer3_id UUID;
    invoice1_id UUID;
    wallet_usdc_id UUID;
    wallet_kes_id UUID;
BEGIN
    -- Get demo account (created separately)
    SELECT id INTO demo_account_id FROM accounts WHERE email = 'demo@corridormoney.net';
    
    IF demo_account_id IS NULL THEN
        RAISE NOTICE 'Demo account not found! Create it first.';
        RETURN;
    END IF;

    RAISE NOTICE 'Using demo account: %', demo_account_id;

    -- Create wallets if they don't exist
    SELECT id INTO wallet_usdc_id FROM wallets WHERE account_id = demo_account_id AND currency = 'USDC';
    IF wallet_usdc_id IS NULL THEN
        INSERT INTO wallets (account_id, type, currency, chain_address, balance)
        VALUES (demo_account_id, 'ONCHAIN_STABLE', 'USDC', '0xDEMO_USDC_' || demo_account_id::text, 1000.00)
        RETURNING id INTO wallet_usdc_id;
        RAISE NOTICE 'Created USDC wallet: %', wallet_usdc_id;
    END IF;

    SELECT id INTO wallet_kes_id FROM wallets WHERE account_id = demo_account_id AND currency = 'KES';
    IF wallet_kes_id IS NULL THEN
        INSERT INTO wallets (account_id, type, currency, chain_address, balance)
        VALUES (demo_account_id, 'INTERNAL_FIAT', 'KES', 'KES_' || demo_account_id::text, 50000.00)
        RETURNING id INTO wallet_kes_id;
        RAISE NOTICE 'Created KES wallet: %', wallet_kes_id;
    END IF;

    -- Clear existing test data
    DELETE FROM invoice_items WHERE invoice_id IN (SELECT id FROM invoices WHERE account_id = demo_account_id);
    DELETE FROM invoices WHERE account_id = demo_account_id;
    DELETE FROM customers WHERE account_id = demo_account_id;

    -- Create sample customers
    INSERT INTO customers (account_id, name, phone, email)
    VALUES (demo_account_id, 'John Doe', '+254700111222', 'john@example.com')
    RETURNING id INTO customer1_id;
    
    INSERT INTO customers (account_id, name, phone, email)
    VALUES (demo_account_id, 'Jane Smith', '+254700333444', 'jane@example.com')
    RETURNING id INTO customer2_id;
    
    INSERT INTO customers (account_id, name, phone, email)
    VALUES (demo_account_id, 'Acme Corp', '+254700555666', 'billing@acme.com')
    RETURNING id INTO customer3_id;

    RAISE NOTICE 'Created 3 customers';

    -- Create sample invoices
    INSERT INTO invoices (account_id, customer_id, number, currency, subtotal, tax, total, status, due_date)
    VALUES (demo_account_id, customer1_id, 'INV-000001', 'USD', 150.00, 0, 150.00, 'pending', NOW() + INTERVAL '7 days')
    RETURNING id INTO invoice1_id;
    
    INSERT INTO invoices (account_id, customer_id, number, currency, subtotal, tax, total, status, due_date, paid_at)
    VALUES (demo_account_id, customer2_id, 'INV-000002', 'USD', 299.99, 0, 299.99, 'paid', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days');
    
    INSERT INTO invoices (account_id, customer_id, number, currency, subtotal, tax, total, status, due_date)
    VALUES (demo_account_id, customer3_id, 'INV-000003', 'USD', 1500.00, 0, 1500.00, 'pending', NOW() + INTERVAL '14 days');

    RAISE NOTICE 'Created 3 invoices';

    -- Create invoice items for first invoice
    INSERT INTO invoice_items (invoice_id, description, qty, unit_price, line_total)
    VALUES (invoice1_id, 'Web Development Services', 5, 30.00, 150.00);

    -- Create sample transactions
    INSERT INTO transactions (sender_wallet_id, recipient_wallet_id, amount, currency, status, message)
    VALUES 
        (wallet_usdc_id, wallet_kes_id, 50.00, 'USDC', 'COMPLETED', 'Test payment'),
        (wallet_usdc_id, wallet_kes_id, 25.00, 'USDC', 'COMPLETED', 'Monthly subscription');

    RAISE NOTICE 'Created 2 transactions';

    -- Update account settings
    UPDATE accounts SET settings = '{
        "company_name": "Demo Company Ltd",
        "logo_url": "https://via.placeholder.com/150",
        "timezone": "Africa/Nairobi",
        "default_currency": "USD",
        "notification_email": "demo@corridormoney.net"
    }'::jsonb WHERE id = demo_account_id;

    RAISE NOTICE 'Demo data created successfully!';
END $$;

-- Verify data
SELECT 
    (SELECT COUNT(*) FROM customers WHERE account_id = (SELECT id FROM accounts WHERE email = 'demo@corridormoney.net')) as customers,
    (SELECT COUNT(*) FROM invoices WHERE account_id = (SELECT id FROM accounts WHERE email = 'demo@corridormoney.net')) as invoices,
    (SELECT COUNT(*) FROM wallets WHERE account_id = (SELECT id FROM accounts WHERE email = 'demo@corridormoney.net')) as wallets;
