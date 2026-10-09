'use client'
import { useMemo, useState } from 'react'
import { bereken } from '@/lib/wrapped/calculations'
import { COPY } from '@/lib/wrapped/copy'
import { HOGESCHOLEN, PATIENTEN_PER_KEUZE } from '@/lib/wrapped/config'
import type { Antwoorden } from '@/lib/wrapped/calculations'
import DeelKaart from './DeelKaart'
import PluimFlow from './PluimFlow'
import Rekenvoorbeeld from './Rekenvoorbeeld'

// ─── Kleuren ──────────────────────────────────────────────────────────────────
const BG     = '#1C2A20'
const SURF   = '#2A3D2E'
const CLAY   = '#B65436'
const BUTTER = '#E8D08A'
const CREAM  = 'rgba(247,243,234,0.9)'
const MUTED  = 'rgba(247,243,234,0.45)'
const DIM    = 'rgba(247,243,234,0.2)'
const BORDER = 'rgba(232,208,138,0.2)'
const F      = '"Bricolage Grotesque",-apple-system,sans-serif'
const SERIF  = '"Fraunces",Georgia,serif'

// ─── Slide types ──────────────────────────────────────────────────────────────
type SlideKey =
  | 'intro' | 'nachten' | 'stage_uren' | 'weekends'
  | 'stageplaatsen' | 'patienten' | 'kilometers'
  | 'superkracht' | 'tribe' | 'deelkaart' | 'rekenvoorbeeld'

function buildSlides(ant: Antwoorden, heeftStappen: boolean): SlideKey[] {
  const s: SlideKey[] = ['intro']
  if (ant.rol === 'ziekenhuis') {
    if (ant.nachtdiensten > 0) s.push('nachten')
    s.push('weekends')
    if (ant.patientenKeuze) s.push('patienten')
  } else {
    s.push('stage_uren')
    if (ant.stageplaatsen != null) s.push('stageplaatsen')
    if (ant.nachtdiensten > 0) s.push('nachten')
  }
  if (heeftStappen) s.push('kilometers')
  s.push('superkracht', 'tribe', 'deelkaart')
  if (ant.rol === 'ziekenhuis') s.push('rekenvoorbeeld')
  return s
}

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────
function cap(s: string | null) {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function hogeschoolNaam(slug: string | null): string {
  if (!slug) return ''
  return HOGESCHOLEN.find(h => h.slug === slug)?.naam ?? cap(slug)
}

// ─── Subcomponenten ───────────────────────────────────────────────────────────
function Eyebrow({ label }: { label: string }) {
  return (
    <p style={{ margin: '0 0 20px', fontSize: 11, fontFamily: F, color: 'rgba(232,208,138,0.6)', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700 }}>
      {label}
    </p>
  )
}

function BigStat({ n, unit }: { n: string | number; unit: string }) {
  return (
    <>
      <p style={{ margin: '0 0 4px', fontFamily: SERIF, fontSize: 'clamp(68px,18vw,110px)', color: BUTTER, fontWeight: 800, lineHeight: 0.9 }}>
        {typeof n === 'number' ? n.toLocaleString('nl-BE') : n}
      </p>
      <p style={{ margin: '16px 0 0', fontSize: 'clamp(18px,4.5vw,24px)', color: CREAM, fontFamily: SERIF, fontWeight: 600, lineHeight: 1.3 }}>
        {unit}
      </p>
    </>
  )
}

function Context({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: '20px 0 0', fontSize: 15, color: MUTED, fontFamily: F, lineHeight: 1.6 }}>{children}</p>
}

