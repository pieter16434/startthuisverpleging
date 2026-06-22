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

    if (data.discount_code) {
      if (data.discount_code !== REFERRAL_CODE) {
        return NextResponse.json({ error: 'Ongeldige kortingscode' }, { status: 400 })
      }

      // Check of dit e-mailadres de code al gebruikt heeft op een betaalde order
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
      amountCents = 4000 // 20% korting op €50
      amountEuros = '40.00'
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
        ...(applyDiscount ? { discount_code: REFERRAL_CODE } : {}),
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
