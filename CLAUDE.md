# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Projectoverzicht

**startthuisverpleging.be** is een Belgische webshop die een digitale gids verkoopt voor thuisverpleegkundigen die zelfstandig willen starten in Vlaanderen. De gids kost €45 (introductieprijs t.e.m. 31 december 2026, daarna €85) en wordt direct na betaling als PDF afgeleverd.

**Eigenaar:** Pieter Vanermen — niet-developer, werkt samen met Claude Code voor alle technische aanpassingen.

---

## Tech stack

| Onderdeel | Technologie |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| Betalingen | Mollie |
| E-mail | Resend |
| Hosting | Vercel (Hobby plan) |
| Analytics | TikTok Pixel + Events API, Meta Pixel + Conversions API |
| Validatie | Zod |

---

## Architectuur

### Homepage

`public/coming-soon.html` — **statische HTML-pagina** die Vercel serveert als root (`/`). Next.js layout/components zijn hier **niet** actief. TikTok pixel, formulieren en JS staan allemaal inline in dit bestand. Wijzigingen hier vereisen geen build.

### Database-tabellen (Supabase)

```
leads         email, first_name, province, profile, source, utm_*, marketing_consent,
              nurture_step (int, default 0), unsubscribed_at, created_at

customers     email, first_name, last_name, province, address_*, marketing_consent

orders        customer_id, amount_cents, status (pending|paid|failed|expired|refunded),
              discount_code, influencer_id, mollie_payment_id, created_at

influencers   email, first_name, last_name, discount_code, is_active, deactivated_at,
              commission_rate, iban, ...

partners      naam, email, discount_code, province, ...

organizations naam, email, ...

offices       organization_id, naam, ...
```

De Supabase service role client (`createServiceClient`) omzeilt RLS en wordt uitsluitend in API routes gebruikt.

---

## API routes

### Klant-flow

| Route | Methode | Functie |
|---|---|---|
| `/api/opstartcheck` | POST | Lead aanmaken, bevestigingsmail + PDF sturen |
| `/api/checkout` | POST | Klant + order aanmaken, Mollie betaling starten |
| `/api/webhooks/mollie` | POST | Betaling verwerken, PDF-mail sturen, TikTok + Meta Purchase event |
| `/api/validate-code` | POST | Kortingscode valideren (VRIEND20 of influencer code) |
| `/api/unsubscribe` | GET | HMAC-gebaseerde uitschrijflink verwerken |
| `/api/refund-request` | POST | Terugbetalingsverzoek indienen |
| `/api/partner-inquiry` | POST | Partner contactformulier |

### E-mail automation

| Route | Methode | Functie |
|---|---|---|
| `/api/cron/nurture` | GET | Dagelijkse nurture-mails (dag 2, 4, 6 na inschrijving) |

### Admin dashboard

Alle routes onder `/api/admin/*` zijn beveiligd met `ADMIN_JWT_SECRET`.

### Partner portaal

Alle routes onder `/api/partner/*` zijn beveiligd met `PARTNER_JWT_SECRET`.

### Influencer portaal

Alle routes onder `/api/influencer/*` zijn beveiligd met JWT.

### Office/Organization portaal

Alle routes onder `/api/office/*` en `/api/organization/*` zijn beveiligd met `OFFICE_JWT_SECRET` / `ORGANIZATION_JWT_SECRET`.

---

## E-mail automation — nurture sequence

Na inschrijving op de Opstartcheck ontvangen leads 3 follow-up mails:

| Mail | Dag | Onderwerp |
|---|---|---|
| 1 | +2 | "De fout die starters €2.100 per jaar kost" |
| 2 | +4 | "Wat je krijgt voor €45 (en waarom het zichzelf terugbetaalt)" |
| 3 | +6 | "Na 31 december betaal je €40 meer" |

**Logica:** Vercel Cron Job draait dagelijks om 08:00 UTC. De cron kijkt welke leads `nurture_step = N-1` hebben en minstens N×2 dagen geleden inschreven. Buyers (orders met status `paid`) worden overgeslagen. Na versturen wordt `nurture_step` verhoogd.

**Uitschrijven:** HMAC-SHA256 token via `src/lib/email/unsubscribe.ts`. Elke mail heeft een uitschrijflink onderaan. Na klikken wordt `unsubscribed_at` gezet in de `leads` tabel.

---

## Betalingsflow

1. Klant vult checkout-formulier in → `/api/checkout`
2. Klant + order worden aangemaakt in Supabase (status: `pending`)
3. Mollie betaling aangemaakt → klant krijgt redirect naar Mollie
4. Na betaling: Mollie stuurt webhook naar `/api/webhooks/mollie`
5. Order status → `paid`, PDF-download mail wordt verstuurd
6. TikTok Purchase event wordt gefired (server-side)

**Kortingscodes:**
- `VRIEND20` (of waarde van `REFERRAL_CODE` env var) — 20% korting, eenmalig per e-mail
- Influencer codes — 20% korting, tracked via `influencer_id` op de order

---

## Prijs logica

```typescript
// In /api/checkout/route.ts
const INTRO_PRICE_ENDS = new Date('2026-12-31T23:59:59+01:00')
const isIntro = new Date() < INTRO_PRICE_ENDS
const BASE_CENTS = isIntro ? 4500 : 8500  // €45 of €85
const DISC_CENTS = isIntro ? 3600 : 6800  // €36 of €68 (20% korting)
```

De prijs schakelt automatisch over op 1 januari 2027.

---

## Meta tracking

**Browser-side pixel:** inline script in `public/coming-soon.html`  
Pixel ID: `1885798712582280` (hardcoded in HTML; op server via `META_PIXEL_ID`)

