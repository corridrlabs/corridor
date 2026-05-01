-- Migration: 20260426_pricing_catalog_billing.sql
-- Purpose:
--   1) Normalize pricing catalog metadata
--   2) Align plan features/limits with backend enforcement
--   3) Add billing provider product mapping for Payday Pro entitlement
-- Safe to rerun.

BEGIN;

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS marketing_points JSONB DEFAULT '[]'::jsonb;

ALTER TABLE subscription_plans
    ADD COLUMN IF NOT EXISTS product_mapping JSONB DEFAULT '{}'::jsonb;

INSERT INTO subscription_plans (name, slug, price, currency, interval, description, features, limits, marketing_points, product_mapping)
VALUES
    (
        'Free',
        'free',
        0,
        'USD',
        'monthly',
        'Starter tier for individuals and small teams launching with core wallets and social payments.',
        '["wallet","payments","social_goals"]'::jsonb,
        '{"wallet_limit":1,"api_access":false,"webhooks":false,"payouts":false,"ewa":false,"treasury":false,"payout_fee_rate":0.015}'::jsonb,
        '["1 managed wallet","Core payments and social goals","Community support"]'::jsonb,
        '{}'::jsonb
    ),
    (
        'Pro',
        'pro',
        29,
        'USD',
        'monthly',
        'Automation, payouts, API access, and webhooks for growing teams running production payment flows.',
        '["wallet","payments","social_goals","api_access","webhooks","payouts","ewa"]'::jsonb,
        '{"wallet_limit":3,"api_access":true,"webhooks":true,"payouts":true,"ewa":true,"treasury":false,"payout_fee_rate":0.01}'::jsonb,
        '["API and webhook access","Payouts and EWA","Priority support"]'::jsonb,
        '{"payday_pro_entitlement":"Payday Pro","monthly":"monthly","yearly":"yearly","lifetime":"lifetime"}'::jsonb
    ),
    (
        'Premium',
        'premium',
        99,
        'USD',
        'monthly',
        'Advanced treasury controls and higher-scale operations for teams with complex payout flows.',
        '["wallet","payments","social_goals","api_access","webhooks","payouts","ewa","treasury"]'::jsonb,
        '{"wallet_limit":-1,"api_access":true,"webhooks":true,"payouts":true,"ewa":true,"treasury":true,"payout_fee_rate":0.005}'::jsonb,
        '["Unlimited wallets","Treasury automation","Advanced controls"]'::jsonb,
        '{}'::jsonb
    ),
    (
        'Enterprise',
        'enterprise',
        299,
        'USD',
        'monthly',
        'Dedicated support, custom SLA, and high-volume optimization for platform and enterprise rollouts.',
        '["wallet","payments","social_goals","api_access","webhooks","payouts","ewa","treasury","analytics"]'::jsonb,
        '{"wallet_limit":-1,"api_access":true,"webhooks":true,"payouts":true,"ewa":true,"treasury":true,"payout_fee_rate":0.005}'::jsonb,
        '["Dedicated support","Custom SLA","High-volume optimization"]'::jsonb,
        '{}'::jsonb
    )
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    price = EXCLUDED.price,
    currency = EXCLUDED.currency,
    interval = EXCLUDED.interval,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    marketing_points = EXCLUDED.marketing_points,
    product_mapping = EXCLUDED.product_mapping;

COMMIT;
