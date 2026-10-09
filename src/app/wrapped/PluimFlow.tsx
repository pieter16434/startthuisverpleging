'use client'
import { useState } from 'react'
import { SUPERKRACHTEN } from '@/lib/wrapped/config'
import type { SuperkrachtSlug } from '@/lib/wrapped/config'
import { COPY } from '@/lib/wrapped/copy'

const SHARE_URL = process.env.NEXT_PUBLIC_WRAPPED_BASE_URL ?? 'https://zorgwrapped.be'

const SURF   = '#2A3D2E'
const BUTTER = '#E8D08A'
const CREAM  = 'rgba(247,243,234,0.9)'
const MUTED  = 'rgba(247,243,234,0.45)'
const BORDER = 'rgba(232,208,138,0.18)'
const F      = '"Bricolage Grotesque",-apple-system,sans-serif'

export default function PluimFlow({ senderNaam }: { senderNaam: string }) {
  const [open,     setOpen]     = useState(false)
  const [naam,     setNaam]     = useState('')
  const [gekozenSK, setGekozenSK] = useState<SuperkrachtSlug | null>(null)
  const [toast,    setToast]    = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  const superkracht = SUPERKRACHTEN.find(s => s.slug === gekozenSK) ?? null
  const klaar = naam.trim().length > 0 && gekozenSK !== null

  const pluimUrl = gekozenSK
    ? `${SHARE_URL}?van=${encodeURIComponent(senderNaam)}&sk=${encodeURIComponent(gekozenSK)}`
    : SHARE_URL

  const bericht = klaar && superkracht
    ? COPY.pluimBerichtMal(senderNaam, superkracht.naam, pluimUrl)
    : null

  function deelWhatsApp() {
    if (!bericht) return
    window.open(
      `https://api.whatsapp.com/send?text=${encodeURIComponent(bericht)}`,
      '_blank', 'noopener'
    )
  }

  async function kopieer() {
    if (!bericht) return
    try { await navigator.clipboard.writeText(bericht); showToast('Bericht gekopieerd! ✓') }
    catch { showToast('Kopieer handmatig: ' + bericht.slice(0, 60) + '…') }
  }

  return (
    <div style={{ marginTop: 24, borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>

      {!open ? (
        <button onClick={() => setOpen(true)} style={{
          display: 'block', width: '100%', padding: '14px 20px',
          background: 'transparent', color: CREAM,
          border: `1px solid ${BORDER}`, borderRadius: 12,
          fontSize: 15, fontWeight: 600, fontFamily: F, cursor: 'pointer',
          textAlign: 'left',
        }}>
          💌 {COPY.pluimOproep}
        </button>
      ) : (
        <div>
          <p style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: CREAM, fontFamily: F }}>
            💌 {COPY.pluimOproep}
          </p>

          {/* Naam collega */}
          <input
            type="text"
            maxLength={20}
            placeholder="Naam van je collega"
            value={naam}
            onChange={e => setNaam(e.target.value)}
            autoFocus
            style={{
              display: 'block', width: '100%',
              padding: '12px 14px', background: SURF, color: CREAM,
              border: `2px solid ${naam.trim() ? BUTTER : BORDER}`,
              borderRadius: 10, fontSize: 16, fontFamily: F, outline: 'none',
              boxSizing: 'border-box', marginBottom: 14,
            }}
          />

          {/* Superkracht kiezen */}
          <p style={{ margin: '0 0 10px', fontSize: 12, color: MUTED, fontFamily: F, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Kies hun superkracht
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
            {SUPERKRACHTEN.map(sk => {
              const sel = gekozenSK === sk.slug
              return (
                <button key={sk.slug} onClick={() => setGekozenSK(sk.slug as SuperkrachtSlug)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    background: sel ? BUTTER : SURF,
                    color: sel ? '#1A1A17' : CREAM,
                    border: `2px solid ${sel ? BUTTER : BORDER}`,
                    borderRadius: 10, fontFamily: F, cursor: 'pointer',
                    textAlign: 'left',
                  }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>{sk.icoon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.2 }}>{sk.naam}</div>
                    <div style={{ fontSize: 12, opacity: 0.7, marginTop: 2 }}>{sk.uitleg}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Gegenereerd bericht */}
          {bericht && (
            <div style={{ background: SURF, borderRadius: 10, padding: '14px', marginBottom: 12, border: `1px solid ${BORDER}` }}>
              <p style={{ margin: 0, fontSize: 14, color: CREAM, fontFamily: F, lineHeight: 1.6 }}>
                {bericht}
              </p>
            </div>
          )}

          {/* Deel-knoppen */}
          {klaar && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={deelWhatsApp} style={{
                flex: 1, padding: '12px 8px', background: '#25D366', color: '#fff',
                border: 'none', borderRadius: 10, cursor: 'pointer',
                fontSize: 14, fontWeight: 700, fontFamily: F,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <span>💬</span> WhatsApp
              </button>
              <button onClick={kopieer} style={{
                flex: 1, padding: '12px 8px', background: SURF, color: CREAM,
                border: `1px solid ${BORDER}`, borderRadius: 10, cursor: 'pointer',
                fontSize: 14, fontWeight: 700, fontFamily: F,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <span>📋</span> Kopieer
              </button>
            </div>
          )}

          <button onClick={() => setOpen(false)} style={{
            display: 'block', width: '100%', marginTop: 12,
            padding: '10px', background: 'transparent', color: MUTED,
            border: 'none', cursor: 'pointer', fontFamily: F, fontSize: 13,
          }}>
            Sluiten
          </button>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: BUTTER, color: '#1A1A17', padding: '12px 22px',
          borderRadius: 24, fontSize: 14, fontWeight: 700, zIndex: 9999,
          whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          fontFamily: F, pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