- `fbq('init')` + `fbq('track', 'PageView')` laden **alleen na cookietoestemming** (`__grantCookieConsent()`).
- `ViewContent` — IntersectionObserver op `#wachtlijst` (eenmalig, na consent).
- `Lead` — na succesvol indienen Opstartcheck-formulier; `event_id` via `crypto.randomUUID()`.
- `InitiateCheckout` — vlak vóór redirect naar Mollie; `event_id` via `crypto.randomUUID()`.
- `Purchase` — op `/checkout/success` via React client component (`MetaPurchaseFirer`); `event_id = "purchase_<orderId>"`.

**Server-side Conversions API:** `src/lib/meta/capi.ts`  
Graph API versie: `v21.0` (controleer periodiek op updates).

- `Lead` → `/api/opstartcheck` (deduplication via `meta_event_id` uit body)
- `InitiateCheckout` → `/api/checkout` (deduplication via `meta_event_id` uit body)
- `Purchase` → `/api/webhooks/mollie` na bevestigde betaling; `event_id = "purchase_<orderId>"` (matcht browser)

**Tracking data opslaan:** kolommen `tracking_fbp`, `tracking_fbc`, `tracking_ip`, `tracking_ua` op de `orders` tabel (vereist Supabase-migratie: `supabase/migrations/20261017_orders_tracking_columns.sql`).

---

## TikTok tracking

**Browser-side pixel:** inline script in `public/coming-soon.html`  
Pixel ID: `DAN6VT3C77U5PB5VV910`

**Server-side Events API:** `src/lib/tiktok/events.ts`
- `trackInitiateCheckout()` → gefired in `/api/checkout`
- `trackPurchase()` → gefired in `/api/webhooks/mollie` na bevestigde betaling

---

## Lib helpers

| Bestand | Functie |
|---|---|
| `src/lib/supabase/server.ts` | Service role Supabase client (server-only) |
| `src/lib/supabase/client.ts` | Anon Supabase client (client-side) |
| `src/lib/resend/client.ts` | Resend e-mail client |
| `src/lib/mollie/client.ts` | Mollie betaalclient |
| `src/lib/tiktok/events.ts` | TikTok Events API helpers |
| `src/lib/meta/capi.ts`    | Meta Conversions API helper (`sendMetaEvent`) |
| `src/lib/email/unsubscribe.ts` | HMAC unsubscribe token generatie + verificatie |
| `src/lib/storage/pdf.ts` | Signed URL generator voor PDFs (1 jaar geldig) |
| `src/lib/admin/auth.ts` | JWT verificatie admin |
| `src/lib/partner/auth.ts` | JWT verificatie partner portaal |
| `src/lib/influencer/auth.ts` | JWT verificatie influencer portaal |
| `src/lib/office/auth.ts` | JWT verificatie office portaal |
| `src/lib/organization/auth.ts` | JWT verificatie organization portaal |

---

## Omgevingsvariabelen

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Mollie
MOLLIE_API_KEY            # test_ prefix voor test, live_ voor productie

# Resend
RESEND_API_KEY
RESEND_FROM_EMAIL         # hallo@startthuisverpleging.be

# Admin
ADMIN_NOTIFICATION_EMAIL  # pieter@domuscare.be
ADMIN_PASSWORD
ADMIN_JWT_SECRET

# Auth secrets (portalen)
PARTNER_JWT_SECRET
OFFICE_JWT_SECRET
ORGANIZATION_JWT_SECRET

# TikTok
NEXT_PUBLIC_TIKTOK_PIXEL_ID   # DAN6VT3C77U5PB5VV910
TIKTOK_EVENTS_ACCESS_TOKEN

# Meta
META_PIXEL_ID                 # 1885798712582280 (optioneel — hardcoded als fallback)
META_CAPI_ACCESS_TOKEN        # Vercel Production only
META_TEST_EVENT_CODE          # optioneel — voor Meta Events Manager testmodus

# E-mail automation
UNSUBSCRIBE_SECRET        # HMAC geheim voor uitschrijflinks
CRON_SECRET               # Vercel stuurt dit mee bij cron calls

# Overig
NEXT_PUBLIC_BASE_URL      # https://startthuisverpleging.be
REFERRAL_CODE             # standaard: VRIEND20
```

---

## Commands

```bash
npm run dev       # lokale development server
npm run build     # productie build (voer uit voor pushen)
npx tsc --noEmit  # TypeScript type check zonder build
```

**Altijd `npx tsc --noEmit` uitvoeren voor `git push`** om build-errors op Vercel te voorkomen.

---

## Vercel Cron Jobs

Geconfigureerd in `vercel.json`:
```json
{ "path": "/api/cron/nurture", "schedule": "0 8 * * *" }
```
Draait dagelijks om 08:00 UTC (= 10:00 Belgische tijd). Vercel stuurt automatisch `Authorization: Bearer <CRON_SECRET>` mee.

---

## Belangrijke aandachtspunten

- `public/coming-soon.html` is een statisch bestand — Next.js layout is hier **niet** actief. TikTok pixel, formulier-JS en styles staan allemaal inline in dit bestand.
- De Supabase service role client omzeilt RLS — nooit in client-side code gebruiken.
- `marketing_consent` staat voor alle bestaande leads op `false` (geen zichtbare checkbox in het formulier). Filter hier **niet** op voor de nurture-mails — dan gaan er nooit mails uit.
- De introductieprijs (€45) vervalt automatisch op 1 januari 2027 — geen code-aanpassing nodig.
- Mollie webhook is niet geauthenticeerd via signature — de betalingsstatus wordt opgehaald via de Mollie API (niet vertrouwd op de webhook payload zelf).
