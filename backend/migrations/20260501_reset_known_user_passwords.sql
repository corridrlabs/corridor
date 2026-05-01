-- Reset known account passwords for recovery/debugging
-- This keeps existing account rows intact and only updates the password hash.

BEGIN;

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'ACTIVE';

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS user_tier VARCHAR(20) DEFAULT 'FREE';

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'inactive';

ALTER TABLE accounts
    ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE;

INSERT INTO accounts (email, full_name, password_hash, account_type, account_status, user_tier, subscription_status, country, onboarding_completed)
VALUES
    (
        'jamesmweni52@gmail.com',
        'James Mweni',
        '$2a$12$n1mcMugHZhH3gMXJBM9XU.lmPyVpIOpMDhDQcIz/7iAh90vtLdC1W',
        'ADMIN',
        'ACTIVE',
        'ENTERPRISE',
        'inactive',
        'KE',
        false
    )
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    account_type = 'ADMIN',
    account_status = 'ACTIVE',
    user_tier = 'ENTERPRISE',
    subscription_status = 'inactive',
    updated_at = NOW();

INSERT INTO accounts (email, full_name, password_hash, account_type, account_status, user_tier, subscription_status, country, onboarding_completed)
VALUES
    (
        'johndoe1@gmail.com',
        'John Doe',
        '$2a$12$oF/aTmRh0C/txGsyG0UtNeE0QuV0smtD0ld4.7HaKX90lOBYlznKu',
        'PERSONAL',
        'ACTIVE',
        'FREE',
        'inactive',
        'KE',
        false
    )
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    user_tier = 'FREE',
    subscription_status = 'inactive',
    updated_at = NOW();

COMMIT;
