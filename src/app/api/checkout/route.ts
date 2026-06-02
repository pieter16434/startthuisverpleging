import { NextRequest, NextResponse } from 'next/server'
import { mollieClient } from '@/lib/mollie/client'
import { createServiceClient } from '@/lib/supabase/server'
import { z } from 'zod'

const CheckoutSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1).max(50),
  last_name: z.string().min(1).max(50),
  province: z.enum(['ANT', 'LIM', 'OVL', 'VBR', 'WVL']).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = CheckoutSchema.parse(body)

    const supabase = createServiceClient()
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!

    // Koper aanmaken of updaten
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert(
        {
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          province: data.province ?? null,
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
        amount_cents: 8500,
        status: 'pending',
      })
      .select('id')
      .single()

    if (orderError) throw orderError

    // Mollie betaling aanmaken
    const payment = await mollieClient.payments.create({
      amount: { currency: 'EUR', value: '85.00' },
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
