import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend/client'
import { getSignedPdfUrl } from '@/lib/storage/pdf'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const PROVINCIE_LABELS: Record<string, string> = {
  ANT: 'Antwerpen', LIM: 'Limburg', OVL: 'Oost-Vlaanderen',
  VBR: 'Vlaams-Brabant', WVL: 'West-Vlaanderen',
}

// ─── In-memory rate limiter ────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000 // 10 minuten

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }
  entry.count++
  return entry.count > RATE_LIMIT_MAX
}

// ─── Validatieschema ───────────────────────────────────────────────────────
const Schema = z.object({
  email:        z.string().email('Ongeldig e-mailadres').transform(s => s.toLowerCase().trim()),
  province:     z.enum(['ANT', 'LIM', 'OVL', 'VBR', 'WVL'], { message: 'Kies een provincie.' }),
  profile:      z.enum(['student', 'employed']).optional(),
  consent:      z.boolean().optional(),
  utm_source:   z.string().max(80).optional(),
  utm_campaign: z.string().max(80).optional(),
  utm_content:  z.string().max(80).optional(),
  website:      z.string().optional(), // honeypot: moet leeg zijn
})

export async function POST(req: NextRequest) {
  // IP-gebaseerde rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: true }) // stil antwoorden om bots niet te verraden
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ongeldig verzoek.' }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'Ongeldige invoer.'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const data = parsed.data

  // Honeypot: website-veld moet leeg zijn
  if (data.website) {
    return NextResponse.json({ ok: true }) // bot, stil negeren
  }

  const supabase = createServiceClient()

  const leadRow = {
    email:             data.email,
    province:          data.province,
    profile:           data.profile ?? null,
    source:            data.utm_source ?? 'direct',
    utm_campaign:      data.utm_campaign ?? null,
    utm_content:       data.utm_content ?? null,
    marketing_consent: data.consent ?? false,
  }

  // Probeer eerst een INSERT; bij duplicate e-mail → UPDATE (stuur mail altijd opnieuw)
  const { error: insertError } = await supabase.from('leads').insert(leadRow)

  if (insertError) {
    if (insertError.code === '23505') {
      // Dubbele inschrijving: bijwerken en mail opnieuw sturen
      const { error: updateError } = await supabase
        .from('leads')
        .update({
          province:          leadRow.province,
          profile:           leadRow.profile,
          source:            leadRow.source,
          utm_campaign:      leadRow.utm_campaign,
          utm_content:       leadRow.utm_content,
          marketing_consent: leadRow.marketing_consent,
          unsubscribed_at:   null, // heractiveren als ze eerder uitschreven
        })
        .eq('email', data.email)
      if (updateError) {
        console.error('[opstartcheck] Update fout:', updateError)
        return NextResponse.json({ error: 'Inschrijving mislukt. Probeer opnieuw.' }, { status: 500 })
      }
    } else {
      console.error('[opstartcheck] Insert fout:', insertError.code, insertError.message)
      return NextResponse.json({ error: 'Inschrijving mislukt. Probeer opnieuw.' }, { status: 500 })
    }
  }

  // Signed URL voor de PDF (7 dagen)
  const pdfUrl = await getSignedPdfUrl('opstartcheck.pdf')
  const provincieName = PROVINCIE_LABELS[data.province] ?? data.province

  // ─── Mail naar de lead ─────────────────────────────────────────────────
  const leadHtml = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F1ECE0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE0;padding:32px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#FBF8F2;border-radius:14px;overflow:hidden;max-width:100%;">
        <tr>
          <td style="background:#2A3D2E;padding:28px 32px;">
            <p style="margin:0;font-size:13px;color:rgba(232,208,138,0.8);text-transform:uppercase;letter-spacing:0.12em;font-weight:600;">startthuisverpleging.be</p>
            <p style="margin:8px 0 0;font-size:22px;color:#fff;font-weight:700;line-height:1.3;">Je Opstartcheck staat klaar 📋</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 20px;">
            <p style="font-size:15px;color:#3A3A33;line-height:1.7;margin:0 0 24px;">
              Welkom! We zijn blij dat je de stap zet richting zelfstandig thuisverpleegkundige worden in ${provincieName}.
              Hieronder vind je de link naar je gratis Opstartcheck — een pdf die je helpt te begrijpen waar je staat en wat je eerste stap is.
            </p>

            ${pdfUrl ? `
            <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
              <tr>
                <td style="background:#2A3D2E;border-radius:10px;padding:14px 28px;">
                  <a href="${pdfUrl}" style="color:#E8D08A;font-size:16px;font-weight:700;text-decoration:none;display:block;text-align:center;">
                    ↓ Download de Opstartcheck (PDF)
                  </a>
                </td>
              </tr>
            </table>
            <p style="font-size:13px;color:#6E6B62;margin:0 0 28px;">De link is 7 dagen geldig. Sla de PDF op in je downloads.</p>
            ` : `
            <p style="font-size:15px;color:#3A3A33;line-height:1.7;margin:0 0 28px;background:#FFF8E1;border-left:3px solid #E8D08A;padding:14px 18px;border-radius:6px;">
              We sturen je de Opstartcheck binnen 24 uur — we zijn de laatste hand aan het leggen.
            </p>
            `}

            <div style="border-top:1px solid #E8E3D8;padding-top:24px;">
              <p style="font-size:15px;color:#1A1A17;font-weight:700;margin:0 0 10px;">Klaar voor de volledige gids?</p>
              <p style="font-size:14px;color:#3A3A33;line-height:1.7;margin:0 0 16px;">
                De Opstartcheck geeft je de basis. De volledige gids neemt je stap voor stap mee door alle documenten, de volgorde én de drie dure fouten die je <strong>€2.100 per jaar</strong> kunnen kosten.
                <strong>Introductieprijs: €50 (normaal €85)</strong> — met 30 dagen geld-terug-garantie, geldig t.e.m. 30 september 2026.
              </p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#F1ECE0;border:1.5px solid #2A3D2E;border-radius:10px;padding:12px 22px;">
                    <a href="https://startthuisverpleging.be/#wachtlijst" style="color:#2A3D2E;font-size:14px;font-weight:700;text-decoration:none;">
                      Bekijk de volledige gids →
                    </a>
                  </td>
                </tr>
              </table>
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px 28px;border-top:1px solid #E8E3D8;">
            <p style="font-size:12px;color:#8A9588;margin:0;line-height:1.6;">
              Je ontvangt deze mail omdat je de Opstartcheck aanvroeg via startthuisverpleging.be.<br>
              Geen interesse meer? Antwoord met <strong>'stop'</strong> of schrijf naar
              <a href="mailto:hallo@startthuisverpleging.be" style="color:#B65436;">hallo@startthuisverpleging.be</a>.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  const leadMailResult = await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL!,
    to:      data.email,
    subject: 'Je Opstartcheck staat klaar',
    html:    leadHtml,
  })

  if (leadMailResult.error) {
    console.error('[opstartcheck] Lead mail fout:', leadMailResult.error)
  }

  // ─── Totaal voor provincie ophalen ────────────────────────────────────
  const { count: provinceTotal } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('province', data.province)
    .is('unsubscribed_at', null)

  // ─── Notificatiemail naar admin ───────────────────────────────────────
  const profileLabel = data.profile === 'student' ? 'Net afgestudeerd' : data.profile === 'employed' ? 'Al in loondienst' : '—'
  const adminHtml = `<!DOCTYPE html>
<html lang="nl">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#F1ECE0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE0;padding:32px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#FBF8F2;border-radius:14px;overflow:hidden;max-width:100%;">
        <tr>
          <td style="background:#2A3D2E;padding:22px 32px;">
            <p style="margin:0;font-size:18px;color:#fff;font-weight:700;">📥 Nieuwe lead — ${provincieName}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="padding:6px 0;border-bottom:1px solid #E8E3D8;">
                <span style="font-size:12px;color:#6E6B62;text-transform:uppercase;letter-spacing:0.5px;">E-mail</span><br>
                <a href="mailto:${data.email}" style="font-size:15px;color:#B65436;font-weight:600;">${data.email}</a>
              </td></tr>
              <tr><td style="padding:6px 0;border-bottom:1px solid #E8E3D8;">
                <span style="font-size:12px;color:#6E6B62;text-transform:uppercase;letter-spacing:0.5px;">Provincie</span><br>
                <strong style="font-size:15px;color:#1A1A17;">${provincieName}</strong>
                <span style="font-size:13px;color:#2A3D2E;font-weight:700;margin-left:8px;">(totaal: ${provinceTotal ?? '?'})</span>
              </td></tr>
              <tr><td style="padding:6px 0;border-bottom:1px solid #E8E3D8;">
                <span style="font-size:12px;color:#6E6B62;text-transform:uppercase;letter-spacing:0.5px;">Profiel</span><br>
                <strong style="font-size:15px;color:#1A1A17;">${profileLabel}</strong>
              </td></tr>
              <tr><td style="padding:6px 0;border-bottom:1px solid #E8E3D8;">
                <span style="font-size:12px;color:#6E6B62;text-transform:uppercase;letter-spacing:0.5px;">Bron</span><br>
                <strong style="font-size:15px;color:#1A1A17;">${data.utm_source ?? 'direct'}${data.utm_campaign ? ` · ${data.utm_campaign}` : ''}${data.utm_content ? ` · ${data.utm_content}` : ''}</strong>
              </td></tr>
              <tr><td style="padding:6px 0;">
                <span style="font-size:12px;color:#6E6B62;text-transform:uppercase;letter-spacing:0.5px;">Marketingtoestemming</span><br>
                <strong style="font-size:15px;color:#1A1A17;">${data.consent ? '✓ Ja' : '✗ Nee'}</strong>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`

  await resend.emails.send({
    from:    process.env.RESEND_FROM_EMAIL!,
    to:      process.env.ADMIN_NOTIFICATION_EMAIL!,
    subject: `📥 Nieuwe lead — ${provincieName} (${provinceTotal ?? '?'} totaal)`,
    html:    adminHtml,
  })

  return NextResponse.json({ ok: true })
}
