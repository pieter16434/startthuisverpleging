'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const PROVINCES: Record<string, string> = {
  ANT: 'Antwerpen', LIM: 'Limburg', OVL: 'Oost-Vlaanderen',
  VBR: 'Vlaams-Brabant', WVL: 'West-Vlaanderen',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'In afwachting', paid: 'Betaald', refunded: 'Terugbetaald', failed: 'Mislukt',
}
const STATUS_COLORS: Record<string, string> = {
  paid: '#2A3D2E', pending: '#6E6B62', refunded: '#B65436', failed: '#c0392b',
}

type Partner = {
  id: string; name: string; business_name: string; email: string; province: string
  service_type: string; discount_description: string; fee_per_customer: number
  is_active: boolean; notes: string | null; created_at: string
  vat_number: string | null; billing_address: string | null
  total_codes: number; verified_codes: number
}
type Order = {
  id: string; amount_cents: number; status: string; created_at: string; paid_at: string | null
  pdf_main_url: string | null
  customers: { first_name: string; last_name: string; email: string; province: string }
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', border: '1.5px solid #D8D0C0', borderRadius: 8,
  fontSize: 14, background: '#fff', color: '#1A1A17', boxSizing: 'border-box',
  fontFamily: 'inherit', marginBottom: 12,
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#6E6B62',
  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
}

function Pill({ active }: { active: boolean }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      background: active ? '#E8F5E9' : '#FEE9E7', color: active ? '#2A3D2E' : '#B65436',
      border: `1px solid ${active ? '#A5D6A7' : '#F5C6C0'}`,
    }}>
      {active ? 'Actief' : 'Inactief'}
    </span>
  )
}

