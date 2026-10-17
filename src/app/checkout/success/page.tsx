'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

const PIXEL_ID = '1885798712582280'

function MetaPurchaseFirer() {
  const params = useSearchParams()

  useEffect(() => {
    const orderId    = params.get('order_id')
    const amountStr  = params.get('amount_cents')
    if (!orderId || !amountStr) return

    let consent: string | null = null
    try { consent = localStorage.getItem('stv_cookie_consent') } catch {}
    if (consent !== 'yes') return

    const value   = parseInt(amountStr, 10) / 100
    const eventId = `purchase_${orderId}`

    function fireEvent() {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fbq = (window as any).fbq as ((...args: unknown[]) => void) | undefined
      if (typeof fbq !== 'function') return
      fbq('init', PIXEL_ID)
      fbq('track', 'Purchase',
        { value, currency: 'EUR', content_ids: ['gids-zelfstandig-thuisverpleegkundige'], num_items: 1 },
        { eventID: eventId }
      )
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (typeof (window as any).fbq === 'function') {
      fireEvent()
      return
    }

    // Laad fbevents.js en definieer fbq stub
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any
    if (!w.fbq) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const q: unknown[][] = []; const n: any = (...a: unknown[]) => q.push(a)
      n.queue = q; n.loaded = true; n.version = '2.0'; n.push = n
      w.fbq = n; w._fbq = n
    }
    const script = document.createElement('script')
    script.async = true
    script.src   = 'https://connect.facebook.net/en_US/fbevents.js'
    script.onload = fireEvent
    document.head.appendChild(script)
  }, [params])

  return null
}

export default function SuccessPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#F1ECE0',
      fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <Suspense fallback={null}>
        <MetaPurchaseFirer />
      </Suspense>

      <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>

        {/* Check icoon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#2A3D2E', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 28px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8D08A" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        {/* Titel */}
        <h1 style={{
          fontFamily: 'Georgia, serif', fontSize: 30, color: '#1A1A17',
          fontWeight: 400, marginBottom: 12,
        }}>
          Betaling geslaagd!
        </h1>
        <p style={{ color: '#3A3A33', fontSize: 17, lineHeight: 1.6, marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>
          Bedankt voor je aankoop. Je ontvangt dadelijk een bevestigingsmail.
          Daarna sturen we je gids zo snel mogelijk door.
        </p>

        {/* Info blok */}
        <div style={{
          background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 14,
          padding: '24px 28px', marginBottom: 28, textAlign: 'left',
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6E6B62', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            Wat nu?
          </p>
          {[
            { icon: '📧', text: 'Je krijgt een bevestigingsmail op het adres dat je invulde. Controleer ook je spammap als je niets ziet.' },
            { icon: '📄', text: 'Zodra jouw gids klaar is sturen we de downloadlink door. Dit duurt normaal niet lang.' },
            { icon: '🛡️', text: '30 dagen geld-terug-garantie. Geen vragen, geen gedoe.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 2 ? 14 : 0, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <p style={{ margin: 0, fontSize: 15, color: '#3A3A33', lineHeight: 1.5 }}>{item.text}</p>
            </div>
          ))}
        </div>

        <a href="/" style={{
          display: 'inline-block', padding: '13px 28px',
          background: '#2A3D2E', color: '#F7F3EA', borderRadius: 100,
          textDecoration: 'none', fontSize: 15, fontWeight: 600,
        }}>
          ← Terug naar de website
        </a>
      </div>
    </main>
  )
}
