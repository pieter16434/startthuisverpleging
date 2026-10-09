-- ─── Zorg Wrapped: UTM-kolommen op wrapped_leads ─────────────────────────────
-- Voer uit via Supabase Dashboard → SQL Editor
-- Vereist dat wrapped_leads al bestaat

ALTER TABLE wrapped_leads
  ADD COLUMN IF NOT EXISTS utm_source   text,
  ADD COLUMN IF NOT EXISTS utm_medium   text,
  ADD COLUMN IF NOT EXISTS utm_campaign text;
