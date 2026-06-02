import { NextRequest, NextResponse } from 'next/server'
import { mollieClient } from '@/lib/mollie/client'
import { createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend/client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    const params = new URLSearchParams(body)
    const paymentId = params.get('id')

    if (!paymentId) {
      return NextResponse.json({ error: 'Geen payment ID' }, { status: 400 })
    }

    // Haal betaalstatus op via Mollie API
    const payment = await mollieClient.payments.get(paymentId)
    const supabase = createServiceClient()

    if (payment.status !== 'paid') {
      // Markeer als mislukt als definitief gefaald
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

    // Controleer of al verwerkt (idempotentie)
    const { data: order } = await supabase
      .from('orders')
      .select('*, customers(*)')
      .eq('id', orderId)
      .single()

    if (!order) return NextResponse.json({ error: 'Order niet gevonden' }, { status: 404 })
    if (order.status === 'paid') return NextResponse.json({ ok: true }) // Al verwerkt

    // Markeer als betaald
    await supabase
      .from('orders')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', orderId)

    const customer = order.customers

    // Stuur bevestigingsmail
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: customer.email,
      subject: 'Je gids staat klaar — startthuisverpleging',
      html: `
        <p>Dag ${customer.first_name},</p>
        <p>Bedankt voor je aankoop! Je gids is onderweg.</p>
        <p>We sturen je de PDF zo snel mogelijk toe.</p>
        <p>Vragen? Mail ons op <a href="mailto:hallo@startthuisverpleging.be">hallo@startthuisverpleging.be</a></p>
        <p>Met vriendelijke groeten,<br>Pieter &amp; Jonas</p>
      `,
    })

    // Notificatie naar admin
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: process.env.ADMIN_NOTIFICATION_EMAIL!,
      subject: `Nieuwe aankoop — ${customer.first_name} ${customer.last_name}`,
      html: `
        <p><strong>Nieuwe aankoop ontvangen!</strong></p>
        <p>Klant: ${customer.first_name} ${customer.last_name} (${customer.email})</p>
        <p>Order ID: ${orderId}</p>
        <p>Bedrag: €85,00</p>
        <p>Tijdstip: ${new Date().toLocaleString('nl-BE')}</p>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[mollie-webhook]', err)
    return NextResponse.json({ error: 'Webhook verwerking mislukt' }, { status: 500 })
  }
}
