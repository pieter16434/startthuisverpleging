import Link from 'next/link'

export const metadata = {
  title: 'Privacybeleid — startthuisverpleging',
}

export default function PrivacyPage() {
  return (
    <main style={{ fontFamily: 'Georgia, serif', maxWidth: 720, margin: '0 auto', padding: '60px 24px', color: '#1A1A17', lineHeight: 1.7 }}>
      <Link href="/" style={{ color: '#B65436', fontSize: 14, textDecoration: 'none' }}>← Terug naar de startpagina</Link>

      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, marginTop: 32, marginBottom: 8 }}>Privacybeleid</h1>
      <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 40 }}>Laatste update: juni 2026</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>1. Verantwoordelijke voor de verwerking</h2>
      <p>
        <strong>Vitalion Ascent BV</strong>, handelend onder de naam <em>startthuisverpleging</em><br />
        E-mail: <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a>
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>2. Welke gegevens verzamelen wij?</h2>
      <p>Bij een aankoop verzamelen wij:</p>
      <ul style={{ paddingLeft: 20, marginTop: 8 }}>
        <li>Voornaam en achternaam</li>
        <li>E-mailadres</li>
        <li>Provincie (optioneel)</li>
        <li>Betalingsinformatie (verwerkt door Mollie — wij slaan geen kaartgegevens op)</li>
        <li>Marketingtoestemming (enkel indien u dat aanvinkt bij aankoop)</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>3. Waarvoor gebruiken wij uw gegevens?</h2>
      <ul style={{ paddingLeft: 20, marginTop: 8 }}>
        <li>Verwerking en bevestiging van uw bestelling</li>
        <li>Levering van het digitale product per e-mail</li>
        <li>Klantendienst en opvolging</li>
        <li>E-mailmarketing over aanbiedingen en updates (enkel indien u toestemming heeft gegeven bij aankoop)</li>
      </ul>
      <p style={{ marginTop: 12 }}>
        Wij verkopen uw gegevens <strong>nooit</strong> aan derden en gebruiken ze niet voor advertenties.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>4. Rechtsgrond</h2>
      <p>De verwerking is gebaseerd op:</p>
      <ul style={{ paddingLeft: 20, marginTop: 8 }}>
        <li><strong>Uitvoering van een overeenkomst</strong> (art. 6.1.b AVG) — voor de verwerking van uw aankoop en levering van het product</li>
        <li><strong>Toestemming</strong> (art. 6.1.a AVG) — voor e-mailmarketing. U kunt uw toestemming op elk moment intrekken via <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a> of via de uitschrijflink in onze e-mails.</li>
        <li><strong>Gerechtvaardigd belang</strong> (art. 6.1.f AVG) — voor klantencommunicatie aan bestaande klanten over gelijkaardige producten en diensten</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>5. Bewaartermijn</h2>
      <ul style={{ paddingLeft: 20, marginTop: 8 }}>
        <li><strong>Klantgegevens</strong>: bewaard zolang wettelijk vereist (minimum 7 jaar voor boekhoudkundige doeleinden)</li>
        <li><strong>Marketingtoestemming</strong>: geldig tot u zich uitschrijft of uw toestemming intrekt</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>6. Verwerkers (sub-processors)</h2>
      <ul style={{ paddingLeft: 20, marginTop: 8 }}>
        <li><strong>Supabase</strong> — databaseopslag (EU-servers)</li>
        <li><strong>Mollie</strong> — betalingsverwerking (EU, PCI-DSS gecertificeerd)</li>
        <li><strong>Resend</strong> — transactionele e-mail</li>
        <li><strong>Vercel</strong> — webhosting</li>
      </ul>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>7. Uw rechten</h2>
      <p>Op grond van de AVG hebt u recht op:</p>
      <ul style={{ paddingLeft: 20, marginTop: 8 }}>
        <li>Inzage in uw gegevens</li>
        <li>Correctie van onjuiste gegevens</li>
        <li>Verwijdering van uw gegevens (&ldquo;recht om vergeten te worden&rdquo;)</li>
        <li>Beperking van de verwerking</li>
        <li>Overdraagbaarheid van uw gegevens</li>
      </ul>
      <p style={{ marginTop: 12 }}>
        Stuur een e-mail naar <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a> om een recht uit te oefenen. Wij reageren binnen 30 dagen.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>8. Cookies</h2>
      <p>
        startthuisverpleging gebruikt geen tracking- of advertentiecookies. Er worden alleen technisch noodzakelijke cookies gebruikt voor de werking van de website.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>9. Klachten</h2>
      <p>
        U heeft het recht een klacht in te dienen bij de Belgische toezichthouder:<br />
        <strong>Gegevensbeschermingsautoriteit (GBA)</strong><br />
        <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener" style={{ color: '#B65436' }}>www.gegevensbeschermingsautoriteit.be</a>
      </p>

      <hr style={{ marginTop: 48, borderColor: '#D8D0C0' }} />
      <p style={{ fontSize: 13, color: '#6E6B62', marginTop: 16 }}>
        <Link href="/voorwaarden" style={{ color: '#B65436' }}>Algemene voorwaarden</Link> · <Link href="/terugbetaling" style={{ color: '#B65436' }}>Terugbetalingsbeleid</Link>
      </p>
    </main>
  )
}
