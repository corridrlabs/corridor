-- backend/migrations/20260427_admin_tier_fix.sql
-- Fix accounts_user_tier_check to include ENTERPRISE
-- and set jamesmweni52@gmail.com as Admin

BEGIN;

-- 1. Update the check constraint
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_user_tier_check;

ALTER TABLE accounts
    ADD CONSTRAINT accounts_user_tier_check
    CHECK (user_tier IN ('FREE', 'PRO', 'PREMIUM', 'ENTERPRISE'));

-- 2. Update the user
UPDATE accounts 
SET account_type = 'ADMIN', 
    account_status = 'ACTIVE', 
    user_tier = 'ENTERPRISE' 
WHERE email = 'jamesmweni52@gmail.com';

COMMIT;
