-- Migration: Compliance - Data Retention Policies & Consent Ledger
-- Implements Kenya DPA s39, GDPR Art. 5(1)(e), PCI DSS Req 10.2

-- Data retention policies table
CREATE TABLE IF NOT EXISTS data_retention_policies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    data_category VARCHAR(100) NOT NULL UNIQUE,
    retention_days INTEGER NOT NULL,
    legal_basis VARCHAR(255),
    auto_delete BOOLEAN NOT NULL DEFAULT false,
    review_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Consent ledger for GDPR Art. 7, Kenya DPA s32
CREATE TABLE IF NOT EXISTS consent_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    consent_type VARCHAR(100) NOT NULL,
    version VARCHAR(50) NOT NULL,
    granted BOOLEAN NOT NULL DEFAULT true,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    ip_address VARCHAR(100),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_consent_ledger_account_id ON consent_ledger(account_id);
CREATE INDEX IF NOT EXISTS idx_consent_ledger_type ON consent_ledger(consent_type);

-- Data subject requests (DSAR) - Kenya DPA s26, GDPR Art. 15-17
CREATE TABLE IF NOT EXISTS data_subject_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    request_type VARCHAR(50) NOT NULL, -- ACCESS, RECTIFICATION, ERASURE, PORTABILITY
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payload JSONB DEFAULT '{}'::jsonb,
    reviewed_by UUID REFERENCES accounts(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dsr_account_id ON data_subject_requests(account_id);
CREATE INDEX IF NOT EXISTS idx_dsr_status ON data_subject_requests(status);

-- Insert default retention policies (Kenya DPA, POCA, NPSA requirements)
INSERT INTO data_retention_policies (data_category, retention_days, legal_basis, auto_delete) VALUES
    ('kyc_documents', 2555, 'POCA s36B - AML record keeping (7 years)', false),
    ('transaction_records', 2555, 'POCA s36B - AML record keeping (7 years)', false),
    ('audit_logs', 2555, 'NPSA s20 - Regulatory reporting (7 years)', false),
    ('kyc_submissions', 2555, 'POCA s36B - AML record keeping (7 years)', false),
    ('waitlist_entries', 730, 'Legitimate interest - 2 years', true),
    ('consent_records', 2555, 'Kenya DPA s39 - Proof of consent (7 years)', false),
    ('data_subject_requests', 1825, 'Kenya DPA s26 - Request audit trail (5 years)', false),
    ('session_tokens', 30, 'Legitimate interest - JWT expiry + buffer', true),
    ('api_keys', 365, 'Security best practice - annual rotation', true)
ON CONFLICT (data_category) DO NOTHING;

-- Insert default consent types
INSERT INTO consent_ledger (account_id, consent_type, version, granted, metadata)
SELECT 
    id, 
    'terms_of_service', 
    '1.0', 
    true,
    '{"ip_address": "migration", "accepted_at": "' || CURRENT_TIMESTAMP || '"}'::jsonb
FROM accounts
WHERE NOT EXISTS (
    SELECT 1 FROM consent_ledger 
    WHERE consent_ledger.account_id = accounts.id 
    AND consent_type = 'terms_of_service'
)
ON CONFLICT DO NOTHING;
