export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// GET — token valideren
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Geen token' }, { status: 400 })

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('partner_onboarding_tokens')
    .select('expires_at, used_at')
    .eq('token', token)
    .single()

  if (!data) return NextResponse.json({ error: 'Ongeldige link.' }, { status: 404 })
  if (data.used_at) return NextResponse.json({ error: 'Deze link is al gebruikt. Neem contact op via info@domuscare.be.' }, { status: 410 })
  if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: 'Deze link is verlopen (geldig 7 dagen). Neem contact op via info@domuscare.be.' }, { status: 410 })

  return NextResponse.json({ ok: true })
}

// POST — partner aanmaken vanuit onboarding formulier
const Schema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, 'Naam is verplicht').max(100),
  business_name: z.string().min(1, 'Bedrijfsnaam is verplicht').max(100),
  email: z.string().email('Ongeldig e-mailadres'),
  province: z.enum(['ANT', 'LIM', 'OVL', 'VBR', 'WVL', 'VLA']),
  service_type: z.string().min(1, 'Type dienst is verplicht').max(100),
  discount_description: z.string().min(1, 'Beschrijving is verplicht').max(500),
  vat_number: z.string().min(1, 'BTW-nummer is verplicht').max(50),
  billing_address: z.string().min(1, 'Facturatieadres is verplicht').max(300),
  fee_per_customer: z.number().min(25, 'Minimum vergoeding is €25'),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens bevatten'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = Schema.parse(body)

    const supabase = createServiceClient()

    // Token valideren
    const { data: tokenRow } = await supabase
      .from('partner_onboarding_tokens')
      .select('id, expires_at, used_at')
      .eq('token', data.token)
      .single()

    if (!tokenRow) return NextResponse.json({ error: 'Ongeldige link.' }, { status: 404 })
    if (tokenRow.used_at) return NextResponse.json({ error: 'Deze link is al gebruikt.' }, { status: 410 })
    if (new Date(tokenRow.expires_at) < new Date()) return NextResponse.json({ error: 'Link verlopen.' }, { status: 410 })

    const password_hash = await bcrypt.hash(data.password, 12)

    const { error: partnerError } = await supabase.from('partners').insert({
      name: data.name,
      business_name: data.business_name,
      email: data.email.toLowerCase(),
      password_hash,
      invite_token: null,
      invite_token_expires_at: null,
      province: data.province,
      service_type: data.service_type,
      discount_description: data.discount_description,
      fee_per_customer: data.fee_per_customer,
      vat_number: data.vat_number,
      billing_address: data.billing_address,
      is_active: true,
      partner_type: 'service',
    })

    if (partnerError) {
      if (partnerError.code === '23505') {
        return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik.' }, { status: 409 })
      }
      throw partnerError
    }

    // Token als gebruikt markeren
    await supabase
      .from('partner_onboarding_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    }
    console.error('[partner/onboarding POST]', err)
    return NextResponse.json({ error: 'Profiel aanmaken mislukt' }, { status: 500 })
  }
}
