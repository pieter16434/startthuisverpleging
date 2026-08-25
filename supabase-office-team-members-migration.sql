-- =====================================================================
-- KANTOOR TEAMLEDEN MIGRATIE
-- Voer dit uit in de Supabase SQL Editor
-- =====================================================================

-- ── 1. Teamleden per kantoor (organization_office)
CREATE TABLE IF NOT EXISTS office_team_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id     UUID NOT NULL REFERENCES organization_offices(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Uitnodigingstokens voor nieuwe kantoor-teamleden (aangemaakt door admin)
CREATE TABLE IF NOT EXISTS office_team_invite_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id   UUID NOT NULL REFERENCES organization_offices(id) ON DELETE CASCADE,
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. Bijhouden wie een code geverifieerd heeft (teamlid of kantoor-account)
ALTER TABLE organization_codes
  ADD COLUMN IF NOT EXISTS verified_by_member_id UUID REFERENCES office_team_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS verified_by_email TEXT;

-- ── 4. Indexen
CREATE INDEX IF NOT EXISTS idx_office_team_members_office_id ON office_team_members(office_id);
CREATE INDEX IF NOT EXISTS idx_office_team_invite_tokens_office_id ON office_team_invite_tokens(office_id);
