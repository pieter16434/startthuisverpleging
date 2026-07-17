import { NextRequest, NextResponse } from 'next/server'
import { mollieClient } from '@/lib/mollie/client'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const REFERRAL_CODE = (process.env.REFERRAL_CODE ?? 'VRIEND20').toUpperCase()

const CheckoutSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  province: z.enum(['ANT', 'LIM', 'OVL', 'VBR', 'WVL']).optional(),
  discount_code: z.string().max(30).optional().transform(s => s?.trim().toUpperCase()),
  marketing_consent: z.boolean().optional().default(false),
  address_street: z.string().max(150).optional().transform(s => s?.trim() || undefined),
  address_postal_code: z.string().max(20).optional().transform(s => s?.trim() || undefined),
  address_city: z.string().max(100).optional().transform(s => s?.trim() || undefined),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CheckoutSchema.parse(body)

    const supabase = createServiceClient()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

    // Valideer kortingscode indien opgegeven
    let applyDiscount = false
    let amountCents = 5000
    let amountEuros = '50.00'
    let influencerId: string | null = null

    if (data.discount_code) {
      if (data.discount_code === REFERRAL_CODE) {
        // Bestaande VRIEND20 referral logica
        const { data: existingCustomer } = await supabase
          .from('customers')
          .select('id')
          .eq('email', data.email.toLowerCase())
          .maybeSingle()

        if (existingCustomer) {
          const { data: usedOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('customer_id', existingCustomer.id)
            .eq('discount_code', REFERRAL_CODE)
            .eq('status', 'paid')
            .maybeSingle()

          if (usedOrder) {
            return NextResponse.json(
              { error: 'Deze kortingscode is al gebruikt voor dit e-mailadres' },
              { status: 400 }
            )
          }
        }

        applyDiscount = true
        amountCents = 4000
        amountEuros = '40.00'
      } else {
        // Controleer of het een influencer code is (actief of binnen 3 maanden grace period)
        const { data: influencer } = await supabase
          .from('influencers')
          .select('id, is_active, deactivated_at')
          .eq('discount_code', data.discount_code)
          .maybeSingle()

        if (!influencer) {
          return NextResponse.json({ error: 'Ongeldige kortingscode' }, { status: 400 })
        }

        // Controleer geldigheid: actief OF binnen 3-maanden grace period
        if (!influencer.is_active) {
          if (!influencer.deactivated_at) {
            return NextResponse.json({ error: 'Ongeldige kortingscode' }, { status: 400 })
          }
          const graceEnd = new Date(influencer.deactivated_at)
          graceEnd.setMonth(graceEnd.getMonth() + 3)
          if (new Date() > graceEnd) {
            return NextResponse.json({ error: 'Ongeldige kortingscode' }, { status: 400 })
          }
        }

        influencerId = influencer.id
        applyDiscount = true
        amountCents = 4000
        amountEuros = '40.00'
      }
    }

    // Koper aanmaken of updaten
    // marketing_consent wordt alleen op true gezet (nooit terug naar false via checkout)
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert(
        {
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          province: data.province ?? null,
          ...(data.marketing_consent ? { marketing_consent: true } : {}),
          ...(data.address_street ? { address_street: data.address_street } : {}),
          ...(data.address_postal_code ? { address_postal_code: data.address_postal_code } : {}),
          ...(data.address_city ? { address_city: data.address_city } : {}),
        },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (customerError) throw customerError

    // Order aanmaken (pending)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        customer_id: customer.id,
        amount_cents: amountCents,
        status: 'pending',
        ...(applyDiscount ? { discount_code: data.discount_code } : {}),
        ...(influencerId ? { influencer_id: influencerId } : {}),
      })
      .select('id')
      .single()

    if (orderError) throw orderError

    // Mollie betaling aanmaken
    const payment = await mollieClient.payments.create({
      amount: { currency: 'EUR', value: amountEuros },
      description: 'Gids — Zelfstandig thuisverpleegkundige worden in Vlaanderen',
      redirectUrl: `${baseUrl}/checkout/success?order_id=${order.id}`,
      webhookUrl: `${baseUrl}/api/webhooks/mollie`,
      metadata: {
        order_id: order.id,
        customer_id: customer.id,
      },
    })

    // Sla Mollie payment ID op
    await supabase
      .from('orders')
      .update({ mollie_payment_id: payment.id })
      .eq('id', order.id)

    return NextResponse.json({ payment_url: payment.getCheckoutUrl() })
  } catch (err) {
    console.error('[checkout]', err)
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Ongeldige gegevens', details: err.issues }, { status: 400 })
    }
    return NextResponse.json({ error: 'Betaling kon niet aangemaakt worden' }, { status: 500 })
  }
}
