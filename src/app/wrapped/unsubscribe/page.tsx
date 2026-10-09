import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Uitgeschreven',
  robots: { index: false },
}

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const ok = searchParams.status === 'ok'

  return (
    <main style={{
      minHeight: '100dvh', background: '#1C2A20',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', fontFamily: '"Bricolage Grotesque",-apple-system,sans-serif',
    }}>
      <div style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <p style={{ fontSize: 48, margin: '0 0 20px' }}>{ok ? '✓' : '⚠️'}</p>
        <h1 style={{
          margin: '0 0 16px', fontSize: 'clamp(22px,5vw,30px)',
          fontFamily: '"Fraunces",Georgia,serif', color: '#E8D08A',
          fontWeight: 800, lineHeight: 1.2,
        }}>
          {ok ? 'Je bent uitgeschreven.' : 'Ongeldige link.'}
        </h1>
        <p style={{ margin: '0 0 36px', fontSize: 16, color: 'rgba(247,243,234,0.7)', lineHeight: 1.6 }}>
          {ok
            ? 'Je ontvangt geen e-mails meer van Zorg Wrapped.'
            : 'De uitschrijflink is ongeldig of al gebruikt. Stuur ons een mail als je nog e-mails ontvangt.'}
        </p>
        <a
          href="https://zorgwrapped.be"
          style={{
            display: 'inline-block', padding: '14px 28px',
            background: '#2A3D2E', color: 'rgba(247,243,234,0.8)',
            textDecoration: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600,
          }}
        >
          Terug naar Zorg Wrapped
        </a>
      </div>
    </main>
  )
}
