// Echte cijfers van Pieter Vanermen — eerste volledige periode als zelfstandig thuisverpleegkundige
// Controleer belastingen en overgebleven met de boekhouder vóór publicatie.
// Zolang een waarde null is, wordt dit scherm niet getoond in de tool.
export const REKENVOORBEELD = {
  wie: 'Pieter, zelfstandig thuisverpleegkundige — Domus Care, Antwerpen',
  periode: 'september 2024 – mei 2025 (9 maanden)',
  statuut: 'eenmanszaak' as const,
  regio: 'Antwerpen',
  urenPerWeek: 35,          // ~150 uur/maand bij volle ronde
  patientenPerDag: 18,      // 17–20 patiënten per dag bij volle ronde
  omzet: 83910,             // RIZIV-omzet sept 2024 – mei 2025 (excl. remgeld — nakijken of remgeld erbij moet)
  kosten: 20250,            // schatting: €2.000–2.500/maand × 9 maanden
  socialeBijdragen: 13050,   // 20,5% van netto winst (tarief zelfstandige hoofdberoep 2024) — boekhouder bevestigt definitief bedrag
  belastingen: 15444,        // personenbelasting eenmanszaak 2024 (progressieve schijven na aftrek sociale bijdragen + belastingvrije som) — kan verschillen op basis van persoonlijke situatie
  overgebleven: 35166,       // netto winst - sociale bijdragen - belasting
  vergelijking: null as number | null,       // optioneel: netto loon ziekenhuis voor dezelfde uren
  opmerking: 'De eerste drie maanden waren rustiger omdat ik volledig van nul begon. Een andere route is instappen in een bestaande groep met patiënten — maar je geeft dan 15% van je omzet af. Let op: de belasting- en bijdragecijfers zijn schattingen — jouw persoonlijke situatie (partner, kinderen, aftrekposten) kan het bedrag beïnvloeden.',
}
