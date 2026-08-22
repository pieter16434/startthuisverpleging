'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const PROVINCES: Record<string, string> = {
  ANT: 'Antwerpen', LIM: 'Limburg', OVL: 'Oost-Vlaanderen',
  VBR: 'Vlaams-Brabant', WVL: 'West-Vlaanderen',
}

type OrgData = {
  org: { name: string; business_name: string; service_type: string; fee_per_customer: number; code_mode: string; bundle_invoicing: boolean }
  offices: { id: string; business_name: string; province: string; is_active: boolean; fee_per_customer: number | null }[]
  stats: { totalCodes: number; totalVerified: number; totalToInvoice: number }
  monthly: Record<string, { business_name: string; province: string; months: Record<string, { count: number; amount: number }> }>
}

function fmtMonth(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })
}

export default function OrganizationDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<OrgData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const res = await fetch('/api/organization/dashboard')
    if (res.status === 401) { router.push('/organization'); return }
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [router])

  useEffect(() => { load() }, [load])

  async function handleLogout() {
    await fetch('/api/organization/logout', { method: 'POST' })
    router.push('/organization')
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6E6B62', fontFamily: 'system-ui' }}>Laden…</p>
    </div>
  )
  if (!data) return null
  const { org, stats, monthly } = data

  // Verzamel alle maanden over alle kantoren voor de kolommen
  const allMonths = Array.from(new Set(
    Object.values(monthly).flatMap(o => Object.keys(o.months))
  )).sort((a, b) => b.localeCompare(a)).slice(0, 6) // max 6 maanden

  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  return (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}>
      <header style={{ background: '#2A3D2E', padding: '0 clamp(20px,4vw,56px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#fff', fontWeight: 700 }}>
            start<span style={{ color: '#E8D08A' }}>thuisverpleging</span>
          </span>
          <span style={{ fontSize: 12, color: '#8A9588', fontFamily: 'system-ui', fontWeight: 400, marginLeft: 10 }}>Organisatieportaal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#D8D0C0', fontSize: 14 }}>{org.name}</span>
          <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #8A9588', color: '#D8D0C0', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Uitloggen
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px clamp(20px,4vw,56px)' }}>
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#1A1A17', marginBottom: 4 }}>
            {org.business_name}
          </h1>
          <p style={{ color: '#6E6B62', fontSize: 15, margin: 0 }}>
            {org.service_type} · {data.offices.length} kantoren ·{' '}
            <span style={{ background: org.code_mode === 'shared' ? '#E8F5E9' : '#EEF0FD', color: org.code_mode === 'shared' ? '#2A3D2E' : '#3949AB', padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
              {org.code_mode === 'shared' ? 'Gedeelde code' : 'Code per kantoor'}
            </span>
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 36 }}>
          {[
            { label: 'Totaal codes uitgegeven', value: stats.totalCodes, color: '#2A3D2E' },
            { label: 'Geverifieerde klanten', value: stats.totalVerified, color: '#B65436' },
            { label: 'Totaal te factureren', value: `€ ${stats.totalToInvoice.toFixed(2).replace('.', ',')}`, color: '#6E6B62', small: true },
          ].map(s => (
            <div key={s.label} style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: s.small ? 22 : 32, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6E6B62', marginTop: 4 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Maandoverzicht per kantoor */}
        <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1A1A17', marginBottom: 8 }}>Overzicht per kantoor per maand</h2>
        <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 20 }}>Geverifieerde klanten en te factureren bedrag per kantoor, per maand.</p>

        {Object.keys(monthly).length === 0 ? (
          <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#6E6B62' }}>
            Nog geen geverifieerde klanten. Zodra kantoren codes verifiëren verschijnen ze hier.
          </div>
        ) : (
          <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ background: '#2A3D2E' }}>
                    <th style={{ textAlign: 'left', padding: '12px 20px', color: '#E8D08A', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 160 }}>Kantoor</th>
                    {allMonths.map(m => (
                      <th key={m} style={{ textAlign: 'center', padding: '12px 16px', color: m === thisMonth ? '#E8D08A' : '#D8D0C0', fontWeight: 600, fontSize: 12, minWidth: 120 }}>
                        {fmtMonth(m)}
                        {m === thisMonth && <span style={{ display: 'block', fontSize: 10, color: '#8A9588' }}>Huidig</span>}
                      </th>
                    ))}
                    <th style={{ textAlign: 'center', padding: '12px 16px', color: '#D8D0C0', fontWeight: 600, fontSize: 12, minWidth: 110 }}>Totaal</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(monthly).map(([officeId, od], rowIdx) => {
                    const totalCount = Object.values(od.months).reduce((s, m) => s + m.count, 0)
                    const totalAmount = Object.values(od.months).reduce((s, m) => s + m.amount, 0)
                    return (
                      <tr key={officeId} style={{ borderTop: '1px solid #EDE9E0', background: rowIdx % 2 === 0 ? 'transparent' : '#F7F3EA' }}>
                        <td style={{ padding: '12px 20px' }}>
                          <div style={{ fontWeight: 600, color: '#1A1A17', fontSize: 14 }}>{od.business_name}</div>
                          <div style={{ fontSize: 12, color: '#6E6B62' }}>{PROVINCES[od.province] ?? od.province}</div>
                        </td>
                        {allMonths.map(m => {
                          const entry = od.months[m]
                          return (
                            <td key={m} style={{ padding: '12px 16px', textAlign: 'center', background: m === thisMonth ? '#FFFBEF' : 'transparent' }}>
                              {entry ? (
                                <>
                                  <div style={{ fontWeight: 700, color: '#2A3D2E' }}>{entry.count}</div>
                                  <div style={{ fontSize: 12, color: '#B65436' }}>€ {entry.amount.toFixed(0)}</div>
                                </>
                              ) : (
                                <span style={{ color: '#D8D0C0', fontSize: 13 }}>—</span>
                              )}
                            </td>
                          )
                        })}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <div style={{ fontWeight: 700, color: '#2A3D2E' }}>{totalCount}</div>
                          <div style={{ fontSize: 12, color: '#B65436', fontWeight: 600 }}>€ {totalAmount.toFixed(0)}</div>
                        </td>
                      </tr>
                    )
                  })}
                  {/* Totaalrij */}
                  <tr style={{ borderTop: '2px solid #D8D0C0', background: '#F1ECE0' }}>
                    <td style={{ padding: '12px 20px', fontWeight: 700, color: '#1A1A17', fontSize: 14 }}>Totaal alle kantoren</td>
                    {allMonths.map(m => {
                      const totalCount = Object.values(monthly).reduce((s, od) => s + (od.months[m]?.count ?? 0), 0)
                      const totalAmount = Object.values(monthly).reduce((s, od) => s + (od.months[m]?.amount ?? 0), 0)
                      return (
                        <td key={m} style={{ padding: '12px 16px', textAlign: 'center', background: m === thisMonth ? '#FFF8E7' : 'transparent' }}>
                          {totalCount > 0 ? (
                            <>
                              <div style={{ fontWeight: 700, color: '#2A3D2E' }}>{totalCount}</div>
                              <div style={{ fontSize: 12, color: '#B65436', fontWeight: 700 }}>€ {totalAmount.toFixed(0)}</div>
                            </>
                          ) : <span style={{ color: '#D8D0C0', fontSize: 13 }}>—</span>}
                        </td>
                      )
                    })}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 700, color: '#2A3D2E', fontSize: 16 }}>{stats.totalVerified}</div>
                      <div style={{ fontSize: 13, color: '#B65436', fontWeight: 700 }}>€ {stats.totalToInvoice.toFixed(0)}</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p style={{ fontSize: 13, color: '#8A9588', marginTop: 16 }}>
          Vragen of problemen? <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a>
        </p>
      </main>
    </div>
  )
}
