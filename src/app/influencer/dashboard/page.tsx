'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const PLATFORM_LABELS: Record<string, string> = {
  instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube',
  facebook: 'Facebook', other: 'Sociaal media',
}

type Influencer = {
  name: string; platform: string; social_handle: string; profile_url: string | null
  discount_code: string; payout_per_use: number; is_active: boolean
  deactivated_at: string | null; graceEndsAt: string | null
}
type Stats = { totalUses: number; totalEarnings: number }
type MonthEntry = { month: string; uses: number; earnings: number }

function fmt(monthKey: string) {
  const [y, m] = monthKey.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })
}

export default function InfluencerDashboard() {
  const router = useRouter()
  const [influencer, setInfluencer] = useState<Influencer | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [monthly, setMonthly] = useState<MonthEntry[]>([])
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  useEffect(() => {
    fetch('/api/influencer/dashboard')
      .then(r => {
        if (r.status === 401) { router.push('/influencer'); return null }
        return r.json()
      })
      .then(d => {
        if (!d) return
        setInfluencer(d.influencer)
        setStats(d.stats)
        setMonthly(d.monthly)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  async function handleLogout() {
    await fetch('/api/influencer/logout', { method: 'POST' })
    router.push('/influencer')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6E6B62' }}>Laden…</p>
    </div>
  )

  if (!influencer || !stats) return null

  const isDeactivated = !influencer.is_active
  const graceEnd = influencer.graceEndsAt ? new Date(influencer.graceEndsAt) : null
  const inGrace = isDeactivated && graceEnd && new Date() < graceEnd

  return (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ background: '#1C2A20', padding: '0 clamp(20px,4vw,48px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#fff', fontWeight: 700 }}>
          start<span style={{ color: '#E8D08A' }}>thuisverpleging</span>
          <span style={{ fontSize: 12, color: '#8A9588', fontFamily: 'system-ui', fontWeight: 400, marginLeft: 10 }}>Influencer portaal</span>
        </span>
        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #8A9588', color: '#D8D0C0', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Uitloggen
        </button>
      </header>

      <main style={{ maxWidth: 900, margin: '0 auto', padding: '36px clamp(20px,4vw,48px)' }}>

        {/* Grace period banner */}
        {inGrace && (
          <div style={{ background: '#FEF3E2', border: '1px solid #F5C6C0', borderRadius: 10, padding: '14px 20px', marginBottom: 24, fontSize: 14, color: '#B65436' }}>
            <strong>Samenwerking beëindigd</strong> — je portaal en kortingscode blijven nog actief tot{' '}
            <strong>{graceEnd?.toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.
            Daarna werkt je code niet meer. Neem contact op via <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a> bij vragen.
          </div>
        )}

        {/* Welkom + code */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'start', marginBottom: 28, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1A1A17', marginBottom: 4 }}>Welkom, {influencer.name}</h1>
            <p style={{ color: '#6E6B62', fontSize: 14 }}>
              {PLATFORM_LABELS[influencer.platform] ?? influencer.platform} · {influencer.social_handle}
              {influencer.profile_url && (
                <> · <a href={influencer.profile_url} target="_blank" rel="noopener noreferrer" style={{ color: '#B65436' }}>profiel ↗</a></>
              )}
            </p>
          </div>
          {/* Kortingscode badge */}
          <div style={{ background: '#2A3D2E', borderRadius: 10, padding: '14px 20px', textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontSize: 10, color: '#E8D08A', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>Jouw kortingscode</div>
            <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 700, color: '#fff', letterSpacing: 3 }}>{influencer.discount_code}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 3 }}>20% korting voor volgers</div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 32 }}>
          <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#2A3D2E', fontFamily: 'Georgia, serif' }}>{stats.totalUses}</div>
            <div style={{ fontSize: 13, color: '#6E6B62', marginTop: 2 }}>Totaal verkopen via jouw code</div>
          </div>
          <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#B65436', fontFamily: 'Georgia, serif' }}>
              € {stats.totalEarnings.toFixed(0)}
            </div>
            <div style={{ fontSize: 13, color: '#6E6B62', marginTop: 2 }}>Totale uitbetaling</div>
          </div>
          <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '20px 22px' }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#2A3D2E', fontFamily: 'Georgia, serif' }}>
              € {influencer.payout_per_use}
            </div>
            <div style={{ fontSize: 13, color: '#6E6B62', marginTop: 2 }}>Per verkoop via jouw code</div>
          </div>
        </div>

        {/* Maandoverzicht */}
        <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 16, overflow: 'hidden' }}>
          <div style={{ background: '#2A3D2E', padding: '16px 24px' }}>
            <h2 style={{ color: '#fff', fontFamily: 'Georgia, serif', fontSize: 18, margin: 0 }}>Maandoverzicht</h2>
            <p style={{ color: '#8A9588', fontSize: 13, margin: '4px 0 0' }}>Alle verkopen via jouw kortingscode, per maand</p>
          </div>

          {monthly.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: '#6E6B62', fontSize: 14 }}>
              Nog geen verkopen via jouw code. Deel hem met je volgers!
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F1ECE0' }}>
                    {['Maand', 'Verkopen', 'Uitbetaling', 'Status'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 20px', color: '#6E6B62', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthly.map((entry, i) => {
                    const isCurrent = entry.month === thisMonth
                    return (
                      <tr key={entry.month} style={{ borderTop: '1px solid #EDE9E0', background: isCurrent ? '#FFFBEF' : (i % 2 === 0 ? 'transparent' : '#F7F3EA') }}>
                        <td style={{ padding: '12px 20px', fontWeight: isCurrent ? 700 : 400, color: '#1A1A17' }}>
                          {fmt(entry.month)}
                          {isCurrent && <span style={{ marginLeft: 8, fontSize: 11, background: '#E8D08A', color: '#2A3D2E', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>Huidig</span>}
                        </td>
                        <td style={{ padding: '12px 20px', color: '#2A3D2E', fontWeight: 600 }}>{entry.uses}</td>
                        <td style={{ padding: '12px 20px', color: '#B65436', fontWeight: 700, fontFamily: 'Georgia, serif' }}>
                          € {entry.earnings.toFixed(0)}
                        </td>
                        <td style={{ padding: '12px 20px' }}>
                          {isCurrent
                            ? <span style={{ fontSize: 12, background: '#E8D08A', color: '#2A3D2E', borderRadius: 4, padding: '3px 8px', fontWeight: 600 }}>In behandeling</span>
                            : <span style={{ fontSize: 12, background: '#E8F5E9', color: '#2A3D2E', borderRadius: 4, padding: '3px 8px', fontWeight: 600 }}>Uitbetaald</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ fontSize: 12, color: '#8A9588', marginTop: 16, textAlign: 'center' }}>
          Vragen over uitbetaling? Stuur een bericht naar <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a>
        </p>
      </main>
    </div>
  )
}
