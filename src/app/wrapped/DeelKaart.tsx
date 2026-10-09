'use client'
import { useEffect, useRef, useState } from 'react'
import { COPY } from '@/lib/wrapped/copy'
import type { Stats, Antwoorden } from '@/lib/wrapped/calculations'

// ─── Canvas afmetingen ────────────────────────────────────────────────────────
const W        = 1080
const H_STORY  = 1920   // 9:16 — Instagram Story / TikTok
const H_POST   = 1080   // 1:1  — Instagram Post

// ─── Palet (hex voor canvas, geen CSS rgba) ───────────────────────────────────
const C = {
  bg:       '#1C2A20',
  surf:     '#2A3D2E',
  butter:   '#E8D08A',
  cream:    'rgba(247,243,234,0.92)',
  muted:    'rgba(232,208,138,0.55)',
  dim:      'rgba(232,208,138,0.25)',
  divider:  'rgba(232,208,138,0.18)',
  clay:     '#B65436',
} as const

const F      = '"Bricolage Grotesque", -apple-system, sans-serif'
const SERIF  = '"Fraunces", Georgia, serif'
const EMOJI  = '"Apple Color Emoji", "Segoe UI Emoji", serif'
const SURF_STYLE = '#2A3D2E'
const BORDER_STYLE = 'rgba(232,208,138,0.2)'
const CREAM_STYLE  = 'rgba(247,243,234,0.9)'
const MUTED_STYLE  = 'rgba(247,243,234,0.45)'

// ─── Hulpfuncties ─────────────────────────────────────────────────────────────

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lineH: number,
): number {
  const words = text.split(' ')
  let line = ''
  let cy = y
  for (const word of words) {
    const test = line + word + ' '
    if (ctx.measureText(test).width > maxW && line !== '') {
      ctx.fillText(line.trim(), x, cy)
      line = word + ' '
      cy += lineH
    } else {
      line = test
    }
  }
  if (line.trim()) ctx.fillText(line.trim(), x, cy)
  return cy
}

// Kies de meest indrukwekkende stat voor de kaart
function kiesStat(stats: Stats, ant: Antwoorden): { n: number; label: string } | null {
  if (stats.patientenTotaal && stats.patientenTotaal > 0)
    return { n: stats.patientenTotaal, label: 'patiënten dit jaar' }
  if (stats.stappenKm && stats.stappenKm > 0)
    return { n: stats.stappenKm, label: 'km gewandeld' }
  if (stats.nachtenUren > 0)
    return { n: stats.nachtenUren, label: 'nachturen' }
  if (ant.stageUren > 0)
    return { n: ant.stageUren, label: 'uur stage' }
  return null
}

// Schaal fontgrootte op basis van het aantal tekens van het getal
function statFontSize(n: number, base: number): number {
  const len = n.toLocaleString('nl-BE').length
  if (len <= 3) return base
  if (len <= 5) return Math.round(base * 0.85)
  if (len <= 7) return Math.round(base * 0.7)
  return Math.round(base * 0.6)
}

