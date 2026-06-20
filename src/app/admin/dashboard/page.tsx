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
  const [tab, setTab] = useState<'partners' | 'orders' | 'invoicing' | 'emails'>('partners')
  const [partners, setPartners] = useState<Partner[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [orderStats, setOrderStats] = useState({ total: 0, revenue: 0, pdfPending: 0, revenueThisMonth: 0, revenueLastMonth: 0 })
  const [sendingPdf, setSendingPdf] = useState<string | null>(null)
  const [pdfMsg, setPdfMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editPartner, setEditPartner] = useState<Partner | null>(null)
  const [inviteLink, setInviteLink] = useState<{ partnerId: string; name: string; url: string } | null>(null)
  const [formError, setFormError] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [invoicingData, setInvoicingData] = useState<Record<string, { name: string; business_name: string; province: string; fee: number; months: Record<string, { count: number; amount: number }> }>>({})
  const [invoicingLoaded, setInvoicingLoaded] = useState(false)
  const [emailStats, setEmailStats] = useState<{ total: number; with_consent: number } | null>(null)

  // Nieuw partner form
  const emptyForm = { name: '', business_name: '', email: '', province: '', service_type: '', discount_description: '', fee_per_customer: '', notes: '', vat_number: '', billing_address: '' }
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
      if (data.invite_url) {
        setInviteLink({ partnerId: data.partner.id, name: data.partner.name, url: data.invite_url })
      }
      setTimeout(() => setSuccessMsg(''), 8000)
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

  async function handleGenerateInvite(p: Partner) {
    const res = await fetch(`/api/admin/partners/${p.id}/invite`, { method: 'POST' })
    const data = await res.json()
    if (res.ok) setInviteLink({ partnerId: p.id, name: p.name, url: data.url })
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
          <div style={{ background: '#E8F5E9', border: '1px solid #A5D6A7', borderRadius: 8, padding: '12px 18px', color: '#2A3D2E', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            {successMsg}
          </div>
        )}

        {/* Uitnodigingslink */}
        {inviteLink && (
          <div style={{ background: '#FBF8F2', border: '2px solid #2A3D2E', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1A17', margin: 0 }}>
                Uitnodigingslink voor {inviteLink.name} <span style={{ fontWeight: 400, color: '#6E6B62', fontSize: 12 }}>(7 dagen geldig)</span>
              </p>
              <button onClick={() => setInviteLink(null)} style={{ background: 'none', border: 'none', color: '#6E6B62', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <code style={{ background: '#F1ECE0', border: '1px solid #D8D0C0', borderRadius: 6, padding: '8px 12px', fontSize: 12, flex: 1, minWidth: 0, wordBreak: 'break-all', color: '#3A3A33' }}>
                {inviteLink.url}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(inviteLink.url).then(() => { const b = document.getElementById('copy-btn'); if (b) { b.textContent = 'Gekopieerd ✓'; setTimeout(() => { if (b) b.textContent = 'Kopieer link' }, 2000) } })}
                id="copy-btn"
                style={{ background: '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
              >
                Kopieer link
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#6E6B62', marginTop: 10, marginBottom: 0 }}>
              Stuur deze link naar de partner. Via de link stellen zij zelf hun wachtwoord in. Werkt ook als de partner zijn wachtwoord vergeten is.
            </p>
          </div>
        )}

        {/* Snelle stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 32 }}>
          {[
            { label: 'Betalende klanten', value: orderStats.total, color: '#2A3D2E' },
            { label: 'Totale omzet', value: `€ ${orderStats.revenue.toFixed(2).replace('.', ',')}`, color: '#B65436' },
            { label: `Omzet ${new Date().toLocaleDateString('nl-BE', { month: 'long' })}`, value: `€ ${orderStats.revenueThisMonth.toFixed(2).replace('.', ',')}`, color: '#2A3D2E' },
            { label: `Omzet ${new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleDateString('nl-BE', { month: 'long' })}`, value: `€ ${orderStats.revenueLastMonth.toFixed(2).replace('.', ',')}`, color: '#6E6B62' },
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
        <div style={{ display: 'flex', gap: 8, marginBottom: 28, background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 10, padding: 6, width: 'fit-content', flexWrap: 'wrap' }}>
          <button style={tabStyle('partners')} onClick={() => setTab('partners')}>Partners ({partners.length})</button>
          <button style={tabStyle('orders')} onClick={() => setTab('orders')}>Bestellingen ({paidOrders.length})</button>
          <button style={tabStyle('invoicing')} onClick={() => setTab('invoicing')}>Facturatie</button>
          <button style={tabStyle('emails')} onClick={() => {
            setTab('emails')
            if (!emailStats) {
              fetch('/api/admin/export-emails?format=json')
                .then(r => r.json())
                .then(d => setEmailStats(d))
            }
          }}>E-maillijst</button>
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
                      <div style={{ borderTop: '1px solid #D8D0C0', paddingTop: 14, marginTop: 4 }}>
                        <p style={{ fontSize: 13, color: '#6E6B62', margin: 0 }}>
                          Wachtwoord resetten? Sla eerst op, klik dan op <strong>&ldquo;Uitnodigingslink&rdquo;</strong> op de partnerkaart — de partner stelt zelf een nieuw wachtwoord in via de link.
                        </p>
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
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button onClick={() => { setEditPartner(p); setFormError('') }} style={{ background: '#F1ECE0', border: '1px solid #D8D0C0', borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#3A3A33' }}>
                            Bewerken
                          </button>
                          <button onClick={() => handleGenerateInvite(p)} style={{ background: '#F1ECE0', border: '1px solid #D8D0C0', borderRadius: 6, padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', color: '#3A3A33' }}>
                            Uitnodigingslink
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
        {tab === 'invoicing' && (() => {
          // Laad maanddata bij eerste keer openen
          if (!invoicingLoaded) {
            fetch('/api/admin/invoicing')
              .then(r => r.json())
              .then(d => { setInvoicingData(d.monthly ?? {}); setInvoicingLoaded(true) })
            return <p style={{ color: '#6E6B62' }}>Laden…</p>
          }

          const now = new Date()
          const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
          const fmt = (key: string) => {
            const [y, m] = key.split('-')
            return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' })
          }

          const partnerEntries = Object.entries(invoicingData)

          return (
            <div>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1A1A17', marginBottom: 4 }}>Facturatie per partner per maand</h2>
              <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 24 }}>
                Klik op &ldquo;E-mail versturen&rdquo; bij de betreffende maand om de partner te factureren.
              </p>

              {partnerEntries.length === 0 && (
                <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#6E6B62' }}>
                  Nog geen geverifieerde codes. Zodra partners codes verifiëren verschijnen ze hier.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {partnerEntries.map(([partnerId, pd]) => {
                  const monthEntries = Object.entries(pd.months).sort((a, b) => b[0].localeCompare(a[0]))
                  const partner = partners.find(p => p.id === partnerId)
                  return (
                    <div key={partnerId} style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 16, overflow: 'hidden' }}>
                      {/* Partner header */}
                      <div style={{ background: '#2A3D2E', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                        <div>
                          <strong style={{ color: '#fff', fontSize: 16 }}>{pd.business_name}</strong>
                          <span style={{ color: '#8A9588', fontSize: 14, marginLeft: 8 }}>({pd.name})</span>
                          <div style={{ fontSize: 13, color: '#8A9588', marginTop: 2 }}>
                            {PROVINCES[pd.province]} · € {pd.fee.toFixed(2).replace('.', ',')} per klant
                            {partner?.vat_number && ` · BTW: ${partner.vat_number}`}
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 20, fontWeight: 700, color: '#E8D08A', fontFamily: 'Georgia, serif' }}>
                            € {Object.values(pd.months).reduce((s, m) => s + m.amount, 0).toFixed(2).replace('.', ',')}
                          </div>
                          <div style={{ fontSize: 11, color: '#8A9588' }}>totaal alle maanden</div>
                        </div>
                      </div>

                      {/* Maandtabel */}
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                          <tr style={{ background: '#F1ECE0' }}>
                            {['Maand', 'Geverifieerde klanten', 'Bedrag', 'Actie'].map(h => (
                              <th key={h} style={{ textAlign: 'left', padding: '10px 20px', color: '#6E6B62', fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {monthEntries.map(([monthKey, entry], i) => (
                            <tr key={monthKey} style={{ borderTop: '1px solid #EDE9E0', background: monthKey === thisMonth ? '#FFFBEF' : (i % 2 === 0 ? 'transparent' : '#F7F3EA') }}>
                              <td style={{ padding: '12px 20px', fontWeight: monthKey === thisMonth ? 700 : 400, color: '#1A1A17' }}>
                                {fmt(monthKey)}
                                {monthKey === thisMonth && <span style={{ marginLeft: 8, fontSize: 11, background: '#E8D08A', color: '#2A3D2E', borderRadius: 4, padding: '2px 6px', fontWeight: 600 }}>Huidig</span>}
                              </td>
                              <td style={{ padding: '12px 20px', color: '#2A3D2E', fontWeight: 600 }}>{entry.count}</td>
                              <td style={{ padding: '12px 20px', color: '#B65436', fontWeight: 700, fontFamily: 'Georgia, serif' }}>€ {entry.amount.toFixed(2).replace('.', ',')}</td>
                              <td style={{ padding: '12px 20px' }}>
                                <a
                                  href={`mailto:${partner?.email ?? ''}?subject=Facturatie ${fmt(monthKey)} — startthuisverpleging&body=Beste ${pd.name},%0D%0A%0D%0AHierbij de facturatie voor ${fmt(monthKey)}:%0D%0A${entry.count} geverifieerde klant(en) × € ${pd.fee.toFixed(2)} = € ${entry.amount.toFixed(2)}%0D%0A%0D%0A${partner?.billing_address ? `Facturatieadres: ${partner.billing_address}%0D%0A` : ''}${partner?.vat_number ? `BTW-nummer: ${partner.vat_number}%0D%0A` : ''}%0D%0AMet vriendelijke groeten,%0D%0APieter Vanermen`}
                                  style={{ background: '#2A3D2E', color: '#fff', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}
                                >
                                  E-mail versturen →
                                </a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── TAB: E-MAILLIJST ── */}
        {tab === 'emails' && (
          <div>
            <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1A1A17', marginBottom: 4 }}>E-maillijst kopers</h2>
            <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 24 }}>
              Exporteer de e-mailadressen van betalende klanten als CSV-bestand. Importeer dit in Mailchimp, Brevo of een ander e-mailtool.
            </p>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: 14, marginBottom: 28 }}>
              <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#2A3D2E', fontFamily: 'Georgia, serif' }}>
                  {emailStats ? emailStats.total : '…'}
                </div>
                <div style={{ fontSize: 12, color: '#6E6B62', marginTop: 2 }}>Totale kopers</div>
              </div>
              <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 12, padding: '18px 20px' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#B65436', fontFamily: 'Georgia, serif' }}>
                  {emailStats ? emailStats.with_consent : '…'}
                </div>
                <div style={{ fontSize: 12, color: '#6E6B62', marginTop: 2 }}>Expliciete toestemming</div>
              </div>
            </div>

            {/* Download knoppen */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
              <a
                href="/api/admin/export-emails?filter=consent"
                download
                style={{ background: '#2A3D2E', color: '#fff', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                ↓ Download met toestemming (veiligst)
              </a>
              <a
                href="/api/admin/export-emails?filter=all"
                download
                style={{ background: '#FBF8F2', color: '#2A3D2E', border: '1.5px solid #2A3D2E', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 600, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
              >
                ↓ Download alle kopers
              </a>
            </div>

            {/* GDPR uitleg */}
            <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderLeft: '3px solid #B65436', borderRadius: 10, padding: '20px 24px', maxWidth: 680 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#1A1A17', marginBottom: 10 }}>GDPR — wat mag je sturen?</p>
              <div style={{ fontSize: 13, color: '#3A3A33', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <p><strong style={{ color: '#2A3D2E' }}>Met toestemming (groen vinkje bij bestelling):</strong> deze klanten kozen actief voor e-mails. Je mag hen onbeperkt mailing sturen, zolang je altijd een uitschrijflink voorziet.</p>
                <p><strong style={{ color: '#6E6B62' }}>Alle kopers (gerechtvaardigd belang):</strong> als bestaande klant mag je hen ook mailen over gelijkaardige producten/diensten — bv. nieuwe gids, kortingsactie, update. Verplicht: altijd een duidelijke uitschrijflink in de mail. Gebruik dit niet voor ongerelateerde reclame.</p>
                <p style={{ fontSize: 12, color: '#8A9588', borderTop: '1px solid #D8D0C0', paddingTop: 8, marginTop: 4 }}>
                  Zet in elke marketingmail: &ldquo;Wil je geen e-mails meer ontvangen? Stuur een bericht naar info@domuscare.be&rdquo; of gebruik de uitschrijflink van je e-mailtool.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
