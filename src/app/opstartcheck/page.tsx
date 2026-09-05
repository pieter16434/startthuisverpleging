'use client'
import React, { useState, useEffect } from 'react'

const PROVINCES = [
  { code: 'ANT', label: 'Antwerpen' },
  { code: 'LIM', label: 'Limburg' },
  { code: 'OVL', label: 'Oost-Vlaanderen' },
  { code: 'VBR', label: 'Vlaams-Brabant' },
  { code: 'WVL', label: 'West-Vlaanderen' },
] as const

export default function OpstartcheckPage() {
  const [email, setEmail]         = useState('')
  const [province, setProvince]   = useState('')
  const [profile, setProfile]     = useState('')
  const [consent, setConsent]     = useState(false)
  const [honeypot, setHoneypot]   = useState('')
  const [utmSource, setUtmSource]     = useState('')
  const [utmCampaign, setUtmCampaign] = useState('')
  const [utmContent, setUtmContent]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [provinceError, setProvinceError] = useState(false)

  // UTM-parameters uit URL lezen
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    setUtmSource(p.get('utm_source') ?? '')
    setUtmCampaign(p.get('utm_campaign') ?? '')
    setUtmContent(p.get('utm_content') ?? '')
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setProvinceError(false)

    if (!province) {
      setProvinceError(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/opstartcheck', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email, province, profile: profile || undefined,
          consent,
          utm_source:   utmSource || undefined,
          utm_campaign: utmCampaign || undefined,
          utm_content:  utmContent || undefined,
          website: honeypot, // honeypot
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) {
        setError(json.error ?? 'Inschrijving mislukt. Probeer opnieuw.')
        return
      }

      // Vercel Analytics event
      try {
        // @ts-expect-error – optioneel, alleen als analytics is geladen
        if (typeof window.va === 'function') window.va('event', { name: 'opstartcheck_lead', province })
      } catch { /* no-op */ }

      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch {
      setError('Verbindingsfout. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  const formBlock = (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Honeypot — verborgen voor echte gebruikers */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <label htmlFor="website-hp">Website</label>
        <input id="website-hp" name="website" tabIndex={-1} autoComplete="off"
          value={honeypot} onChange={e => setHoneypot(e.target.value)} />
      </div>

      {/* E-mail */}
      <label style={labelStyle} htmlFor="email-field">E-mailadres <span style={{ color: '#B65436' }}>*</span></label>
      <input
        id="email-field"
        type="email"
        required
        placeholder="jouw@email.be"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
        autoComplete="email"
      />

      {/* Provincie */}
      <label style={{ ...labelStyle, marginTop: 16 }}>
        Provincie <span style={{ color: '#B65436' }}>*</span>
      </label>
      {provinceError && (
        <p style={{ margin: '0 0 8px', fontSize: 13, color: '#B65436' }}>Kies je provincie om door te gaan.</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 8, marginBottom: 20 }}>
        {PROVINCES.map(p => (
          <button
            key={p.code}
            type="button"
            onClick={() => { setProvince(p.code); setProvinceError(false) }}
            style={{
              padding: '10px 8px',
              borderRadius: 8,
              border: province === p.code ? '2px solid #2A3D2E' : '2px solid #D8D0C0',
              background: province === p.code ? '#2A3D2E' : '#fff',
              color: province === p.code ? '#fff' : '#1A1A17',
              fontFamily: 'inherit',
              fontSize: 14,
              fontWeight: province === p.code ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Situatie (optioneel) */}
      <label style={labelStyle}>Wat is jouw situatie? <span style={{ color: '#8A9588', fontWeight: 400 }}>(optioneel)</span></label>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[
          { value: 'student', label: 'Net afgestudeerd' },
          { value: 'employed', label: 'Al in loondienst' },
        ].map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setProfile(profile === opt.value ? '' : opt.value)}
            style={{
              flex: 1,
              padding: '9px 8px',
              borderRadius: 8,
              border: profile === opt.value ? '2px solid #2A3D2E' : '2px solid #D8D0C0',
              background: profile === opt.value ? '#2A3D2E' : '#fff',
              color: profile === opt.value ? '#fff' : '#1A1A17',
              fontFamily: 'inherit',
              fontSize: 13,
              fontWeight: profile === opt.value ? 700 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Marketing consent */}
      <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 22, fontSize: 13, color: '#6E6B62', lineHeight: 1.5 }}>
        <input
          type="checkbox"
          checked={consent}
          onChange={e => setConsent(e.target.checked)}
          style={{ marginTop: 2, accentColor: '#2A3D2E', width: 16, height: 16, flexShrink: 0 }}
        />
        Hou me op de hoogte over de volledige gids en partnervoordelen in mijn provincie.
      </label>

      {/* UTM verborgen velden */}
      <input type="hidden" value={utmSource} readOnly />
      <input type="hidden" value={utmCampaign} readOnly />
      <input type="hidden" value={utmContent} readOnly />

      {error && <p style={{ margin: '0 0 12px', fontSize: 14, color: '#B65436' }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          background: loading ? '#6E8A6E' : '#2A3D2E',
          color: '#E8D08A',
          border: 'none',
          borderRadius: 10,
          padding: '15px 24px',
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'inherit',
          cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s',
          letterSpacing: '0.02em',
        }}
      >
        {loading ? 'Even geduld…' : 'Stuur mij de Opstartcheck →'}
      </button>

      <p style={{ textAlign: 'center', fontSize: 12, color: '#8A9588', marginTop: 10 }}>
        Je krijgt de pdf binnen één minuut in je mailbox. Geen spam. <a href="/privacy" style={{ color: '#8A9588' }}>Privacybeleid</a>
      </p>
    </form>
  )

  return (
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; background: #FDFAF4; color: #1A1A17; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
        @media (min-width: 640px) { .form-card { max-width: 480px; } }
      `}</style>

      <main style={{ minHeight: '100dvh', background: '#FDFAF4' }}>

        {/* ── HERO — boven de vouw op mobiel ── */}
        <section style={{ background: '#2A3D2E', padding: '40px 20px 36px' }}>
          <div style={{ maxWidth: 540, margin: '0 auto' }}>
            <p style={{ margin: '0 0 10px', fontSize: 12, color: 'rgba(232,208,138,0.7)', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 600 }}>
              Gratis · pdf · startthuisverpleging.be
            </p>
            <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(26px, 6vw, 36px)', fontFamily: 'Georgia, "Times New Roman", serif', color: '#E8D08A', lineHeight: 1.2, fontWeight: 700 }}>
              De Opstartcheck
            </h1>
            <p style={{ margin: '0 0 6px', fontSize: 'clamp(15px, 3.5vw, 18px)', color: '#F7F3EA', lineHeight: 1.55, fontWeight: 400 }}>
              Zelfstandig thuisverpleegkundige worden in Vlaanderen — de documenten, de volgorde en de fouten die je duizenden euro&apos;s kosten.
            </p>
            <p style={{ margin: '0 0 28px', fontSize: 13, color: 'rgba(247,243,234,0.65)' }}>
              Door twee thuisverpleegkundigen die het in 2024 zelf deden.
            </p>

            {/* ── FORMULIER ── */}
            <div className="form-card" style={{ background: '#FBF8F2', borderRadius: 14, padding: '24px 22px' }}>
              {success ? (
                <div>
                  <p style={{ fontSize: 22, margin: '0 0 12px', fontFamily: 'Georgia, serif', color: '#2A3D2E', fontWeight: 700 }}>✓ Check je mailbox!</p>
                  <p style={{ fontSize: 15, color: '#3A3A33', lineHeight: 1.6, margin: '0 0 20px' }}>
                    Je Opstartcheck is onderweg (ook je spammap even checken).
                  </p>
                  <div style={{ borderTop: '1px solid #E8E3D8', paddingTop: 20 }}>
                    <p style={{ fontSize: 14, color: '#3A3A33', margin: '0 0 6px', fontWeight: 600 }}>Wil je het volledige stappenplan?</p>
                    <p style={{ fontSize: 13, color: '#6E6B62', margin: '0 0 14px', lineHeight: 1.55 }}>
                      De gids kost nu €50 in plaats van €85 — met 30 dagen geld-terug-garantie.
                    </p>
                    <a
                      href="/#wachtlijst"
                      style={{ display: 'inline-block', background: '#2A3D2E', color: '#E8D08A', borderRadius: 8, padding: '12px 20px', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}
                    >
                      Bekijk de volledige gids →
                    </a>
                  </div>
                </div>
              ) : formBlock}
            </div>
          </div>
        </section>

        {/* ── INHOUD VAN DE CHECK ── */}
        <section style={{ padding: '48px 20px', maxWidth: 580, margin: '0 auto' }}>
          <p style={{ fontSize: 11, color: '#B65436', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, margin: '0 0 8px' }}>WAT ZIT ERIN</p>
          <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontFamily: 'Georgia, serif', color: '#1A1A17', margin: '0 0 28px', lineHeight: 1.3 }}>
            Drie stappen die de meeste starters overslaan
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              {
                num: '01',
                title: 'Ken je vertrekpunt',
                text: 'Student of al in loondienst — dat bepaalt je volgorde én je statuten. En waarom een eenmanszaak voor 90% van de starters de slimste keuze is.',
              },
              {
                num: '02',
                title: 'Documenten in de juiste volgorde',
                text: 'Visum, RIZIV-nummer, KBO, sociaal verzekeringsfonds, zakelijke rekening. Eén stap in de verkeerde volgorde = maanden vertraging.',
              },
              {
                num: '03',
                title: 'De drie dure fouten',
                text: 'Fouten die startende thuisverpleegkundigen €300, €1.000 en €800 per jaar kosten — en hoe je ze vermijdt.',
              },
            ].map(item => (
              <div key={item.num} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#B65436', fontWeight: 700, minWidth: 24, paddingTop: 3 }}>{item.num}</div>
                <div>
                  <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: 15, color: '#1A1A17' }}>{item.title}</p>
                  <p style={{ margin: 0, fontSize: 14, color: '#6E6B62', lineHeight: 1.6 }}>{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── AUTEURS ── */}
        <section style={{ background: '#F7F3EA', padding: '36px 20px', borderTop: '1px solid #E8E3D8', borderBottom: '1px solid #E8E3D8' }}>
          <div style={{ maxWidth: 580, margin: '0 auto' }}>
            <p style={{ fontSize: 11, color: '#B65436', textTransform: 'uppercase', letterSpacing: '0.14em', fontWeight: 700, margin: '0 0 8px' }}>WIE SCHREEF DIT</p>
            <p style={{ fontSize: 15, color: '#3A3A33', lineHeight: 1.7, margin: 0 }}>
              <strong style={{ color: '#1A1A17' }}>Pieter Vanermen &amp; Jonas Piron</strong> zijn zelfstandig thuisverpleegkundigen bij Domus Care in Antwerpen.
              Ze startten in 2024 en documenteerden elke stap — inclusief de fouten die hen geld kosten.
              De Opstartcheck is de samenvatting die ze zichzelf hadden willen geven op dag één.
            </p>
          </div>
        </section>

        {/* ── TWEEDE FORMULIER (onder de vouw) ── */}
        <section style={{ padding: '48px 20px', maxWidth: 540, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(20px, 5vw, 26px)', fontFamily: 'Georgia, serif', color: '#1A1A17', margin: '0 0 8px', lineHeight: 1.3 }}>
            Gratis meedenken?
          </h2>
          <p style={{ fontSize: 15, color: '#6E6B62', margin: '0 0 24px', lineHeight: 1.6 }}>
            Laat je e-mail achter en we sturen je de Opstartcheck direct toe.
          </p>
          {!success && (
            <div style={{ background: '#FBF8F2', border: '1px solid #E8E3D8', borderRadius: 14, padding: '24px 22px' }}>
              {formBlock}
            </div>
          )}
          {success && (
            <p style={{ fontSize: 15, color: '#2A3D2E', fontWeight: 600 }}>✓ Check je mailbox — je Opstartcheck is onderweg!</p>
          )}
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: '1px solid #E8E3D8', padding: '24px 20px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: '#8A9588', margin: 0 }}>
            © {new Date().getFullYear()} startthuisverpleging.be — Domus Care ·{' '}
            <a href="/privacy" style={{ color: '#8A9588' }}>Privacy</a> ·{' '}
            <a href="/voorwaarden" style={{ color: '#8A9588' }}>Voorwaarden</a>
          </p>
        </footer>
      </main>
    </>
  )
}

// ─── Gedeelde stijlen ─────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 700,
  color: '#6E6B62',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 6,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid #D8D0C0',
  borderRadius: 8,
  fontSize: 15,
  background: '#fff',
  color: '#1A1A17',
  fontFamily: 'inherit',
  outline: 'none',
  marginBottom: 4,
}
