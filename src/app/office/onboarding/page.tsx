'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const PROVINCES: Record<string, string> = {
  ANT: 'Antwerpen', LIM: 'Limburg', OVL: 'Oost-Vlaanderen',
  VBR: 'Vlaams-Brabant', WVL: 'West-Vlaanderen',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #D8D0C0', borderRadius: 8,
  fontSize: 15, background: '#fff', color: '#1A1A17', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#6E6B62',
  textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5,
}
const fieldWrap: React.CSSProperties = { marginBottom: 16 }

type OrgInfo = {
  business_name: string
  service_type: string
  discount_description: string
  fee_per_customer: number
  offices_have_own_description: boolean
  offices_have_own_billing: boolean
  code_mode: string
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontFamily: '"Bricolage Grotesque", system-ui, sans-serif', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 560 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2A3D2E', fontWeight: 700 }}>
              start<span style={{ color: '#B65436' }}>thuisverpleging</span>
            </span>
          </a>
          <p style={{ color: '#6E6B62', fontSize: 13, marginTop: 6 }}>Kantoor onboarding</p>
        </div>
        <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 16, padding: '40px', boxShadow: '0 4px 24px rgba(26,26,23,0.06)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function OnboardingContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [tokenOk, setTokenOk] = useState(false)
  const [tokenError, setTokenError] = useState('')
  const [validating, setValidating] = useState(true)
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [done, setDone] = useState(false)
  const [org, setOrg] = useState<OrgInfo | null>(null)

  const [form, setForm] = useState({
    name: '', business_name: '', email: '', province: '',
    website: '', phone: '', office_address: '',
    discount_description: '',
    vat_number: '', billing_address: '', fee_per_customer: '',
    password: '', confirm: '',
  })

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    if (!token) { setTokenError('Geen geldige link gevonden.'); setValidating(false); return }
    fetch(`/api/office/onboarding?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) { setTokenError(d.error); }
        else { setTokenOk(true); setOrg(d.org) }
        setValidating(false)
      })
      .catch(() => { setTokenError('Verbindingsfout.'); setValidating(false) })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setSubmitError('Wachtwoorden komen niet overeen.'); return }
    setSubmitError(''); setLoading(true)
    try {
      const body: Record<string, unknown> = { token, ...form }
      if (org?.offices_have_own_billing && form.fee_per_customer) {
        body.fee_per_customer = parseFloat(form.fee_per_customer)
      } else {
        delete body.fee_per_customer
      }
      const res = await fetch('/api/office/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error); return }
      setDone(true)
      setTimeout(() => router.push('/office'), 4000)
    } catch { setSubmitError('Verbindingsfout. Probeer opnieuw.') }
    finally { setLoading(false) }
  }

  if (validating) return <p style={{ color: '#6E6B62', textAlign: 'center', margin: 0 }}>Link controleren…</p>
  if (tokenError) return (
    <>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#B65436', marginBottom: 12 }}>Link niet geldig</h1>
      <p style={{ color: '#6E6B62', fontSize: 15, marginBottom: 16 }}>{tokenError}</p>
      <p style={{ color: '#6E6B62', fontSize: 14 }}>Neem contact op via <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a></p>
    </>
  )
  if (done) return (
    <>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#2A3D2E', marginBottom: 12 }}>Kantoor aangemaakt ✓</h1>
      <p style={{ color: '#6E6B62', fontSize: 15, lineHeight: 1.6 }}>Uw kantoor is aangemaakt. U wordt doorgestuurd naar de inlogpagina…</p>
    </>
  )
  if (!tokenOk || !org) return null

  return (
    <>
      <div style={{ background: '#2A3D2E', borderRadius: 10, padding: '14px 18px', marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: '#8A9588', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 4px' }}>Onderdeel van</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{org.business_name}</p>
        <p style={{ fontSize: 13, color: '#D8D0C0', margin: '2px 0 0' }}>{org.service_type}</p>
      </div>

      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1A1A17', marginBottom: 6 }}>Kantoor registreren</h1>
      <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Vul de gegevens van uw kantoor in.</p>

      <form onSubmit={handleSubmit}>

        {/* Contactgegevens */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2A3D2E', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Contactgegevens kantoor</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Naam contactpersoon</label>
            <input type="text" required value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Jan Janssen" style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>E-mailadres (wordt uw login)</label>
            <input type="email" required value={form.email} onChange={e => setField('email', e.target.value)} placeholder="antwerpen@xerius.be" style={inputStyle} />
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Naam kantoor</label>
          <input type="text" required value={form.business_name} onChange={e => setField('business_name', e.target.value)} placeholder="Xerius Antwerpen" style={inputStyle} />
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Provincie</label>
          <select required value={form.province} onChange={e => setField('province', e.target.value)} style={{ ...inputStyle }}>
            <option value="">— Kies provincie —</option>
            {Object.entries(PROVINCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Telefoon <span style={{ color: '#8A9588', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optioneel)</span></label>
            <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+32 3 000 00 00" style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Adres kantoor <span style={{ color: '#8A9588', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optioneel)</span></label>
            <input type="text" value={form.office_address} onChange={e => setField('office_address', e.target.value)} placeholder="Meir 1, 2000 Antwerpen" style={inputStyle} />
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Website <span style={{ color: '#8A9588', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(optioneel)</span></label>
          <input type="url" value={form.website} onChange={e => setField('website', e.target.value)} placeholder="https://www.xerius.be/antwerpen" style={inputStyle} />
        </div>

        {/* Eigen aanbod (indien vereist) */}
        {org.offices_have_own_description && (
          <>
            <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#2A3D2E', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Aanbod voor klanten</p>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Wat krijgen klanten van uw kantoor?</label>
              <textarea required rows={3} value={form.discount_description} onChange={e => setField('discount_description', e.target.value)} placeholder="Bv. Gratis adviesgesprek + optimale verzekeringsdekking" style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} />
            </div>
          </>
        )}

        {/* Eigen billing (indien vereist) */}
        {org.offices_have_own_billing && (
          <>
            <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#2A3D2E', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Facturatie kantoor</p>
            </div>
            <div style={fieldWrap}>
              <label style={labelStyle}>Leadsfee per klant (€)</label>
              <input type="number" required min={0} step="0.01" value={form.fee_per_customer} onChange={e => setField('fee_per_customer', e.target.value)} placeholder={String(org.fee_per_customer || 0)} style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>BTW-nummer</label>
                <input type="text" value={form.vat_number} onChange={e => setField('vat_number', e.target.value)} placeholder="BE0123.456.789" style={inputStyle} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Facturatieadres</label>
                <input type="text" value={form.billing_address} onChange={e => setField('billing_address', e.target.value)} placeholder="Meir 1, 2000 Antwerpen" style={inputStyle} />
              </div>
            </div>
          </>
        )}

        {/* Wachtwoord */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2A3D2E', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Wachtwoord</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Wachtwoord</label>
            <input type="password" required minLength={8} value={form.password} onChange={e => setField('password', e.target.value)} placeholder="Minimaal 8 tekens" style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Bevestig wachtwoord</label>
            <input type="password" required value={form.confirm} onChange={e => setField('confirm', e.target.value)} placeholder="Herhaal wachtwoord" style={inputStyle} />
          </div>
        </div>

        {submitError && <div style={{ background: '#FEE9E7', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px', color: '#B65436', fontSize: 14, marginBottom: 16 }}>{submitError}</div>}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
          {loading ? 'Kantoor aanmaken…' : 'Kantoor aanmaken →'}
        </button>
      </form>
    </>
  )
}

export default function OfficeOnboardingPage() {
  return (
    <Shell>
      <Suspense fallback={<p style={{ color: '#6E6B62', textAlign: 'center', margin: 0 }}>Laden…</p>}>
        <OnboardingContent />
      </Suspense>
    </Shell>
  )
}
