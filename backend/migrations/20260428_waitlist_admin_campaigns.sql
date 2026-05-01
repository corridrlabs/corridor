CREATE TABLE IF NOT EXISTS waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  company VARCHAR(255) DEFAULT '',
  segment VARCHAR(255) DEFAULT '',
  use_case TEXT DEFAULT '',
  preferred_channel VARCHAR(50) DEFAULT '',
  volume VARCHAR(120) DEFAULT '',
  notes TEXT DEFAULT '',
  status VARCHAR(30) NOT NULL DEFAULT 'NEW',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS waitlist_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_waitlist_entries_created_at ON waitlist_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_status ON waitlist_entries(status);
