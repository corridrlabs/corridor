-- Migration: add professional invoice fields and public access support

ALTER TABLE IF EXISTS invoices
    ADD COLUMN IF NOT EXISTS reference VARCHAR(255);

ALTER TABLE IF EXISTS invoices
    ADD COLUMN IF NOT EXISTS notes TEXT;