export default function AdminDashboard() {
  const router = useRouter()
  const [tab, setTab] = useState<'partners' | 'orders' | 'invoicing'>('partners')
  const [partners, setPartners] = useState<Partner[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [orderStats, setOrderStats] = useState({ total: 0, revenue: 0, pdfPending: 0 })
  const [sendingPdf, setSendingPdf] = useState<string | null>(null)
  const [pdfMsg, setPdfMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editPartner, setEditPartner] = useState<Partner | null>(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  // Nieuw partner form
  const emptyForm = { name: '', business_name: '', email: '', password: '', province: '', service_type: '', discount_description: '', fee_per_customer: '', notes: '', vat_number: '', billing_address: '' }
  const [form, setForm] = useState(emptyForm)

  const loadData = useCallback(async () => {
    const [pRes, oRes] = await Promise.all([
      fetch('/api/admin/partners'),
      fetch('/api/admin/orders'),
    ])
    if (pRes.status === 401 || oRes.status === 401) { router.push('/admin'); return }
    const pData = await pRes.json()
    const oData = await oRes.json()
    setPartners(pData.partners ?? [])
    setOrders(oData.orders ?? [])
    setOrderStats(oData.stats ?? { total: 0, revenue: 0 })
    setLoading(false)
  }, [router])

  useEffect(() => { loadData() }, [loadData])

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin')
  }

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleAddPartner(e: React.FormEvent) {
    e.preventDefault()
    setFormError(''); setFormLoading(true)
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, fee_per_customer: parseFloat(form.fee_per_customer) || 0 }),
      })
      const data = await res.json()
      if (!res.ok) { setFormError(data.error); return }
      setShowAddForm(false); setForm(emptyForm)
      setSuccessMsg(`Partner "${data.partner.name}" aangemaakt ✓`)
      setTimeout(() => setSuccessMsg(''), 4000)
      loadData()
    } catch { setFormError('Aanmaken mislukt') }
    finally { setFormLoading(false) }
  }

  async function handleToggleActive(p: Partner) {
    await fetch(`/api/admin/partners/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !p.is_active }),
    })
    loadData()
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editPartner) return
    setFormError(''); setFormLoading(true)
    try {
      const res = await fetch(`/api/admin/partners/${editPartner.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discount_description: editPartner.discount_description,
          fee_per_customer: editPartner.fee_per_customer,
          notes: editPartner.notes,
          service_type: editPartner.service_type,
          vat_number: editPartner.vat_number,
          billing_address: editPartner.billing_address,
        }),
      })
      if (!res.ok) { setFormError('Opslaan mislukt'); return }
      setEditPartner(null)
      setSuccessMsg('Partner bijgewerkt ✓')
      setTimeout(() => setSuccessMsg(''), 3000)
      loadData()
    } catch { setFormError('Opslaan mislukt') }
    finally { setFormLoading(false) }
  }

  // UI helpers
  const tabStyle = (t: string): React.CSSProperties => ({
    padding: '10px 20px', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
    background: tab === t ? '#2A3D2E' : 'transparent',
    color: tab === t ? '#fff' : '#6E6B62',
  })

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#6E6B62' }}>Laden…</p>
    </div>
  )

  const paidOrders = orders.filter(o => o.status === 'paid')

  return (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', fontFamily: '"Bricolage Grotesque", system-ui, sans-serif' }}>

      {/* Header */}
      <header style={{ background: '#1C2A20', padding: '0 clamp(20px,4vw,56px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#fff', fontWeight: 700 }}>
          start<span style={{ color: '#E8D08A' }}>thuisverpleging</span>
          <span style={{ fontSize: 12, color: '#8A9588', fontFamily: 'system-ui', fontWeight: 400, marginLeft: 10 }}>Admin</span>
        </span>
        <button onClick={handleLogout} style={{ background: 'transparent', border: '1px solid #8A9588', color: '#D8D0C0', borderRadius: 6, padding: '6px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Uitloggen
        </button>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '36px clamp(20px,4vw,56px)' }}>

        {/* Succesmelding */}
        {successMsg && (
          <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 8, padding: '12px 18px', color: '#2A3D2E', fontSize: 14, fontWeight: 600, marginBottom: 20 }}>
            {successMsg}
          </div>
        )}

        {/* Snelle stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Betalende klanten', value: orderStats.total, color: '#2A3D2E' },
            { label: 'Totale omzet', value: `€ ${orderStats.revenue.toFixed(2).replace('.', ',')}`, color: '#B65436' },
            { label: 'PDF nog te sturen', value: orderStats.pdfPending, color: orderStats.pdfPending > 0 ? '#B65436' : '#2A3D2E' },
            { label: 'Geverifieerde codes', value: partners.reduce((a, p) => a + p.verified_codes, 0), color: '#6E6B62' },
          ].map(s => (
            <div key={s.label} style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '18px 20px' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: s.color, fontFamily: 'Georgia, serif' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6E6B62', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 10, padding: 6, width: 'fit-content' }}>
          <button style={tabStyle('partners')} onClick={() => setTab('partners')}>Partners ({partners.length})</button>
          <button style={tabStyle('orders')} onClick={() => setTab('orders')}>Bestellingen ({paidOrders.length})</button>
          <button style={tabStyle('invoicing')} onClick={() => setTab('invoicing')}>Facturatie</button>
        </div>

        {/* ── TAB: PARTNERS ── */}
        {tab === 'partners' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1A1A17' }}>Partners</h2>
              <button
                onClick={() => { setShowAddForm(!showAddForm); setForm(emptyForm); setFormError('') }}
                style={{ background: '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {showAddForm ? '✕ Annuleer' : '+ Partner toevoegen'}
              </button>
            </div>

            {/* Formulier: nieuwe partner */}
            {showAddForm && (
              <div style={{ background: '#FBF8F2', border: '2px solid #2A3D2E', borderRadius: 16, padding: '28px', marginBottom: 28 }}>
                <h3 style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: '#1A1A17', marginBottom: 20 }}>Nieuwe partner toevoegen</h3>
                <form onSubmit={handleAddPartner}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                    {[
                      { label: 'Naam contactpersoon', key: 'name', placeholder: 'Jan Janssen', req: true },
                      { label: 'Bedrijfsnaam', key: 'business_name', placeholder: 'Janssen Boekhouding', req: true },
                      { label: 'E-mailadres (login)', key: 'email', placeholder: 'jan@janssen.be', type: 'email', req: true },
                      { label: 'Wachtwoord', key: 'password', placeholder: 'Minimaal 6 tekens', type: 'password', req: true },
                      { label: 'Type dienst', key: 'service_type', placeholder: 'Boekhouder / Verzekeringsmakelaar / …', req: true },
                      { label: 'Facturatiebedrag per klant (€)', key: 'fee_per_customer', placeholder: '25', type: 'number', req: true },
                      { label: 'Ondernemings- / BTW-nummer', key: 'vat_number', placeholder: 'BE0123.456.789', req: false },
                      { label: 'Facturatieadres', key: 'billing_address', placeholder: 'Kerkstraat 1, 3500 Hasselt', req: false },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={labelStyle}>{f.label}{!f.req && <span style={{ color: '#9E9B91', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}> (optioneel)</span>}</label>
                        <input type={f.type ?? 'text'} value={form[f.key as keyof typeof form]} onChange={e => setField(f.key, e.target.value)} placeholder={f.placeholder} required={f.req} style={inputStyle} />
                      </div>
                    ))}
                    <div>
                      <label style={labelStyle}>Provincie</label>
                      <select value={form.province} onChange={e => setField('province', e.target.value)} required style={{ ...inputStyle }}>
                        <option value="">— Kies provincie —</option>
                        {Object.entries(PROVINCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={labelStyle}>Interne notities</label>
                      <input type="text" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Optioneel" style={inputStyle} />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Wat biedt deze partner aan klanten? (staat in de codebook PDF)</label>
                    <textarea value={form.discount_description} onChange={e => setField('discount_description', e.target.value)} required rows={3} placeholder="Bv. Gratis eerste gesprek van 30 min + 10% korting op boekhouding voor starters" style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} />
                  </div>
                  {formError && <p style={{ color: '#B65436', fontSize: 14, marginBottom: 12 }}>{formError}</p>}
                  <button type="submit" disabled={formLoading} style={{ background: formLoading ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 24px', fontSize: 14, fontWeight: 600, cursor: formLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                    {formLoading ? 'Opslaan…' : 'Partner aanmaken →'}
                  </button>
                </form>
              </div>
            )}

            {/* Partnerlijst */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {partners.length === 0 && (
                <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#6E6B62' }}>
                  Nog geen partners. Klik op &ldquo;Partner toevoegen&rdquo; om te beginnen.
                </div>
              )}
              {partners.map(p => (
                <div key={p.id} style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '20px 24px' }}>
                  {editPartner?.id === p.id ? (
                    // Edit mode
                    <form onSubmit={handleSaveEdit}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                        <strong style={{ fontSize: 16 }}>{p.name} — {p.business_name}</strong>
                        <button type="button" onClick={() => setEditPartner(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6E6B62', fontSize: 20 }}>✕</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                        <div>
                          <label style={labelStyle}>Type dienst</label>
                          <input value={editPartner.service_type} onChange={e => setEditPartner({ ...editPartner, service_type: e.target.value })} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Facturatiebedrag per klant (€)</label>
                          <input type="number" value={editPartner.fee_per_customer} onChange={e => setEditPartner({ ...editPartner, fee_per_customer: parseFloat(e.target.value) })} style={inputStyle} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Aanbod voor klanten</label>
                        <textarea value={editPartner.discount_description} onChange={e => setEditPartner({ ...editPartner, discount_description: e.target.value })} rows={2} style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} />
                      </div>
                      <div>
                        <label style={labelStyle}>Interne notities</label>
                        <input value={editPartner.notes ?? ''} onChange={e => setEditPartner({ ...editPartner, notes: e.target.value })} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Ondernemings- / BTW-nummer</label>
                        <input value={editPartner.vat_number ?? ''} onChange={e => setEditPartner({ ...editPartner, vat_number: e.target.value })} placeholder="BE0123.456.789" style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Facturatieadres</label>
                        <input value={editPartner.billing_address ?? ''} onChange={e => setEditPartner({ ...editPartner, billing_address: e.target.value })} placeholder="Kerkstraat 1, 3500 Hasselt" style={inputStyle} />
                      </div>
                      {formError && <p style={{ color: '#B65436', fontSize: 13 }}>{formError}</p>}
                      <button type="submit" disabled={formLoading} style={{ background: '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                        {formLoading ? 'Opslaan…' : 'Opslaan ✓'}
                      </button>
                    </form>
                  ) : (
                    // Weergave mode
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                      <div style={{ flex: 1, minWidth: 260 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                          <strong style={{ fontSize: 15, color: '#1A1A17' }}>{p.name}</strong>
                          <span style={{ color: '#6E6B62', fontSize: 14 }}>— {p.business_name}</span>
                          <Pill active={p.is_active} />
                        </div>
                        <div style={{ fontSize: 13, color: '#6E6B62', marginBottom: 4 }}>
                          {p.service_type} · {PROVINCES[p.province]} · {p.email}
                        </div>
                        <div style={{ fontSize: 13, color: '#3A3A33', marginBottom: p.notes ? 4 : 0 }}>
                          Aanbod: {p.discount_description}
                        </div>
                        {p.notes && <div style={{ fontSize: 12, color: '#8A9588', fontStyle: 'italic' }}>Notitie: {p.notes}</div>}
                        {(p.vat_number || p.billing_address) && (
                          <div style={{ fontSize: 12, color: '#6E6B62', marginTop: 2, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            {p.vat_number && <span>BTW: <strong>{p.vat_number}</strong></span>}
                            {p.billing_address && <span>📍 {p.billing_address}</span>}
                          </div>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#2A3D2E', fontFamily: 'Georgia, serif' }}>{p.verified_codes}</div>
                          <div style={{ fontSize: 11, color: '#6E6B62' }}>geverifieerd</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#B65436', fontFamily: 'Georgia, serif' }}>
                            € {(p.verified_codes * p.fee_per_customer).toFixed(0)}
                          </div>
                          <div style={{ fontSize: 11, color: '#6E6B62' }}>te factureren</div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setEditPartner(p); setFormError('') }} style={{ background: '#F1ECE0', border: '1px solid #D8D0C0', borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#3A3A33' }}>
                            Bewerken
                          </button>
                          <button onClick={() => handleToggleActive(p)} style={{ background: p.is_active ? '#FEE9E7' : '#E8F5E9', border: `1px solid ${p.is_active ? '#F5C6C0' : '#A5D6A7'}`, borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: p.is_active ? '#B65436' : '#2A3D2E' }}>
                            {p.is_active ? 'Deactiveer' : 'Activeer'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB: BESTELLINGEN ── */}
        {tab === 'orders' && (
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1A1A17', marginBottom: 20 }}>Bestellingen</h2>
            <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: '#F1ECE0', borderBottom: '2px solid #D8D0C0' }}>
                      {['Klant', 'E-mail', 'Provincie', 'Bedrag', 'Status', 'Datum', 'PDF'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: '#6E6B62', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length === 0 && (
                      <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: '#6E6B62' }}>Nog geen bestellingen</td></tr>
                    )}
                    {pdfMsg && (
                      <tr><td colSpan={7} style={{ padding: '10px 16px', background: '#E8F5E9', color: '#2A3D2E', fontSize: 13, fontWeight: 600 }}>{pdfMsg}</td></tr>
                    )}
                    {orders.map((o, i) => (
                      <tr key={o.id} style={{ borderBottom: '1px solid #EDE9E0', background: i % 2 === 0 ? 'transparent' : '#F7F3EA' }}>
                        <td style={{ padding: '11px 16px', fontWeight: 600, color: '#1A1A17' }}>{o.customers.first_name} {o.customers.last_name}</td>
                        <td style={{ padding: '11px 16px', color: '#6E6B62' }}>{o.customers.email}</td>
                        <td style={{ padding: '11px 16px', color: '#6E6B62' }}>{PROVINCES[o.customers.province] ?? '—'}</td>
                        <td style={{ padding: '11px 16px', fontWeight: 600 }}>€ {(o.amount_cents / 100).toFixed(2).replace('.', ',')}</td>
                        <td style={{ padding: '11px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: STATUS_COLORS[o.status] ?? '#6E6B62' }}>
                            {STATUS_LABELS[o.status] ?? o.status}
                          </span>
                        </td>
                        <td style={{ padding: '11px 16px', color: '#6E6B62' }}>
                          {new Date(o.paid_at ?? o.created_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          {o.status === 'paid' ? (
                            o.pdf_main_url ? (
                              <span style={{ fontSize: 12, color: '#2A3D2E', fontWeight: 600 }}>✓ Verstuurd</span>
                            ) : (
                              <button
                                onClick={async () => {
                                  setSendingPdf(o.id)
                                  setPdfMsg('')
                                  const res = await fetch(`/api/admin/orders/${o.id}`, { method: 'POST' })
                                  const data = await res.json()
                                  setSendingPdf(null)
                                  if (res.ok) {
                                    setPdfMsg(`✓ PDF verstuurd naar ${data.sent_to}`)
                                    setTimeout(() => { setPdfMsg(''); loadData() }, 4000)
                                  } else {
                                    setPdfMsg(`✗ Fout: ${data.error}`)
                                  }
                                }}
                                disabled={sendingPdf === o.id}
                                style={{ background: '#2A3D2E', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: sendingPdf === o.id ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
                              >
                                {sendingPdf === o.id ? '…' : 'Stuur PDF'}
                              </button>
                            )
                          ) : <span style={{ color: '#D8D0C0', fontSize: 12 }}>—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: FACTURATIE ── */}
        {tab === 'invoicing' && (
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1A1A17', marginBottom: 8 }}>Facturatie naar partners</h2>
            <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 24 }}>
              Overzicht van wat jij per partner kunt factureren op basis van geverifieerde klanten.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {partners.filter(p => p.verified_codes > 0).length === 0 && (
                <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#6E6B62' }}>
                  Nog geen geverifieerde codes. Zodra partners codes verifiëren verschijnen ze hier.
                </div>
              )}
              {partners.filter(p => p.verified_codes > 0).map(p => (
                <div key={p.id} style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                  <div>
                    <strong style={{ fontSize: 15, color: '#1A1A17' }}>{p.business_name}</strong>
                    <span style={{ color: '#6E6B62', fontSize: 14, marginLeft: 8 }}>({p.name})</span>
                    <div style={{ fontSize: 13, color: '#6E6B62', marginTop: 2 }}>
                      {PROVINCES[p.province]} · € {p.fee_per_customer.toFixed(2).replace('.', ',')} per klant
                    </div>
                    {p.vat_number && <div style={{ fontSize: 12, color: '#8A9588', marginTop: 2 }}>BTW: {p.vat_number}</div>}
                    {p.billing_address && <div style={{ fontSize: 12, color: '#8A9588' }}>📍 {p.billing_address}</div>}
                  </div>
                  <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#2A3D2E', fontFamily: 'Georgia, serif' }}>{p.verified_codes}</div>
                      <div style={{ fontSize: 11, color: '#6E6B62' }}>klanten geverifieerd</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: '#B65436', fontFamily: 'Georgia, serif' }}>
                        € {(p.verified_codes * p.fee_per_customer).toFixed(2).replace('.', ',')}
                      </div>
                      <div style={{ fontSize: 11, color: '#6E6B62' }}>te factureren</div>
                    </div>
                    <a href={`mailto:${p.email}?subject=Facturatie startthuisverpleging&body=Beste ${p.name},%0D%0A%0D%0AIn bijlage vindt u de factuur voor ${p.verified_codes} geverifieerde klant(en) via startthuisverpleging.be.%0D%0AFactuurbedrag: € ${(p.verified_codes * p.fee_per_customer).toFixed(2)}%0D%0A%0D%0AMet vriendelijke groeten,%0D%0APieter Vanermen`}
                      style={{ background: '#2A3D2E', color: '#fff', padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                      E-mail versturen →
                    </a>
                  </div>
                </div>
              ))}
              {partners.filter(p => p.verified_codes > 0).length > 0 && (
                <div style={{ background: '#2A3D2E', borderRadius: 12, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#fff', fontSize: 15 }}>Totaal te factureren</strong>
                  <strong style={{ color: '#E8D08A', fontSize: 22, fontFamily: 'Georgia, serif' }}>
                    € {partners.reduce((a, p) => a + p.verified_codes * p.fee_per_customer, 0).toFixed(2).replace('.', ',')}
                  </strong>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
