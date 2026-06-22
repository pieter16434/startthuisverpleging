export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { resend } from '@/lib/resend/client'
import { getSignedPdfUrl, GUIDE_PATH, CODEBOOK_PATH } from '@/lib/storage/pdf'

// PATCH /api/admin/orders/[id] — pas status of bedrag aan
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const body = await req.json()
  const schema = z.object({
    status: z.enum(['pending', 'paid', 'refunded', 'failed']).optional(),
    amount_cents: z.number().int().min(0).max(100000).optional(),
  })
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Ongeldige gegevens' }, { status: 400 })

  const updates: Record<string, unknown> = {}
  if (parsed.data.status !== undefined) updates.status = parsed.data.status
  if (parsed.data.amount_cents !== undefined) updates.amount_cents = parsed.data.amount_cents

  const supabase = createServiceClient()
  const { error } = await supabase.from('orders').update(updates).eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Opslaan mislukt' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// POST /api/admin/orders/[id] — stuur PDF handmatig naar klant
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  // Haal order + klant op
  const { data: order, error } = await supabase
    .from('orders')
    .select('*, customers(*)')
    .eq('id', params.id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order niet gevonden' }, { status: 404 })
  }
  if (order.status !== 'paid') {
    return NextResponse.json({ error: 'Order is niet betaald' }, { status: 400 })
  }

  const customer = order.customers

  // Genereer signed URLs
  const guideUrl = await getSignedPdfUrl(GUIDE_PATH)
  if (!guideUrl) {
    return NextResponse.json({
      error: 'Hoofdgids PDF niet gevonden in Supabase Storage. Upload eerst "main-guide.pdf" naar de "guides" bucket.',
    }, { status: 404 })
  }

  const codebookUrl = customer.province
    ? await getSignedPdfUrl(CODEBOOK_PATH(customer.province))
    : null

  // Sla URLs op in order
  await supabase
    .from('orders')
    .update({ pdf_main_url: guideUrl })
    .eq('id', params.id)

  // Stuur e-mail met downloadlinks
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: customer.email,
    subject: 'Jouw gids staat klaar — startthuisverpleging',
    html: `
      <!DOCTYPE html>
      <html lang="nl">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
      <body style="margin:0;padding:0;background:#F1ECE0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE0;padding:40px 20px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#FBF8F2;border-radius:16px;overflow:hidden;max-width:100%;">

              <tr>
                <td style="background:#2A3D2E;padding:28px 36px;">
                  <p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#fff;font-weight:700;">
                    start<span style="color:#E8D08A;">thuisverpleging</span>
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:36px 36px 28px;">
                  <h1 style="margin:0 0 12px;font-family:Georgia,serif;font-size:26px;color:#1A1A17;font-weight:400;">
                    Je gids staat klaar, ${customer.first_name}!
                  </h1>
                  <p style="margin:0 0 28px;font-size:16px;color:#3A3A33;line-height:1.6;">
                    Jouw persoonlijk exemplaar is klaar. Download hieronder je bestanden.
                  </p>

                  <!-- Download knop 1 -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                    <tr>
                      <td style="background:#2A3D2E;border-radius:10px;padding:16px 28px;">
                        <a href="${guideUrl}" style="color:#E8D08A;font-size:16px;font-weight:700;text-decoration:none;">
                          📄 Download jouw gids →
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 24px;font-size:13px;color:#6E6B62;">
                    Deze link is 7 dagen geldig. Sla het bestand op na het downloaden.
                  </p>

                  ${codebookUrl ? `
                  <!-- Download knop 2 -->
                  <table cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
                    <tr>
                      <td style="background:#B65436;border-radius:10px;padding:16px 28px;">
                        <a href="${codebookUrl}" style="color:#fff;font-size:16px;font-weight:700;text-decoration:none;">
                          📋 Download jouw codeboek →
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 24px;font-size:13px;color:#6E6B62;">
                    Jouw persoonlijk codeboek met partners voor jouw provincie. Toon de codes aan de betreffende partner om je voordeel te ontvangen.
                  </p>
                  ` : ''}

                  <table width="100%" cellpadding="0" cellspacing="0" style="background:#2A3D2E;border-radius:10px;margin-bottom:28px;">
                    <tr>
                      <td style="padding:16px 20px;">
                        <p style="margin:0;font-size:14px;color:#fff;">
                          🛡️ <strong>30 dagen geld-terug-garantie.</strong>
                          Niet tevreden? Mail ons en we storten het volledige bedrag terug.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <tr>
                <td style="padding:0 36px 32px;border-top:1px solid #D8D0C0;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="padding-top:20px;">
                    <tr>
                      <td>
                        <p style="margin:0;font-size:13px;color:#6E6B62;">
                          Pieter Vanermen &amp; Jonas Piron
                        </p>
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

  return NextResponse.json({ ok: true, sent_to: customer.email })
}
