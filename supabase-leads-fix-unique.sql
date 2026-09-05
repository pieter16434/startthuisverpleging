-- ═══════════════════════════════════════════════════════════════════════════
-- Fix: vervang functionele index door UNIQUE constraint op email
-- De API slaat altijd lowercase op, dus dit is veilig.
-- Uitvoeren in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Verwijder de functionele index (als die bestaat)
DROP INDEX IF EXISTS leads_email_lower_idx;

-- Voeg een echte UNIQUE constraint toe (nodig voor Supabase upsert / onConflict)
ALTER TABLE leads ADD CONSTRAINT leads_email_unique UNIQUE (email);
