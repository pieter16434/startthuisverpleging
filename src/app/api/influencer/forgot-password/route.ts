export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend/client'
import { randomBytes } from 'crypto'
import { z } from 'zod'

const Schema = z.object({ email: z.string().email() })

export async function POST(req: NextRequest) {
  try {
    const { email } = Schema.parse(await req.json())
    const supabase = createServiceClient()

    const { data: influencer } = await supabase
      .from('influencers')
      .select('id, name')
      .eq('email', email.toLowerCase())
      .single()

    // Altijd OK retourneren — verraad niet of het e-mailadres bestaat
    if (influencer) {
      const token = randomBytes(32).toString('hex')
      const expires = new Date()
      expires.setDate(expires.getDate() + 1) // 24 uur geldig

      await supabase
        .from('influencers')
        .update({ reset_token: token, reset_token_expires_at: expires.toISOString() })
        .eq('id', influencer.id)

      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/influencer/instellen?token=${token}`

      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: email,
        subject: 'Wachtwoord opnieuw instellen — startthuisverpleging',
        html: `
          <!DOCTYPE html>
          <html lang="nl">
          <head><meta charset="UTF-8"></head>
          <body style="margin:0;padding:0;background:#F1ECE0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE0;padding:40px 20px;">
              <tr><td align="center">
                <table width="480" cellpadding="0" cellspacing="0" style="background:#FBF8F2;border-radius:16px;overflow:hidden;max-width:100%;border:1px solid #D8D0C0;">
                  <tr>
                    <td style="background:#2A3D2E;padding:24px 36px;">
                      <p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#fff;font-weight:700;">
                        start<span style="color:#E8D08A;">thuisverpleging</span>
                      </p>
                      <p style="margin:6px 0 0;font-size:12px;color:#8A9588;text-transform:uppercase;letter-spacing:1px;">Influencer portaal</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:36px 36px 28px;">
                      <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:22px;color:#1A1A17;font-weight:400;">
                        Wachtwoord opnieuw instellen
                      </h2>
                      <p style="margin:0 0 24px;font-size:15px;color:#3A3A33;line-height:1.6;">
                        Beste ${influencer.name},<br><br>
                        We ontvingen een verzoek om je wachtwoord opnieuw in te stellen. Klik op de knop hieronder om een nieuw wachtwoord te kiezen.
                      </p>
                      <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                        <tr>
                          <td style="background:#2A3D2E;border-radius:8px;padding:14px 28px;">
                            <a href="${url}" style="color:#E8D08A;font-size:15px;font-weight:700;text-decoration:none;">
                              Nieuw wachtwoord instellen →
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="margin:0;font-size:13px;color:#6E6B62;line-height:1.5;">
                        Deze link is <strong>24 uur</strong> geldig. Heb je dit niet aangevraagd? Dan kun je deze e-mail negeren — je wachtwoord blijft ongewijzigd.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 36px 28px;">
                      <p style="margin:0;font-size:12px;color:#8A9588;">
                        Of kopieer deze link in je browser:<br>
                        <span style="color:#6E6B62;word-break:break-all;">${url}</span>
                      </p>
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
          </body>
          </html>
        `,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres' }, { status: 400 })
    }
    console.error('[influencer/forgot-password]', err)
    return NextResponse.json({ error: 'Verzoek mislukt' }, { status: 500 })
  }
}
