import { NextRequest, NextResponse } from 'next/server'
import { mollieClient } from '@/lib/mollie/client'
import { createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend/client'
import { generateCodebookPdf, type CodebookData } from '@/lib/pdf/codebook'
import { getSignedPdfUrl, GUIDE_PATH, GUIDE_PRINT_PATH } from '@/lib/storage/pdf'

const PROVINCES: Record<string, string> = {
  ANT: 'Antwerpen', LIM: 'Limburg', OVL: 'Oost-Vlaanderen',
  VBR: 'Vlaams-Brabant', WVL: 'West-Vlaanderen',
}

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
    if (!paymentId) return NextResponse.json({ error: 'Geen payment ID' }, { status: 400 })

    const payment = await mollieClient.payments.get(paymentId)
    const supabase = createServiceClient()

    if (payment.status !== 'paid') {
      if (['failed', 'canceled', 'expired'].includes(payment.status)) {
        await supabase.from('orders').update({ status: 'failed' }).eq('mollie_payment_id', paymentId)
      }
      return NextResponse.json({ ok: true })
    }

    const orderId = (payment.metadata as { order_id: string })?.order_id
    if (!orderId) return NextResponse.json({ error: 'Geen order_id' }, { status: 400 })

    // Idempotentie: al verwerkt?
    const { data: order } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('id', orderId)
      .single()

    if (!order) return NextResponse.json({ error: 'Order niet gevonden' }, { status: 404 })
    if (order.status === 'paid') return NextResponse.json({ ok: true })

    // ── 1. Markeer als betaald ───────────────────────────────────────────────
    await supabase
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', orderId)

    const customer = order.customers

    // ── 2. Genereer partner codes per provincie ──────────────────────────────
    type PartnerRow = { id: string; business_name: string; name: string; service_type: string; discount_description: string }
    let partners: PartnerRow[] = []
    const codeMap: Record<string, string> = {} // partner_id → code

    if (customer.province) {
      const { data: activePartners } = await supabase
        .from('partners')
        .select('id, business_name, name, service_type, discount_description')
        .eq('province', customer.province)
        .eq('is_active', true)

      partners = activePartners ?? []

      for (const partner of partners) {
        let code = generateCode(customer.province)
        for (let attempt = 0; attempt < 5; attempt++) {
          const { error } = await supabase.from('partner_codes').insert({
            partner_id: partner.id,
            order_id: orderId,
            customer_id: customer.id,
            code,
          })
          if (!error) { codeMap[partner.id] = code; break }
          code = generateCode(customer.province)
        }
      }
    }

    // ── 3. Genereer codeboek PDF ─────────────────────────────────────────────
    const codebookData: CodebookData = {
      customer_first_name: customer.first_name,
      customer_last_name: customer.last_name,
      province_label: PROVINCES[customer.province] ?? 'Vlaanderen',
      order_short_id: orderId.slice(0, 8).toUpperCase(),
      generated_date: new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }),
      partners: partners.map(p => ({
        code: codeMap[p.id] ?? '—',
        business_name: p.business_name,
        name: p.name,
        service_type: p.service_type,
        discount_description: p.discount_description,
      })),
    }

    const codebookBuffer = await generateCodebookPdf(codebookData)

    // Upload codeboek naar Supabase Storage (persoonlijk exemplaar)
    const codebookPath = `codebooks/orders/${orderId}.pdf`
    await supabase.storage.from('guides').upload(codebookPath, codebookBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    })

    // Signed URL voor codeboek (7 dagen)
    const { data: codebookSigned } = await supabase.storage
      .from('guides')
      .createSignedUrl(codebookPath, 60 * 60 * 24 * 7)
    const codebookUrl = codebookSigned?.signedUrl ?? null

    // ── 4. Controleer of hoofdgids al geüpload is ────────────────────────────
    const guideUrl = await getSignedPdfUrl(GUIDE_PATH)
    const guidePrintUrl = await getSignedPdfUrl(GUIDE_PRINT_PATH)

    // ── 5. Sla PDF-URL op in order ───────────────────────────────────────────
    if (guideUrl) {
      await supabase.from('orders').update({ pdf_main_url: guideUrl }).eq('id', orderId)
    }

    // ── 6. Stuur e-mails ─────────────────────────────────────────────────────
    const hasGuide = !!guideUrl

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: customer.email,
      subject: hasGuide
        ? 'Jouw gids staat klaar — startthuisverpleging'
        : 'Bestelling bevestigd — startthuisverpleging',
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
                      ${hasGuide ? `Je gids staat klaar, ${customer.first_name}!` : `Bedankt, ${customer.first_name}!`}
                    </h1>
                    <p style="margin:0 0 24px;font-size:16px;color:#3A3A33;line-height:1.6;">
                      ${hasGuide
                        ? 'Jouw bestanden staan klaar. Download ze hieronder — de links zijn 7 dagen geldig.'
                        : 'Jouw bestelling is bevestigd en betaald. Je gids wordt zo snel mogelijk doorgestuurd.'}
                    </p>

                    <!-- Order info -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1ECE0;border-radius:10px;margin-bottom:28px;">
                      <tr>
                        <td style="padding:16px 20px;">
                          <p style="margin:0 0 4px;font-size:12px;color:#6E6B62;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Jouw aankoop</p>
                          <p style="margin:0 0 8px;font-size:15px;color:#1A1A17;font-weight:600;">Gids: Zelfstandig thuisverpleegkundige worden in Vlaanderen</p>
                          <p style="margin:0;font-size:13px;color:#6E6B62;">
                            Betaald: <strong style="color:#2A3D2E;">€ ${(order.amount_cents / 100).toFixed(2).replace('.', ',')}</strong>
                            &nbsp;·&nbsp; Order: <code style="font-family:monospace;font-size:12px;">${orderId.slice(0, 8).toUpperCase()}</code>
                          </p>
                        </td>
                      </tr>
                    </table>

                    ${hasGuide ? `
                    <!-- Download: Hoofdgids -->
                    <p style="margin:0 0 8px;font-size:13px;color:#6E6B62;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Jouw bestanden</p>
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:10px;width:100%;">
                      <tr>
                        <td style="background:#2A3D2E;border-radius:10px;padding:14px 24px;">
                          <a href="${guideUrl}" style="color:#E8D08A;font-size:15px;font-weight:700;text-decoration:none;">
                            📄 Download jouw gids →
                          </a>
                        </td>
                      </tr>
                    </table>
                    ${guidePrintUrl ? `
                    <!-- Download: Printversie -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:12px;width:100%;">
                      <tr>
                        <td style="background:#4A5E4E;border-radius:10px;padding:12px 24px;">
                          <a href="${guidePrintUrl}" style="color:#D8D0C0;font-size:14px;font-weight:600;text-decoration:none;">
                            🖨 Download printversie (minder inkt) →
                          </a>
                        </td>
                      </tr>
                    </table>
                    ` : ''}

                    ${codebookUrl ? `
                    <!-- Download: Codeboek -->
                    <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;width:100%;">
                      <tr>
                        <td style="background:#B65436;border-radius:10px;padding:14px 24px;">
                          <a href="${codebookUrl}" style="color:#fff;font-size:15px;font-weight:700;text-decoration:none;">
                            📋 Download jouw persoonlijk codeboek →
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 24px;font-size:12px;color:#6E6B62;">
                      Het codeboek bevat jouw unieke codes voor lokale partners in ${PROVINCES[customer.province] ?? 'jouw provincie'}. Toon een code bij de partner om je voordeel te ontvangen.
                    </p>
                    ` : ''}

                    <p style="margin:0 0 24px;font-size:13px;color:#8A9588;">
                      ⏱ Deze downloadlinks zijn 7 dagen geldig. Sla de bestanden op na het downloaden.
                    </p>
                    ` : `
                    <p style="margin:0 0 24px;font-size:15px;color:#3A3A33;line-height:1.6;">
                      Je ontvangt een tweede e-mail zodra je gids klaarstaat met de downloadlink.
                    </p>
                    `}

                    <!-- Garantie -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background:#2A3D2E;border-radius:10px;padding:16px 20px;">
                          <p style="margin:0;font-size:14px;color:#fff;line-height:1.5;">
                            🛡️ <strong>30 dagen geld-terug-garantie.</strong>
                            Niet tevreden? Mail ons en we storten het volledige bedrag terug — zonder vragen.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td style="padding:0 36px 28px;border-top:1px solid #D8D0C0;">
                    <table width="100%" cellpadding="0" cellspacing="0" style="padding-top:20px;">
                      <tr>
                        <td>
                          <p style="margin:0;font-size:13px;color:#6E6B62;">
                            Pieter Vanermen &amp; Jonas Piron
                            &nbsp;·&nbsp;
                            <a href="https://startthuisverpleging.be/terugbetaling" style="color:#8A9588;">Terugbetalingsbeleid</a>
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

    // Admin notificatie
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.ADMIN_NOTIFICATION_EMAIL!,
      subject: `💰 Nieuwe aankoop — ${customer.first_name} ${customer.last_name} (€50)`,
      html: `
        <p><strong>Nieuwe aankoop!</strong></p>
        <table>
          <tr><td><strong>Naam:</strong></td><td>${customer.first_name} ${customer.last_name}</td></tr>
          <tr><td><strong>E-mail:</strong></td><td>${customer.email}</td></tr>
          <tr><td><strong>Provincie:</strong></td><td>${PROVINCES[customer.province] ?? '—'}</td></tr>
          <tr><td><strong>Order:</strong></td><td>${orderId}</td></tr>
          <tr><td><strong>Partner codes:</strong></td><td>${partners.length} gegenereerd</td></tr>
          <tr><td><strong>Codeboek PDF:</strong></td><td>${codebookUrl ? '✓ Aangemaakt en verstuurd' : '✗ Niet aangemaakt'}</td></tr>
          <tr><td><strong>Hoofdgids:</strong></td><td>${hasGuide ? '✓ Verstuurd' : '⚠ Nog niet geüpload — stuur handmatig via admindashboard'}</td></tr>
        </table>
        <p><a href="https://startthuisverpleging.be/admin/dashboard">Bekijk in admindashboard →</a></p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[mollie-webhook]', err)
    return NextResponse.json({ error: 'Webhook verwerking mislukt' }, { status: 500 })
  }
}
