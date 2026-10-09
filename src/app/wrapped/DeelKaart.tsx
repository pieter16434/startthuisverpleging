'use client'
import { useEffect, useRef, useState, useMemo } from 'react'
import { COPY } from '@/lib/wrapped/copy'
import type { Stats, Antwoorden } from '@/lib/wrapped/calculations'

const W       = 1080
const H_STORY = 1920
const H_POST  = 1080

const C = {
  bg:       '#1E2D22',
  surf:     '#2A3D2E',
  butter:   '#E8D08A',
  cream:    'rgba(251,248,242,0.95)',
  muted:    'rgba(232,208,138,0.55)',
  dim:      'rgba(232,208,138,0.28)',
  divider:  'rgba(232,208,138,0.20)',
  tile:     '#243328',
  tileEdge: 'rgba(232,208,138,0.22)',
} as const

const F     = '"Bricolage Grotesque", -apple-system, sans-serif'
const SERIF = '"Fraunces", Georgia, serif'
const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", serif'

const SURF_S   = '#2A3D2E'
const BORDER_S = 'rgba(232,208,138,0.2)'
const CREAM_S  = 'rgba(247,243,234,0.9)'
const MUTED_S  = 'rgba(247,243,234,0.45)'
const BUTTER_S = '#E8D08A'
const CLAY_S   = '#B65436'
const BG_S     = '#1E2D22'

// ─── Stat-definitie ───────────────────────────────────────────────────────────
type StatVal = { display: string; numeric: number | null }
type StatDef = {
  id: string
  chipLabel: string
  canvasLabel: string
  priority: number
  get: (stats: Stats, ant: Antwoorden) => StatVal | null
}

const STAT_DEFS: StatDef[] = [
  {
    id: 'patienten', chipLabel: 'Patiënten', canvasLabel: 'patiënten\nverzorgd', priority: 1,
    get: (s) => s.patientenTotaal && s.patientenTotaal > 0
      ? { display: s.patientenTotaal.toLocaleString('nl-BE'), numeric: s.patientenTotaal } : null,
  },
  {
    id: 'km', chipLabel: 'Km gelopen', canvasLabel: 'km\ngewandeld', priority: 2,
    get: (s) => s.stappenKm && s.stappenKm > 0
      ? { display: s.stappenKm.toLocaleString('nl-BE'), numeric: s.stappenKm } : null,
  },
  {
    id: 'stageUren', chipLabel: 'Uur stage', canvasLabel: 'uur\nstage', priority: 2,
    get: (_, a) => a.stageUren > 0
      ? { display: a.stageUren.toLocaleString('nl-BE'), numeric: a.stageUren } : null,
  },
  {
    id: 'nachtdiensten', chipLabel: 'Nachtdiensten', canvasLabel: 'nacht-\ndiensten', priority: 3,
    get: (_, a) => a.nachtdiensten > 0
      ? { display: a.nachtdiensten.toLocaleString('nl-BE'), numeric: a.nachtdiensten } : null,
  },
  {
    id: 'weekends', chipLabel: 'Weekends', canvasLabel: 'weekends\ngewerkt', priority: 4,
    get: (_, a) => a.weekends > 0
      ? { display: a.weekends.toLocaleString('nl-BE'), numeric: a.weekends } : null,
  },
  {
    id: 'stageplaatsen', chipLabel: 'Stageplaatsen', canvasLabel: 'stage-\nplaatsen', priority: 4,
    get: (s) => s.stageplaatsen && s.stageplaatsen > 0
      ? { display: s.stageplaatsen.toLocaleString('nl-BE'), numeric: s.stageplaatsen } : null,
  },
  {
    id: 'diensten', chipLabel: 'Diensten', canvasLabel: 'diensten\ndit jaar', priority: 5,
    get: (s) => s.dienstenPerJaar && s.dienstenPerJaar > 0
      ? { display: s.dienstenPerJaar.toLocaleString('nl-BE'), numeric: s.dienstenPerJaar } : null,
  },
  {
    id: 'afdeling', chipLabel: 'Afdeling', canvasLabel: 'afdeling', priority: 6,
    get: (_, a) => a.afdeling ? { display: a.afdeling, numeric: null } : null,
  },
  {
    id: 'provincie', chipLabel: 'Provincie', canvasLabel: 'provincie', priority: 7,
    get: (_, a) => a.provincie ? { display: a.provincie, numeric: null } : null,
  },
]

