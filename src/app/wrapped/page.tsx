'use client'
// Fase 1: startscherm — vragenflow volgt in Fase 2
import { COPY } from '@/lib/wrapped/copy'
import { MIN_COMPLETIONS_VOOR_TELLER } from '@/lib/wrapped/config'
import { useState, useEffect } from 'react'

export default function WrappedPage() {
  const [teller, setTeller] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/wrapped/stats')
      .then(r => r.json())
      .then(d => setTeller(d.total ?? null))
      .catch(() => {})
  }, [])

  const toonTeller = teller !== null && teller >= MIN_COMPLETIONS_VOOR_TELLER

  return (
    <main style={{
      minHeight: '100dvh',
      background: '#1C2A20',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      fontFamily: '"Bricolage Grotesque", -apple-system, system-ui, sans-serif',
    }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>

        {/* Eyebrow */}
        <p style={{
          margin: '0 0 20px',
          fontSize: 12,
          color: 'rgba(232,208,138,0.7)',
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          fontWeight: 600,
        }}>
          Zorg Wrapped 2026
        </p>

        {/* Titel */}
        <h1 style={{
          margin: '0 0 16px',
          fontSize: 'clamp(28px, 7vw, 40px)',
          fontFamily: '"Fraunces", Georgia, serif',
          color: '#E8D08A',
          lineHeight: 1.15,
          fontWeight: 800,
          textWrap: 'balance',
        } as React.CSSProperties}>
          {COPY.startTitel}
        </h1>

        {/* Subtekst */}
        <p style={{
          margin: '0 0 36px',
          fontSize: 17,
          color: 'rgba(247,243,234,0.8)',
          lineHeight: 1.6,
        }}>
          {COPY.startSubtekst}
        </p>

        {/* Startknop */}
        <button
          onClick={() => {
            // Fase 2: navigeer naar de vragenflow
            // window.location.href = '?stap=1'
          }}
          style={{
            display: 'block',
            width: '100%',
            padding: '18px 24px',
            background: '#B65436',
            color: '#FBF8F2',
            border: 'none',
            borderRadius: 12,
            fontSize: 18,
            fontWeight: 700,
            fontFamily: 'inherit',
            cursor: 'pointer',
            letterSpacing: '0.01em',
            marginBottom: 16,
          }}
        >
          {COPY.startKnop}
        </button>

        {/* Sociale bewijskracht */}
        {toonTeller && (
          <p style={{ fontSize: 13, color: 'rgba(247,243,234,0.5)', margin: 0 }}>
            {teller?.toLocaleString('nl-BE')} {COPY.startTellerSuffix}
          </p>
        )}

        {/* Footer */}
        <p style={{
          marginTop: 48,
          fontSize: 12,
          color: 'rgba(247,243,234,0.35)',
          lineHeight: 1.5,
        }}>
          {COPY.footerTekst}
        </p>
      </div>
    </main>
  )
}
