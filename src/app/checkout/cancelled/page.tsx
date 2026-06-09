export default function CancelledPage() {
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
      <div style={{ width: '100%', maxWidth: 480, textAlign: 'center' }}>

        {/* Icoon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#F1ECE0', border: '2px solid #D8D0C0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px', fontSize: 32,
        }}>
          ↩
        </div>

        <h1 style={{
          fontFamily: 'Georgia, serif', fontSize: 28, color: '#1A1A17',
          fontWeight: 400, marginBottom: 12,
        }}>
          Betaling geannuleerd
        </h1>
        <p style={{ color: '#3A3A33', fontSize: 17, lineHeight: 1.6, marginBottom: 32, maxWidth: 380, margin: '0 auto 32px' }}>
          Geen probleem — je bent niets verschuldigd en er is niets afgeschreven.
          Je kan het altijd opnieuw proberen.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Opnieuw proberen */}
          <a href="/#wachtlijst" style={{
            display: 'inline-block', padding: '13px 24px',
            background: '#B65436', color: '#fff', borderRadius: 100,
            textDecoration: 'none', fontSize: 15, fontWeight: 600,
          }}>
            Opnieuw proberen →
          </a>

          {/* Terug */}
          <a href="/" style={{
            display: 'inline-block', padding: '13px 24px',
            background: 'transparent', color: '#3A3A33',
            border: '1.5px solid #D8D0C0', borderRadius: 100,
            textDecoration: 'none', fontSize: 15, fontWeight: 500,
          }}>
            ← Terug naar de website
          </a>
        </div>

        <p style={{ marginTop: 28, color: '#6E6B62', fontSize: 14 }}>
          Liever via mail betalen of een vraag?{' '}
          <a href="mailto:hallo@startthuisverpleging.be" style={{ color: '#B65436' }}>
            Contacteer ons
          </a>
        </p>
      </div>
    </main>
  )
}
