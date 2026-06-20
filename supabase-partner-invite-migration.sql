-- Partner uitnodigingslinks: token voor wachtwoord instellen / resetten
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS invite_token TEXT,
  ADD COLUMN IF NOT EXISTS invite_token_expires_at TIMESTAMPTZ;

-- Wachtwoord mag null zijn (partner stelt het zelf in via uitnodigingslink)
ALTER TABLE partners
  ALTER COLUMN password_hash DROP NOT NULL;
