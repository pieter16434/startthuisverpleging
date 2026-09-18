import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend/client'
import { buildUnsubscribeUrl } from '@/lib/email/unsubscribe'

// ─── Configuratie ────────────────────────────────────────────────────────────
const SCHEDULE = [
  { step: 1, daysAfter: 2 },
  { step: 2, daysAfter: 4 },
  { step: 3, daysAfter: 6 },
] as const

const FROM = process.env.RESEND_FROM_EMAIL!
const SITE_URL = 'https://startthuisverpleging.be'

const PROVINCIE_LABELS: Record<string, string> = {
  ANT: 'Antwerpen', LIM: 'Limburg', OVL: 'Oost-Vlaanderen',
  VBR: 'Vlaams-Brabant', WVL: 'West-Vlaanderen',
}

// ─── Mail-templates ───────────────────────────────────────────────────────────
function emailFooter(unsubUrl: string) {
  return `
    <tr>
      <td style="padding:18px 32px 26px;border-top:1px solid #E8E3D8;">
        <p style="font-size:12px;color:#8A9588;margin:0;line-height:1.6;">
          Je ontvangt deze mail omdat je de Opstartcheck aanvroeg via startthuisverpleging.be.<br>
          <a href="${unsubUrl}" style="color:#8A9588;text-decoration:underline;">Uitschrijven</a>
          &nbsp;·&nbsp;
          <a href="mailto:hallo@startthuisverpleging.be" style="color:#8A9588;">hallo@startthuisverpleging.be</a>
        </p>
      </td>
    </tr>`
}

