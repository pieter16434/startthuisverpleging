# Prompt voor Claude Code — Opstartcheck als lead magnet live zetten

Kopieer alles onder de lijn en plak het in Claude Code in `C:\Users\piete\startthuisverpleging`.

---

Lees eerst CLAUDE.md en verken de codebase (`public/coming-soon.html`, `src/app/api/partner-inquiry/route.ts`, `src/app/api/checkout/route.ts`, `src/lib/resend/client.ts`, `src/lib/storage/pdf.ts`, `src/lib/supabase/server.ts`, `src/app/admin/dashboard/page.tsx`, de `supabase-*.sql` bestanden) voor je iets bouwt. Volg de bestaande conventies (zod-validatie, service-role Supabase client server-side, `export const dynamic = 'force-dynamic'` op routes die cookies lezen, Resend-mails in dezelfde huisstijl als de partner-inquiry mail).

## Doel

We lanceren binnenkort video-ads op Instagram/TikTok/Facebook die verwijzen naar een **gratis lead magnet: "De Opstartcheck"** (een pdf van 4–6 pagina's voor startende zelfstandige thuisverpleegkundigen). Bouw de volledige funnel: landingspagina → formulier met e-mail + provincie (beide verplicht) → lead opslaan in Supabase → automatische mail met downloadlink → admin-overzicht met leads per provincie. Het aantal leads per provincie is een verkoopargument in onze partnergesprekken ("in Limburg staan al 23 starters op de lijst"), dus provincie is geen optioneel veld.

Werk in deze volgorde en stop na elke fase kort om te tonen wat je deed, zodat ik kan bijsturen. Push niet naar GitHub; ik push zelf na review.

## Fase 1 — Database

Maak `supabase-leads-migration.sql` (zelfde stijl als de andere migraties, uitvoerbaar in de Supabase SQL Editor):

- Tabel `leads` met: `id uuid pk default gen_random_uuid()`, `email text not null`, `province province not null` (bestaande enum ANT/LIM/OVL/VBR/WVL), `profile text` (nullable; waarden `student` | `employed` — "net afgestudeerd" of "al in loondienst", optioneel veld), `source text` (utm_source of `direct`), `utm_campaign text`, `utm_content text`, `marketing_consent boolean not null default false`, `converted_order_id uuid references orders(id)` (nullable), `created_at timestamptz default now()`, `unsubscribed_at timestamptz`.
- Unieke index op `lower(email)` zodat een dubbele inschrijving geen tweede rij maakt (upsert: update provincie/source, verhoog niets, stuur de mail wel opnieuw).
- RLS aan, geen policies (enkel service role), exact zoals de andere tabellen.
- Een view of query voorbeeld in commentaar: aantal leads per provincie.

## Fase 2 — API-route `POST /api/opstartcheck`

- Zod-schema: `email` (email, lowercase/trim), `province` (enum ANT/LIM/OVL/VBR/WVL), `profile` optioneel, `consent` boolean optioneel, `utm_source`/`utm_campaign`/`utm_content` optioneel (max 80 tekens), en een honeypot-veld `website` dat leeg moet zijn (bij invulling: antwoord 200 maar sla niets op).
- Eenvoudige rate limiting per IP in memory (bv. max 5 requests per 10 minuten) om misbruik van de mail-verzending te beperken; geen externe dienst.
- Upsert in `leads` via de service-role client.
- Stuur met Resend een mail naar de lead: onderwerp "Je Opstartcheck staat klaar", huisstijl identiek aan de bestaande mails (groen #2A3D2E, crème, dezelfde tabel-layout), afzender `RESEND_FROM_EMAIL`. Inhoud: één alinea welkom, een grote knop "Download de Opstartcheck" met een **signed URL (7 dagen)** naar het bestand `opstartcheck.pdf` in de bestaande private bucket `guides` (gebruik `getSignedPdfUrl` uit `src/lib/storage/pdf.ts`; als het bestand ontbreekt: log een waarschuwing, stuur de mail zonder link met de tekst "we sturen hem binnen 24u" en mail de admin). Daarna één korte alinea over de volledige gids: introductieprijs €50 t.e.m. 30 sept 2026 (normaal €85), 30 dagen geld-terug-garantie, link naar `https://startthuisverpleging.be/#wachtlijst`. Onderaan: "Je ontvangt deze mail omdat je de Opstartcheck aanvroeg. Geen interesse meer? Antwoord met 'stop'." plus hallo@startthuisverpleging.be.
- Stuur een korte notificatiemail naar `ADMIN_NOTIFICATION_EMAIL`: "Nieuwe lead — [provincie]" met e-mail, profiel, bron en de nieuwe totaalteller voor die provincie.
- Antwoord altijd `{ ok: true }` bij succes; bij validatiefout 400 met een Nederlandse foutmelding die de frontend kan tonen.

## Fase 3 — Landingspagina `/opstartcheck`

Maak een aparte pagina op `/opstartcheck` (mag een React page in `src/app/opstartcheck/page.tsx` zijn met eigen styling, of raw HTML geserveerd zoals de homepage — kies wat het snelst consistent is met de huisstijl en licht je keuze toe). Dit is de pagina waar de ads naartoe linken, dus:

- **Boven de vouw op mobiel (9:16 telefoon)** staan: de titel "De Opstartcheck", de ondertitel "Zelfstandig thuisverpleegkundige worden in Vlaanderen — de documenten, de volgorde en de fouten die je duizenden euro's kosten", de regel "Gratis · pdf · door twee thuisverpleegkundigen die het in 2024 zelf deden", en het formulier. Geen navigatiebalk, geen afleiding; één doel.
- Formulier: e-mail (verplicht), provincie als 5 grote tapbare knoppen of een select (verplicht: Antwerpen, Limburg, Oost-Vlaanderen, Vlaams-Brabant, West-Vlaanderen), optioneel "Wat is jouw situatie?" met twee keuzes (Net afgestudeerd / Al in loondienst), een checkbox "Hou me op de hoogte over de volledige gids en partnervoordelen in mijn provincie" (niet verplicht; dit is `marketing_consent`), verborgen honeypot-veld, verborgen utm-velden die uit de URL-querystring gelezen worden (`utm_source`, `utm_campaign`, `utm_content`). Knop: "Stuur mij de Opstartcheck". Onder de knop: "Je krijgt de pdf binnen één minuut in je mailbox. Geen spam." en een link naar `/privacy`.
- Provincie is verplicht: zonder provincie kan de knop niet verzonden worden en toont het formulier een duidelijke melding.
- Na succes: vervang het formulier door een bevestiging "Check je mailbox (ook je spam-map). Je Opstartcheck is onderweg." met daaronder een rustige tweede stap: "Wil je het volledige stappenplan? De gids kost nu €50 in plaats van €85, met 30 dagen geld-terug-garantie" en een knop naar `/#wachtlijst`. Voeg hier ook een `gtag`/Vercel Analytics custom event `opstartcheck_lead` toe met de provincie als property (Vercel Analytics is of wordt geïnstalleerd; als het pakket ontbreekt, voeg `@vercel/analytics` toe en initialiseer het in `layout.tsx`).
- Onder de vouw, kort: drie bullets over wat in de check staat (Stap 1 · Ken je vertrekpunt: student of in loondienst, en waarom eenmanszaak voor 90% van de starters de juiste keuze is; de documenten en de volgorde: visum, RIZIV-nummer, KBO, sociaal verzekeringsfonds, zakelijke rekening; de drie fouten die je €300, €1.000 en €800 per jaar kosten), één blok "Wie schreef dit" (Pieter Vanermen & Jonas Piron, zelfstandig thuisverpleegkundigen bij Domus Care, gestart in 2024), en het formulier nog een tweede keer.
- Huisstijl van de homepage: kleuren #2A3D2E (groen), #E8D08A (goud), #B65436 (terracotta), #FDFAF4/#F7F3EA (crème), #1A1A17 (inkt), dezelfde display-serif en body-font als `coming-soon.html` (kijk welke fontvariabelen daar gebruikt worden en hergebruik ze). Volledig responsive, snel (geen zware libraries), en `<title>` + Open Graph-tags: "Gratis Opstartcheck — zelfstandig thuisverpleegkundige worden in Vlaanderen".

## Fase 4 — Blok op de homepage

Voeg in `public/coming-soon.html` een compacte sectie toe, net vóór de sectie "08 / Bestel nu" (`#wachtlijst`), met id `#opstartcheck`: titel "Nog niet klaar om te kopen? Begin gratis.", één zin over de Opstartcheck, en een inline mini-formulier met e-mail + provincie-select + knop "Stuur mij de Opstartcheck", dat naar dezelfde API-route post en dezelfde succesmelding toont. Hergebruik de bestaande formulierstijlen (`.waitlist-form`) en de bestaande JS-structuur; verwijder of vervang de oude Formspark-wachtlijsthandler alleen als hij nergens meer gebruikt wordt (controleer dat eerst). Voeg "Gratis Opstartcheck" toe aan de navigatie van de homepage.

## Fase 5 — Admin dashboard: tab "Leads"

In `src/app/admin/dashboard/page.tsx` en een nieuwe route `GET /api/admin/leads` (admin-auth zoals de andere admin-routes):

- Bovenaan vijf tellers: leads per provincie (ANT, LIM, OVL, VBR, WVL) met de volledige provincienaam, plus totaal en aantal van de laatste 7 dagen. Dit is het getal dat ik in partnergesprekken gebruik, dus groot en duidelijk.
- Daaronder een tabel: e-mail, provincie, profiel, bron/utm, consent, datum, en of de lead intussen klant werd (match op e-mail met `customers`/`orders` met status paid; vul dan ook `converted_order_id`). Toon conversiepercentage per provincie.
- Knop "Exporteer CSV" (alle leads, of gefilterd op provincie) via `GET /api/admin/leads/export`, in de stijl van de bestaande `export-emails` route.
- Filter op provincie en op consent = true.

## Fase 6 — Randzaken

- Update `/privacy` met één alinea over de Opstartcheck: welke gegevens (e-mail, provincie, situatie, bron), doel (pdf verzenden en, met toestemming, informatie over de gids en partnervoordelen), bewaartermijn, en hoe je je uitschrijft.
- Voeg aan CLAUDE.md een korte sectie "Lead magnet (Opstartcheck)" toe: tabel, route, pagina, bucketpad `guides/opstartcheck.pdf`, en dat de pdf handmatig moet geüpload worden (of breid `scripts/upload-pdfs.mjs` uit zodat het ook `opstartcheck.pdf` uploadt).
- Voeg `.env.local.example`-documentatie toe als je een nieuwe env-variabele nodig hebt; probeer er geen nodig te hebben.

## Afwerking

- Draai `npm run lint` en `npm run build`; los alle fouten op.
- Test lokaal met `npm run dev`: inschrijving met en zonder provincie, dubbele inschrijving, honeypot gevuld, utm-parameters in de URL (`/opstartcheck?utm_source=instagram&utm_campaign=muur&utm_content=hookA`), admin-tab met tellers en CSV-export.
- Geef me op het einde een korte checklist van wat ik zelf nog moet doen: SQL uitvoeren in Supabase, `opstartcheck.pdf` uploaden naar de bucket `guides`, eventueel env-vars in Vercel, en de link-in-bio zetten op `startthuisverpleging.be/opstartcheck?utm_source=instagram`.

Vraag me eerst kort bevestiging van je plan (welke bestanden je maakt of wijzigt) voor je begint met fase 1.
