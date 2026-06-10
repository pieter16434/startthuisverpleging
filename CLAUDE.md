# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Belgian webshop selling a PDF guide (€50 intro price, normally €85) to starting self-employed home nurses in Flanders. Owners: Pieter Vanermen & Jonas Piron (Domus Care).

- **Live site**: startthuisverpleging.be
- **GitHub**: https://github.com/pieter16434/startthuisverpleging
- **Hosting**: Vercel — auto-deploys on every push to `main`
- **Working directory**: `C:\Users\piete\startthuisverpleging`
- **Admin email**: pieter@domuscare.be
- **Contact email**: hallo@startthuisverpleging.be

## Commands

```bash
npm run dev      # local development (port 3000)
npm run build    # production build + type check (always run before pushing)
npm run lint     # ESLint check
```

**"push to github"** command (pre-approved, no prompt):
```bash
git add -A && git commit -m "..." && git push origin main
```

Always run `npm run build` before pushing to catch TypeScript/lint errors.

## Architecture

### Landing page strategy
The main page at `/` is **not** a React page. `src/app/route.ts` reads `public/coming-soon.html` and serves it as raw HTML. This avoids converting a 2500-line branded HTML file to React. All frontend JS (modal, forms) lives inside that HTML file.

### Payment flow
1. User fills checkout modal → `POST /api/checkout` → creates `customers` + `orders` rows in Supabase, creates Mollie payment, returns `{ payment_url }`
2. User completes payment on Mollie → Mollie calls `POST /api/webhooks/mollie`
3. Webhook: marks order paid → generates partner codes per province → generates codebook PDF → uploads to Supabase Storage → sends branded emails to customer + admin

### Partner system
Partners (accountants, insurance brokers, etc.) serve customers who buy the guide. The flow:
- Admin creates partners via `/admin/dashboard` with province, fee per customer, and discount description
- When a customer buys → unique codes generated per partner in their province (format: `STH-LIM-A3B9K2`) stored in `partner_codes` table
- Customer receives a personalized codebook PDF with their unique codes per partner
- Partner logs into `/partner` → verifies codes customers show them → admin sees verified count for invoicing

### Authentication
Two separate JWT-based auth systems, both using HTTP-only cookies:
- **Admin** (`/admin`): single shared password via `ADMIN_PASSWORD` env var → `admin_session` cookie
- **Partner** (`/partner`): email + bcrypt password stored in `partners` table → `partner_session` cookie

Auth helpers: `src/lib/admin/auth.ts` and `src/lib/partner/auth.ts`. All protected API routes must add `export const dynamic = 'force-dynamic'` (required because they read cookies, which prevents static rendering).

### PDF delivery
- **Main guide**: static file uploaded once to Supabase Storage bucket `guides` as `main-guide.pdf`. Webhook generates a signed URL (7-day expiry) if it exists.
- **Codebook**: dynamically generated per customer using `@react-pdf/renderer` in `src/lib/pdf/codebook.tsx`. Uploaded to `guides/codebooks/orders/{orderId}.pdf`. Contains partner name, service, discount description, and the customer's unique code per partner.
- If main guide is not yet uploaded when a customer pays, the webhook sends a "coming soon" email. Admin can manually trigger delivery via "Stuur PDF" button in `/admin/dashboard` → calls `POST /api/admin/orders/[id]`.

### Key lib files
| File | Purpose |
|------|---------|
| `src/lib/supabase/server.ts` | Service role client (bypasses RLS) — server-side only |
| `src/lib/supabase/client.ts` | Anon client — safe for client components |
| `src/lib/mollie/client.ts` | Mollie API client |
| `src/lib/resend/client.ts` | Resend email client |
| `src/lib/storage/pdf.ts` | Supabase Storage helpers + signed URL generation |
| `src/lib/pdf/codebook.tsx` | PDF generator using @react-pdf/renderer |
| `src/lib/admin/auth.ts` | Admin JWT sign/verify/cookie helpers |
| `src/lib/partner/auth.ts` | Partner JWT sign/verify/cookie helpers |

## Database (Supabase)

Schema files: `supabase-schema.sql` (Fase 1) and `supabase-partners-schema.sql` (Fase 2). Run in Supabase SQL Editor. RLS is enabled on all tables — only accessible via service role key.

**Tables**: `customers`, `orders`, `partners`, `partner_codes`

**Enums**: `province` (ANT/LIM/OVL/VBR/WVL), `order_status` (pending/paid/refunded/failed)

**Supabase Storage**: private bucket `guides`. Paths:
- `main-guide.pdf` — the main guide (upload manually)
- `codebooks/orders/{orderId}.pdf` — auto-generated per customer

## Environment variables

All required vars (set in `.env.local` locally and in Vercel for production):

```
NEXT_PUBLIC_BASE_URL          # https://startthuisverpleging.be
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Supabase anon key (safe for client)
SUPABASE_SERVICE_ROLE_KEY     # Supabase service role — server-side only, never expose
MOLLIE_API_KEY                # test_... for testing, live_... for production
RESEND_API_KEY                # Resend API key
RESEND_FROM_EMAIL             # hallo@startthuisverpleging.be
ADMIN_NOTIFICATION_EMAIL      # pieter@domuscare.be
ADMIN_PASSWORD                # Shared password for /admin login
ADMIN_JWT_SECRET              # Secret for signing admin session JWTs
PARTNER_JWT_SECRET            # Secret for signing partner session JWTs
CRON_SECRET                   # For future cron jobs
```

## Current state & roadmap

**Live and working:**
- Full purchase flow (€50, Mollie live)
- Automatic codebook PDF generation and email delivery
- Partner portal (`/partner`) with code verification
- Admin dashboard (`/admin`) — partners, orders, invoicing, PDF delivery
- Legal pages: `/voorwaarden`, `/privacy`, `/terugbetaling`
- Waitlist form via Formspark (form ID: `hzzGRrLC8`)

**Pending (requires PDF file):**
- Upload `main-guide.pdf` to Supabase Storage `guides` bucket
- After upload, all future orders are fully automatic

**Future phases:**
- Fase 3: Refund flow, invoice generation
- Fase 4: Rate limiting, GDPR pages, 2FA for admin, cron for expired links

## Important constraints

- `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS — never use in client components or expose to browser
- Partners are added manually by admin via dashboard — no public registration
- Admin accounts (Pieter + Jonas) share one password — no public admin registration endpoint
- `MOLLIE_API_KEY` starts with `test_` for testing, `live_` for production — switch in Vercel env vars
- `.env.local` is gitignored — never commit it