function wrapEmail(headerTitle: string, body: string, unsubUrl: string): string {
  return `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F1ECE0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE0;padding:32px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#FBF8F2;border-radius:14px;overflow:hidden;max-width:100%;">
        <tr>
          <td style="background:#2A3D2E;padding:28px 32px;">
            <p style="margin:0;font-size:13px;color:rgba(232,208,138,0.8);text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">startthuisverpleging.be</p>
            <p style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;line-height:1.3;">${headerTitle}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 24px;">
            ${body}
          </td>
        </tr>
        ${emailFooter(unsubUrl)}
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function ctaButton(url: string, label: string, primary = true): string {
  if (primary) {
    return `
    <table cellpadding="0" cellspacing="0" style="margin:24px 0 0;">
      <tr>
        <td style="background:#2A3D2E;border-radius:10px;padding:14px 28px;">
          <a href="${url}" style="color:#E8D08A;font-size:16px;font-weight:700;text-decoration:none;display:block;text-align:center;">${label}</a>
        </td>
      </tr>
    </table>`
  }
  return `
    <table cellpadding="0" cellspacing="0" style="margin:12px 0 0;">
      <tr>
        <td style="background:#F1ECE0;border:1.5px solid #2A3D2E;border-radius:10px;padding:12px 22px;">
          <a href="${url}" style="color:#2A3D2E;font-size:14px;font-weight:700;text-decoration:none;">${label}</a>
        </td>
      </tr>
    </table>`
}

function p(text: string): string {
  return `<p style="font-size:15px;color:#3A3A33;line-height:1.7;margin:0 0 16px;">${text}</p>`
}

type MailData = { subject: string; preheader: string; html: string }

function buildMail1(naam: string, unsubUrl: string): MailData {
  const body = `
    ${p(`Hoi ${naam},`)}
    ${p('Heb je de Opstartcheck al doorgenomen? Mooi.')}
    ${p('De meeste startende thuisverpleegkundigen maken één fout bij de start die hen gemiddeld <strong>€2.100 per jaar kost</strong> — en ze merken het pas bij de eerste afrekening.')}
    ${p('Het zit niet in hun tarieven. Het zit in de volgorde waarin ze hun opstart regelen: boekhouder, verzekering en RIZIV in de verkeerde volgorde aanpakken.')}
    ${p('In de volledige gids leggen we die volgorde stap voor stap uit, mét de exacte documenten en de kortingscodes bij onze partners.')}
    <p style="font-size:15px;color:#3A3A33;line-height:1.7;margin:16px 0 0;">— Pieter &amp; Jonas</p>
    ${ctaButton(`${SITE_URL}/#wachtlijst`, 'Bekijk de volledige gids → (€50)')}
  `
  return {
    subject: 'De fout die starters €2.100 per jaar kost',
    preheader: 'En hoe je hem in 10 minuten vermijdt.',
    html: wrapEmail('De fout die starters €2.100 per jaar kost', body, unsubUrl),
  }
}

function buildMail2(naam: string, provincie: string, unsubUrl: string): MailData {
  const provincieNaam = PROVINCIE_LABELS[provincie] ?? 'Vlaanderen'
  const body = `
    ${p(`Hoi ${naam},`)}
    ${p('Even eerlijk: waarom €50 betalen als er info gratis op Google staat?')}
    ${p(`Omdat die info verspreid, verouderd en niet Vlaanderen-specifiek is — en je er weken mee kwijt bent. De gids bundelt alles, actueel en op maat van <strong>${provincieNaam}</strong>.`)}
    <p style="font-size:15px;color:#3A3A33;line-height:1.7;margin:0 0 8px;">Je krijgt:</p>
    <ul style="font-size:15px;color:#3A3A33;line-height:1.8;margin:0 0 16px;padding-left:20px;">
      <li>31 pagina's stappenplan, van RIZIV tot je eerste patiënt</li>
      <li>De juiste volgorde en checklists (geen dure fouten)</li>
      <li>Persoonlijke kortingscodes bij boekhouder, verzekeraar en software — samen meer dan €50 waard</li>
      <li>30 dagen geld-terug-garantie</li>
    </ul>
    ${p('<strong>De kortingen alleen al verdienen de gids terug.</strong>')}
    <p style="font-size:15px;color:#3A3A33;line-height:1.7;margin:16px 0 0;">— Pieter &amp; Jonas</p>
    ${ctaButton(`${SITE_URL}/#wachtlijst`, 'Ik wil de gids → (€50)')}
  `
  return {
    subject: 'Wat je krijgt voor €50 (en waarom het zichzelf terugbetaalt)',
    preheader: "31 pagina’s stappenplan + kortingscodes van meer dan €50 waard.",
    html: wrapEmail('Wat je krijgt voor €50', body, unsubUrl),
  }
}

function buildMail3(naam: string, unsubUrl: string): MailData {
  const body = `
    ${p(`Hoi ${naam},`)}
    ${p('Kort en duidelijk: de introprijs van <strong>€50</strong> loopt t.e.m. 30 september. Daarna kost exact dezelfde gids <strong>€85</strong>.')}
    ${p('Elke week uitstel is ook een week later starten als zelfstandige — en nu €35 duurder.')}
    ${p('Wie vandaag begint, verdient de gids terug vóór de prijs stijgt.')}
    ${p('Twijfel je nog? Onthoud: <strong>30 dagen geld terug</strong>, geen risico.')}
    <p style="font-size:15px;color:#3A3A33;line-height:1.7;margin:16px 0 0;">— Pieter &amp; Jonas</p>
    ${ctaButton(`${SITE_URL}/#wachtlijst`, 'Bestel nu voor €50 →')}
  `
  return {
    subject: 'Na 30 september betaal je €35 meer',
    preheader: 'Zelfde gids, hogere prijs. Dit is je herinnering.',
    html: wrapEmail('Na 30 september betaal je €35 meer', body, unsubUrl),
  }
}

// ─── Cron handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Vercel stuurt automatisch Authorization: Bearer {CRON_SECRET}
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const now = new Date()
  let totalSent = 0

  for (const { step, daysAfter } of SCHEDULE) {
    // Leads die daysAfter dagen geleden (of langer) hebben ingeschreven
    // en waarvan nurture_step nog op de vorige stap staat
    const cutoff = new Date(now)
    cutoff.setDate(cutoff.getDate() - daysAfter)

    const { data: leads, error } = await supabase
      .from('leads')
      .select('email, first_name, province')
      .eq('nurture_step', step - 1)
      .is('unsubscribed_at', null)
      .lte('created_at', cutoff.toISOString())

    if (error) {
      console.error(`[nurture] Fout bij ophalen leads voor stap ${step}:`, error)
      continue
    }
    if (!leads || leads.length === 0) continue

    // Exit-conditie: filter leads die de gids al gekocht hebben
    const leadEmails = leads.map(l => l.email.toLowerCase())
    const { data: existingCustomers } = await supabase
      .from('customers')
      .select('id, email')
      .in('email', leadEmails)

    let buyerEmails = new Set<string>()
    if (existingCustomers && existingCustomers.length > 0) {
      const { data: paidOrders } = await supabase
        .from('orders')
        .select('customer_id')
        .eq('status', 'paid')
        .in('customer_id', existingCustomers.map(c => c.id))
      const paidIds = new Set(paidOrders?.map(o => o.customer_id) ?? [])
      buyerEmails = new Set(
        existingCustomers.filter(c => paidIds.has(c.id)).map(c => c.email.toLowerCase())
      )
    }

    const eligible = leads.filter(l => !buyerEmails.has(l.email.toLowerCase()))

    for (const lead of eligible) {
      const naam = lead.first_name ?? 'daar'
      const unsubUrl = buildUnsubscribeUrl(lead.email)

      let mail: MailData
      if (step === 1) mail = buildMail1(naam, unsubUrl)
      else if (step === 2) mail = buildMail2(naam, lead.province ?? 'VLA', unsubUrl)
      else mail = buildMail3(naam, unsubUrl)

      const { error: mailError } = await resend.emails.send({
        from: FROM,
        to: lead.email,
        subject: mail.subject,
        html: mail.html,
        headers: { 'X-Entity-Ref-ID': `nurture-step${step}-${lead.email}` },
      })

      if (mailError) {
        console.error(`[nurture] Stap ${step} mail fout voor ${lead.email}:`, mailError)
        continue
      }

      // Stap bijwerken
      await supabase
        .from('leads')
        .update({ nurture_step: step })
        .eq('email', lead.email)

      totalSent++
    }
  }

  console.log(`[nurture] Cron klaar — ${totalSent} mail(s) verstuurd`)
  return NextResponse.json({ ok: true, sent: totalSent })
}