// ─── Teken Story (1080×1920) ──────────────────────────────────────────────────
function drawStory(ctx: CanvasRenderingContext2D, stats: Stats, ant: Antwoorden) {
  const H = H_STORY
  const cx = W / 2
  const MARGIN = 108
  const MAX_W = W - MARGIN * 2

  // Achtergrond
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // Subtiele radiale gloed
  const glow = ctx.createRadialGradient(cx, H * 0.38, 100, cx, H * 0.38, W * 0.9)
  glow.addColorStop(0, 'rgba(42,61,46,0.7)')
  glow.addColorStop(1, 'rgba(28,42,32,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // Header label
  ctx.font = `600 32px ${F}`
  ctx.fillStyle = C.muted
  ctx.fillText('ZORG WRAPPED 2026', cx, 80)

  // Superkracht emoji
  ctx.font = `200px ${EMOJI}`
  ctx.fillText(stats.superkracht?.icoon ?? '💙', cx, 170)

  // Superkracht naam
  ctx.font = `800 92px ${SERIF}`
  ctx.fillStyle = C.butter
  const naamEndY = wrapText(ctx, stats.superkracht?.naam ?? '', cx, 460, MAX_W, 108)

  // Uitleg quote
  ctx.font = `italic 500 50px ${SERIF}`
  ctx.fillStyle = C.cream
  const uitlegEndY = wrapText(ctx, `"${stats.superkracht?.uitleg ?? ''}"`, cx, naamEndY + 80, MAX_W, 64)

  // Scheidingslijn
  const divY = Math.max(uitlegEndY + 90, 830)
  ctx.strokeStyle = C.divider
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(MARGIN, divY)
  ctx.lineTo(W - MARGIN, divY)
  ctx.stroke()

  // Naam van de gebruiker
  ctx.font = `700 58px ${F}`
  ctx.fillStyle = C.cream
  ctx.fillText(stats.naam, cx, divY + 60)

  // Hoofdstat
  const stat = kiesStat(stats, ant)
  if (stat) {
    const fs = statFontSize(stat.n, 156)
    ctx.font = `800 ${fs}px ${SERIF}`
    ctx.fillStyle = C.butter
    ctx.fillText(stat.n.toLocaleString('nl-BE'), cx, divY + 190)

    ctx.font = `500 50px ${F}`
    ctx.fillStyle = C.cream
    ctx.fillText(stat.label, cx, divY + 190 + fs + 24)
  }

  // Footer
  ctx.font = `500 36px ${F}`
  ctx.fillStyle = C.dim
  ctx.textBaseline = 'bottom'
  ctx.fillText(COPY.slide8Footer, cx, H - 72)
}

// ─── Teken Post (1080×1080) ───────────────────────────────────────────────────
function drawPost(ctx: CanvasRenderingContext2D, stats: Stats, ant: Antwoorden) {
  const H = H_POST
  const cx = W / 2
  const MARGIN = 100
  const MAX_W = W - MARGIN * 2

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(cx, cx * 0.9, 80, cx, cx * 0.9, W * 0.7)
  glow.addColorStop(0, 'rgba(42,61,46,0.65)')
  glow.addColorStop(1, 'rgba(28,42,32,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  // Header
  ctx.font = `600 30px ${F}`
  ctx.fillStyle = C.muted
  ctx.fillText('ZORG WRAPPED 2026', cx, 62)

  // Emoji (kleiner)
  ctx.font = `160px ${EMOJI}`
  ctx.fillText(stats.superkracht?.icoon ?? '💙', cx, 120)

  // Superkracht naam
  ctx.font = `800 76px ${SERIF}`
  ctx.fillStyle = C.butter
  const naamEndY = wrapText(ctx, stats.superkracht?.naam ?? '', cx, 340, MAX_W, 88)

  // Uitleg
  ctx.font = `italic 500 42px ${SERIF}`
  ctx.fillStyle = C.cream
  const uitlegEndY = wrapText(ctx, `"${stats.superkracht?.uitleg ?? ''}"`, cx, naamEndY + 56, MAX_W, 54)

  // Divider
  const divY = Math.max(uitlegEndY + 56, 660)
  ctx.strokeStyle = C.divider
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(MARGIN, divY)
  ctx.lineTo(W - MARGIN, divY)
  ctx.stroke()

  // Naam
  ctx.font = `700 48px ${F}`
  ctx.fillStyle = C.cream
  ctx.fillText(stats.naam, cx, divY + 46)

  // Stat (compacter)
  const stat = kiesStat(stats, ant)
  if (stat) {
    const fs = statFontSize(stat.n, 112)
    ctx.font = `800 ${fs}px ${SERIF}`
    ctx.fillStyle = C.butter
    ctx.fillText(stat.n.toLocaleString('nl-BE'), cx, divY + 120)
    ctx.font = `500 40px ${F}`
    ctx.fillStyle = C.cream
    ctx.fillText(stat.label, cx, divY + 120 + fs + 16)
  }

  // Footer
  ctx.font = `500 32px ${F}`
  ctx.fillStyle = C.dim
  ctx.textBaseline = 'bottom'
  ctx.fillText(COPY.slide8Footer, cx, H - 56)
}

// ─── Render + download ────────────────────────────────────────────────────────
function renderToCanvas(
  canvas: HTMLCanvasElement,
  format: 'story' | 'post',
  stats: Stats,
  ant: Antwoorden,
) {
  const H = format === 'story' ? H_STORY : H_POST
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  if (format === 'story') drawStory(ctx, stats, ant)
  else drawPost(ctx, stats, ant)
}

const SHARE_URL = process.env.NEXT_PUBLIC_WRAPPED_BASE_URL ?? 'https://zorgwrapped.be'

// Maak een PNG Blob van de off-screen canvas
async function maakBlob(format: 'story' | 'post', stats: Stats, ant: Antwoorden): Promise<Blob | null> {
  const c = document.createElement('canvas')
  await document.fonts.ready
  renderToCanvas(c, format, stats, ant)
  return new Promise(resolve => c.toBlob(resolve, 'image/png'))
}

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────
export default function DeelKaart({ stats, ant }: { stats: Stats; ant: Antwoorden }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [format, setFormat] = useState<'story' | 'post'>('story')
  const [ready,  setReady]  = useState(false)
  const [bezig,  setBezig]  = useState(false)
  const [toast,  setToast]  = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

  // Lettertypen laden
  useEffect(() => {
    async function load() {
      await document.fonts.ready
      try {
        await Promise.all([
          document.fonts.load(`800 100px ${SERIF}`),
          document.fonts.load(`italic 500 50px ${SERIF}`),
          document.fonts.load(`700 60px ${F}`),
        ])
      } catch {}
      setReady(true)
    }
    load()
  }, [])

  // Herteken canvas bij format/data wijziging
  useEffect(() => {
    if (!ready || !canvasRef.current) return
    renderToCanvas(canvasRef.current, format, stats, ant)
  }, [ready, format, stats, ant])

  // ── Acties ────────────────────────────────────────────────────────────────

  async function bewaar() {
    if (bezig) return
    setBezig(true)
    const blob = await maakBlob(format, stats, ant)
    if (blob) {
      const a = document.createElement('a')
      a.download = `zorgwrapped-${stats.naam.toLowerCase().replace(/\s+/g, '-')}-${format}.png`
      a.href = URL.createObjectURL(blob)
      a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 10_000)
    }
    setBezig(false)
  }

  async function deelViaNatief() {
    if (bezig) return
    setBezig(true)
    try {
      const blob = await maakBlob(format, stats, ant)
      if (!blob) { await bewaar(); return }
      const file = new File([blob], `zorgwrapped-${format}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Zorg Wrapped 2026', text: COPY.deelBijschrift, url: SHARE_URL })
      } else {
        // Fallback op desktop of browser zonder file share
        await bewaar()
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') await bewaar()
    } finally {
      setBezig(false)
    }
  }

  async function kopieerLink() {
    try { await navigator.clipboard.writeText(SHARE_URL); showToast(COPY.deelLinkToast) }
    catch { showToast(SHARE_URL) }
  }

  async function kopieerBijschrift() {
    try { await navigator.clipboard.writeText(COPY.deelBijschrift); showToast(COPY.deelBijschriftKnop + ' ✓') }
    catch { showToast('Kon niet kopiëren') }
  }

  function deelWhatsApp() {
    const text = encodeURIComponent(`${COPY.deelWhatsApp}${SHARE_URL}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener')
  }

  function deelFacebook() {
    const url = encodeURIComponent(SHARE_URL)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'noopener,width=620,height=400')
  }

  // ── Preview afmetingen ─────────────────────────────────────────────────────
  const PREVIEW_W = 288
  const PREVIEW_H = format === 'story' ? Math.round(PREVIEW_W * H_STORY / W) : PREVIEW_W

  // Detecteer of native file share beschikbaar is (= mobiel)
  const kanNatiefDelen = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div style={{ fontFamily: '"Bricolage Grotesque",-apple-system,sans-serif' }}>

      {/* Formaat-keuze */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['story', 'post'] as const).map(f => (
          <button key={f} onClick={() => setFormat(f)} style={{
            flex: 1, padding: '10px 8px',
            background: format === f ? C.butter : SURF_STYLE,
            color: format === f ? '#1A1A17' : CREAM_STYLE,
            border: `2px solid ${format === f ? C.butter : BORDER_STYLE}`,
            borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700,
            fontFamily: '"Bricolage Grotesque",-apple-system,sans-serif',
          }}>
            {f === 'story' ? 'Story (9:16)' : 'Post (1:1)'}
          </button>
        ))}
      </div>

      {/* Canvas preview */}
      <div style={{ width: PREVIEW_W, height: PREVIEW_H, margin: '0 auto 20px', borderRadius: 12, overflow: 'hidden', border: `1px solid ${BORDER_STYLE}`, background: '#1C2A20' }}>
        {!ready
          ? <div style={{ height: PREVIEW_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: MUTED_STYLE, fontSize: 13 }}>Kaart laden…</p>
            </div>
          : <canvas ref={canvasRef} style={{ width: PREVIEW_W, height: PREVIEW_H, display: 'block' }} />
        }
      </div>

      {/* Primaire deel-knop */}
      <button onClick={kanNatiefDelen ? deelViaNatief : bewaar}
        disabled={!ready || bezig}
        style={{
          display: 'block', width: '100%', padding: '16px 24px',
          background: ready ? C.clay : SURF_STYLE, color: '#FBF8F2',
          border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
          fontFamily: '"Bricolage Grotesque",-apple-system,sans-serif',
          cursor: ready ? 'pointer' : 'default', marginBottom: 8,
          opacity: ready ? 1 : 0.6,
        }}>
        {bezig ? 'Even wachten…' : kanNatiefDelen ? COPY.deelKnopHoofd : '↓ Bewaar als afbeelding'}
      </button>

      {/* Desktop: aparte download-knop als native share beschikbaar is */}
      {kanNatiefDelen && (
        <button onClick={bewaar} disabled={!ready || bezig} style={{
          display: 'block', width: '100%', padding: '12px 24px',
          background: SURF_STYLE, color: CREAM_STYLE,
          border: `1px solid ${BORDER_STYLE}`, borderRadius: 12,
          fontSize: 14, fontWeight: 600,
          fontFamily: '"Bricolage Grotesque",-apple-system,sans-serif',
          cursor: ready ? 'pointer' : 'default', marginBottom: 10,
          opacity: ready ? 1 : 0.5,
        }}>
          ↓ Bewaar als afbeelding
        </button>
      )}

      {/* WhatsApp + Facebook */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={deelWhatsApp} style={{
          flex: 1, padding: '12px 8px',
          background: '#25D366', color: '#fff',
          border: 'none', borderRadius: 10, cursor: 'pointer',
          fontSize: 14, fontWeight: 700,
          fontFamily: '"Bricolage Grotesque",-apple-system,sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>💬</span> WhatsApp
        </button>
        <button onClick={deelFacebook} style={{
          flex: 1, padding: '12px 8px',
          background: '#1877F2', color: '#fff',
          border: 'none', borderRadius: 10, cursor: 'pointer',
          fontSize: 14, fontWeight: 700,
          fontFamily: '"Bricolage Grotesque",-apple-system,sans-serif',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>📘</span> Facebook
        </button>
      </div>

      {/* Kopieer link + bijschrift */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '4px 0 2px' }}>
        <button onClick={kopieerLink} style={{ background: 'none', border: 'none', color: MUTED_STYLE, fontSize: 13, cursor: 'pointer', fontFamily: '"Bricolage Grotesque",-apple-system,sans-serif', padding: '4px 0', textDecoration: 'underline' }}>
          Kopieer link
        </button>
        <span style={{ color: 'rgba(232,208,138,0.2)', fontSize: 13, lineHeight: '22px' }}>|</span>
        <button onClick={kopieerBijschrift} style={{ background: 'none', border: 'none', color: MUTED_STYLE, fontSize: 13, cursor: 'pointer', fontFamily: '"Bricolage Grotesque",-apple-system,sans-serif', padding: '4px 0', textDecoration: 'underline' }}>
          {COPY.deelBijschriftKnop}
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: C.butter, color: '#1A1A17',
          padding: '12px 22px', borderRadius: 24,
          fontSize: 14, fontWeight: 700, zIndex: 9999,
          whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          fontFamily: '"Bricolage Grotesque",-apple-system,sans-serif',
          pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
