-- =====================================================================
-- ORGANISATIES MIGRATIE
-- Nieuwe tabellen: organizations, offices, organization_codes,
--                  onboarding_tokens (uitgebreid met org & office type)
-- =====================================================================

-- Verwijder bestaande tabellen indien aanwezig (bij herstarten)
-- DROP TABLE IF EXISTS organization_codes CASCADE;
-- DROP TABLE IF EXISTS offices CASCADE;
-- DROP TABLE IF EXISTS organizations CASCADE;

-- ── 1. Organizations ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organizations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT NOT NULL,               -- contactpersoon
  business_name               TEXT NOT NULL,
  email                       TEXT NOT NULL UNIQUE,
  password_hash               TEXT NOT NULL,
  service_type                TEXT NOT NULL,
  discount_description        TEXT NOT NULL,
  fee_per_customer            NUMERIC(10,2) NOT NULL DEFAULT 0,
  code_mode                   TEXT NOT NULL DEFAULT 'shared'  -- 'shared' | 'per_office'
                              CHECK (code_mode IN ('shared', 'per_office')),
  offices_have_own_description BOOLEAN NOT NULL DEFAULT FALSE,
  offices_have_own_billing    BOOLEAN NOT NULL DEFAULT FALSE,
  bundle_invoicing            BOOLEAN NOT NULL DEFAULT FALSE,
  vat_number                  TEXT,
  billing_address             TEXT,
  website                     TEXT,
  phone                       TEXT,
  notes                       TEXT,
  is_active                   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 2. Offices ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS offices (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,               -- contactpersoon
  business_name        TEXT NOT NULL,
  email                TEXT NOT NULL UNIQUE,
  password_hash        TEXT NOT NULL,
  province             TEXT NOT NULL
                       CHECK (province IN ('ANT','LIM','OVL','VBR','WVL')),
  discount_description TEXT,                        -- eigen aanbod indien offices_have_own_description
  fee_per_customer     NUMERIC(10,2),               -- overschrijft org fee indien ingesteld
  vat_number           TEXT,
  billing_address      TEXT,
  office_address       TEXT,
  website              TEXT,
  phone                TEXT,
  notes                TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, province)               -- max 1 kantoor per provincie per org
);

-- ── 3. Organization codes ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS organization_codes (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  office_id               UUID REFERENCES offices(id) ON DELETE SET NULL,  -- NULL voor shared mode
  order_id                UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id             UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  code                    TEXT NOT NULL UNIQUE,
  is_verified             BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at             TIMESTAMPTZ,
  verified_by_office_id   UUID REFERENCES offices(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Uitbreiden onboarding_tokens voor org & office type ────────────
ALTER TABLE onboarding_tokens
  ADD COLUMN IF NOT EXISTS token_type TEXT NOT NULL DEFAULT 'partner'
    CHECK (token_type IN ('partner', 'organization', 'office')),
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- ── 5. Indexen ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_offices_organization_id ON offices(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_codes_organization_id ON organization_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_codes_office_id ON organization_codes(office_id);
CREATE INDEX IF NOT EXISTS idx_org_codes_order_id ON organization_codes(order_id);
CREATE INDEX IF NOT EXISTS idx_org_codes_customer_id ON organization_codes(customer_id);
CREATE INDEX IF NOT EXISTS idx_org_codes_code ON organization_codes(code);
