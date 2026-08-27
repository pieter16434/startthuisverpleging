-- =====================================================================
-- KANTOOR TWEEDE PROVINCIE MIGRATIE
-- Voer dit uit in de Supabase SQL Editor
-- =====================================================================

ALTER TABLE organization_offices
  ADD COLUMN IF NOT EXISTS province_2 TEXT;
