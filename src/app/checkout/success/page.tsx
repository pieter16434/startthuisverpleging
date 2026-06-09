export default function SuccessPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#F1ECE0',
      fontFamily: '"Bricolage Grotesque", system-ui, sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>

        {/* Check icoon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#2A3D2E', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 28px',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8D08A" strokeWidth="2.5">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        {/* Titel */}
        <h1 style={{
          fontFamily: 'Georgia, serif', fontSize: 30, color: '#1A1A17',
          fontWeight: 400, marginBottom: 12,
        }}>
          Betaling geslaagd!
        </h1>
        <p style={{ color: '#3A3A33', fontSize: 17, lineHeight: 1.6, marginBottom: 28, maxWidth: 420, margin: '0 auto 28px' }}>
          Bedankt voor je aankoop. Je ontvangt dadelijk een bevestigingsmail.
          Daarna sturen we je gids zo snel mogelijk door.
        </p>

        {/* Info blok */}
        <div style={{
          background: '#FBF8F2', border: '1px solid #D8D0C0', borderRadius: 14,
          padding: '24px 28px', marginBottom: 28, textAlign: 'left',
        }}>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6E6B62', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 600 }}>
            Wat nu?
          </p>
          {[
            { icon: '📧', text: 'Je krijgt een bevestigingsmail op het adres dat je invulde.' },
            { icon: '📄', text: 'Zodra jouw gids klaar is sturen we de downloadlink door. Dit duurt normaal niet lang.' },
            { icon: '🛡️', text: '30 dagen geld-terug-garantie. Geen vragen, geen gedoe.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 2 ? 14 : 0, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <p style={{ margin: 0, fontSize: 15, color: '#3A3A33', lineHeight: 1.5 }}>{item.text}</p>
            </div>
          ))}
        </div>

        <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 24 }}>
          Vragen? Mail ons op{' '}
          <a href="mailto:hallo@startthuisverpleging.be" style={{ color: '#B65436' }}>
            hallo@startthuisverpleging.be
          </a>
        </p>

        <a href="/" style={{
          display: 'inline-block', padding: '13px 28px',
          background: '#2A3D2E', color: '#F7F3EA', borderRadius: 100,
          textDecoration: 'none', fontSize: 15, fontWeight: 600,
        }}>
          ← Terug naar de website
        </a>
      </div>
    </main>
  )
}
