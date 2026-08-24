'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type Code = {
  code: string
  is_verified: boolean
  verified_at: string | null
  created_at: string
  deal_number: number | null
  customers: { first_name: string; last_name: string }
}

type DashboardData = {
  partner: {
    name: string
    business_name: string
    province: string
    service_type: string
    discount_description: string
    fee_per_customer: number
    has_deal2: boolean
    deal1_name: string | null
    deal2_name: string | null
    deal2_description: string | null
    deal2_fee: number | null
  }
  stats: {
    totalCodes: number
    verifiedCodes: number
    toInvoice: number
    deal1Verified: number
    deal2Verified: number
    deal1ToInvoice: number
    deal2ToInvoice: number
  }
  codes: Code[]
  thisMonthCodes: Code[]
  role: 'owner' | 'member'
  memberEmail: string | null
}

const PROVINCES: Record<string, string> = {
  ANT: 'Antwerpen', LIM: 'Limburg', OVL: 'Oost-Vlaanderen',
  VBR: 'Vlaams-Brabant', WVL: 'West-Vlaanderen',
}

export default function PartnerDashboardPage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  // Verificatie state
  const [codeInput, setCodeInput] = useState('')
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyResult, setVerifyResult] = useState<{
    valid: boolean
    message: string
    alreadyVerified?: boolean
    customer?: { first_name: string; last_name: string }
  } | null>(null)

  const loadDashboard = useCallback(async () => {
    const res = await fetch('/api/partner/dashboard')
    if (res.status === 401) { router.push('/partner'); return }
    const json = await res.json()
    setData(json)
    setLoading(false)
  }, [router])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  async function handleLogout() {
    await fetch('/api/partner/logout', { method: 'POST' })
    router.push('/partner')
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!codeInput.trim()) return
    setVerifyLoading(true)
    setVerifyResult(null)
    try {
      const res = await fetch('/api/partner/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: codeInput }),
      })
      const json = await res.json()
      setVerifyResult(json)
      if (json.valid && !json.alreadyVerified) {
        // Herlaad data om stats bij te werken
        loadDashboard()
      }
    } catch {
      setVerifyResult({ valid: false, message: 'Verbindingsfout. Probeer opnieuw.' })
    } finally {
      setVerifyLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6E6B62', fontFamily: 'system-ui' }}>Laden…</p>
      </div>
    )
  }

  if (!data) return null
  const { partner, stats, codes, thisMonthCodes, role, memberEmail } = data
  const isMember = role === 'member'
  const now = new Date()
  const monthLabel = now.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })

  // ── Vereenvoudigde weergave voor teamleden (alleen verificatie) ──────
  if (isMember) {
    return (
      <div style={{ minHeight: '100vh', background: '#F1ECE0', fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}>
        <header style={{ background: '#2A3D2E', padding: '0 clamp(20px,4vw,56px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#fff', fontWeight: 700 }}>
            start<span style={{ color: '#E8D08A' }}>thuisverpleging</span>
            <span style={{ fontSize: 12, color: '#8A9588', fontFamily: 'system-ui', fontWeight: 400, marginLeft: 10 }}>Partnerportaal</span>
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ color: '#D8D0C0', fontSize: 14 }}>
              {memberEmail}
              <span style={{ marginLeft: 8, background: '#E8D08A', color: '#1C2A20', borderRadius: 6, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>Teamlid</span>
            </span>
            <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #8A9588', color: '#D8D0C0', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              Uitloggen
            </button>
          </div>
        </header>
        <main style={{ maxWidth: 600, margin: '60px auto', padding: '0 clamp(20px,4vw,56px)' }}>
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 26, color: '#1A1A17', marginBottom: 4 }}>Code verifiëren</h1>
            <p style={{ color: '#6E6B62', fontSize: 15, margin: 0 }}>{partner.business_name} — {partner.service_type}</p>
          </div>
          <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 16, padding: '32px' }}>
            <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              Voer de code in die de klant toont. Elke code kan slechts eenmaal geverifieerd worden.
            </p>
            <form onSubmit={handleVerify} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setVerifyResult(null) }}
                placeholder="STH-ANT-XXXXXX"
                maxLength={20}
                style={{ flex: '1 1 200px', padding: '12px 16px', border: '1.5px solid #D8D0C0', borderRadius: 8, fontSize: 16, fontWeight: 700, letterSpacing: 2, background: '#fff', color: '#1A1A17', outline: 'none', fontFamily: 'inherit' }}
              />
              <button type="submit" disabled={verifyLoading || !codeInput.trim()} style={{ padding: '12px 24px', background: verifyLoading || !codeInput.trim() ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: verifyLoading || !codeInput.trim() ? 'not-allowed' : 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                {verifyLoading ? 'Bezig…' : 'Verifiëren →'}
              </button>
            </form>
            {verifyResult && (
              <div style={{ marginTop: 16, padding: '14px 18px', borderRadius: 10, background: verifyResult.valid && !verifyResult.alreadyVerified ? '#E8F5E9' : verifyResult.valid ? '#FFF8E7' : '#FEE9E7', border: `1px solid ${verifyResult.valid && !verifyResult.alreadyVerified ? '#C8E6C9' : verifyResult.valid ? '#E8D08A' : '#F5C6C0'}`, color: verifyResult.valid && !verifyResult.alreadyVerified ? '#2A3D2E' : verifyResult.valid ? '#7A6020' : '#B65436' }}>
                <p style={{ fontWeight: 700, margin: '0 0 4px', fontSize: 15 }}>{verifyResult.message}</p>
                {verifyResult.customer && (
                  <p style={{ margin: 0, fontSize: 14, opacity: 0.85 }}>
                    Klant: {verifyResult.customer.first_name} {verifyResult.customer.last_name}
                  </p>
                )}
              </div>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#8A9588', marginTop: 20 }}>
            Vragen? <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a>
          </p>
        </main>
      </div>
    )
  }
  // ── Einde teamlid-weergave ───────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{
        background: '#2A3D2E',
        padding: '0 clamp(20px,4vw,56px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#fff', fontWeight: 700 }}>
          start<span style={{ color: '#E8D08A' }}>thuisverpleging</span>
          <span style={{ fontSize: 12, color: '#8A9588', fontFamily: 'system-ui', fontWeight: 400, marginLeft: 10 }}>Partnerportaal</span>
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: '#D8D0C0', fontSize: 14 }}>
            {partner.name}
            {isMember && <span style={{ marginLeft: 8, background: '#E8D08A', color: '#1C2A20', borderRadius: 6, fontSize: 11, fontWeight: 700, padding: '2px 8px' }}>Teamlid</span>}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: '1px solid #8A9588',
              color: '#D8D0C0',
              borderRadius: 6,
              padding: '6px 14px',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Uitloggen
          </button>
        </div>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '40px clamp(20px,4vw,56px)' }}>

        {/* Welkom */}
        <div style={{ marginBottom: 36 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#1A1A17', marginBottom: 4 }}>
            Welkom, {partner.name}
          </h1>
          <p style={{ color: '#6E6B62', fontSize: 15 }}>
            {partner.business_name} · {PROVINCES[partner.province]} · {partner.service_type}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Totaal codes uitgegeven', value: stats.totalCodes, color: '#2A3D2E' },
            { label: 'Geverifieerde klanten', value: stats.verifiedCodes, color: '#B65436' },
            { label: 'Te factureren (totaal)', value: `€ ${stats.toInvoice.toFixed(2).replace('.', ',')}`, color: '#6E6B62', small: true },
          ].map(st => (
            <div key={st.label} style={{
              background: '#FBF8F2',
              border: '1px solid #D8D0C0',
              borderRadius: 12,
              padding: '20px 24px',
            }}>
              <div style={{ fontSize: st.small ? 22 : 32, fontWeight: 700, color: st.color, fontFamily: 'Georgia, serif' }}>
                {st.value}
              </div>
              <div style={{ fontSize: 13, color: '#6E6B62', marginTop: 4 }}>{st.label}</div>
            </div>
          ))}
          {partner.has_deal2 && (
            <>
              <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#2A3D2E', fontFamily: 'Georgia, serif' }}>{stats.deal1Verified}</div>
                <div style={{ fontSize: 13, color: '#6E6B62', marginTop: 4 }}>Geverifieerd — {partner.deal1_name || 'Deal 1'}</div>
                <div style={{ fontSize: 12, color: '#8A9588', marginTop: 2 }}>€ {stats.deal1ToInvoice.toFixed(2).replace('.', ',')} te factureren</div>
              </div>
              <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '20px 24px' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#2A3D2E', fontFamily: 'Georgia, serif' }}>{stats.deal2Verified}</div>
                <div style={{ fontSize: 13, color: '#6E6B62', marginTop: 4 }}>Geverifieerd — {partner.deal2_name || 'Deal 2'}</div>
                <div style={{ fontSize: 12, color: '#8A9588', marginTop: 2 }}>€ {stats.deal2ToInvoice.toFixed(2).replace('.', ',')} te factureren</div>
              </div>
            </>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>

          {/* Code verificatie */}
          <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 16, padding: '28px 28px' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A17', marginBottom: 6 }}>
              Code verifiëren
            </h2>
            <p style={{ fontSize: 14, color: '#6E6B62', marginBottom: 20 }}>
              Voer de code in die de klant u toont vanuit de gids van startthuisverpleging.
            </p>
            <form onSubmit={handleVerify}>
              <input
                type="text"
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.toUpperCase()); setVerifyResult(null) }}
                placeholder="STH-LIM-A3B9K2"
                maxLength={20}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  border: '1.5px solid #D8D0C0',
                  borderRadius: 8,
                  fontSize: 18,
                  fontFamily: '"JetBrains Mono", monospace',
                  letterSpacing: 2,
                  color: '#1A1A17',
                  background: '#fff',
                  marginBottom: 12,
                  boxSizing: 'border-box',
                  textTransform: 'uppercase',
                }}
              />
              <button
                type="submit"
                disabled={verifyLoading || !codeInput.trim()}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: verifyLoading ? '#8A9588' : '#2A3D2E',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: verifyLoading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                {verifyLoading ? 'Verifiëren…' : 'Controleer code →'}
              </button>
            </form>

            {/* Resultaat */}
            {verifyResult && (
              <div style={{
                marginTop: 16,
                padding: '16px',
                borderRadius: 10,
                background: verifyResult.valid ? (verifyResult.alreadyVerified ? '#FFF8E7' : '#E8F5E9') : '#FEE9E7',
                border: `1px solid ${verifyResult.valid ? (verifyResult.alreadyVerified ? '#E8D08A' : '#A5D6A7') : '#F5C6C0'}`,
              }}>
                <div style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: verifyResult.valid ? (verifyResult.alreadyVerified ? '#7A6A20' : '#2A3D2E') : '#B65436',
                  marginBottom: verifyResult.customer ? 6 : 0,
                }}>
                  {verifyResult.valid ? (verifyResult.alreadyVerified ? '⚠ Al eerder geverifieerd' : '✓ Geldige code') : '✗ Ongeldige code'}
                </div>
                <p style={{ fontSize: 14, color: '#3A3A33', margin: 0 }}>{verifyResult.message}</p>
                {verifyResult.customer && (
                  <p style={{ fontSize: 14, color: '#6E6B62', marginTop: 4, marginBottom: 0 }}>
                    Klant: <strong>{verifyResult.customer.first_name} {verifyResult.customer.last_name}</strong>
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Uw aanbod */}
          <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 16, padding: '28px 28px' }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A17', marginBottom: 16 }}>
              Uw aanbod in de gids
            </h2>
            <p style={{ fontSize: 13, color: '#6E6B62', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Wat klanten van u krijgen
            </p>
            <p style={{ fontSize: 15, color: '#1A1A17', marginBottom: 20, lineHeight: 1.6, background: '#F1ECE0', borderRadius: 8, padding: '12px 14px' }}>
              {partner.discount_description}
            </p>
            <p style={{ fontSize: 13, color: '#6E6B62', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
              Uw dienstenprofiel
            </p>
            <p style={{ fontSize: 15, color: '#1A1A17', marginBottom: 0 }}>
              <strong>{partner.service_type}</strong> — {PROVINCES[partner.province]}
            </p>
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #D8D0C0' }}>
              <p style={{ fontSize: 13, color: '#6E6B62', marginBottom: 4 }}>Vragen of wijzigingen?</p>
              <a href="mailto:info@domuscare.be" style={{ color: '#B65436', fontSize: 14 }}>
                info@domuscare.be
              </a>
            </div>
          </div>
        </div>

        {/* Huidige maand */}
        <div style={{ background: '#FBF8F2', border: '2px solid #2A3D2E', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A17', margin: 0 }}>
              Geverifieerde klanten — {monthLabel}
            </h2>
            <div style={{ background: '#2A3D2E', color: '#E8D08A', borderRadius: 8, padding: '6px 14px', fontSize: 14, fontWeight: 700 }}>
              {thisMonthCodes.length} klant{thisMonthCodes.length !== 1 ? 'en' : ''}
              {thisMonthCodes.length > 0 && (() => {
                const deal1Month = thisMonthCodes.filter(c => (c.deal_number ?? 1) === 1).length
                const deal2Month = thisMonthCodes.filter(c => c.deal_number === 2).length
                const monthInvoice = deal1Month * partner.fee_per_customer + deal2Month * (partner.deal2_fee ?? 0)
                return ` · € ${monthInvoice.toFixed(0).replace('.', ',')}`
              })()}
            </div>
          </div>
          {thisMonthCodes.length === 0 ? (
            <p style={{ color: '#6E6B62', fontSize: 14, margin: 0 }}>
              Nog geen geverifieerde klanten deze maand.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #D8D0C0' }}>
                    {['Code', partner.has_deal2 ? 'Deal' : null, 'Klant', 'Geverifieerd op'].filter(Boolean).map(h => (
                      <th key={h!} style={{ textAlign: 'left', padding: '8px 12px', color: '#6E6B62', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {thisMonthCodes.map((c, i) => (
                    <tr key={c.code} style={{ borderBottom: '1px solid #EDE9E0', background: i % 2 === 0 ? 'transparent' : '#F7F3EA' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#2A3D2E' }}>{c.code}</td>
                      {partner.has_deal2 && (
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c.deal_number === 2 ? '#EEF0FD' : '#E8F5E9', color: c.deal_number === 2 ? '#3949AB' : '#2A3D2E' }}>
                            {c.deal_number === 2 ? (partner.deal2_name || 'Deal 2') : (partner.deal1_name || 'Deal 1')}
                          </span>
                        </td>
                      )}
                      <td style={{ padding: '10px 12px', color: '#1A1A17' }}>{c.customers.first_name} {c.customers.last_name}</td>
                      <td style={{ padding: '10px 12px', color: '#6E6B62' }}>
                        {c.verified_at ? new Date(c.verified_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alle codes overzicht */}
        <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 16, padding: '28px 28px' }}>
          <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A17', marginBottom: 20 }}>
            Overzicht codes ({codes.length})
          </h2>
          {codes.length === 0 ? (
            <p style={{ color: '#6E6B62', fontSize: 14 }}>
              Er zijn nog geen codes uitgegeven voor uw account. Dit gebeurt automatisch wanneer een klant de gids aankoopt.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #D8D0C0' }}>
                    {['Code', partner.has_deal2 ? 'Deal' : null, 'Klant', 'Uitgegeven op', 'Status', 'Geverifieerd op'].filter(Boolean).map(h => (
                      <th key={h!} style={{ textAlign: 'left', padding: '8px 12px', color: '#6E6B62', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c, i) => (
                    <tr key={c.code} style={{ borderBottom: '1px solid #EDE9E0', background: i % 2 === 0 ? 'transparent' : '#F7F3EA' }}>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: '#2A3D2E' }}>
                        {c.code}
                      </td>
                      {partner.has_deal2 && (
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c.deal_number === 2 ? '#EEF0FD' : '#E8F5E9', color: c.deal_number === 2 ? '#3949AB' : '#2A3D2E', border: `1px solid ${c.deal_number === 2 ? '#C5CAE9' : '#A5D6A7'}` }}>
                            {c.deal_number === 2 ? (partner.deal2_name || 'Deal 2') : (partner.deal1_name || 'Deal 1')}
                          </span>
                        </td>
                      )}
                      <td style={{ padding: '10px 12px', color: '#1A1A17' }}>
                        {c.customers.first_name} {c.customers.last_name}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#6E6B62' }}>
                        {new Date(c.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: c.is_verified ? '#E8F5E9' : '#F1ECE0',
                          color: c.is_verified ? '#2A3D2E' : '#6E6B62',
                          border: `1px solid ${c.is_verified ? '#A5D6A7' : '#D8D0C0'}`,
                        }}>
                          {c.is_verified ? '✓ Geverifieerd' : 'Niet geverifieerd'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#6E6B62' }}>
                        {c.verified_at
                          ? new Date(c.verified_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  )
}
