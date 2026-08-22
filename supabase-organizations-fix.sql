-- =====================================================================
-- ORGANISATIES AANVULLENDE MIGRATIE
-- Voer dit uit NAAST de eerste SQL die je al hebt gedraaid.
-- Gebruikt IF NOT EXISTS zodat niets twee keer wordt aangemaakt.
-- =====================================================================

-- ── 1. Org onboarding tokens (voor stap: admin genereert link voor org)
CREATE TABLE IF NOT EXISTS organization_onboarding_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token       TEXT UNIQUE NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. Kantoren tabel (let op: heet organization_offices, niet offices)
CREATE TABLE IF NOT EXISTS organization_offices (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name                 TEXT NOT NULL,
  business_name        TEXT NOT NULL,
  email                TEXT NOT NULL UNIQUE,
  password_hash        TEXT NOT NULL,
  province             TEXT NOT NULL
                       CHECK (province IN ('ANT','LIM','OVL','VBR','WVL')),
  discount_description TEXT,
  fee_per_customer     NUMERIC(10,2),
  vat_number           TEXT,
  billing_address      TEXT,
  office_address       TEXT,
  website              TEXT,
  phone                TEXT,
  notes                TEXT,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (organization_id, province)
);

-- ── 3. Organisatiecodes (aangemaakt bij aankoop van de gids)
CREATE TABLE IF NOT EXISTS organization_codes (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id       UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  office_id             UUID REFERENCES organization_offices(id) ON DELETE SET NULL,
  order_id              UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id           UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  code                  TEXT NOT NULL UNIQUE,
  is_verified           BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at           TIMESTAMPTZ,
  verified_by_office_id UUID REFERENCES organization_offices(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 4. Indexen
CREATE INDEX IF NOT EXISTS idx_org_offices_org_id ON organization_offices(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_codes_org_id   ON organization_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_codes_code      ON organization_codes(code);
CREATE INDEX IF NOT EXISTS idx_org_codes_order_id  ON organization_codes(order_id);
