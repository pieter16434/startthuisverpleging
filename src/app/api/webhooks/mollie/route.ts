import { NextRequest, NextResponse } from 'next/server'
import { mollieClient } from '@/lib/mollie/client'
import { createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend/client'

// Genereer een unieke partnercode: STH-LIM-A3B9K2
function generateCode(province: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let rand = ''
  for (let i = 0; i < 6; i++) rand += chars[Math.floor(Math.random() * chars.length)]
  return `STH-${province}-${rand}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)
    const paymentId = params.get('id')

    if (!paymentId) {
      return NextResponse.json({ error: 'Geen payment ID' }, { status: 400 })
    }

    const payment = await mollieClient.payments.get(paymentId)
    const supabase = createServiceClient()

    if (payment.status !== 'paid') {
      if (['failed', 'canceled', 'expired'].includes(payment.status)) {
        await supabase
          .from('orders')
          .update({ status: 'failed' })
          .eq('mollie_payment_id', paymentId)
      }
      return NextResponse.json({ ok: true })
    }

    const orderId = (payment.metadata as { order_id: string })?.order_id
    if (!orderId) return NextResponse.json({ error: 'Geen order_id in metadata' }, { status: 400 })

    // Idempotentie check
    const { data: order } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('id', orderId)
      .single()

    if (!order) return NextResponse.json({ error: 'Order niet gevonden' }, { status: 404 })
    if (order.status === 'paid') return NextResponse.json({ ok: true })

    // Markeer als betaald
    await supabase
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', orderId)

    const customer = order.customers

    // ── Partner codes genereren (als klant een provincie koos) ──
    if (customer.province) {
      const { data: partners } = await supabase
        .from('partners')
        .select('id')
        .eq('province', customer.province)
        .eq('is_active', true)

      if (partners && partners.length > 0) {
        // Genereer unieke codes (retry bij conflict)
        const codeInserts = await Promise.all(
          partners.map(async (partner) => {
            let code = generateCode(customer.province)
            let attempts = 0
            while (attempts < 5) {
              const { error } = await supabase.from('partner_codes').insert({
                partner_id: partner.id,
                order_id: orderId,
                customer_id: customer.id,
                code,
              })
              if (!error) break
              code = generateCode(customer.province) // nieuw proberen bij conflict
              attempts++
            }
            return code
          })
        )
        console.log(`[webhook] ${codeInserts.length} partner codes gegenereerd voor order ${orderId}`)
      }
    }

    // ── Bevestigingsmail aan klant ──
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: customer.email,
      subject: 'Jouw gids is onderweg — startthuisverpleging',
      html: `
        <!DOCTYPE html>
        <html lang="nl">
        <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
        <body style="margin:0;padding:0;background:#F1ECE0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE0;padding:40px 20px;">
            <tr><td align="center">
              <table width="560" cellpadding="0" cellspacing="0" style="background:#FBF8F2;border-radius:16px;overflow:hidden;max-width:100%;">

                <!-- Header -->
                <tr>
                  <td style="background:#2A3D2E;padding:28px 36px;">
                    <p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#fff;font-weight:700;">
                      start<span style="color:#E8D08A;">thuisverpleging</span>
                    </p>
                  </td>
                </tr>

                <!-- Body -->
                <tr>
                  <td style="padding:36px 36px 24px;">
                    <h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;color:#1A1A17;font-weight:400;">
                      Bedankt, ${customer.first_name}!
                    </h1>
                    <p style="margin:0 0 24px;font-size:16px;color:#3A3A33;line-height:1.6;">
                      Jouw bestelling is bevestigd. We zijn je gids aan het klaarmaken — je ontvangt hem
                      zo snel mogelijk op dit e-mailadres.
                    </p>

                    <!-- Order box -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE0;border-radius:10px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:20px 24px;">
                          <p style="margin:0 0 4px;font-size:12px;color:#6E6B62;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Jouw aankoop</p>
                          <p style="margin:0 0 12px;font-size:16px;color:#1A1A17;font-weight:600;">
                            Gids: Zelfstandig thuisverpleegkundige worden in Vlaanderen
                          </p>
                          <p style="margin:0;font-size:13px;color:#6E6B62;">
                            Betaald: <strong style="color:#2A3D2E;">€ 50,00</strong>
                            &nbsp;·&nbsp; Order: <code style="font-family:monospace;font-size:12px;">${orderId.slice(0, 8).toUpperCase()}</code>
                          </p>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 8px;font-size:15px;color:#3A3A33;line-height:1.6;">
                      <strong>Wat volgt:</strong> Zodra jouw persoonlijk exemplaar klaar is, sturen we
                      je een tweede e-mail met de downloadlink. Dit duurt normaal gezien niet lang.
                    </p>
                    <p style="margin:0 0 28px;font-size:15px;color:#3A3A33;line-height:1.6;">
                      Heb je een vraag of probleem? Stuur gerust een mail —
                      we antwoorden snel.
                    </p>
                  </td>
                </tr>

                <!-- Garantie banner -->
                <tr>
                  <td style="padding:0 36px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#2A3D2E;border-radius:10px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0;font-size:14px;color:#fff;">
                            🛡️ <strong>30 dagen geld-terug-garantie.</strong>
                            Niet tevreden? Stuur ons een mail en we storten het volledige bedrag terug — zonder vragen.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding:0 36px 32px;border-top:1px solid #D8D0C0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="padding-top:20px;">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:13px;color:#6E6B62;">
                            Pieter Vanermen &amp; Jonas Piron<br>
                            <a href="mailto:hallo@startthuisverpleging.be" style="color:#B65436;">hallo@startthuisverpleging.be</a>
                            &nbsp;·&nbsp;
                            <a href="https://startthuisverpleging.be" style="color:#B65436;">startthuisverpleging.be</a>
                          </p>
                          <p style="margin:8px 0 0;font-size:11px;color:#8A9588;">
                            <a href="https://startthuisverpleging.be/terugbetaling" style="color:#8A9588;">Terugbetalingsbeleid</a>
                            &nbsp;·&nbsp;
                            <a href="https://startthuisverpleging.be/voorwaarden" style="color:#8A9588;">Algemene voorwaarden</a>
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

    // ── Admin notificatie ──
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.ADMIN_NOTIFICATION_EMAIL!,
      subject: `💰 Nieuwe aankoop — ${customer.first_name} ${customer.last_name} (€50)`,
      html: `
        <p><strong>Nieuwe aankoop ontvangen!</strong></p>
        <table>
          <tr><td><strong>Naam:</strong></td><td>${customer.first_name} ${customer.last_name}</td></tr>
          <tr><td><strong>E-mail:</strong></td><td>${customer.email}</td></tr>
          <tr><td><strong>Provincie:</strong></td><td>${customer.province ?? 'Niet opgegeven'}</td></tr>
          <tr><td><strong>Order ID:</strong></td><td>${orderId}</td></tr>
          <tr><td><strong>Bedrag:</strong></td><td>€ 50,00</td></tr>
          <tr><td><strong>Tijdstip:</strong></td><td>${new Date().toLocaleString('nl-BE')}</td></tr>
        </table>
        <p>
          <a href="https://startthuisverpleging.be/admin/dashboard">Bekijk in admindashboard →</a>
        </p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[mollie-webhook]', err)
    return NextResponse.json({ error: 'Webhook verwerking mislukt' }, { status: 500 })
  }
}
