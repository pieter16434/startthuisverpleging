import Link from 'next/link'

export const metadata = {
  title: 'Terugbetalingsbeleid — startthuisverpleging',
}

export default function TerugbetalingPage() {
  return (
    <main style={{ fontFamily: 'Georgia, serif', maxWidth: 720, margin: '0 auto', padding: '60px 24px', color: '#1A1A17', lineHeight: 1.7 }}>
      <Link href="/" style={{ color: '#B65436', fontSize: 14, textDecoration: 'none' }}>← Terug naar de startpagina</Link>

      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, marginTop: 32, marginBottom: 8 }}>Terugbetalingsbeleid</h1>
      <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 40 }}>Laatste update: juni 2026</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>30 dagen tevredenheidsgarantie</h2>
      <p>
        Wij geloven sterk in de kwaliteit van onze gids. Indien u niet tevreden bent, kunt u binnen <strong>30 dagen na aankoop</strong> een volledige terugbetaling aanvragen — zonder vragen.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>Hoe een terugbetaling aanvragen?</h2>
      <ol style={{ paddingLeft: 20, marginTop: 8 }}>
        <li>Stuur een e-mail naar <a href="mailto:hallo@startthuisverpleging.be" style={{ color: '#B65436' }}>hallo@startthuisverpleging.be</a></li>
        <li>Vermeld het e-mailadres waarmee u besteld heeft</li>
        <li>Geef kort aan wat u verwacht had maar niet vond</li>
      </ol>
      <p style={{ marginTop: 12 }}>
        Wij verwerken de terugbetaling binnen <strong>5 werkdagen</strong>. Het bedrag wordt teruggestort op de originele betaalmethode.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>Wettelijk herroepingsrecht</h2>
      <p>
        Conform artikel VI.53, 13° van het Belgisch Wetboek van Economisch Recht is het wettelijke herroepingsrecht niet van toepassing op digitale inhoud die onmiddellijk wordt geleverd na aankoop. De bovenvermelde 30 dagen garantie is een <strong>vrijwillige aanvulling</strong> bovenop de wettelijke bepalingen.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>Uitzonderingen</h2>
      <p>
        Een terugbetaling is niet mogelijk indien er misbruik vastgesteld wordt (bv. doorverkoop of het openbaar maken van de inhoud).
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>Contact</h2>
      <p>
        Vragen? Stuur een e-mail naar <a href="mailto:hallo@startthuisverpleging.be" style={{ color: '#B65436' }}>hallo@startthuisverpleging.be</a>. Wij reageren doorgaans binnen 1 werkdag.
      </p>

      <hr style={{ marginTop: 48, borderColor: '#D8D0C0' }} />
      <p style={{ fontSize: 13, color: '#6E6B62', marginTop: 16 }}>
        <Link href="/voorwaarden" style={{ color: '#B65436' }}>Algemene voorwaarden</Link> · <Link href="/privacy" style={{ color: '#B65436' }}>Privacybeleid</Link>
      </p>
    </main>
  )
}
