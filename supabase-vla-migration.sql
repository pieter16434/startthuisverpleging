-- Voeg 'VLA' (Vlaanderen) toe aan het province enum
-- Uitvoeren in: Supabase Dashboard → SQL Editor → New query
ALTER TYPE province ADD VALUE IF NOT EXISTS 'VLA';
