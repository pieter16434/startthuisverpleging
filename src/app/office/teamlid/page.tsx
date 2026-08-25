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

function OfficeTeamllidContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [validating, setValidating] = useState(true)
  const [tokenError, setTokenError] = useState('')
  const [officeName, setOfficeName] = useState('')
  const [orgName, setOrgName] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    if (!token) { setTokenError('Geen geldige link gevonden.'); setValidating(false); return }
    fetch(`/api/office/team/onboarding?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setTokenError(d.error)
        else {
          setOfficeName(d.office?.business_name ?? '')
          setOrgName((d.office?.organizations as { business_name?: string } | null)?.business_name ?? '')
        }
        setValidating(false)
      })
      .catch(() => { setTokenError('Verbindingsfout.'); setValidating(false) })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setError('Wachtwoorden komen niet overeen.'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/office/team/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name: form.name, email: form.email, password: form.password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Aanmaken mislukt'); return }
      setDone(true)
      setTimeout(() => router.push('/office'), 3000)
    } catch { setError('Verbindingsfout. Probeer opnieuw.') }
    finally { setLoading(false) }
  }

  const shell = (children: React.ReactNode) => (
    <div style={{ minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Bricolage Grotesque", system-ui, sans-serif', padding: '32px 24px' }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2A3D2E', fontWeight: 700 }}>
              start<span style={{ color: '#B65436' }}>thuisverpleging</span>
            </span>
          </a>
          <p style={{ color: '#6E6B62', fontSize: 13, marginTop: 6 }}>Kantoor teamlid registreren</p>
        </div>
        <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 16, padding: '40px 36px', boxShadow: '0 4px 24px rgba(26,26,23,0.06)' }}>
          {children}
        </div>
      </div>
    </div>
  )

  if (validating) return shell(<p style={{ color: '#6E6B62', textAlign: 'center', margin: 0 }}>Link controleren…</p>)

  if (tokenError) return shell(
    <>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#B65436', marginBottom: 12 }}>Link niet geldig</h1>
      <p style={{ color: '#6E6B62', fontSize: 15 }}>{tokenError}</p>
      <p style={{ color: '#6E6B62', fontSize: 14 }}>Neem contact op via <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a></p>
    </>
  )

  if (done) return shell(
    <>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#2A3D2E', marginBottom: 12 }}>Account aangemaakt ✓</h1>
      <p style={{ color: '#6E6B62', fontSize: 15, lineHeight: 1.6 }}>Je account is gekoppeld aan <strong>{officeName}</strong> ({orgName}). Je wordt doorgestuurd naar de inlogpagina…</p>
    </>
  )

  return shell(
    <>
      {officeName && (
        <div style={{ background: '#2A3D2E', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
          <p style={{ fontSize: 11, color: '#8A9588', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 3px' }}>Je wordt teamlid van</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>{officeName}</p>
          {orgName && <p style={{ fontSize: 12, color: '#8A9588', margin: '2px 0 0' }}>{orgName}</p>}
        </div>
      )}
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1A1A17', marginBottom: 6 }}>Account aanmaken</h1>
      <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
        Vul je gegevens in. Je kan codes verifiëren via het kantoorportaal.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Naam</label>
          <input type="text" required value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Jan Janssen" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>E-mailadres (wordt je login)</label>
          <input type="email" required value={form.email} onChange={e => setField('email', e.target.value)} placeholder="jan@kantoor.be" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Wachtwoord</label>
          <input type="password" required minLength={8} value={form.password} onChange={e => setField('password', e.target.value)} placeholder="Minimaal 8 tekens" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Bevestig wachtwoord</label>
          <input type="password" required value={form.confirm} onChange={e => setField('confirm', e.target.value)} placeholder="Herhaal wachtwoord" style={inputStyle} />
        </div>
        {error && (
          <div style={{ background: '#FEE9E7', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px', color: '#B65436', fontSize: 14, marginBottom: 16 }}>{error}</div>
        )}
        <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Account aanmaken…' : 'Account aanmaken →'}
        </button>
      </form>
      <p style={{ textAlign: 'center', fontSize: 13, color: '#8A9588', marginTop: 16 }}>
        Na het aanmaken log je in via <a href="/office" style={{ color: '#B65436' }}>het kantoorportaal</a>.
      </p>
    </>
  )
}

export default function OfficeTeamllidPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6E6B62', fontFamily: 'system-ui' }}>Laden…</p>
      </div>
    }>
      <OfficeTeamllidContent />
    </Suspense>
  )
}
