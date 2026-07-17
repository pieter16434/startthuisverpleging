'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const PLATFORMS: Record<string, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  facebook: 'Facebook',
  other: 'Ander platform',
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
const sectionHead: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: '#2A3D2E', textTransform: 'uppercase',
  letterSpacing: 1, margin: '0 0 16px',
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'flex-start',
      justifyContent: 'center', fontFamily: '"Bricolage Grotesque", system-ui, sans-serif', padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 580 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2A3D2E', fontWeight: 700 }}>
              start<span style={{ color: '#B65436' }}>thuisverpleging</span>
            </span>
          </a>
          <p style={{ color: '#6E6B62', fontSize: 13, marginTop: 6 }}>Influencer onboarding</p>
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
  const [codeAvailable, setCodeAvailable] = useState<boolean | null>(null)

  const [form, setForm] = useState({
    name: '', email: '', platform: '', social_handle: '',
    profile_url: '', discount_code: '', iban: '', iban_name: '',
    password: '', confirm: '',
  })

  function setField(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  useEffect(() => {
    if (!token) { setTokenError('Geen geldige link gevonden.'); setValidating(false); return }
    fetch(`/api/influencer/onboarding?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setTokenError(d.error)
        else setTokenOk(true)
        setValidating(false)
      })
      .catch(() => { setTokenError('Verbindingsfout. Probeer de pagina te herladen.'); setValidating(false) })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirm) { setSubmitError('Wachtwoorden komen niet overeen.'); return }
    if (!form.platform) { setSubmitError('Kies je sociale media platform.'); return }
    setSubmitError(''); setLoading(true)
    try {
      const res = await fetch('/api/influencer/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...form, discount_code: form.discount_code.trim().toUpperCase() }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error); return }
      setDone(true)
      setTimeout(() => router.push('/influencer'), 4000)
    } catch {
      setSubmitError('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) return <p style={{ color: '#6E6B62', textAlign: 'center' }}>Link controleren…</p>

  if (tokenError) return (
    <>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#B65436', marginBottom: 12 }}>Link niet geldig</h1>
      <p style={{ color: '#6E6B62', fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>{tokenError}</p>
      <p style={{ color: '#6E6B62', fontSize: 14 }}>
        Neem contact op via <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a>
      </p>
    </>
  )

  if (done) return (
    <>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#2A3D2E', marginBottom: 12 }}>Profiel aangemaakt ✓</h1>
      <p style={{ color: '#6E6B62', fontSize: 15, lineHeight: 1.6 }}>
        Je kortingscode is actief. Je wordt doorgestuurd naar het inlogscherm…
      </p>
    </>
  )

  if (!tokenOk) return null

  return (
    <>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1A1A17', marginBottom: 6 }}>
        Welkom als influencer
      </h1>
      <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
        Vul je gegevens in om je profiel aan te maken en je persoonlijke kortingscode te activeren.
      </p>

      <form onSubmit={handleSubmit}>

        {/* Contactgegevens */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={sectionHead}>Jouw gegevens</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Volledige naam</label>
            <input type="text" required value={form.name} onChange={e => setField('name', e.target.value)} placeholder="Lisa Janssen" style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>E-mailadres (wordt je login)</label>
            <input type="email" required value={form.email} onChange={e => setField('email', e.target.value)} placeholder="lisa@email.com" style={inputStyle} />
          </div>
        </div>

        {/* Sociale media */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={sectionHead}>Sociale media</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Platform</label>
            <select required value={form.platform} onChange={e => setField('platform', e.target.value)} style={{ ...inputStyle }}>
              <option value="">— Kies platform —</option>
              {Object.entries(PLATFORMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Gebruikersnaam / handle</label>
            <input type="text" required value={form.social_handle} onChange={e => setField('social_handle', e.target.value)} placeholder="@lisajanssen" style={inputStyle} />
          </div>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Link naar profiel <span style={{ color: '#9E9B91', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optioneel)</span></label>
          <input type="url" value={form.profile_url} onChange={e => setField('profile_url', e.target.value)} placeholder="https://www.instagram.com/lisajanssen" style={inputStyle} />
        </div>

        {/* Kortingscode */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={sectionHead}>Jouw kortingscode</p>
        </div>
        <div style={fieldWrap}>
          <label style={labelStyle}>Kies jouw kortingscode (20% korting voor jouw volgers)</label>
          <input
            type="text"
            required
            value={form.discount_code}
            onChange={e => {
              setField('discount_code', e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))
              setCodeAvailable(null)
            }}
            placeholder="LISASAVE20"
            maxLength={30}
            style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 2 }}
          />
          <p style={{ fontSize: 12, color: codeAvailable === false ? '#B65436' : '#8A9588', marginTop: 6 }}>
            {codeAvailable === false
              ? '✗ Deze code is al in gebruik — kies een andere.'
              : 'Enkel hoofdletters, cijfers, koppeltekens en underscores. Min. 3 tekens.'}
          </p>
        </div>

        {/* IBAN */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={sectionHead}>Uitbetalingsgegevens</p>
        </div>
        <p style={{ fontSize: 13, color: '#6E6B62', marginBottom: 16, lineHeight: 1.5 }}>
          Je ontvangt <strong style={{ color: '#2A3D2E' }}>€20</strong> per verkoop via jouw code. Uitbetaling gebeurt manueel maandelijks op onderstaande rekening.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>IBAN-rekeningnummer</label>
            <input type="text" required value={form.iban} onChange={e => setField('iban', e.target.value.toUpperCase())} placeholder="BE12 3456 7890 1234" style={{ ...inputStyle, fontFamily: 'monospace', letterSpacing: 1 }} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Naam rekeninghouder</label>
            <input type="text" required value={form.iban_name} onChange={e => setField('iban_name', e.target.value)} placeholder="Lisa Janssen" style={inputStyle} />
          </div>
        </div>

        {/* Wachtwoord */}
        <div style={{ borderBottom: '1px solid #D8D0C0', marginBottom: 20, paddingBottom: 4 }}>
          <p style={sectionHead}>Wachtwoord instellen</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div style={fieldWrap}>
            <label style={labelStyle}>Wachtwoord (min. 8 tekens)</label>
            <input type="password" required minLength={8} value={form.password} onChange={e => setField('password', e.target.value)} placeholder="••••••••" style={inputStyle} />
          </div>
          <div style={fieldWrap}>
            <label style={labelStyle}>Herhaal wachtwoord</label>
            <input type="password" required value={form.confirm} onChange={e => setField('confirm', e.target.value)} placeholder="••••••••" style={inputStyle} />
          </div>
        </div>

        {submitError && (
          <div style={{ background: '#FEE9E7', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px', color: '#B65436', fontSize: 14, marginBottom: 16 }}>
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{ background: loading ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 28px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}
        >
          {loading ? 'Profiel aanmaken…' : 'Profiel aanmaken →'}
        </button>
      </form>
    </>
  )
}

export default function InfluencerOnboardingPage() {
  return (
    <Shell>
      <Suspense fallback={<p style={{ color: '#6E6B62', textAlign: 'center' }}>Laden…</p>}>
        <OnboardingContent />
      </Suspense>
    </Shell>
  )
}
