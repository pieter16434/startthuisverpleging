'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'


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

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', fontFamily: '"Bricolage Grotesque", system-ui, sans-serif', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 600 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2A3D2E', fontWeight: 700 }}>
              start<span style={{ color: '#B65436' }}>thuisverpleging</span>
            </span>
          </a>
          <p style={{ color: '#6E6B62', fontSize: 13, marginTop: 6 }}>Organisatie onboarding</p>
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

  const [form, setForm] = useState({
    name: '', business_name: '', email: '',
    service_type: '', discount_description: '',
    fee_per_customer: '',
    code_mode: 'shared' as 'shared' | 'per_office',
    offices_have_own_description: false,
    offices_have_own_billing: false,
    vat_number: '', billing_address: '',
    website: '', phone: '',
    show_name: true,
    password: '', confirm: '',
  })

  function setField(k: string, v: string | boolean) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    if (!token) { setTokenError('Geen geldige link gevonden.'); setValidating(false); return }
    fetch(`/api/organization/onboarding?token=${token}`)
      .then(r => r.json())
      .then(d => { if (d.error) setTokenError(d.error); else setTokenOk(true); setValidating(false) })
      .catch(() => { setTokenError('Verbindingsfout.'); setValidating(false) })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setSubmitError('Wachtwoorden komen niet overeen.'); return }
    setSubmitError(''); setLoading(true)
    try {
      const res = await fetch('/api/organization/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token, ...form,
          fee_per_customer: parseFloat(form.fee_per_customer) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error); return }
      setDone(true)
      setTimeout(() => router.push('/organisatie'), 4000)
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
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#2A3D2E', marginBottom: 12 }}>Organisatie aangemaakt ✓</h1>
      <p style={{ color: '#6E6B62', fontSize: 15, lineHeight: 1.6 }}>Je organisatie is aangemaakt. Je wordt doorgestuurd naar de inlogpagina…</p>
    </>
  )
  if (!tokenOk) return null

  return (
    <>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1A1A17', marginBottom: 6 }}>Organisatie registreren</h1>
      <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>Vul onderstaande gegevens in. Na registratie genereert de admin kantoor-onboardinglinks voor elk van uw kantoren.</p>

      <form onSubmit={handleSubmit}>

        {/* Contactgegevens */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2A3D2E', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Contactgegevens</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Naam contactpersoon</label>
            <input type="text" required value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Jan Janssen" style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>E-mailadres (wordt uw login)</label>
            <input type="email" required value={form.email} onChange={e => setField('email', e.target.value)} placeholder="info@hetbedrijf.be" style={inputStyle} />
          </div>
        </div>
        <div style={{ ...fieldWrap, background: '#F1ECE0', border: '1px solid #D8D0C0', borderRadius: 8, padding: '12px 14px' }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form.show_name}
              onChange={e => setForm(f => ({ ...f, show_name: e.target.checked }))}
              style={{ width: 16, height: 16, marginTop: 2, accentColor: '#2A3D2E', cursor: 'pointer', flexShrink: 0 }}
            />
            <div>
              <span style={{ fontSize: 14, color: '#1A1A17', fontWeight: 600 }}>Vermeld mijn naam in het codeboek</span>
              <p style={{ fontSize: 12, color: '#6E6B62', margin: '3px 0 0', lineHeight: 1.5 }}>
                Uw naam (<strong>{form.name || 'Naam contactpersoon'}</strong>) verschijnt in het persoonlijk codeboekje van de klant naast de organisatienaam.
                Vink dit uit als u enkel de organisatienaam wil tonen.
              </p>
            </div>
          </label>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Organisatienaam</label>
          <input type="text" required value={form.business_name} onChange={e => setField('business_name', e.target.value)} placeholder="Het Bedrijf BV" style={inputStyle} />
        </div>

        {/* Aanbod */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2A3D2E', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Aanbod in het codeboek</p>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Type dienst</label>
          <input type="text" required value={form.service_type} onChange={e => setField('service_type', e.target.value)} placeholder="Verzekeringen / Boekhouding / …" style={inputStyle} />
        </div>
        <div style={{ ...fieldWrap, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
            <input type="checkbox" checked={form.offices_have_own_description} onChange={e => setField('offices_have_own_description', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#2A3D2E' }} />
            <span style={{ fontSize: 14, color: '#1A1A17', fontWeight: 600 }}>Elk kantoor heeft eigen aanbod</span>
          </label>
          <p style={{ fontSize: 12, color: '#8A9588', marginLeft: 26, margin: '0 0 0 26px', lineHeight: 1.5 }}>Als aangevinkt: elk kantoor vult zelf zijn aanbod in bij de onboarding.</p>
        </div>
        {!form.offices_have_own_description && (
          <div style={fieldWrap}>
            <label style={labelStyle}>Wat krijgen klanten? (geldt voor alle kantoren)</label>
            <textarea required rows={3} value={form.discount_description} onChange={e => setField('discount_description', e.target.value)} placeholder="Bv. Gratis adviesgesprek + optimale verzekeringsdekking voor zelfstandige verpleegkundigen" style={{ ...inputStyle, resize: 'vertical' } as React.CSSProperties} />
          </div>
        )}

        {/* Code-modus */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2A3D2E', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Code-systeem</p>
        </div>
        <div style={{ ...fieldWrap, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { value: 'shared', label: '1 gedeelde code', desc: 'Elke klant krijgt één code, geldig bij elk kantoor van uw organisatie. Slechts eenmalig te gebruiken.' },
            { value: 'per_office', label: 'Code per kantoor', desc: 'Elke klant krijgt een code specifiek voor het kantoor in zijn provincie. Andere kantoren zien die code niet.' },
          ].map(opt => (
            <label key={opt.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', background: form.code_mode === opt.value ? '#E8F5E9' : '#F1ECE0', border: `1.5px solid ${form.code_mode === opt.value ? '#2A3D2E' : '#D8D0C0'}`, borderRadius: 8, padding: '12px 14px' }}>
              <input type="radio" name="code_mode" value={opt.value} checked={form.code_mode === opt.value} onChange={() => setField('code_mode', opt.value)} style={{ marginTop: 2, accentColor: '#2A3D2E' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: '#1A1A17' }}>{opt.label}</div>
                <div style={{ fontSize: 12, color: '#6E6B62', marginTop: 2, lineHeight: 1.5 }}>{opt.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {/* Facturatie */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2A3D2E', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>Facturatie</p>
        </div>
        <div style={{ ...fieldWrap, marginBottom: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 8 }}>
            <input type="checkbox" checked={form.offices_have_own_billing} onChange={e => setField('offices_have_own_billing', e.target.checked)} style={{ width: 16, height: 16, accentColor: '#2A3D2E' }} />
            <span style={{ fontSize: 14, color: '#1A1A17', fontWeight: 600 }}>Elk kantoor betaalt eigen leadsfee</span>
          </label>
          <p style={{ fontSize: 12, color: '#8A9588', marginLeft: 26, lineHeight: 1.5 }}>Als aangevinkt: elk kantoor vult eigen BTW-nummer, facturatieadres en bedrag in.</p>
        </div>
        {!form.offices_have_own_billing && (
          <>
            <div style={fieldWrap}>
              <label style={labelStyle}>Leadsfee per klant (€)</label>
              <input type="number" required min={0} step="0.01" value={form.fee_per_customer} onChange={e => setField('fee_per_customer', e.target.value)} placeholder="40" style={inputStyle} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div style={fieldWrap}>
                <label style={labelStyle}>BTW-nummer <span style={{ color: '#8A9588', fontWeight: 400, textTransform: 'none' }}>(optioneel)</span></label>
                <input type="text" value={form.vat_number} onChange={e => setField('vat_number', e.target.value)} placeholder="BE0123.456.789" style={inputStyle} />
              </div>
              <div style={fieldWrap}>
                <label style={labelStyle}>Facturatieadres <span style={{ color: '#8A9588', fontWeight: 400, textTransform: 'none' }}>(optioneel)</span></label>
                <input type="text" value={form.billing_address} onChange={e => setField('billing_address', e.target.value)} placeholder="Hoofdkantoor, 9000 Gent" style={inputStyle} />
              </div>
            </div>
          </>
        )}
        {form.offices_have_own_billing && (
          <div style={fieldWrap}>
            <label style={labelStyle}>Standaard leadsfee per klant (€) — kantoren kunnen dit overschrijven</label>
            <input type="number" min={0} step="0.01" value={form.fee_per_customer} onChange={e => setField('fee_per_customer', e.target.value)} placeholder="0" style={inputStyle} />
          </div>
        )}

        {/* Contact (optioneel) */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#2A3D2E', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 16px' }}>
            Contact organisatie <span style={{ color: '#8A9588', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optioneel)</span>
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Website</label>
            <input type="url" value={form.website} onChange={e => setField('website', e.target.value)} placeholder="https://www.hetbedrijf.be" style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Telefoon</label>
            <input type="tel" value={form.phone} onChange={e => setField('phone', e.target.value)} placeholder="+32 9 000 00 00" style={inputStyle} />
          </div>
        </div>

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

        {submitError && (
          <div style={{ background: '#FEE9E7', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px', color: '#B65436', fontSize: 14, marginBottom: 16 }}>{submitError}</div>
        )}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '13px', background: loading ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 8 }}>
          {loading ? 'Organisatie aanmaken…' : 'Organisatie aanmaken →'}
        </button>
      </form>
    </>
  )
}

export default function OrganizationOnboardingPage() {
  return (
    <Shell>
      <Suspense fallback={<p style={{ color: '#6E6B62', textAlign: 'center', margin: 0 }}>Laden…</p>}>
        <OnboardingContent />
      </Suspense>
    </Shell>
  )
}
