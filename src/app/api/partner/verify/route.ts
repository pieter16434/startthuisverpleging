export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getPartnerSession } from '@/lib/partner/auth'
import { z } from 'zod'

const Schema = z.object({
  code: z.string().min(3).max(30).transform(s => s.trim().toUpperCase()),
})

export async function POST(req: NextRequest) {
  try {
    const session = await getPartnerSession()
    if (!session) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const body = await req.json()
    const { code } = Schema.parse(body)

    const supabase = createServiceClient()

    // Zoek de code op
    const { data: partnerCode, error } = await supabase
      .from('partner_codes')
      .select('*, customers(first_name, last_name, email), orders(paid_at)')
      .eq('code', code)
      .single()

    if (error || !partnerCode) {
      return NextResponse.json({
        valid: false,
        message: 'Deze code is niet gevonden. Controleer de code en probeer opnieuw.',
      })
    }

    // Check of de code bij deze partner hoort
    if (partnerCode.partner_id !== session.partnerId) {
      return NextResponse.json({
        valid: false,
        message: 'Deze code is niet gekoppeld aan uw partneraccount.',
      })
    }

    // Check of al eerder geverifieerd
    if (partnerCode.is_verified) {
      return NextResponse.json({
        valid: true,
        alreadyVerified: true,
        message: `Deze code werd al geverifieerd op ${new Date(partnerCode.verified_at).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
        customer: {
          first_name: partnerCode.customers.first_name,
          last_name: partnerCode.customers.last_name,
        },
        verified_at: partnerCode.verified_at,
      })
    }

    // Markeer als geverifieerd
    await supabase
      .from('partner_codes')
      .update({ is_verified: true, verified_at: new Date().toISOString() })
      .eq('id', partnerCode.id)

    return NextResponse.json({
      valid: true,
      alreadyVerified: false,
      message: '✓ Code succesvol geverifieerd. Deze klant heeft de gids van startthuisverpleging.be aangeschaft.',
      customer: {
        first_name: partnerCode.customers.first_name,
        last_name: partnerCode.customers.last_name,
      },
      verified_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[partner/verify]', err)
    return NextResponse.json({ error: 'Verificatie mislukt' }, { status: 500 })
  }
}