// ─── Canvas helpers ───────────────────────────────────────────────────────────
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number): number {
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

function drawRR(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

function numFontSize(display: string, base: number): number {
  const len = display.replace(/[^0-9]/g, '').length
  if (len <= 3) return base
  if (len <= 5) return Math.round(base * 0.82)
  if (len <= 7) return Math.round(base * 0.68)
  return Math.round(base * 0.56)
}

function drawStatTile(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  val: StatVal, label: string,
) {
  drawRR(ctx, x, y, w, h, 22)
  ctx.fillStyle = C.tile
  ctx.fill()
  ctx.strokeStyle = C.tileEdge
  ctx.lineWidth = 2
  ctx.stroke()

  const tcx = x + w / 2
  ctx.textAlign = 'center'

  if (val.numeric !== null) {
    const fs = numFontSize(val.display, Math.round(h * 0.23))
    ctx.font = `800 ${fs}px ${SERIF}`
    ctx.fillStyle = C.butter
    ctx.textBaseline = 'top'
    ctx.fillText(val.display, tcx, y + Math.round(h * 0.10))

    const lines = label.split('\n')
    const lfs = Math.max(26, Math.round(h * 0.09))
    ctx.font = `500 ${lfs}px ${F}`
    ctx.fillStyle = C.cream
    const ly = y + Math.round(h * 0.10) + fs + 10
    lines.forEach((line, i) => ctx.fillText(line, tcx, ly + i * (lfs + 5)))
  } else {
    // Tekststat (afdeling, provincie)
    const txt = val.display
    const tfs = txt.length <= 8 ? Math.round(h * 0.19)
      : txt.length <= 14 ? Math.round(h * 0.14)
      : Math.round(h * 0.10)
    ctx.font = `700 ${tfs}px ${F}`
    ctx.fillStyle = C.butter
    ctx.textBaseline = 'middle'
    ctx.fillText(txt, tcx, y + h * 0.42)

    const lfs = Math.max(24, Math.round(h * 0.082))
    ctx.font = `500 ${lfs}px ${F}`
    ctx.fillStyle = C.muted
    ctx.textBaseline = 'top'
    ctx.fillText(label, tcx, y + h * 0.68)
  }
}

// ─── Draw Story (1080×1920) ───────────────────────────────────────────────────
function drawStory(
  ctx: CanvasRenderingContext2D,
  stats: Stats,
  selected: Array<{ def: StatDef; val: StatVal }>,
) {
  const H = H_STORY
  const cx = W / 2
  const MG = 96
  const IW = W - MG * 2

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(cx, H * 0.33, 60, cx, H * 0.33, W * 0.88)
  glow.addColorStop(0, 'rgba(52,82,58,0.55)')
  glow.addColorStop(1, 'rgba(30,45,34,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  ctx.font = `600 30px ${F}`
  ctx.fillStyle = C.muted
  ctx.fillText('ZORG WRAPPED 2026', cx, 84)

  ctx.font = `180px ${EMOJI}`
  ctx.fillText(stats.superkracht?.icoon ?? '💙', cx, 150)

  ctx.font = `800 84px ${SERIF}`
  ctx.fillStyle = C.butter
  const naamEndY = wrapText(ctx, stats.superkracht?.naam ?? '', cx, 420, IW, 100)

  ctx.font = `italic 500 46px ${SERIF}`
  ctx.fillStyle = C.cream
  const uitlegEndY = wrapText(ctx, `"${stats.superkracht?.uitleg ?? ''}"`, cx, naamEndY + 68, IW, 60)

  const divY = Math.max(uitlegEndY + 72, 780)
  ctx.strokeStyle = C.divider
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(MG + 60, divY)
  ctx.lineTo(W - MG - 60, divY)
  ctx.stroke()

  ctx.font = `700 52px ${F}`
  ctx.fillStyle = C.cream
  ctx.textBaseline = 'top'
  ctx.fillText(stats.naam, cx, divY + 48)

  const ST  = Math.max(divY + 48 + 52 + 60, 900)
  const GAP = 18
  const n   = selected.length
  const availH = 1680 - ST

  if (n === 1) {
    const TH = Math.min(440, availH)
    drawStatTile(ctx, MG, ST, IW, TH, selected[0].val, selected[0].def.canvasLabel)
  } else if (n === 2) {
    const TW = (IW - GAP) / 2
    const TH = Math.min(400, availH)
    drawStatTile(ctx, MG, ST, TW, TH, selected[0].val, selected[0].def.canvasLabel)
    drawStatTile(ctx, MG + TW + GAP, ST, TW, TH, selected[1].val, selected[1].def.canvasLabel)
  } else if (n === 3) {
    const TW = (IW - GAP) / 2
    const TH = Math.min(340, (availH - GAP) / 2)
    drawStatTile(ctx, MG, ST, TW, TH, selected[0].val, selected[0].def.canvasLabel)
    drawStatTile(ctx, MG + TW + GAP, ST, TW, TH, selected[1].val, selected[1].def.canvasLabel)
    drawStatTile(ctx, MG, ST + TH + GAP, IW, TH, selected[2].val, selected[2].def.canvasLabel)
  } else if (n >= 4) {
    const TW = (IW - GAP) / 2
    const TH = Math.min(340, (availH - GAP) / 2)
    drawStatTile(ctx, MG, ST, TW, TH, selected[0].val, selected[0].def.canvasLabel)
    drawStatTile(ctx, MG + TW + GAP, ST, TW, TH, selected[1].val, selected[1].def.canvasLabel)
    drawStatTile(ctx, MG, ST + TH + GAP, TW, TH, selected[2].val, selected[2].def.canvasLabel)
    drawStatTile(ctx, MG + TW + GAP, ST + TH + GAP, TW, TH, selected[3].val, selected[3].def.canvasLabel)
  }

  // Decoratieve elementen
  ctx.globalAlpha = 0.45
  ctx.font = `54px ${EMOJI}`
  ctx.textBaseline = 'top'
  ctx.fillText('🩺', cx - 130, 1722)
  ctx.fillText('❤️', cx + 60, 1722)
  ctx.globalAlpha = 1

  ctx.strokeStyle = C.divider
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(MG, 1796)
  ctx.lineTo(W - MG, 1796)
  ctx.stroke()

  ctx.font = `500 32px ${F}`
  ctx.fillStyle = C.dim
  ctx.textBaseline = 'bottom'
  ctx.fillText(COPY.slide8Footer, cx, H - 64)
}

// ─── Draw Post (1080×1080) ────────────────────────────────────────────────────
function drawPost(
  ctx: CanvasRenderingContext2D,
  stats: Stats,
  selected: Array<{ def: StatDef; val: StatVal }>,
) {
  const H = H_POST
  const cx = W / 2
  const MG = 100
  const IW = W - MG * 2

  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  const glow = ctx.createRadialGradient(cx, H * 0.40, 60, cx, H * 0.40, W * 0.72)
  glow.addColorStop(0, 'rgba(52,82,58,0.5)')
  glow.addColorStop(1, 'rgba(30,45,34,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  ctx.font = `600 28px ${F}`
  ctx.fillStyle = C.muted
  ctx.fillText('ZORG WRAPPED 2026', cx, 58)

  ctx.font = `150px ${EMOJI}`
  ctx.fillText(stats.superkracht?.icoon ?? '💙', cx, 112)

  ctx.font = `800 72px ${SERIF}`
  ctx.fillStyle = C.butter
  const naamEndY = wrapText(ctx, stats.superkracht?.naam ?? '', cx, 320, IW, 86)

  ctx.font = `italic 500 40px ${SERIF}`
  ctx.fillStyle = C.cream
  const uitlegEndY = wrapText(ctx, `"${stats.superkracht?.uitleg ?? ''}"`, cx, naamEndY + 48, IW, 52)

  const divY = Math.max(uitlegEndY + 50, 640)
  ctx.strokeStyle = C.divider
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(MG + 40, divY)
  ctx.lineTo(W - MG - 40, divY)
  ctx.stroke()

  ctx.font = `700 46px ${F}`
  ctx.fillStyle = C.cream
  ctx.textBaseline = 'top'
  ctx.fillText(stats.naam, cx, divY + 40)

  // Post toont max 2 stats
  const postSel = selected.slice(0, 2)
  const ST  = Math.max(divY + 40 + 46 + 40, 760)
  const GAP = 16
  const TH  = Math.min(220, 1010 - ST)

  if (postSel.length === 1) {
    drawStatTile(ctx, MG, ST, IW, TH, postSel[0].val, postSel[0].def.canvasLabel)
  } else if (postSel.length >= 2) {
    const TW = (IW - GAP) / 2
    drawStatTile(ctx, MG, ST, TW, TH, postSel[0].val, postSel[0].def.canvasLabel)
    drawStatTile(ctx, MG + TW + GAP, ST, TW, TH, postSel[1].val, postSel[1].def.canvasLabel)
  }

  ctx.font = `500 28px ${F}`
  ctx.fillStyle = C.dim
  ctx.textBaseline = 'bottom'
  ctx.fillText(COPY.slide8Footer, cx, H - 52)
}

// ─── Render ───────────────────────────────────────────────────────────────────
function renderToCanvas(
  canvas: HTMLCanvasElement,
  format: 'story' | 'post',
  stats: Stats,
  selected: Array<{ def: StatDef; val: StatVal }>,
) {
  canvas.width  = W
  canvas.height = format === 'story' ? H_STORY : H_POST
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  if (format === 'story') drawStory(ctx, stats, selected)
  else drawPost(ctx, stats, selected)
}

const SHARE_URL = process.env.NEXT_PUBLIC_WRAPPED_BASE_URL ?? 'https://zorgwrapped.be'

async function maakBlob(
  format: 'story' | 'post',
  stats: Stats,
  selected: Array<{ def: StatDef; val: StatVal }>,
): Promise<Blob | null> {
  const c = document.createElement('canvas')
  await document.fonts.ready
  renderToCanvas(c, format, stats, selected)
  return new Promise(resolve => c.toBlob(resolve, 'image/png'))
}

// ─── Hoofdcomponent ───────────────────────────────────────────────────────────
export default function DeelKaart({ stats, ant }: { stats: Stats; ant: Antwoorden }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [format,      setFormat]      = useState<'story' | 'post'>('story')
  const [ready,       setReady]       = useState(false)
  const [bezig,       setBezig]       = useState(false)
  const [toast,       setToast]       = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // Alleen stats met waarden
  const availableStats = useMemo(
    () => STAT_DEFS
      .map(def => ({ def, val: def.get(stats, ant) }))
      .filter((x): x is { def: StatDef; val: StatVal } => x.val !== null)
      .sort((a, b) => a.def.priority - b.def.priority),
    [stats, ant],
  )

  // Auto-selecteer top 4 bij start / wijziging
  useEffect(() => {
    setSelectedIds(availableStats.slice(0, 4).map(x => x.def.id))
  }, [availableStats])

  const selectedStats = useMemo(
    () => selectedIds
      .map(id => availableStats.find(x => x.def.id === id))
      .filter((x): x is { def: StatDef; val: StatVal } => !!x),
    [selectedIds, availableStats],
  )

  function toggleStat(id: string) {
    setSelectedIds(prev => {
      if (prev.includes(id)) return prev.filter(i => i !== id)
      if (prev.length >= 4) return prev
      return [...prev, id]
    })
  }

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }

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

  useEffect(() => {
    if (!ready || !canvasRef.current) return
    renderToCanvas(canvasRef.current, format, stats, selectedStats)
  }, [ready, format, stats, selectedStats])

  async function bewaar() {
    if (bezig) return
    setBezig(true)
    const blob = await maakBlob(format, stats, selectedStats)
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
      const blob = await maakBlob(format, stats, selectedStats)
      if (!blob) { await bewaar(); return }
      const file = new File([blob], `zorgwrapped-${format}.png`, { type: 'image/png' })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Zorg Wrapped 2026', text: COPY.deelBijschrift, url: SHARE_URL })
      } else {
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
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(`${COPY.deelWhatsApp}${SHARE_URL}`)}`, '_blank', 'noopener')
  }

  function deelFacebook() {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE_URL)}`, '_blank', 'noopener,width=620,height=400')
  }

  const PREVIEW_W = 288
  const PREVIEW_H = format === 'story' ? Math.round(PREVIEW_W * H_STORY / W) : PREVIEW_W
  const kanNatiefDelen = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div style={{ fontFamily: F }}>

      {/* Stat-selector */}
      {availableStats.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: '0 0 10px', fontSize: 13, color: MUTED_S, fontFamily: F }}>
            Kies je stats <span style={{ color: 'rgba(232,208,138,0.45)' }}>({selectedIds.length}/4)</span>:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {availableStats.map(({ def }) => {
              const active   = selectedIds.includes(def.id)
              const disabled = !active && selectedIds.length >= 4
              return (
                <button
                  key={def.id}
                  onClick={() => !disabled && toggleStat(def.id)}
                  style={{
                    padding: '8px 14px',
                    background: active ? BUTTER_S : SURF_S,
                    color: active ? '#1A1A17' : disabled ? 'rgba(247,243,234,0.2)' : CREAM_S,
                    border: `2px solid ${active ? BUTTER_S : disabled ? 'rgba(232,208,138,0.08)' : BORDER_S}`,
                    borderRadius: 20,
                    cursor: disabled ? 'default' : 'pointer',
                    fontSize: 13, fontWeight: 700, fontFamily: F,
                    transition: 'background 0.16s ease, color 0.16s ease, border-color 0.16s ease',
                    opacity: disabled ? 0.38 : 1,
                  }}
                >
                  {def.chipLabel}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Formaat-keuze */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {(['story', 'post'] as const).map(f => (
          <button key={f} onClick={() => setFormat(f)} style={{
            flex: 1, padding: '10px 8px',
            background: format === f ? BUTTER_S : SURF_S,
            color: format === f ? '#1A1A17' : CREAM_S,
            border: `2px solid ${format === f ? BUTTER_S : BORDER_S}`,
            borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: F,
            transition: 'background 0.15s ease, color 0.15s ease',
          }}>
            {f === 'story' ? 'Story (9:16)' : 'Post (1:1)'}
          </button>
        ))}
      </div>

      {/* Canvas preview */}
      <div style={{
        width: PREVIEW_W, height: PREVIEW_H,
        margin: '0 auto 20px', borderRadius: 12,
        overflow: 'hidden', border: `1px solid ${BORDER_S}`,
        background: BG_S,
        opacity: ready ? 1 : 0,
        transform: ready ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        {!ready
          ? <div style={{ height: PREVIEW_H, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <p style={{ color: MUTED_S, fontSize: 13 }}>Kaart laden…</p>
            </div>
          : <canvas ref={canvasRef} style={{ width: PREVIEW_W, height: PREVIEW_H, display: 'block' }} />
        }
      </div>

      {/* Primaire deel-knop */}
      <button
        onClick={kanNatiefDelen ? deelViaNatief : bewaar}
        disabled={!ready || bezig}
        style={{
          display: 'block', width: '100%', padding: '16px 24px',
          background: ready ? CLAY_S : SURF_S, color: '#FBF8F2',
          border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, fontFamily: F,
          cursor: ready ? 'pointer' : 'default', marginBottom: 8,
          opacity: ready ? 1 : 0.6,
          transition: 'opacity 0.2s ease',
        }}
      >
        {bezig ? 'Even wachten…' : kanNatiefDelen ? COPY.deelKnopHoofd : '↓ Bewaar als afbeelding'}
      </button>

      {kanNatiefDelen && (
        <button onClick={bewaar} disabled={!ready || bezig} style={{
          display: 'block', width: '100%', padding: '12px 24px',
          background: SURF_S, color: CREAM_S,
          border: `1px solid ${BORDER_S}`, borderRadius: 12,
          fontSize: 14, fontWeight: 600, fontFamily: F,
          cursor: ready ? 'pointer' : 'default', marginBottom: 10,
          opacity: ready ? 1 : 0.5,
        }}>
          ↓ Bewaar als afbeelding
        </button>
      )}

      {/* WhatsApp + Facebook */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <button onClick={deelWhatsApp} style={{
          flex: 1, padding: '12px 8px', background: '#25D366', color: '#fff',
          border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: F,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>💬</span> WhatsApp
        </button>
        <button onClick={deelFacebook} style={{
          flex: 1, padding: '12px 8px', background: '#1877F2', color: '#fff',
          border: 'none', borderRadius: 10, cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: F,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        }}>
          <span style={{ fontSize: 16 }}>📘</span> Facebook
        </button>
      </div>

      {/* Kopieer link + bijschrift */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', padding: '4px 0 2px' }}>
        <button onClick={kopieerLink} style={{
          background: 'none', border: 'none', color: MUTED_S, fontSize: 13,
          cursor: 'pointer', fontFamily: F, padding: '4px 0', textDecoration: 'underline',
        }}>
          Kopieer link
        </button>
        <span style={{ color: 'rgba(232,208,138,0.2)', fontSize: 13, lineHeight: '22px' }}>|</span>
        <button onClick={kopieerBijschrift} style={{
          background: 'none', border: 'none', color: MUTED_S, fontSize: 13,
          cursor: 'pointer', fontFamily: F, padding: '4px 0', textDecoration: 'underline',
        }}>
          {COPY.deelBijschriftKnop}
        </button>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
          background: BUTTER_S, color: '#1A1A17',
          padding: '12px 22px', borderRadius: 24,
          fontSize: 14, fontWeight: 700, zIndex: 9999,
          whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          fontFamily: F, pointerEvents: 'none',
        }}>
          {toast}
        </div>
      )}
    </div>
  )
}
