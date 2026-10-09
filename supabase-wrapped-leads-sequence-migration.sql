-- ─── Zorg Wrapped: sequence tracking kolommen op wrapped_leads ───────────────
-- Voer uit via Supabase Dashboard → SQL Editor
-- Vereist dat de wrapped_leads tabel al bestaat (zie supabase-wrapped-leads-migration.sql)

ALTER TABLE wrapped_leads
  ADD COLUMN IF NOT EXISTS seq_step      integer      NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS seq_updated_at timestamptz,
  ADD COLUMN IF NOT EXISTS unsubscribed_at timestamptz;

-- Index voor cron-queries (haal snel leads op per stap + datum)
CREATE INDEX IF NOT EXISTS idx_wrapped_leads_seq
  ON wrapped_leads (seq_step, seq_updated_at)
  WHERE unsubscribed_at IS NULL;
