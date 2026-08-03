import Link from 'next/link'

export const metadata = {
  title: 'Algemene voorwaarden — startthuisverpleging',
}

export default function VoorwaardenPage() {
  return (
    <main style={{ fontFamily: 'Georgia, serif', maxWidth: 720, margin: '0 auto', padding: '60px 24px', color: '#1A1A17', lineHeight: 1.7 }}>
      <Link href="/" style={{ color: '#B65436', fontSize: 14, textDecoration: 'none' }}>← Terug naar de startpagina</Link>

      <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 32, marginTop: 32, marginBottom: 8 }}>Algemene voorwaarden</h1>
      <p style={{ color: '#6E6B62', fontSize: 14, marginBottom: 40 }}>Laatste update: juni 2026</p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>1. Identificatie van de verkoper</h2>
      <p>
        <strong>Vitalion Ascent BV</strong><br />
        Rechtsvorm: Besloten vennootschap (BV)<br />
        Handelend onder de naam <em>startthuisverpleging</em><br />
        Maatschappelijke zetel: Elfenbergstraat 31, 3511 Kuringen<br />
        Ondernemingsnummer: BE 1023.728.595<br />
        E-mail: <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a><br />
        Website: <a href="https://startthuisverpleging.be" style={{ color: '#B65436' }}>startthuisverpleging.be</a>
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>2. Aanbod en product</h2>
      <p>
        startthuisverpleging biedt één digitaal product aan:
      </p>
      <ul style={{ paddingLeft: 20, marginTop: 8 }}>
        <li><strong>Gids: Zelfstandig thuisverpleegkundige worden in Vlaanderen</strong> — een digitale PDF-gids (introductieprijs € 50,00 incl. btw; normaal € 85,00)</li>
      </ul>
      <p style={{ marginTop: 12 }}>
        Na succesvolle betaling ontvangt de koper de gids per e-mail als downloadlink. Het gaat om een digitaal product — er wordt geen fysiek exemplaar verzonden.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>3. Prijs</h2>
      <p>
        Alle prijzen zijn vermeld in euro en inclusief btw. De prijs op het moment van bestelling is de definitieve prijs.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>4. Betaling</h2>
      <p>
        Betalingen verlopen via <strong>Mollie</strong>, een erkende betaaldienstaanbieder. Beschikbare betaalmethoden: Bancontact, Visa, Mastercard. De bestelling wordt pas bevestigd na succesvolle betaling.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>5. Levering</h2>
      <p>
        Na bevestiging van de betaling ontvangt de koper automatisch een e-mail met de downloadlink. Dit gebeurt doorgaans binnen de 5 minuten. Bij problemen: neem contact op via <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a>.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>6. Herroepingsrecht en terugbetaling</h2>
      <p>
        Conform artikel VI.53, 13° van het Wetboek van Economisch Recht is het herroepingsrecht <strong>uitgesloten</strong> voor digitale inhoud die niet op een materiële drager wordt geleverd, mits cumulatief voldaan is aan de volgende voorwaarden:
      </p>
      <ol style={{ paddingLeft: 20, marginTop: 8, lineHeight: 1.7 }}>
        <li>de consument heeft vóór de aankoop uitdrukkelijk verzocht de uitvoering te starten vóór het verstrijken van de herroepingstermijn;</li>
        <li>de consument heeft erkend daarmee zijn herroepingsrecht te verliezen;</li>
        <li>Vitalion Ascent BV heeft deze bevestiging verstrekt per e-mail (conform art. VI.46, §7 WER).</li>
      </ol>
      <p style={{ marginTop: 12 }}>
        Bij elke bestelling via startthuisverpleging wordt uitdrukkelijk om instemming gevraagd via een verplicht aankruisvakje. De bevestigingsmail herneemt deze erkenning. Aan alle drie voorwaarden is voldaan.
      </p>
      <p style={{ marginTop: 12 }}>
        Onverminderd het voorgaande biedt startthuisverpleging vrijwillig een <strong>30 dagen tevredenheidsgarantie</strong> aan. Meer info: <Link href="/terugbetaling" style={{ color: '#B65436' }}>terugbetalingsbeleid</Link>.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>7. Intellectuele eigendom</h2>
      <p>
        De gids is auteursrechtelijk beschermd. Het is niet toegestaan de inhoud te kopiëren, door te sturen, te verkopen of openbaar te maken zonder schriftelijke toestemming van Vitalion Ascent BV.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>8. Aansprakelijkheid</h2>
      <p>
        De informatie in de gids is met de grootst mogelijke zorg samengesteld door ervaren verpleegkundigen. startthuisverpleging is niet aansprakelijk voor beslissingen die de koper neemt op basis van de inhoud. Raadpleeg bij twijfel een erkend adviseur.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>9. Toepasselijk recht</h2>
      <p>
        Deze voorwaarden worden beheerst door het Belgisch recht. Bij geschillen is de rechtbank van het gerechtelijk arrondissement van de maatschappelijke zetel bevoegd.
      </p>

      <h2 style={{ fontSize: 18, marginTop: 32, marginBottom: 8 }}>10. Contact</h2>
      <p>
        Voor vragen over je bestelling of deze voorwaarden: <a href="mailto:info@domuscare.be" style={{ color: '#B65436' }}>info@domuscare.be</a>
      </p>

      <hr style={{ marginTop: 48, borderColor: '#D8D0C0' }} />
      <p style={{ fontSize: 13, color: '#6E6B62', marginTop: 16 }}>
        <Link href="/privacy" style={{ color: '#B65436' }}>Privacybeleid</Link> · <Link href="/terugbetaling" style={{ color: '#B65436' }}>Terugbetalingsbeleid</Link>
      </p>
    </main>
  )
}
