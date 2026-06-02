export default function SuccessPage() {
  return (
    <main style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F1ECE0',
      fontFamily: '"Bricolage Grotesque", sans-serif',
      padding: '40px 24px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '24px' }}>✓</div>
      <h1 style={{
        fontFamily: '"Fraunces", Georgia, serif',
        fontSize: '2rem',
        color: '#2A3D2E',
        marginBottom: '16px',
        fontWeight: 400,
      }}>
        Betaling geslaagd!
      </h1>
      <p style={{ color: '#3A3A33', fontSize: '1.1rem', maxWidth: '480px', lineHeight: 1.6 }}>
        Bedankt voor je aankoop. Je gids wordt zo snel mogelijk naar{' '}
        <strong>je e-mailadres</strong> gestuurd. Check ook je spam-map.
      </p>
      <p style={{ color: '#6E6B62', marginTop: '24px', fontSize: '0.9rem' }}>
        Vragen? Mail ons op{' '}
        <a href="mailto:hallo@startthuisverpleging.be" style={{ color: '#B65436' }}>
          hallo@startthuisverpleging.be
        </a>
      </p>
      <a href="/" style={{
        marginTop: '40px',
        display: 'inline-block',
        padding: '14px 28px',
        background: '#B65436',
        color: '#F7F3EA',
        borderRadius: '100px',
        textDecoration: 'none',
        fontSize: '0.95rem',
        fontWeight: 500,
      }}>
        ← Terug naar de website
      </a>
    </main>
  )
}
