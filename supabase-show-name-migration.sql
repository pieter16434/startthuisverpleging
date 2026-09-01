-- =====================================================================
-- SHOW NAME MIGRATIE
-- Voer dit uit in de Supabase SQL Editor
-- Voegt show_name kolom toe aan partners, organizations en organization_offices
-- Standaard TRUE (naam wordt getoond) voor bestaande records
-- =====================================================================

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS show_name BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS show_name BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE organization_offices
  ADD COLUMN IF NOT EXISTS show_name BOOLEAN NOT NULL DEFAULT TRUE;
