// Alle teksten van Zorg Wrapped op één plek — Pieter kan deze aanpassen
// zonder andere code te raken.

export const COPY = {
  // ─── Startscherm ──────────────────────────────────────────────────────────
  startTitel:   'Jouw jaar in de zorg, in 90 seconden.',
  startSubtekst: 'Nachten, weekends, kilometers. Tijd dat iemand het eens optelt.',
  startKnop:    'Start mijn Zorg Wrapped',
  startTellerSuffix: 'collega\'s maakten de hunne al.',

  // ─── Laadscherm ───────────────────────────────────────────────────────────
  laadRegels: [
    'We tellen je nachten…',
    'We meten je kilometers…',
    'We zoeken je superkracht…',
  ] as const,

  // ─── Slide 8 (deelkaart) ─────────────────────────────────────────────────
  slide8Footer: 'zorgwrapped.be · maak de jouwe',
  headerLabel:  'Zorg Wrapped 2026',

  // ─── Deelknoppen ──────────────────────────────────────────────────────────
  deelKnopHoofd:      'Deel in je story',
  deelBijschrift:     'Mijn jaar in de zorg 💙 Wat is jouw superkracht? #ZorgWrapped',
  deelBijschriftKnop: 'Kopieer bijschrift',
  deelLinkToast:      'Link gekopieerd, plak hem als link-sticker in je story.',
  deelWhatsApp:       'Ik heb mijn jaar in de zorg laten optellen. Durf jij? 👉 ',

  // ─── Pluim ────────────────────────────────────────────────────────────────
  pluimOproep:      'Wie verdient dit jaar een pluim? Geef een collega haar superkracht.',
  pluimBerichtMal:  (van: string, superkracht: string, link: string) =>
    `${van} gaf jou de superkracht "${superkracht}" 💙 Maak je eigen Zorg Wrapped: ${link}`,

  // ─── Rekenvoorbeeld ───────────────────────────────────────────────────────
  rekenvoorbeeldIntro: 'Er is één vraag die je collega\'s niet hardop durven stellen: wat blijft er over als je zelfstandig start? Wij tonen je ons échte eerste jaar, met alle cijfers.',
  rekenvoorbeeldDisclaimer: 'Dit is één echt voorbeeld, geen belofte. Wat jij overhoudt, hangt af van je regio, je uren, je patiënten, je statuut, je kosten en je gezinssituatie. Laat je persoonlijke situatie altijd nakijken door een boekhouder.',
  rekenvoorbeeldCta:  'Hoe wij het aanpakten, stap voor stap → het stappenplan',

  // ─── E-mailveld (voor rekenvoorbeeld) ────────────────────────────────────
  emailLabel:         'E-mailadres',
  emailPlaceholder:   'jouw@email.be',
  consentTekst:       'Ja, stuur mij het rekenvoorbeeld en tips om zelfstandig te starten. Afmelden kan altijd.',
  rekenvoorbeeldKnop: 'Toon het rekenvoorbeeld',
  privacyLink:        '/privacy',

  // ─── Footer elk scherm ────────────────────────────────────────────────────
  footerTekst: 'Een initiatief van Pieter & Jonas, verpleegkundigen en oprichters van Domus Care.',

  // ─── Mini-reacties na antwoorden ──────────────────────────────────────────
  miniReacties: {
    nachtenVeel:     'Respect. Echt.',
    nachtenNul:      'Een dagmens! Ook daar is moed voor nodig.',
    weekendsVeel:    'Zoveel zaterdagen?! Je familie mist je.',
    patientenVeel:   'Hoe doe je dat met twee handen?',
    stappenIngevuld: 'Je smartwatch is trots op je.',
    stappenOvergeslagen: 'Geen probleem, we tellen de rest.',
    superkrachtGekozen:  'Wist het wel.',
  },

  // ─── Superkracht-vraag ────────────────────────────────────────────────────
  superkrachtVraag: 'Kies je superkracht. Kies goed, deze komt op je kaart.',

  // ─── Slide-teksten (ziekenhuis) ───────────────────────────────────────────
  slide1ZiekenhuisTitel: (naam: string | null) =>
    naam ? `${naam}, dit was jouw 2026 in de zorg.` : 'Dit was jouw 2026 in de zorg.',

  slide2NachtenTitel: (uren: number) =>
    `${uren} uur wakker terwijl Vlaanderen sliep.`,

  slide3WeekendsTitel: (deel: string) =>
    `Je ${deel} van je zaterdagen gaf je weg aan anderen.`,

  slide4PatientenTitel: (n: number) =>
    `Ongeveer ${n.toLocaleString('nl-BE')} keer rekende iemand op jou.`,

  slide5KilometersTitel: (km: number, label: string) =>
    `Je wandelde ongeveer ${km.toLocaleString('nl-BE')} km op de gang. Dat is ${label}.`,

  slide7TribeTekst: (n: number, provincie: string) =>
    n >= 20
      ? `Je bent één van ${n.toLocaleString('nl-BE')} ${provincie} verpleegkundigen die hun jaar vierden.`
      : `Je hoort bij de eersten in ${provincie} die hun jaar vierden.`,

  // ─── Slide-teksten (student) ──────────────────────────────────────────────
  slide1StudentTitel: (naam: string | null) =>
    naam ? `${naam}, dit was jouw stagejaar.` : 'Dit was jouw stagejaar.',

  slide2StudentUrenTitel: (uur: number) =>
    `${uur} uur stage. Dat zijn ${Math.round(uur / 8)} volle werkdagen voor je diploma.`,

  slide3StudentPlaatsenTitel: (n: number) =>
    `${n} stageplaats${n === 1 ? '' : 'en'}. ${n} team${n === 1 ? '' : 's'} die jou iets leerden.`,

  slide7StudentTribeTekst: (n: number, hogeschool: string) =>
    n >= 20
      ? `Je bent één van ${n.toLocaleString('nl-BE')} studenten van ${hogeschool} die hun jaar vierden.`
      : `Je hoort bij de eersten van ${hogeschool} die hun jaar vierden.`,
} as const
