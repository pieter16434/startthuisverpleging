// Alle aanpasbare aannames voor Zorg Wrapped — Pieter kan deze waarden aanpassen
// zonder dat hij de rest van de code hoeft te begrijpen.

export const WRAPPED_YEAR = process.env.NEXT_PUBLIC_WRAPPED_YEAR ?? '2026'

// ─── Berekeningen: aannames ───────────────────────────────────────────────────
export const DIENSTEN_PER_JAAR_VOLTIJDS = 200   // schatting voor 100%, na verlof
export const UREN_PER_NACHTDIENST = 8
export const METER_PER_STAP = 0.7
export const MAX_STAPPEN_PER_DIENST = 40_000    // boven dit: vriendelijke waarschuwing

export const PATIENTEN_PER_KEUZE: Record<string, number> = {
  '<8':    6,
  '8-12':  10,
  '12-16': 14,
  '16+':   18,
}

// Sleutels moeten overeenkomen met Vraag 2b in de vragenflow
export const TEWERKSTELLING: Record<string, number> = {
  '50%':  0.50,
  '75%':  0.75,
  '80%':  0.80,
  '100%': 1.00,
}

// ─── Afstandsvergelijkingen (km over de weg vanuit Brussel, afgerond) ─────────
export const AFSTANDEN: Array<{ label: string; km: number }> = [
  { label: 'Brussel–Amsterdam',  km: 210 },
  { label: 'Brussel–Parijs',     km: 310 },
  { label: 'Brussel–Londen',     km: 370 },
  { label: 'Brussel–Berlijn',    km: 780 },
  { label: 'Brussel–Barcelona',  km: 1350 },
  { label: 'Brussel–Rome',       km: 1500 },
  { label: 'Brussel–Lissabon',   km: 2050 },
]

// ─── Superkrachten ────────────────────────────────────────────────────────────
export const SUPERKRACHTEN = [
  {
    slug: 'rots',
    naam: 'De Rots in de Branding',
    uitleg: 'Als alles misloopt, blijf jij kalm.',
    icoon: '⚓',
  },
  {
    slug: 'nachtuil',
    naam: 'De Nachtuil',
    uitleg: 'Om 3 uur \'s nachts op je scherpst.',
    icoon: '🦉',
  },
  {
    slug: 'grappenmaker',
    naam: 'De Grappenmaker van de Afdeling',
    uitleg: 'Jij houdt het team overeind met humor.',
    icoon: '😄',
  },
  {
    slug: 'detective',
    naam: 'De Detective',
    uitleg: 'Jij ziet wat anderen missen.',
    icoon: '🔍',
  },
  {
    slug: 'familiefluisteraar',
    naam: 'De Familiefluisteraar',
    uitleg: 'Jij weet wat je moet zeggen tegen bezorgde families.',
    icoon: '🤝',
  },
  {
    slug: 'brandweer',
    naam: 'De Brandweer',
    uitleg: 'Elke crisis geblust, nog vóór de koffie koud is.',
    icoon: '🚒',
  },
] as const

export type SuperkrachtSlug = typeof SUPERKRACHTEN[number]['slug']

// ─── Afdelingen ───────────────────────────────────────────────────────────────
export const AFDELINGEN = [
  'Spoed',
  'Intensieve zorg',
  'Geriatrie',
  'Chirurgie',
  'Interne',
  'Andere',
] as const

// ─── Hogescholen (voor Stage Wrapped) ─────────────────────────────────────────
// slug = korte URL (bv. /wrapped/pxl), naam = volledige naam
export const HOGESCHOLEN = [
  { slug: 'pxl',          naam: 'PXL Hasselt',                          link: 'https://www.pxl.be' },
  { slug: 'artevelde',    naam: 'Artevelde Hogeschool Gent',             link: 'https://www.arteveldehogeschool.be' },
  { slug: 'karel-de-grote', naam: 'Karel de Grote Hogeschool Antwerpen', link: 'https://www.kdg.be' },
  { slug: 'vives',        naam: 'VIVES Brugge / Kortrijk / Roeselare',   link: 'https://www.vives.be' },
  { slug: 'ucll',         naam: 'UC Leuven-Limburg',                     link: 'https://www.ucll.be' },
  { slug: 'ap',           naam: 'AP Hogeschool Antwerpen',               link: 'https://www.ap.be' },
  { slug: 'odisee',       naam: 'Odisee Brussel / Aalst',                link: 'https://www.odisee.be' },
  { slug: 'hogent',       naam: 'HoGent Gent',                           link: 'https://www.hogent.be' },
  { slug: 'thomas-more',  naam: 'Thomas More Mechelen / Geel / Lier',    link: 'https://www.thomasmore.be' },
  { slug: 'andere',       naam: 'Andere hogeschool',                     link: null },
] as const

export type HogeschoolSlug = typeof HOGESCHOLEN[number]['slug']

// ─── Sociale bewijskracht drempel ─────────────────────────────────────────────
// Onder dit aantal worden tellers niet getoond op het startscherm
export const MIN_COMPLETIONS_VOOR_TELLER = 100
