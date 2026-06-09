'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      router.push('/admin/dashboard')
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#1C2A20',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Bricolage Grotesque", system-ui, sans-serif', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#fff', fontWeight: 700 }}>
            start<span style={{ color: '#E8D08A' }}>thuisverpleging</span>
          </span>
          <p style={{ color: '#8A9588', fontSize: 13, marginTop: 6 }}>Admin — Pieter & Jonas</p>
        </div>
        <div style={{ background: '#FBF8F2', borderRadius: 16, padding: '36px 32px' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 22, color: '#1A1A17', marginBottom: 24 }}>Inloggen</h1>
          <form onSubmit={handleSubmit}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#3A3A33', marginBottom: 6 }}>
              Wachtwoord
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••••"
              autoFocus
              style={{
                width: '100%', padding: '10px 14px', border: '1.5px solid #D8D0C0',
                borderRadius: 8, fontSize: 15, background: '#fff', color: '#1A1A17',
                outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', marginBottom: 16,
              }}
            />
            {error && (
              <div style={{ background: '#FEE9E7', border: '1px solid #F5C6C0', borderRadius: 8, padding: '10px 14px', color: '#B65436', fontSize: 14, marginBottom: 16 }}>
                {error}
              </div>
            )}
            <button
              type="submit" disabled={loading}
              style={{
                width: '100%', padding: '12px', background: loading ? '#8A9588' : '#2A3D2E',
                color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
              }}
            >
              {loading ? 'Bezig…' : 'Inloggen →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
