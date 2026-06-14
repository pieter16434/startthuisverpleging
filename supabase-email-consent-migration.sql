-- Marketingtoestemming kolom aan customers tabel
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS marketing_consent BOOLEAN NOT NULL DEFAULT false;
