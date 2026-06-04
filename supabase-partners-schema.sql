-- ============================================================
-- startthuisverpleging — Partnersysteem schema
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- Partners tabel
CREATE TABLE partners (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 TEXT NOT NULL,                   -- Volledige naam contact
  business_name        TEXT NOT NULL,                   -- Naam van het bedrijf
  email                TEXT UNIQUE NOT NULL,             -- Login e-mail
  password_hash        TEXT NOT NULL,                   -- bcrypt hash (ingesteld door admin)
  province             province NOT NULL,               -- In welke provincie actief
  service_type         TEXT NOT NULL,                   -- "Boekhouder", "Verzekeringsmakelaar", ...
  discount_description TEXT NOT NULL,                   -- Wat zij aanbieden aan klanten (bv. "Gratis eerste adviesgesprek")
  fee_per_customer     DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Wat Pieter per geverifieerde klant factureert
  is_active            BOOLEAN DEFAULT TRUE,
  notes                TEXT,                            -- Interne notities voor admin
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Unieke codes per klant per partner (gegenereerd bij aankoop)
CREATE TABLE partner_codes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  code         TEXT UNIQUE NOT NULL,   -- Unieke code bv. "STH-LIM-A3B9K2"
  is_verified  BOOLEAN DEFAULT FALSE,
  verified_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, order_id)         -- 1 code per partner per bestelling
);

CREATE INDEX idx_partner_codes_partner  ON partner_codes(partner_id);
CREATE INDEX idx_partner_codes_code     ON partner_codes(code);
CREATE INDEX idx_partner_codes_order    ON partner_codes(order_id);
CREATE INDEX idx_partner_codes_verified ON partner_codes(is_verified);

-- Row Level Security
ALTER TABLE partners      ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_codes ENABLE ROW LEVEL SECURITY;
-- Toegang alleen via service role key (server-side API routes)
