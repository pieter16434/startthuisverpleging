import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Zorg Wrapped 2026 — jouw jaar in de zorg'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1C2A20',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '80px',
          fontFamily: 'Georgia, serif',
          position: 'relative',
        }}
      >
        {/* Subtiele gloed */}
        <div style={{
          position: 'absolute',
          width: 800, height: 800,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(42,61,46,0.8) 0%, rgba(28,42,32,0) 70%)',
          display: 'flex',
        }} />

        {/* Label */}
        <div style={{
          color: 'rgba(232,208,138,0.55)',
          fontSize: 22,
          letterSpacing: '0.16em',
          marginBottom: 28,
          display: 'flex',
        }}>
          ZORG WRAPPED 2026
        </div>

        {/* Hoofdtitel */}
        <div style={{
          color: '#E8D08A',
          fontSize: 78,
          fontWeight: 800,
          textAlign: 'center',
          lineHeight: 1.15,
          margin: '0 0 28px',
          display: 'flex',
          maxWidth: 900,
        }}>
          Jouw jaar in de zorg,<br />in 90 seconden.
        </div>

        {/* Subtekst */}
        <div style={{
          color: 'rgba(247,243,234,0.6)',
          fontSize: 28,
          textAlign: 'center',
          maxWidth: 760,
          lineHeight: 1.55,
          display: 'flex',
        }}>
          Nachten, weekends, kilometers. Tijd dat iemand het eens optelt.
        </div>

        {/* Footer */}
        <div style={{
          position: 'absolute',
          bottom: 44,
          color: 'rgba(232,208,138,0.35)',
          fontSize: 22,
          display: 'flex',
          letterSpacing: '0.04em',
        }}>
          zorgwrapped.be
        </div>
      </div>
    ),
    { ...size }
  )
}
