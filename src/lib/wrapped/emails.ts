// Zorg Wrapped e-mailtemplates — volledig los van de startthuisverpleging.be nurture
import { createHmac } from 'crypto'
import { REKENVOORBEELD } from './rekenvoorbeeld'

const SECRET   = process.env.UNSUBSCRIBE_SECRET ?? 'fallback-change-in-production'
const SITE_URL = 'https://www.startthuisverpleging.be'
const BASE_URL = process.env.NEXTAUTH_URL ?? 'https://startthuisverpleging.be'

export function buildWrappedUnsubscribeUrl(email: string): string {
  const token   = createHmac('sha256', SECRET).update(email.toLowerCase().trim()).digest('hex')
  const encoded = Buffer.from(email.toLowerCase().trim()).toString('base64url')
  return `${BASE_URL}/api/wrapped/unsubscribe?e=${encoded}&t=${token}`
}

export function verifyWrappedUnsubscribeToken(email: string, token: string): boolean {
  try {
    const expected = createHmac('sha256', SECRET).update(email.toLowerCase().trim()).digest('hex')
    return expected === token
  } catch {
    return false
  }
}

// ─── Gedeelde bouw-helpers ────────────────────────────────────────────────────

function p(text: string): string {
  return `<p style="font-size:15px;color:#3A3A33;line-height:1.7;margin:0 0 16px;">${text}</p>`
}

