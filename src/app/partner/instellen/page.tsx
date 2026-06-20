'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1.5px solid #D8D0C0',
  borderRadius: 8,
  fontSize: 15,
  background: '#fff',
  color: '#1A1A17',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#F1ECE0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
      padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2A3D2E', fontWeight: 700 }}>
              start<span style={{ color: '#B65436' }}>thuisverpleging</span>
            </span>
          </a>
          <p style={{ color: '#6E6B62', fontSize: 13, marginTop: 6 }}>Partnerportaal</p>
        </div>
        <div style={{
          background: '#FBF8F2',
          border: '1px solid #D8D0C0',
          borderRadius: 16,
          padding: '40px 36px',
          boxShadow: '0 4px 24px rgba(26,26,23,0.06)',
        }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function SetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [partnerName, setPartnerName] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [validating, setValidating] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setTokenError('Geen geldige link gevonden.')
      setValidating(false)
      return
    }
    fetch(`/api/partner/set-password?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setTokenError(d.error)
        else setPartnerName(d.name)
        setValidating(false)
      })
      .catch(() => {
        setTokenError('Verbindingsfout. Probeer de pagina te herladen.')
        setValidating(false)
      })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setSubmitError('Wachtwoorden komen niet overeen.')
      return
    }
    setSubmitError('')
    setLoading(true)
    try {
      const res = await fetch('/api/partner/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setSubmitError(data.error); return }
      setDone(true)
      setTimeout(() => router.push('/partner'), 3000)
    } catch {
      setSubmitError('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  if (validating) {
    return <p style={{ color: '#6E6B62', textAlign: 'center', margin: 0 }}>Link controleren…</p>
  }

  if (tokenError) {
    return (
      <>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#B65436', marginBottom: 12 }}>
          Link niet geldig
        </h1>
        <p style={{ color: '#6E6B62', fontSize: 15, lineHeight: 1.6, marginBottom: 16 }}>{tokenError}</p>
        <p style={{ color: '#6E6B62', fontSize: 14 }}>
          Vraag een nieuwe link aan via{' '}
          <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a>
        </p>
      </>
    )
  }

  if (done) {
    return (
      <>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#2A3D2E', marginBottom: 12 }}>
          Wachtwoord ingesteld ✓
        </h1>
        <p style={{ color: '#6E6B62', fontSize: 15 }}>
          Je wordt automatisch doorgestuurd naar de inlogpagina…
        </p>
      </>
    )
  }

  return (
    <>
      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1A1A17', marginBottom: 6 }}>
        Welkom, {partnerName}
      </h1>
      <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 28 }}>
        Stel hieronder je wachtwoord in om toegang te krijgen tot het partnerportaal.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3A3A33', marginBottom: 6 }}>
            Nieuw wachtwoord
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Minimaal 8 tekens"
            style={inputStyle}
          />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3A3A33', marginBottom: 6 }}>
            Wachtwoord bevestigen
          </label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            placeholder="Herhaal je wachtwoord"
            style={inputStyle}
          />
        </div>

        {submitError && (
          <div style={{
            background: '#FEE9E7', border: '1px solid #F5C6C0', borderRadius: 8,
            padding: '10px 14px', color: '#B65436', fontSize: 14, marginBottom: 16,
          }}>
            {submitError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%', padding: '12px',
            background: loading ? '#8A9588' : '#2A3D2E',
            color: '#fff', border: 'none', borderRadius: 8,
            fontSize: 15, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {loading ? 'Opslaan…' : 'Wachtwoord instellen →'}
        </button>
      </form>
    </>
  )
}

export default function InstellenPage() {
  return (
    <Shell>
      <Suspense fallback={<p style={{ color: '#6E6B62', textAlign: 'center', margin: 0 }}>Laden…</p>}>
        <SetPasswordContent />
      </Suspense>
    </Shell>
  )
}
