'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', border: '1.5px solid #D8D0C0', borderRadius: 8,
  fontSize: 15, background: '#fff', color: '#1A1A17', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
}

function ResetContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token') ?? ''

  const [name, setName] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [validating, setValidating] = useState(true)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) { setTokenError('Geen geldige link gevonden.'); setValidating(false); return }
    fetch(`/api/influencer/set-password?token=${token}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setTokenError(d.error)
        else setName(d.name)
        setValidating(false)
      })
      .catch(() => { setTokenError('Verbindingsfout. Probeer opnieuw.'); setValidating(false) })
  }, [token])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Wachtwoorden komen niet overeen.'); return }
    setError(''); setLoading(true)
    try {
      const res = await fetch('/api/influencer/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      setDone(true)
      setTimeout(() => router.push('/influencer'), 3000)
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
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
          {validating && <p style={{ color: '#6E6B62', textAlign: 'center' }}>Link controleren…</p>}

          {!validating && tokenError && (
            <>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: '#B65436', marginBottom: 12 }}>Link niet geldig</h2>
              <p style={{ color: '#6E6B62', fontSize: 14, lineHeight: 1.6, marginBottom: 16 }}>{tokenError}</p>
              <a href="/influencer" style={{ color: '#2A3D2E', fontSize: 14, fontWeight: 600 }}>← Terug naar inloggen</a>
            </>
          )}

          {!validating && !tokenError && !done && (
            <>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1A1A17', marginBottom: 6 }}>
                Nieuw wachtwoord instellen
              </h2>
              <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 24 }}>
                Welkom {name} — kies een nieuw wachtwoord voor je portaal.
              </p>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6E6B62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                    Nieuw wachtwoord (min. 8 tekens)
                  </label>
                  <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#6E6B62', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 5 }}>
                    Herhaal wachtwoord
                  </label>
                  <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" style={inputStyle} />
                </div>
                {error && (
                  <div style={{ background: '#FEE9E7', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px', color: '#B65436', fontSize: 14, marginBottom: 16 }}>
                    {error}
                  </div>
                )}
                <button type="submit" disabled={loading} style={{ width: '100%', background: loading ? '#8A9588' : '#2A3D2E', color: '#fff', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {loading ? 'Opslaan…' : 'Wachtwoord opslaan →'}
                </button>
              </form>
            </>
          )}

          {done && (
            <>
              <h2 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#2A3D2E', marginBottom: 12 }}>Wachtwoord opgeslagen ✓</h2>
              <p style={{ color: '#6E6B62', fontSize: 14, lineHeight: 1.6 }}>
                Je nieuwe wachtwoord is actief. Je wordt doorgestuurd naar het inlogscherm…
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function InfluencerInstellenPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#F1ECE0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#6E6B62' }}>Laden…</p>
      </div>
    }>
      <ResetContent />
    </Suspense>
  )
}
