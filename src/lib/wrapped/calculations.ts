import {
  DIENSTEN_PER_JAAR_VOLTIJDS,
  UREN_PER_NACHTDIENST,
  METER_PER_STAP,
  PATIENTEN_PER_KEUZE,
  TEWERKSTELLING,
  AFSTANDEN,
  SUPERKRACHTEN,
} from './config'
import type { SuperkrachtSlug } from './config'

// ─── Input ────────────────────────────────────────────────────────────────────

export type Antwoorden = {
  rol: 'ziekenhuis' | 'student' | null
  dienst: string | null
  tewerkstelling: string | null
  nachtdiensten: number
  weekends: number
  stageUren: number
  stageplaatsen: number | null
  patientenKeuze: string | null
  afdeling: string | null
  hogeschool: string | null
  provincie: string | null
  stappen: number | null
  superkracht: SuperkrachtSlug | null
  naam: string
}

// ─── Output ───────────────────────────────────────────────────────────────────

export type Stats = {
  rol: 'ziekenhuis' | 'student'
  naam: string
  superkracht: typeof SUPERKRACHTEN[number] | null
  nachtenUren: number
  stappenKm: number | null
  afstandLabel: string | null
  // Ziekenhuis
  dienstenPerJaar: number | null
  weekendsGewerkt: number | null
  weekendDeel: string | null
  patientenTotaal: number | null
  // Student
  stageDagen: number | null
  stageplaatsen: number | null
}

// ─── Hoofdberekening ──────────────────────────────────────────────────────────

export function bereken(ant: Antwoorden): Stats {
  const rol = ant.rol ?? 'ziekenhuis'
  const superkracht = SUPERKRACHTEN.find(s => s.slug === ant.superkracht) ?? null
  const nachtenUren = ant.nachtdiensten * UREN_PER_NACHTDIENST

  let dienstenPerJaar: number | null = null
  let weekendsGewerkt: number | null = null
  let weekendDeel: string | null = null
  let patientenTotaal: number | null = null
  let stappenKm: number | null = null
  let afstandLabel: string | null = null
  let stageDagen: number | null = null

  if (rol === 'ziekenhuis') {
    const tw = ant.tewerkstelling ? (TEWERKSTELLING[ant.tewerkstelling] ?? 1) : 1
    dienstenPerJaar = Math.round(DIENSTEN_PER_JAAR_VOLTIJDS * tw)
    weekendsGewerkt = ant.weekends
    weekendDeel = beschrijfWeekends(ant.weekends)

    if (ant.patientenKeuze) {
      const pp = PATIENTEN_PER_KEUZE[ant.patientenKeuze] ?? 0
      patientenTotaal = pp * dienstenPerJaar
    }

    if (ant.stappen != null) {
      stappenKm = Math.round((ant.stappen * dienstenPerJaar * METER_PER_STAP) / 1000)
      afstandLabel = vindAfstandLabel(stappenKm)
    }
  }

  if (rol === 'student') {
    stageDagen = Math.round(ant.stageUren / 8)

    if (ant.stappen != null && stageDagen > 0) {
      stappenKm = Math.round((ant.stappen * stageDagen * METER_PER_STAP) / 1000)
      afstandLabel = vindAfstandLabel(stappenKm)
    }
  }

  return {
    rol,
    naam: ant.naam.trim() || 'Verpleegkundige',
    superkracht,
    nachtenUren,
    stappenKm,
    afstandLabel,
    dienstenPerJaar,
    weekendsGewerkt,
    weekendDeel,
    patientenTotaal,
    stageDagen,
    stageplaatsen: ant.stageplaatsen,
  }
}

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

export function beschrijfWeekends(weekends: number): string {
  if (weekends === 0) return 'geen enkel'
  if (weekends >= 52) return 'elk weekend'
  const ratio = 52 / weekends
  if (ratio >= 8) return '1 op 8 weekends'
  if (ratio >= 6) return '1 op 6 weekends'
  if (ratio >= 5) return '1 op 5 weekends'
  if (ratio >= 4) return '1 op 4 weekends'
  if (ratio >= 3) return '1 op 3 weekends'
  if (ratio >= 2) return '1 op 2 weekends'
  return 'bijna elk weekend'
}

export function vindAfstandLabel(km: number): string | null {
  if (km <= 0) return null
  // Largest AFSTANDEN entry that is still ≤ km → say "N× die afstand"
  let best = AFSTANDEN[0]
  for (const a of AFSTANDEN) {
    if (a.km <= km) best = a
  }
  const times = Math.round(km / best.km)
  if (times <= 0) return `bijna ${best.label}`
  if (times === 1) return best.label
  return `${times}× ${best.label}`
}
