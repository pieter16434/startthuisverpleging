'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #D8D0C0', borderRadius: 8,
  fontSize: 15, background: '#fff', color: '#1A1A17', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function InfluencerLoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'forgot'>('login')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/influencer/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Inloggen mislukt'); return }
      router.push('/influencer/dashboard')
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
      await fetch('/api/influencer/forgot-password', {
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
      minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: '"Bricolage Grotesque", system-ui, sans-serif', padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2A3D2E', fontWeight: 700 }}>
              start<span style={{ color: '#B65436' }}>thuisverpleging</span>
            </span>
          </a>
          <p style={{ color: '#6E6B62', fontSize: 13, marginTop: 6 }}>Influencer portaal</p>
        </div>

        <div style={{ background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 16, padding: '36px 32px', boxShadow: '0 4px 24px rgba(26,26,23,0.06)' }}>

          {mode === 'login' ? (
            <>
              <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1A1A17', marginBottom: 6 }}>Inloggen</h1>
              <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 24 }}>
                Bekijk hoeveel mensen jouw code al hebben gebruikt.
              </p>
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6E6B62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                    E-mailadres
                  </label>
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="jij@email.com" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6E6B62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                    Wachtwoord
                  </label>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                </div>
                <div style={{ textAlign: 'right', marginBottom: 20 }}>
                  <button type="button" onClick={() => { setMode('forgot'); setForgotEmail(email); setError('') }} style={{ background: 'none', border: 'none', color: '#B65436', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                    Wachtwoord vergeten?
                  </button>
                </div>
                {error && (
                  <div style={{ background: '#FEE9E7', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px', color: '#B65436', fontSize: 14, marginBottom: 16 }}>
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {loading ? 'Inloggen…' : 'Inloggen →'}
                </button>
              </form>
            </>
          ) : forgotSent ? (
            <>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#2A3D2E', marginBottom: 12 }}>E-mail verstuurd ✓</h2>
              <p style={{ color: '#6E6B62', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                Als dit e-mailadres bij ons bekend is, ontvang je binnen enkele minuten een link om je wachtwoord opnieuw in te stellen. Controleer ook je spammap.
              </p>
              <button onClick={() => { setMode('login'); setForgotSent(false) }} style={{ background: 'none', border: 'none', color: '#2A3D2E', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                ← Terug naar inloggen
              </button>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#1A1A17', marginBottom: 6 }}>Wachtwoord vergeten</h2>
              <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                Vul je e-mailadres in. Je ontvangt een link om een nieuw wachtwoord in te stellen.
              </p>
              <form onSubmit={handleForgot}>
                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6E6B62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                    E-mailadres
                  </label>
                  <input type="email" required value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="jij@email.com" style={inputStyle} autoFocus />
                </div>
                <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 12 }}>
                  {loading ? 'Versturen…' : 'Reset-link versturen →'}
                </button>
                <button type="button" onClick={() => setMode('login')} style={{ width: '100%', background: 'transparent', border: '1px solid #D8D0C0', borderRadius: 8, padding: '11px', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: '#6E6B62' }}>
                  Annuleer
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
