-- ============================================================
-- startthuisverpleging — Database schema
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ENUMS
CREATE TYPE province AS ENUM ('ANT', 'LIM', 'OVL', 'VBR', 'WVL');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'refunded', 'failed');

-- Kopers van de gids
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  province province,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Aankopen
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  mollie_payment_id TEXT UNIQUE,
  amount_cents INTEGER NOT NULL DEFAULT 8500,
  status order_status DEFAULT 'pending',
  refund_eligible BOOLEAN DEFAULT TRUE,
  pdf_main_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Alleen toegankelijk via service role key (server-side)
-- Geen publieke policies nodig voor Fase 1
