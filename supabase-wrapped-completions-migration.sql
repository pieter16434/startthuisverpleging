-- ─── Zorg Wrapped: completions tabel ────────────────────────────────────────
-- Voer uit via Supabase Dashboard → SQL Editor
-- Privacy: naam en e-mail worden NIET opgeslagen.

CREATE TABLE IF NOT EXISTS wrapped_completions (
  id               uuid         DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at       timestamptz  DEFAULT now()             NOT NULL,

  -- Rol (verplicht)
  rol              text         NOT NULL,

  -- Locatie / school (voor standings in Fase 12)
  provincie        text,
  hogeschool       text,

  -- Antwoorden (voor toekomstige analyse, geen persoonlijke data)
  superkracht      text,
  afdeling         text,
  tewerkstelling   text,
  nachtdiensten    integer      NOT NULL DEFAULT 0,
  weekends         integer               DEFAULT 0,
  patienten_keuze  text,
  stappen          integer,
  stage_uren       integer,

  CONSTRAINT wrapped_rol_check CHECK (rol IN ('ziekenhuis', 'student'))
);

-- Indexen voor tellers per provincie en hogeschool (Fase 12)
CREATE INDEX IF NOT EXISTS idx_wrapped_provincie
  ON wrapped_completions (provincie)
  WHERE provincie IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_wrapped_hogeschool
  ON wrapped_completions (hogeschool)
  WHERE hogeschool IS NOT NULL;

-- Row Level Security — alleen service-role mag schrijven/lezen
-- (alle writes gaan via de /api/wrapped/complete API-route)
ALTER TABLE wrapped_completions ENABLE ROW LEVEL SECURITY;
