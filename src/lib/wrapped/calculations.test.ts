import { describe, it, expect } from 'vitest'
import { bereken, beschrijfWeekends, vindAfstandLabel } from './calculations'
import type { Antwoorden } from './calculations'

// ─── Basisantwoorden als startpunt ────────────────────────────────────────────

const ANTW_ZH: Antwoorden = {
  rol: 'ziekenhuis',
  dienst: 'vroege',
  tewerkstelling: '100%',
  nachtdiensten: 20,
  weekends: 26,
  stageUren: 0,
  stageplaatsen: null,
  patientenKeuze: '8-12',
  afdeling: 'Spoed',
  hogeschool: null,
  provincie: 'antwerpen',
  stappen: 8000,
  superkracht: 'rots',
  naam: 'Pieter',
}

const ANTW_ST: Antwoorden = {
  rol: 'student',
  dienst: null,
  tewerkstelling: null,
  nachtdiensten: 5,
  weekends: 0,
  stageUren: 480,
  stageplaatsen: 3,
  patientenKeuze: null,
  afdeling: 'Geriatrie',
  hogeschool: 'pxl',
  provincie: 'limburg',
  stappen: 6000,
  superkracht: 'detective',
  naam: 'Emma',
}

// ─── bereken() — ziekenhuis ───────────────────────────────────────────────────

describe('bereken – ziekenhuis', () => {
  it('berekent dienstenPerJaar correct voor 100%', () => {
    const s = bereken(ANTW_ZH)
    expect(s.dienstenPerJaar).toBe(200)
  })

  it('berekent dienstenPerJaar correct voor 50%', () => {
    const s = bereken({ ...ANTW_ZH, tewerkstelling: '50%' })
    expect(s.dienstenPerJaar).toBe(100)
  })

  it('berekent nachtenUren (nachtdiensten × 8)', () => {
    const s = bereken(ANTW_ZH)
    expect(s.nachtenUren).toBe(20 * 8)
  })

  it('berekent patientenTotaal (10 per dienst × 200 diensten)', () => {
    const s = bereken(ANTW_ZH)  // '8-12' → 10 patiënten
    expect(s.patientenTotaal).toBe(10 * 200)
  })

  it('berekent stappenKm (8000 stappen × 200 × 0.7m / 1000)', () => {
    const s = bereken(ANTW_ZH)
    expect(s.stappenKm).toBe(Math.round(8000 * 200 * 0.7 / 1000))  // 1120 km
  })

  it('geeft null terug voor stappenKm als stappen null is', () => {
    const s = bereken({ ...ANTW_ZH, stappen: null })
    expect(s.stappenKm).toBeNull()
    expect(s.afstandLabel).toBeNull()
  })

  it('gebruikt fallbacknaam als naam leeg is', () => {
    const s = bereken({ ...ANTW_ZH, naam: '  ' })
    expect(s.naam).toBe('Verpleegkundige')
  })

  it('stelt studentvelden in op null', () => {
    const s = bereken(ANTW_ZH)
    expect(s.stageDagen).toBeNull()
    expect(s.stageplaatsen).toBeNull()
  })

  it('koppelt het superkracht-object', () => {
    const s = bereken(ANTW_ZH)
    expect(s.superkracht?.slug).toBe('rots')
    expect(s.superkracht?.icoon).toBe('⚓')
  })
})

// ─── bereken() — student ──────────────────────────────────────────────────────

describe('bereken – student', () => {
  it('berekent stageDagen (480 uur / 8)', () => {
    const s = bereken(ANTW_ST)
    expect(s.stageDagen).toBe(60)
  })

  it('berekent stappenKm (6000 × 60 dagen × 0.7m / 1000)', () => {
    const s = bereken(ANTW_ST)
    expect(s.stappenKm).toBe(Math.round(6000 * 60 * 0.7 / 1000))  // 252 km
  })

  it('stelt ziekenhuisvelden in op null', () => {
    const s = bereken(ANTW_ST)
    expect(s.dienstenPerJaar).toBeNull()
    expect(s.patientenTotaal).toBeNull()
    expect(s.weekendsGewerkt).toBeNull()
  })

  it('bewaart stageplaatsen', () => {
    const s = bereken(ANTW_ST)
    expect(s.stageplaatsen).toBe(3)
  })

  it('geeft null terug voor stappenKm als stageUren 0 is', () => {
    const s = bereken({ ...ANTW_ST, stageUren: 0, stappen: 5000 })
    expect(s.stappenKm).toBeNull()
  })
})

// ─── beschrijfWeekends() ──────────────────────────────────────────────────────

describe('beschrijfWeekends', () => {
  it('geeft "geen enkel" voor 0', () => {
    expect(beschrijfWeekends(0)).toBe('geen enkel')
  })

  it('geeft "elk weekend" voor 52', () => {
    expect(beschrijfWeekends(52)).toBe('elk weekend')
  })

  it('geeft "1 op 4 weekends" voor 13', () => {
    // 52/13 = 4 → ratio ≥ 4
    expect(beschrijfWeekends(13)).toBe('1 op 4 weekends')
  })

  it('geeft "1 op 2 weekends" voor 26', () => {
    // 52/26 = 2 → ratio ≥ 2
    expect(beschrijfWeekends(26)).toBe('1 op 2 weekends')
  })
})

// ─── vindAfstandLabel() ───────────────────────────────────────────────────────

describe('vindAfstandLabel', () => {
  it('geeft null terug voor 0 km', () => {
    expect(vindAfstandLabel(0)).toBeNull()
  })

  it('herkent Brussel–Amsterdam (210 km)', () => {
    expect(vindAfstandLabel(210)).toBe('Brussel–Amsterdam')
  })

  it('berekent meervoud correct (630 km ≈ 2× Londen)', () => {
    // Londen (370 km) is de grootste die ≤ 630 past; 630/370 ≈ 1.7 → afgerond 2
    expect(vindAfstandLabel(630)).toBe('2× Brussel–Londen')
  })

  it('kiest de grootste passende afstand (800 km → 1× Berlijn)', () => {
    // 780 km = Berlijn, next is Barcelona 1350 → te groot
    expect(vindAfstandLabel(800)).toBe('Brussel–Berlijn')
  })
})
