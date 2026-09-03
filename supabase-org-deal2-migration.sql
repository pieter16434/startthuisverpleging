-- ═══════════════════════════════════════════════════════════════════════════
-- Migratie: Tweede deal voor organisaties
-- Uitvoeren in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- organizations: dual deal velden
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS has_deal2        BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deal1_name       TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deal2_name       TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deal2_description TEXT;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS deal2_fee        NUMERIC;

-- organization_offices: deal 2 overschrijving per kantoor
ALTER TABLE organization_offices ADD COLUMN IF NOT EXISTS deal2_description TEXT;
ALTER TABLE organization_offices ADD COLUMN IF NOT EXISTS deal2_fee        NUMERIC;

-- organization_codes: deal nummer (1 of 2) bijhouden
ALTER TABLE organization_codes ADD COLUMN IF NOT EXISTS deal_number INTEGER NOT NULL DEFAULT 1;
