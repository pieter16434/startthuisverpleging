-- ─── Zorg Wrapped: leads tabel ───────────────────────────────────────────────
-- Voer uit via Supabase Dashboard → SQL Editor
-- Slaat e-mailadressen op na rekenvoorbeeld-consent.

CREATE TABLE IF NOT EXISTS wrapped_leads (
  id         uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz  DEFAULT now()             NOT NULL,
  email      text         NOT NULL,
  consent    boolean      NOT NULL DEFAULT false,
  rol        text,
  provincie  text
);

-- Unieke e-mails — upsert overschrijft consent + provincie als iemand twee keer invult
CREATE UNIQUE INDEX IF NOT EXISTS idx_wrapped_leads_email
  ON wrapped_leads (email);

-- Index op provincie voor segmentatie
CREATE INDEX IF NOT EXISTS idx_wrapped_leads_provincie
  ON wrapped_leads (provincie)
  WHERE provincie IS NOT NULL;

-- Row Level Security — alleen service-role mag schrijven/lezen
ALTER TABLE wrapped_leads ENABLE ROW LEVEL SECURITY;
