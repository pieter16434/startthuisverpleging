'use client'
import { useState } from 'react'
import { REKENVOORBEELD } from '@/lib/wrapped/rekenvoorbeeld'
import { COPY } from '@/lib/wrapped/copy'
import type { Antwoorden } from '@/lib/wrapped/calculations'
import { trackMeta, trackTikTok } from '@/lib/wrapped/track'
import { getStoredUtms } from '@/lib/wrapped/utm'

const SURF   = '#2A3D2E'
const CLAY   = '#B65436'
const BUTTER = '#E8D08A'
const CREAM  = 'rgba(247,243,234,0.9)'
const MUTED  = 'rgba(247,243,234,0.45)'
const DIM    = 'rgba(247,243,234,0.25)'
const BORDER = 'rgba(232,208,138,0.2)'
const F      = '"Bricolage Grotesque",-apple-system,sans-serif'
const SERIF  = '"Fraunces",Georgia,serif'

function fmt(n: number | null): string {
  if (n == null) return '—'
  return '€ ' + n.toLocaleString('nl-BE')
}

function Rij({ label, waarde, isPlus }: { label: string; waarde: string; isPlus?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '10px 0', borderBottom: `1px solid ${BORDER}` }}>
      <span style={{ fontSize: 14, color: CREAM, fontFamily: F }}>{label}</span>
      <span style={{
        fontSize: 16, fontWeight: 700, fontFamily: SERIF,
        color: isPlus ? BUTTER : waarde === '—' ? MUTED : CREAM,
        minWidth: 90, textAlign: 'right',
      }}>
        {waarde}
      </span>
    </div>
  )
}

