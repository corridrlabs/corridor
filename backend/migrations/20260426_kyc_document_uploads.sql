-- Migration: add stored KYC document uploads
-- Keeps the existing submission record but stores uploaded PDFs in a dedicated table.

CREATE TABLE IF NOT EXISTS kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id UUID NOT NULL REFERENCES kyc_submissions(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    file_name TEXT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    file_data BYTEA NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_kyc_documents_submission_id ON kyc_documents(submission_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_account_id ON kyc_documents(account_id);
