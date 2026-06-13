import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend/client'
import { z } from 'zod'

const Schema = z.object({
  first_name:   z.string().min(1).max(60),
  last_name:    z.string().min(1).max(60),
  email:        z.string().email(),
  order_ref:    z.string().max(30).optional().default(''),
  reason:       z.string().min(5).max(1000),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = Schema.parse(body)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.ADMIN_NOTIFICATION_EMAIL!,
      subject: `💸 Terugbetalingsverzoek — ${data.first_name} ${data.last_name}`,
      html: `
        <!DOCTYPE html>
        <html lang="nl">
        <head><meta charset="UTF-8"></head>
        <body style="margin:0;padding:0;background:#F1ECE0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE0;padding:32px 20px;">
            <tr><td align="center">
              <table width="520" cellpadding="0" cellspacing="0" style="background:#FBF8F2;border-radius:14px;overflow:hidden;max-width:100%;">
                <tr>
                  <td style="background:#B65436;padding:22px 32px;">
                    <p style="margin:0;font-size:18px;color:#fff;font-weight:700;">💸 Terugbetalingsverzoek</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr><td style="padding:6px 0;border-bottom:1px solid #E8E3D8;">
                        <span style="font-size:12px;color:#6E6B62;text-transform:uppercase;letter-spacing:0.5px;">Naam</span><br>
                        <strong style="font-size:15px;color:#1A1A17;">${data.first_name} ${data.last_name}</strong>
                      </td></tr>
                      <tr><td style="padding:6px 0;border-bottom:1px solid #E8E3D8;">
                        <span style="font-size:12px;color:#6E6B62;text-transform:uppercase;letter-spacing:0.5px;">E-mail</span><br>
                        <a href="mailto:${data.email}" style="font-size:15px;color:#B65436;font-weight:600;">${data.email}</a>
                      </td></tr>
                      <tr><td style="padding:6px 0;border-bottom:1px solid #E8E3D8;">
                        <span style="font-size:12px;color:#6E6B62;text-transform:uppercase;letter-spacing:0.5px;">Bestelnummer</span><br>
                        <strong style="font-size:15px;color:#1A1A17;">${data.order_ref || '—'}</strong>
                      </td></tr>
                      <tr><td style="padding:6px 0;">
                        <span style="font-size:12px;color:#6E6B62;text-transform:uppercase;letter-spacing:0.5px;">Reden</span><br>
                        <p style="font-size:14px;color:#3A3A33;line-height:1.6;margin:4px 0 0;">${data.reason.replace(/\n/g, '<br>')}</p>
                      </td></tr>
                    </table>
                    <table cellpadding="0" cellspacing="0" style="margin-top:24px;">
                      <tr>
                        <td style="background:#B65436;border-radius:8px;padding:12px 20px;">
                          <a href="mailto:${data.email}?subject=Re%3A%20Terugbetaling%20startthuisverpleging" style="color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
                            Antwoord sturen → ${data.email}
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td></tr>
          </table>
        </body>
        </html>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[refund-request]', err)
    return NextResponse.json({ error: 'Aanvraag mislukt' }, { status: 500 })
  }
}
