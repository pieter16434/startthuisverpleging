-- ============================================================
-- Migratie: BTW-nummer + facturatieadres toevoegen aan partners
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS vat_number      TEXT,   -- Ondernemings- of BTW-nummer (bv. BE0123.456.789)
  ADD COLUMN IF NOT EXISTS billing_address TEXT;   -- Facturatieadres (bv. Kerkstraat 1, 3500 Hasselt)