function ctaButton(url: string, label: string): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr>
        <td style="background:#1C2A20;border-radius:10px;padding:14px 28px;">
          <a href="${url}" style="color:#E8D08A;font-size:16px;font-weight:700;text-decoration:none;display:block;text-align:center;">${label}</a>
        </td>
      </tr>
    </table>`
}

function wrap(headerTitle: string, body: string, unsubUrl: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1ECE0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE0;padding:32px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#FBF8F2;border-radius:14px;overflow:hidden;max-width:100%;">
        <tr>
          <td style="background:#1C2A20;padding:28px 32px;">
            <p style="margin:0;font-size:11px;color:rgba(232,208,138,0.7);text-transform:uppercase;letter-spacing:0.14em;font-weight:600;">Zorg Wrapped 2026</p>
            <p style="margin:8px 0 0;font-size:22px;color:#E8D08A;font-weight:800;line-height:1.3;">${headerTitle}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 24px;">
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 32px 26px;border-top:1px solid #E8E3D8;">
            <p style="font-size:12px;color:#8A9588;margin:0;line-height:1.6;">
              Je ontvangt deze mail omdat je je e-mailadres achterliet via zorgwrapped.be.<br>
              <a href="${unsubUrl}" style="color:#8A9588;text-decoration:underline;">Uitschrijven</a>
              &nbsp;·&nbsp;
              <a href="mailto:hallo@startthuisverpleging.be" style="color:#8A9588;">hallo@startthuisverpleging.be</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ─── Rijregel voor financieel overzicht ───────────────────────────────────────

function rij(label: string, waarde: string | null, plus = false): string {
  const kleur = plus ? '#1C2A20' : '#3A3A33'
  const tekst = waarde == null ? '<em style="color:#9A9A90;">volgt binnenkort</em>' : waarde
  return `
    <tr>
      <td style="padding:8px 0;font-size:14px;color:#5A5A53;border-bottom:1px solid #E8E3D8;">${label}</td>
      <td style="padding:8px 0;font-size:15px;font-weight:700;color:${kleur};text-align:right;border-bottom:1px solid #E8E3D8;">${tekst}</td>
    </tr>`
}

function fmt(n: number | null): string | null {
  if (n == null) return null
  return '€ ' + n.toLocaleString('nl-BE')
}

// ─── Email 1 — Bevestiging + cijfers ─────────────────────────────────────────

export function buildEmail1(unsubUrl: string): { subject: string; preheader: string; html: string } {
  const body = `
    ${p('Bedankt voor je vertrouwen. Hieronder vind je de echte cijfers van ons eerste jaar als zelfstandig thuisverpleegkundige — ongefilterd.')}

    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td style="padding:4px 0;font-size:11px;color:#8A9588;text-transform:uppercase;letter-spacing:0.1em;" colspan="2">
          ${REKENVOORBEELD.wie} · ${REKENVOORBEELD.periode}
        </td>
      </tr>
      ${rij('RIZIV-omzet',         fmt(REKENVOORBEELD.omzet),              true)}
      ${rij('Kosten (geschat)',     REKENVOORBEELD.kosten   != null ? `- ${fmt(REKENVOORBEELD.kosten)}`   : null)}
      ${rij('Sociale bijdragen',   REKENVOORBEELD.socialeBijdragen != null ? `- ${fmt(REKENVOORBEELD.socialeBijdragen)}` : null)}
      ${rij('Personenbelasting',   REKENVOORBEELD.belastingen != null ? `- ${fmt(REKENVOORBEELD.belastingen)}` : null)}
      <tr>
        <td style="padding:12px 0 4px;font-size:15px;font-weight:700;color:#1C2A20;">Overgebleven</td>
        <td style="padding:12px 0 4px;font-size:20px;font-weight:800;color:#1C2A20;text-align:right;">
          ${REKENVOORBEELD.overgebleven != null ? fmt(REKENVOORBEELD.overgebleven) : '<em style="font-size:14px;font-weight:400;color:#9A9A90;">volgt binnenkort</em>'}
        </td>
      </tr>
    </table>

    <p style="font-size:13px;color:#8A9588;line-height:1.6;margin:0 0 24px;font-style:italic;">&ldquo;${REKENVOORBEELD.opmerking}&rdquo;</p>

    ${p('<strong>Dit is één echt voorbeeld, geen belofte.</strong> Wat jij overhoudt, hangt af van je regio, uren, patiënten en gezinssituatie. Laat je situatie altijd nakijken door een boekhouder.')}

    <p style="font-size:15px;color:#3A3A33;line-height:1.7;margin:0;">— Pieter &amp; Jonas, oprichters Domus Care</p>

    ${ctaButton(`${SITE_URL}`, 'Bekijk het volledige stappenplan →')}
  `
  return {
    subject:   'De cijfers van ons eerste jaar als zelfstandig thuisverpleegkundige',
    preheader: `RIZIV-omzet ${fmt(REKENVOORBEELD.omzet) ?? '—'} in ${REKENVOORBEELD.periode}. Alle details hieronder.`,
    html:      wrap('De cijfers van ons eerste jaar', body, unsubUrl),
  }
}

// ─── Email 2 — Dag 3: het stappenplan ────────────────────────────────────────

export function buildEmail2(unsubUrl: string): { subject: string; preheader: string; html: string } {
  const body = `
    ${p('De meeste verpleegkundigen die zelfstandig willen starten, wachten te lang. Niet omdat ze niet willen — maar omdat ze niet weten <em>waar</em> te beginnen.')}

    ${p('Wij hebben het zelf meegemaakt. Pieter begon van nul, zonder netwerk, zonder patiënten. Hieronder de volgorde die hij zou herhalen:')}

    <ol style="font-size:15px;color:#3A3A33;line-height:1.8;margin:0 0 20px;padding-left:20px;">
      <li>RIZIV-visum aanvragen (lang wachten, doe dit eerst)</li>
      <li>Boekhouder kiezen die zelfstandige verpleegkundigen kent</li>
      <li>Verzekering burgerlijke aansprakelijkheid afsluiten</li>
      <li>Eerste patiënten: via wachtlijsten of instappen in een bestaande groep</li>
    </ol>

    ${p('In het stappenplan op onze website staat elke stap uitgewerkt — met de exacte documenten, de contactgegevens en de partners die je geld besparen.')}

    <p style="font-size:15px;color:#3A3A33;line-height:1.7;margin:0;">— Pieter &amp; Jonas</p>

    ${ctaButton(`${SITE_URL}`, 'Bekijk het stappenplan →')}
  `
  return {
    subject:   'Van Zorg Wrapped naar écht zelfstandig — de eerste 4 stappen',
    preheader: 'De volgorde die Pieter zou herhalen, inclusief de fouten die hij zou overslaan.',
    html:      wrap('De eerste 4 stappen', body, unsubUrl),
  }
}

// ─── Email 3 — Dag 7: zachte CTA ─────────────────────────────────────────────

export function buildEmail3(unsubUrl: string): { subject: string; preheader: string; html: string } {
  const body = `
    ${p('Een week geleden vulde jij je Zorg Wrapped in. Je zag je nachten, je weekends, je stappen.')}

    ${p('Eén vraag: heb je er al aan gedacht wat al die uren zouden opbrengen als je ze voor jezelf werkte?')}

    ${p('We helpen je graag verder. Of je nu twijfelt, concrete vragen hebt, of gewoon wil weten wat er in jouw regio mogelijk is — op onze website vind je alle informatie om de stap te zetten.')}

    <p style="font-size:15px;color:#3A3A33;line-height:1.7;margin:0;">— Pieter &amp; Jonas</p>

    ${ctaButton(`${SITE_URL}`, 'Ik wil meer weten →')}
  `
  return {
    subject:   'Wat als al die uren voor jezelf waren?',
    preheader: 'Jouw nachten, weekends en stappen — en wat ze waard zijn als zelfstandige.',
    html:      wrap('Wat als al die uren voor jezelf waren?', body, unsubUrl),
  }
}