// ─── Slides component ─────────────────────────────────────────────────────────
export default function Slides({ ant, onOpnieuw, perProv = {}, perSchool = {} }: {
  ant: Antwoorden
  onOpnieuw: () => void
  perProv?: Record<string, number>
  perSchool?: Record<string, number>
}) {
  const stats  = useMemo(() => bereken(ant), [ant])
  const slides = useMemo(() => buildSlides(ant, stats.stappenKm != null), [ant, stats.stappenKm])
  const [idx, setIdx] = useState(0)

  const slide  = slides[idx]
  const isLast = idx === slides.length - 1
  const naamArg = ant.naam.trim() || null

  function renderSlide(key: SlideKey) {
    switch (key) {
      // ── Intro ───────────────────────────────────────────────────────────
      case 'intro':
        return <>
          <Eyebrow label="Zorg Wrapped 2026" />
          <p style={{ margin: '0 0 24px', fontFamily: SERIF, fontSize: 'clamp(30px,7.5vw,48px)', color: BUTTER, fontWeight: 800, lineHeight: 1.15, textWrap: 'balance' } as React.CSSProperties}>
            {ant.rol === 'student'
              ? COPY.slide1StudentTitel(naamArg)
              : COPY.slide1ZiekenhuisTitel(naamArg)}
          </p>
          <p style={{ margin: 0, fontSize: 52, lineHeight: 1 }}>💙</p>
        </>

      // ── Nachten ─────────────────────────────────────────────────────────
      case 'nachten':
        return <>
          <Eyebrow label="Jouw nachten" />
          <BigStat n={stats.nachtenUren} unit="uur wakker terwijl Vlaanderen sliep" />
          <Context>= {ant.nachtdiensten} nachtdienst{ant.nachtdiensten !== 1 ? 'en' : ''} van 8 uur</Context>
        </>

      // ── Stage-uren ──────────────────────────────────────────────────────
      case 'stage_uren':
        return <>
          <Eyebrow label="Jouw stage" />
          <BigStat n={ant.stageUren} unit="uur stage" />
          <Context>{COPY.slide2StudentUrenTitel(ant.stageUren)}</Context>
        </>

      // ── Weekends ────────────────────────────────────────────────────────
      case 'weekends':
        return <>
          <Eyebrow label="Jouw weekends" />
          <BigStat n={stats.weekendsGewerkt ?? 0} unit="weekends gewerkt" />
          <Context>
            {stats.weekendDeel === 'geen enkel'
              ? 'Geen enkel weekend. Respect voor de discipline!'
              : `${cap(stats.weekendDeel ?? '')} gaf je weg aan je patiënten.`}
          </Context>
        </>

      // ── Stageplaatsen ───────────────────────────────────────────────────
      case 'stageplaatsen': {
        const n = ant.stageplaatsen ?? 0
        return <>
          <Eyebrow label="Jouw stageplaatsen" />
          <BigStat n={n} unit={`stageplaats${n !== 1 ? 'en' : ''}`} />
          <Context>{COPY.slide3StudentPlaatsenTitel(n)}</Context>
        </>
      }

      // ── Patiënten ───────────────────────────────────────────────────────
      case 'patienten': {
        const pp = ant.patientenKeuze ? (PATIENTEN_PER_KEUZE[ant.patientenKeuze] ?? 0) : 0
        return <>
          <Eyebrow label="Jouw patiënten" />
          <BigStat n={stats.patientenTotaal ?? 0} unit="keer rekende iemand op jou" />
          <Context>{COPY.slide4PatientenTitel(stats.patientenTotaal ?? 0)}</Context>
          {pp > 0 && <Context>Gemiddeld {pp} patiënten per dienst.</Context>}
        </>
      }

      // ── Kilometers ──────────────────────────────────────────────────────
      case 'kilometers':
        return <>
          <Eyebrow label="Jouw stappen" />
          <BigStat n={stats.stappenKm ?? 0} unit="km gewandeld op de afdeling" />
          {stats.afstandLabel && (
            <Context>{COPY.slide5KilometersTitel(stats.stappenKm ?? 0, stats.afstandLabel)}</Context>
          )}
        </>

      // ── Superkracht ─────────────────────────────────────────────────────
      case 'superkracht':
        return <>
          <Eyebrow label="Jouw superkracht" />
          <p style={{ margin: '0 0 16px', fontSize: 80, lineHeight: 1 }}>{stats.superkracht?.icoon}</p>
          <p style={{ margin: '0 0 12px', fontFamily: SERIF, fontSize: 'clamp(26px,6.5vw,38px)', color: BUTTER, fontWeight: 800, lineHeight: 1.2, textWrap: 'balance' } as React.CSSProperties}>
            {stats.superkracht?.naam}
          </p>
          <p style={{ margin: 0, fontSize: 16, color: CREAM, fontFamily: F, lineHeight: 1.7, fontStyle: 'italic' }}>
            &ldquo;{stats.superkracht?.uitleg}&rdquo;
          </p>
        </>

      // ── Tribe ───────────────────────────────────────────────────────────
      case 'tribe': {
        const isStudent  = ant.rol === 'student'
        const mijnSleutel = isStudent ? (ant.hogeschool ?? '') : (ant.provincie ?? '')
        const tabel       = isStudent ? perSchool : perProv
        const mijnN       = tabel[mijnSleutel] ?? 0

        const plaatsNaam  = isStudent ? hogeschoolNaam(ant.hogeschool) : cap(ant.provincie)
        const tribeTekst  = isStudent
          ? COPY.slide7StudentTribeTekst(mijnN, hogeschoolNaam(ant.hogeschool))
          : COPY.slide7TribeTekst(mijnN, cap(ant.provincie ?? ''))

        // Top-5 rangschikking, gesorteerd op aantal
        const ranking = Object.entries(tabel)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
        const maxN    = ranking[0]?.[1] ?? 1

        // Schoollink voor studenten
        const schoolObj  = HOGESCHOLEN.find(h => h.slug === ant.hogeschool)
        const schoolLink = isStudent ? schoolObj?.link ?? null : null
        const schoolNaam = isStudent ? schoolObj?.naam ?? plaatsNaam : null

        const RijLabel = (sleutel: string) =>
          isStudent
            ? (HOGESCHOLEN.find(h => h.slug === sleutel)?.naam ?? sleutel)
            : cap(sleutel)

        return <>
          <Eyebrow label={isStudent ? 'Jouw hogeschool' : 'Jouw provincie'} />
          <p style={{ margin: '0 0 12px', fontFamily: SERIF, fontSize: 'clamp(26px,6.5vw,40px)', color: BUTTER, fontWeight: 800, lineHeight: 1.1 }}>
            {plaatsNaam}
          </p>
          <Context>{tribeTekst}</Context>

          {/* Schoollink */}
          {schoolLink && (
            <a href={schoolLink} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 12, color: BUTTER, fontSize: 14, fontFamily: F, fontWeight: 600, textDecoration: 'none', opacity: 0.85 }}>
              🔗 {schoolNaam}
            </a>
          )}

          {/* Mini-rangschikking */}
          {ranking.length > 0 && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ranking.map(([sleutel, n], i) => {
                const isMijn = sleutel === mijnSleutel
                const breedte = Math.round((n / maxN) * 100)
                return (
                  <div key={sleutel} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: isMijn ? BUTTER : MUTED, fontFamily: F, width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, color: isMijn ? BUTTER : CREAM, fontFamily: F, fontWeight: isMijn ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                          {RijLabel(sleutel)}
                        </span>
                        <span style={{ fontSize: 13, color: isMijn ? BUTTER : MUTED, fontFamily: F, fontWeight: isMijn ? 700 : 400, flexShrink: 0 }}>{n}</span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: DIM, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${breedte}%`, borderRadius: 2, background: isMijn ? BUTTER : 'rgba(247,243,234,0.3)', transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      }

      // ── Deelkaart ───────────────────────────────────────────────────────
      // ── Rekenvoorbeeld ──────────────────────────────────────────────────────
      case 'rekenvoorbeeld':
        return <>
          <Eyebrow label="Wat blijft er over?" />
          <p style={{ margin: '0 0 20px', fontFamily: SERIF, fontSize: 'clamp(22px,5.5vw,30px)', color: BUTTER, fontWeight: 800, lineHeight: 1.2 }}>
            Wat als je zelf begint?
          </p>
          <Rekenvoorbeeld ant={ant} />
        </>

      // ── Deelkaart ───────────────────────────────────────────────────────────
      case 'deelkaart':
        return <>
          <Eyebrow label="Jouw kaart" />
          <p style={{ margin: '0 0 20px', fontFamily: SERIF, fontSize: 'clamp(22px,5.5vw,32px)', color: BUTTER, fontWeight: 800, lineHeight: 1.2 }}>
            Jouw kaart is klaar.
          </p>
          <DeelKaart stats={stats} ant={ant} />
          <PluimFlow senderNaam={stats.naam} />
          <button onClick={onOpnieuw}
            style={{ display: 'block', width: '100%', padding: '14px 24px', background: SURF, color: CREAM, border: `1px solid ${BORDER}`, borderRadius: 12, fontSize: 15, fontFamily: F, cursor: 'pointer', marginTop: 20 }}>
            Opnieuw beginnen
          </button>
        </>
    }
  }

  return (
    <main style={{ minHeight: '100dvh', background: BG, display: 'flex', flexDirection: 'column', padding: '20px 24px 36px', fontFamily: F }}>
      <div style={{ maxWidth: 440, width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100dvh - 56px)' }}>

        {/* Voortgangsbalk */}
        <div style={{ display: 'flex', gap: 3, marginBottom: 20, flexShrink: 0 }}>
          {slides.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= idx ? BUTTER : DIM, transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Terugknop */}
        <div style={{ minHeight: 28, flexShrink: 0 }}>
          {idx > 0 && (
            <button onClick={() => setIdx(i => i - 1)}
              style={{ background: 'none', border: 'none', color: MUTED, fontSize: 14, cursor: 'pointer', padding: 0, fontFamily: F }}>
              ← Vorige
            </button>
          )}
        </div>

        {/* Slide-inhoud */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: (slide === 'deelkaart' || slide === 'rekenvoorbeeld') ? 'flex-start' : 'center', overflowY: 'auto' }}>
          {renderSlide(slide)}
        </div>

        {/* Navigatie */}
        <div style={{ flexShrink: 0, paddingTop: 16 }}>
          {!isLast && (
            <button onClick={() => setIdx(i => i + 1)}
              style={{ display: 'block', width: '100%', padding: '18px 24px', background: CLAY, color: '#FBF8F2', border: 'none', borderRadius: 12, fontSize: 17, fontWeight: 700, fontFamily: F, cursor: 'pointer', minHeight: 56 }}>
              Volgende →
            </button>
          )}
          <p style={{ textAlign: 'center', fontSize: 11, color: DIM, marginTop: 16, lineHeight: 1.5 }}>{COPY.footerTekst}</p>
        </div>
      </div>
    </main>
  )
}
