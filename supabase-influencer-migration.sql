-- ── Influencers tabel ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS influencers (
  id                      UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  name                    TEXT        NOT NULL,
  email                   TEXT        UNIQUE NOT NULL,
  platform                TEXT        NOT NULL, -- 'instagram' | 'tiktok' | 'youtube' | 'facebook' | 'other'
  social_handle           TEXT        NOT NULL,
  profile_url             TEXT,
  discount_code           TEXT        UNIQUE NOT NULL,
  iban                    TEXT,
  iban_name               TEXT,
  payout_per_use          INTEGER     NOT NULL DEFAULT 20, -- euro
  notes                   TEXT,
  password_hash           TEXT,
  is_active               BOOLEAN     NOT NULL DEFAULT true,
  deactivated_at          TIMESTAMPTZ,
  reset_token             TEXT,
  reset_token_expires_at  TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ── Eenmalige onboarding tokens voor influencers ──────────────────────────────
CREATE TABLE IF NOT EXISTS influencer_onboarding_tokens (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  token       TEXT        UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Koppel influencer aan orders ──────────────────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES influencers(id);
