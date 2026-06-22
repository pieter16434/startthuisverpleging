-- Adresgegevens op klant (optioneel, voor factuur)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS address_street      TEXT,
  ADD COLUMN IF NOT EXISTS address_postal_code TEXT,
  ADD COLUMN IF NOT EXISTS address_city        TEXT;

-- Factuurnummer op order (ingevuld na betaling)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE;
