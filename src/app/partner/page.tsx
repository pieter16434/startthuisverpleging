'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

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

export default function PartnerLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'forgot'>('login')

  // Login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/partner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Inloggen mislukt'); return }
      router.push('/partner/dashboard')
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/api/partner/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      })
      setForgotSent(true)
    } catch {
      setForgotSent(true) // toon succes ook bij fout — geen info lekken
    } finally {
      setLoading(false)
    }
  }

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
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2A3D2E', fontWeight: 700 }}>
              start<span style={{ color: '#B65436' }}>thuisverpleging</span>
            </span>
          </a>
          <p style={{ color: '#6E6B62', fontSize: 13, marginTop: 6 }}>Partnerportaal</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#FBF8F2',
          border: '1px solid #D8D0C0',
          borderRadius: 16,
          padding: '40px 36px',
          boxShadow: '0 4px 24px rgba(26,26,23,0.06)',
        }}>
          {mode === 'login' ? (
            <>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1A1A17', marginBottom: 6 }}>
                Inloggen
              </h1>
              <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 28 }}>
                Voer uw partnergegevens in om verder te gaan.
              </p>

              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3A3A33', marginBottom: 6 }}>
                    E-mailadres
                  </label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="uw@email.be" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3A3A33', marginBottom: 6 }}>
                    Wachtwoord
                  </label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inputStyle} />
                </div>

                {error && (
                  <div style={{ background: '#FEE9E7', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px', color: '#B65436', fontSize: 14, marginBottom: 16 }}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {loading ? 'Bezig met inloggen…' : 'Inloggen →'}
                </button>
              </form>

              <button
                onClick={() => { setMode('forgot'); setError('') }}
                style={{ display: 'block', width: '100%', marginTop: 16, background: 'none', border: 'none', color: '#6E6B62', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}
              >
                Wachtwoord vergeten?
              </button>
            </>
          ) : forgotSent ? (
            <>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#2A3D2E', marginBottom: 12 }}>
                E-mail verstuurd
              </h1>
              <p style={{ color: '#6E6B62', fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                Als jouw e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een link om je wachtwoord opnieuw in te stellen.
              </p>
              <button
                onClick={() => { setMode('login'); setForgotSent(false); setForgotEmail('') }}
                style={{ background: '#F1ECE0', border: '1px solid #D8D0C0', borderRadius: 8, padding: '10px 18px', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', color: '#3A3A33' }}
              >
                ← Terug naar inloggen
              </button>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1A1A17', marginBottom: 6 }}>
                Wachtwoord vergeten
              </h1>
              <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 28 }}>
                Vul je e-mailadres in en we sturen je een link om een nieuw wachtwoord in te stellen.
              </p>

              <form onSubmit={handleForgot}>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3A3A33', marginBottom: 6 }}>
                    E-mailadres
                  </label>
                  <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required placeholder="uw@email.be" style={inputStyle} />
                </div>

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
                  {loading ? 'Versturen…' : 'Verstuur reset-link →'}
                </button>
              </form>

              <button
                onClick={() => setMode('login')}
                style={{ display: 'block', width: '100%', background: 'none', border: 'none', color: '#6E6B62', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}
              >
                ← Terug naar inloggen
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#6E6B62', marginTop: 24 }}>
          Problemen?{' '}
          <a href="mailto:info@domuscare.be?subject=Partner%20portaal%20probleem" style={{ color: '#B65436' }}>
            Stuur ons een mail
          </a>
        </p>
      </div>
    </div>
  )
}
