-- Kortingscode kolom aan orders tabel
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS discount_code TEXT;

-- Deactivatiedatum kolom aan partners tabel (voor 3-maanden grace period)
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
