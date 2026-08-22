'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const PROVINCES: Record<string, string> = {
  ANT: 'Antwerpen', LIM: 'Limburg', OVL: 'Oost-Vlaanderen',
  VBR: 'Vlaams-Brabant', WVL: 'West-Vlaanderen',
}

type CodeRow = {
  id: string
  code: string
  buyer_first_name: string
  buyer_last_name: string
  buyer_email: string
  is_verified: boolean
  verified_at: string | null
  created_at: string
}

type OfficeDashData = {
  office: {
    id: string
    business_name: string
    province: string
    is_active: boolean
    fee_per_customer: number | null
  }
  org: {
    business_name: string
    service_type: string
    discount_description: string
    fee_per_customer: number
    code_mode: string
    bundle_invoicing: boolean
  }
  codes: CodeRow[]
  stats: {
    totalCodes: number
    verifiedCodes: number
    toInvoice: number
    effectiveFee: number
  }
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('nl-BE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function OfficeDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<OfficeDashData | null>(null)
  const [loading, setLoading] = useState(true)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyMsg, setVerifyMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/office/dashboard')
    if (res.status === 401) { router.push('/office'); return }
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  async function handleLogout() {
    await fetch('/api/office/logout', { method: 'POST' })
    router.push('/office')
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!verifyCode.trim()) return
    setVerifyLoading(true); setVerifyMsg(null)
    try {
      const res = await fetch('/api/office/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode.trim().toUpperCase() }),
      })
      const json = await res.json()
      if (!res.ok) {
        setVerifyMsg({ type: 'err', text: json.error ?? 'Verificatie mislukt' })
      } else {
        setVerifyMsg({ type: 'ok', text: `✓ Code geverifieerd — ${json.buyer_first_name ?? ''} ${json.buyer_last_name ?? ''}`.trim() })
        setVerifyCode('')
        await load()
      }
    } catch { setVerifyMsg({ type: 'err', text: 'Verbindingsfout. Probeer opnieuw.' }) }
    finally { setVerifyLoading(false) }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6E6B62', fontFamily: 'system-ui' }}>Laden…</p>
    </div>
  )
  if (!data) return null
  const { office, org, codes, stats } = data

  const filtered = codes.filter(c => {
    const q = search.toLowerCase()
    return !q || c.code.toLowerCase().includes(q) || c.buyer_first_name.toLowerCase().includes(q) || c.buyer_last_name.toLowerCase().includes(q) || c.buyer_email.toLowerCase().includes(q)
  })

  // Maandgroepen
  const byMonth: Record<string, CodeRow[]> = {}
  codes.filter(c => c.is_verified && c.verified_at).forEach(c => {
    const d = new Date(c.verified_at!)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(c)
  })
  const monthKeys = Object.keys(byMonth).sort((a, b) => b.localeCompare(a))

  return (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}>
      <header style={{ background: '#2A3D2E', padding: '0 clamp(20px,4vw,56px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#fff', fontWeight: 700 }}>
            start<span style={{ color: '#E8D08A' }}>thuisverpleging</span>
          </span>
          <span style={{ fontSize: 12, color: '#8A9588', fontFamily: 'system-ui', fontWeight: 400, marginLeft: 10 }}>Kantoorportaal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#D8D0C0', fontSize: 14 }}>{office.business_name}</span>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #8A9588', color: '#D8D0C0', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Uitloggen
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '40px clamp(20px,4vw,56px)' }}>

        {/* Office info banner */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1A1A17', marginBottom: 4 }}>{office.business_name}</h1>
              <p style={{ color: '#6E6B62', fontSize: 14, margin: 0 }}>
                {PROVINCES[office.province] ?? office.province} · onderdeel van{' '}
                <strong style={{ color: '#2A3D2E' }}>{org.business_name}</strong>{' '}
                <span style={{ background: org.code_mode === 'shared' ? '#E8F5E9' : '#EEF0FD', color: org.code_mode === 'shared' ? '#2A3D2E' : '#3949AB', padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>
                  {org.code_mode === 'shared' ? 'Gedeelde code' : 'Code per kantoor'}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Codes in omloop', value: stats.totalCodes, color: '#2A3D2E' },
            { label: 'Geverifieerde klanten', value: stats.verifiedCodes, color: '#B65436' },
            {
              label: org.bundle_invoicing ? 'Facturatie via org.' : 'Te factureren',
              value: org.bundle_invoicing ? '—' : `€ ${stats.toInvoice.toFixed(2).replace('.', ',')}`,
              color: '#6E6B62', small: true
            },
            { label: `Tarief per klant`, value: `€ ${stats.effectiveFee.toFixed(2).replace('.', ',')}`, color: '#6E6B62', small: true },
          ].map(s => (
            <div key={s.label} style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: s.small ? 20 : 28, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6E6B62', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Verificatie widget */}
        <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 14, padding: '24px 28px', marginBottom: 28 }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A17', marginBottom: 4 }}>Code verifiëren</h2>
          <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 18, margin: '0 0 18px' }}>
            {org.code_mode === 'shared'
              ? 'Voer de klantcode in. Een gedeelde code kan slechts eenmaal worden geverifieerd.'
              : 'Voer de klantcode in die voor uw kantoor is aangemaakt.'}
          </p>
          <form onSubmit={handleVerify} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              value={verifyCode}
              onChange={e => { setVerifyCode(e.target.value.toUpperCase()); setVerifyMsg(null) }}
              placeholder="ABCD-1234"
              maxLength={20}
              style={{ flex: '1 1 200px', padding: '11px 14px', border: '1.5px solid #D8D0C0', borderRadius: 8, fontSize: 16, fontWeight: 700, letterSpacing: 2, background: '#fff', color: '#1A1A17', outline: 'none', fontFamily: 'inherit' }}
            />
            <button type="submit" disabled={verifyLoading || !verifyCode.trim()} style={{ padding: '11px 22px', background: verifyLoading || !verifyCode.trim() ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: verifyLoading || !verifyCode.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
              {verifyLoading ? 'Bezig…' : 'Verifiëren →'}
            </button>
          </form>
          {verifyMsg && (
            <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, background: verifyMsg.type === 'ok' ? '#E8F5E9' : '#FEE9E7', color: verifyMsg.type === 'ok' ? '#2A3D2E' : '#B65436', border: `1px solid ${verifyMsg.type === 'ok' ? '#C8E6C9' : '#F5C6C0'}` }}>
              {verifyMsg.text}
            </div>
          )}
        </div>

        {/* Maandoverzicht */}
        {monthKeys.length > 0 && (
          <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 14, padding: '24px 28px', marginBottom: 28 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A17', marginBottom: 16 }}>Facturatie per maand</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10 }}>
              {monthKeys.map(m => {
                const rows = byMonth[m]
                const amount = rows.length * stats.effectiveFee
                const label = new Date(Number(m.split('-')[0]), Number(m.split('-')[1]) - 1, 1).toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })
                return (
                  <div key={m} style={{ background: '#F1ECE0', borderRadius: 10, padding: '14px 16px', border: '1px solid #D8D0C0' }}>
                    <div style={{ fontSize: 11, color: '#6E6B62', fontWeight: 600, textTransform: 'capitalize' }}>{label}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: '#2A3D2E', fontFamily: 'Georgia, serif', marginTop: 4 }}>{rows.length}</div>
                    <div style={{ fontSize: 13, color: '#B65436', fontWeight: 600 }}>
                      {org.bundle_invoicing ? 'Via org.' : `€ ${amount.toFixed(0)}`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Codes tabel */}
        <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #EDE9E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A17', margin: 0 }}>
              Alle codes <span style={{ fontSize: 14, color: '#6E6B62', fontFamily: 'system-ui', fontWeight: 400 }}>({codes.length})</span>
            </h2>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Zoeken op naam, e-mail of code…"
              style={{ padding: '8px 12px', border: '1px solid #D8D0C0', borderRadius: 8, fontSize: 14, background: '#fff', color: '#1A1A17', outline: 'none', fontFamily: 'inherit', minWidth: 220 }}
            />
          </div>
          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6E6B62', fontSize: 15 }}>
              {codes.length === 0 ? 'Nog geen codes. Klanten ontvangen hun code na aankoop.' : 'Geen resultaten voor uw zoekopdracht.'}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#F1ECE0' }}>
                    {['Code', 'Klant', 'E-mail', 'Ontvangen', 'Status', 'Geverifieerd op'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '10px 16px', color: '#6E6B62', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c, i) => (
                    <tr key={c.id} style={{ borderTop: '1px solid #EDE9E0', background: i % 2 === 0 ? 'transparent' : '#FAFAF7' }}>
                      <td style={{ padding: '11px 16px', fontWeight: 700, color: '#2A3D2E', letterSpacing: 1, fontFamily: 'monospace', fontSize: 13 }}>{c.code}</td>
                      <td style={{ padding: '11px 16px', color: '#1A1A17' }}>{c.buyer_first_name} {c.buyer_last_name}</td>
                      <td style={{ padding: '11px 16px', color: '#6E6B62', fontSize: 13 }}>{c.buyer_email}</td>
                      <td style={{ padding: '11px 16px', color: '#6E6B62', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtDate(c.created_at)}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{
                          background: c.is_verified ? '#E8F5E9' : '#FFF8E7',
                          color: c.is_verified ? '#2A3D2E' : '#B65436',
                          padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap'
                        }}>
                          {c.is_verified ? '✓ Geverifieerd' : 'In omloop'}
                        </span>
                      </td>
                      <td style={{ padding: '11px 16px', color: '#6E6B62', fontSize: 13, whiteSpace: 'nowrap' }}>{fmtDate(c.verified_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p style={{ fontSize: 13, color: '#8A9588', marginTop: 16 }}>
          Vragen of problemen? <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a>
        </p>
      </main>
    </div>
  )
}
