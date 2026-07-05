-- Voeg contactgegevens voor kopers toe aan de partners tabel
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS office_address TEXT;
