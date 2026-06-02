# startthuisverpleging — Claude Code context

## Project
Belgische webshop die een PDF-gids verkoopt aan startende thuisverpleegkundigen (€85).
Volledig architectuurdocument: zie OneDrive → Pensioen/PDF/coming soon versie/ARCHITECTUUR.md

## Eigenaar
Pieter Vanermen & Jonas Piron — Domus Care
Admin email: pieter@domuscare.be
Contact: hallo@startthuisverpleging.be

## Huidige fase
**Fase 0 — Coming soon**: `index.html` staat live op startthuisverpleging.be via Vercel + GitHub.
Wachtlijst-form gebruikt Formspark (submit-form.com, form ID: hzzGRrLC8).

## Repositories & deployment
- GitHub: https://github.com/pieter16434/startthuisverpleging
- Hosting: Vercel (gekoppeld aan domein startthuisverpleging.be)
- Push naar GitHub triggert automatisch Vercel deployment

## Commando's
- **"push to github"** → `git add -A && git commit -m "..." && git push origin main`
  (git push is automatisch toegestaan zonder permission prompt)

## Tech stack (voor de volledige Next.js app — nog niet gebouwd)
Zie ARCHITECTUUR.md secties 2–15. Bouw in volgorde van de implementatiefases.

## Belangrijk
- Werkdirectory: `C:\Users\piete\startthuisverpleging`
- Vorige code stond in OneDrive — niet meer gebruiken voor dit project
- Directe wijzigingen in GitHub vermijden — altijd lokaal werken en pushen
