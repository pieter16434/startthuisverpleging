-- ═══════════════════════════════════════════════════════════════════════════
-- Migratie: Leads tabel (Opstartcheck lead magnet)
-- Uitvoeren in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Leads tabel
CREATE TABLE IF NOT EXISTS leads (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  email             text        NOT NULL,
  province          province    NOT NULL,  -- bestaande enum: ANT/LIM/OVL/VBR/WVL
  profile           text        CHECK (profile IN ('student', 'employed') OR profile IS NULL),
  source            text,                  -- utm_source of 'direct'
  utm_campaign      text,
  utm_content       text,
  marketing_consent boolean     NOT NULL DEFAULT FALSE,
  converted_order_id uuid       REFERENCES orders(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at   timestamptz
);

-- Unieke index op lowercase email: dubbele inschrijving maakt geen 2e rij (upsert)
CREATE UNIQUE INDEX IF NOT EXISTS leads_email_lower_idx ON leads (lower(email));

-- RLS aan, geen policies (enkel service role)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- ─── Voorbeeld-query: leads per provincie ───────────────────────────────────
-- SELECT province, COUNT(*) AS total
-- FROM leads
-- WHERE unsubscribed_at IS NULL
-- GROUP BY province
-- ORDER BY total DESC;