export default function Rekenvoorbeeld({ ant }: { ant: Antwoorden }) {
  const [email,   setEmail]   = useState('')
  const [consent, setConsent] = useState(false)
  const [status,  setStatus]  = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [emailErr, setEmailErr] = useState('')

  const geldigEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function verzend() {
    if (!geldigEmail) { setEmailErr('Vul een geldig e-mailadres in.'); return }
    if (!consent) return
    setEmailErr('')
    setStatus('loading')
    try {
      const utms = getStoredUtms()
      const r = await fetch('/api/wrapped/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), consent, rol: ant.rol, provincie: ant.provincie, ...utms }),
      })
      if (!r.ok) throw new Error()
      setStatus('done')
      trackMeta('Lead', { content_name: 'RekenvoorbeeldConsent' })
      trackTikTok('SubmitForm', { content_name: 'RekenvoorbeeldConsent' })
    } catch {
      setStatus('error')
    }
  }

  if (status !== 'done') {
    return (
      <div>
        {/* Context */}
        <div style={{ background: SURF, borderRadius: 12, padding: '16px', marginBottom: 20, border: `1px solid ${BORDER}` }}>
          <p style={{ margin: '0 0 6px', fontSize: 11, color: 'rgba(232,208,138,0.55)', fontFamily: F, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            {REKENVOORBEELD.wie}
          </p>
          <p style={{ margin: 0, fontSize: 13, color: MUTED, fontFamily: F }}>{REKENVOORBEELD.periode}</p>
        </div>

        {/* Intro */}
        <p style={{ margin: '0 0 24px', fontSize: 15, color: CREAM, fontFamily: F, lineHeight: 1.65 }}>
          {COPY.rekenvoorbeeldIntro}
        </p>

        {/* E-mailveld */}
        <label style={{ display: 'block', fontSize: 13, color: MUTED, fontFamily: F, marginBottom: 6 }}>
          {COPY.emailLabel}
        </label>
        <input
          type="email"
          placeholder={COPY.emailPlaceholder}
          value={email}
          onChange={e => { setEmail(e.target.value); setEmailErr('') }}
          onKeyDown={e => { if (e.key === 'Enter' && geldigEmail && consent) verzend() }}
          autoComplete="email"
          style={{
            display: 'block', width: '100%', padding: '12px 14px',
            background: SURF, color: CREAM,
            border: `2px solid ${emailErr ? '#E8A07A' : email && geldigEmail ? BUTTER : BORDER}`,
            borderRadius: 10, fontSize: 16, fontFamily: F, outline: 'none',
            boxSizing: 'border-box', marginBottom: emailErr ? 6 : 14,
          }}
        />
        {emailErr && <p style={{ margin: '0 0 10px', fontSize: 13, color: '#E8A07A', fontFamily: F }}>{emailErr}</p>}

        {/* Consent */}
        <label style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 20 }}>
          <div style={{ position: 'relative', flexShrink: 0, marginTop: 2 }}>
            <input
              type="checkbox"
              checked={consent}
              onChange={e => setConsent(e.target.checked)}
              style={{ opacity: 0, position: 'absolute', width: 20, height: 20, cursor: 'pointer', zIndex: 1 }}
            />
            <div style={{
              width: 20, height: 20, borderRadius: 5,
              background: consent ? BUTTER : SURF,
              border: `2px solid ${consent ? BUTTER : BORDER}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {consent && <span style={{ fontSize: 13, color: '#1A1A17', fontWeight: 700 }}>✓</span>}
            </div>
          </div>
          <span style={{ fontSize: 14, color: MUTED, fontFamily: F, lineHeight: 1.5 }}>
            {COPY.consentTekst}
          </span>
        </label>

        {/* Knop */}
        <button
          onClick={verzend}
          disabled={status === 'loading' || !geldigEmail || !consent}
          style={{
            display: 'block', width: '100%', padding: '16px 24px',
            background: geldigEmail && consent ? CLAY : SURF,
            color: geldigEmail && consent ? '#FBF8F2' : MUTED,
            border: 'none', borderRadius: 12, fontSize: 17, fontWeight: 700,
            fontFamily: F, cursor: geldigEmail && consent ? 'pointer' : 'default', minHeight: 52,
          }}
        >
          {status === 'loading' ? 'Even wachten…' : COPY.rekenvoorbeeldKnop}
        </button>

        {status === 'error' && (
          <p style={{ margin: '12px 0 0', fontSize: 13, color: '#E8A07A', fontFamily: F, textAlign: 'center' }}>
            Er liep iets mis. Probeer het opnieuw.
          </p>
        )}

        <p style={{ margin: '14px 0 0', fontSize: 12, color: DIM, fontFamily: F, lineHeight: 1.5 }}>
          Je e-mailadres wordt alleen gebruikt voor dit doel. Afmelden kan altijd.{' '}
          <a href={COPY.privacyLink} style={{ color: DIM, textDecoration: 'underline' }}>Privacy</a>
        </p>
      </div>
    )
  }

  // ── Na consent: toon de cijfers ──────────────────────────────────────────────
  return (
    <div>
      <p style={{ margin: '0 0 20px', fontSize: 17, fontFamily: SERIF, fontWeight: 700, color: BUTTER, lineHeight: 1.3 }}>
        Dit is ons eerste jaar. Alle cijfers.
      </p>

      {/* Breakdown */}
      <div style={{ marginBottom: 20 }}>
        <Rij label="RIZIV-omzet (9 mnd.)"         waarde={fmt(REKENVOORBEELD.omzet)}            isPlus />
        <Rij label="Kosten (auto, materiaal, …)"   waarde={fmt(REKENVOORBEELD.kosten) === '—' ? '—' : `- ${fmt(REKENVOORBEELD.kosten)}`} />
        <Rij label="Sociale bijdragen"             waarde={REKENVOORBEELD.socialeBijdragen == null ? 'volgt' : `- ${fmt(REKENVOORBEELD.socialeBijdragen)}`} />
        <Rij label="Personenbelasting"             waarde={REKENVOORBEELD.belastingen == null ? 'volgt' : `- ${fmt(REKENVOORBEELD.belastingen)}`} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 0 0' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: CREAM, fontFamily: F }}>Overgebleven</span>
          <span style={{ fontSize: 22, fontWeight: 800, fontFamily: SERIF, color: BUTTER }}>
            {REKENVOORBEELD.overgebleven == null ? 'volgt binnenkort' : fmt(REKENVOORBEELD.overgebleven)}
          </span>
        </div>
      </div>

      {/* Opmerking */}
      <div style={{ background: SURF, borderRadius: 10, padding: '14px', marginBottom: 16, border: `1px solid ${BORDER}` }}>
        <p style={{ margin: 0, fontSize: 13, color: MUTED, fontFamily: F, lineHeight: 1.6, fontStyle: 'italic' }}>
          &ldquo;{REKENVOORBEELD.opmerking}&rdquo;
        </p>
        <p style={{ margin: '8px 0 0', fontSize: 12, color: DIM, fontFamily: F }}>
          — {REKENVOORBEELD.wie}
        </p>
      </div>

      {/* Disclaimer */}
      <p style={{ margin: '0 0 20px', fontSize: 12, color: DIM, fontFamily: F, lineHeight: 1.6 }}>
        {COPY.rekenvoorbeeldDisclaimer}
      </p>

      {/* CTA */}
      <a
        href="https://www.startthuisverpleging.be"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'block', width: '100%', padding: '16px 24px', textAlign: 'center',
          background: CLAY, color: '#FBF8F2', textDecoration: 'none',
          borderRadius: 12, fontSize: 16, fontWeight: 700, fontFamily: F, boxSizing: 'border-box',
        }}
      >
        {COPY.rekenvoorbeeldCta}
      </a>

      <p style={{ margin: '12px 0 0', fontSize: 12, color: DIM, fontFamily: F, textAlign: 'center' }}>
        Je ontvangt ook een e-mail met het volledige overzicht.
      </p>
    </div>
  )
}
