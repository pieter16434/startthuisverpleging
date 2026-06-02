export default function CancelledPage() {
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
      <div style={{ fontSize: '48px', marginBottom: '24px' }}>←</div>
      <h1 style={{
        fontFamily: '"Fraunces", Georgia, serif',
        fontSize: '2rem',
        color: '#2A3D2E',
        marginBottom: '16px',
        fontWeight: 400,
      }}>
        Betaling geannuleerd
      </h1>
      <p style={{ color: '#3A3A33', fontSize: '1.1rem', maxWidth: '480px', lineHeight: 1.6 }}>
        Geen probleem — je bent niets verschuldigd. Je kan het altijd opnieuw proberen.
      </p>
      <a href="/" style={{
        marginTop: '40px',
        display: 'inline-block',
        padding: '14px 28px',
        background: '#2A3D2E',
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
