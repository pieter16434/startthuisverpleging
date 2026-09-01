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
    .from('organization_onboarding_tokens')
    .select('expires_at, used_at')
    .eq('token', token)
    .single()

  if (!data) return NextResponse.json({ error: 'Ongeldige link.' }, { status: 404 })
  if (data.used_at) return NextResponse.json({ error: 'Deze link is al gebruikt. Neem contact op via info@domuscare.be.' }, { status: 410 })
  if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: 'Deze link is verlopen (geldig 7 dagen). Neem contact op via info@domuscare.be.' }, { status: 410 })

  return NextResponse.json({ ok: true })
}

const Schema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100),
  business_name: z.string().min(1).max(100),
  email: z.string().email(),
  service_type: z.string().min(1).max(100),
  discount_description: z.string().max(500).optional(),
  fee_per_customer: z.number().min(0),
  code_mode: z.enum(['shared', 'per_office']),
  offices_have_own_description: z.boolean(),
  offices_have_own_billing: z.boolean(),
  vat_number: z.string().max(50).optional(),
  billing_address: z.string().max(300).optional(),
  website: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  show_name: z.boolean().optional(),
  password: z.string().min(8),
})

// POST — organisatie aanmaken
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = Schema.parse(body)

    const supabase = createServiceClient()

    const { data: tokenRow } = await supabase
      .from('organization_onboarding_tokens')
      .select('id, expires_at, used_at')
      .eq('token', data.token)
      .single()

    if (!tokenRow) return NextResponse.json({ error: 'Ongeldige link.' }, { status: 404 })
    if (tokenRow.used_at) return NextResponse.json({ error: 'Link al gebruikt.' }, { status: 410 })
    if (new Date(tokenRow.expires_at) < new Date()) return NextResponse.json({ error: 'Link verlopen.' }, { status: 410 })

    // Als org zelf aanbod invult (geen per-kantoor-beschrijving): vereist
    if (!data.offices_have_own_description && (!data.discount_description || data.discount_description.trim() === '')) {
      return NextResponse.json({ error: 'Aanbod omschrijving is verplicht.' }, { status: 400 })
    }

    const password_hash = await bcrypt.hash(data.password, 12)

    const { error: orgError } = await supabase.from('organizations').insert({
      name: data.name,
      business_name: data.business_name,
      email: data.email.toLowerCase(),
      password_hash,
      service_type: data.service_type,
      discount_description: data.discount_description ?? '',
      fee_per_customer: data.fee_per_customer,
      code_mode: data.code_mode,
      offices_have_own_description: data.offices_have_own_description,
      offices_have_own_billing: data.offices_have_own_billing,
      bundle_invoicing: false,
      vat_number: data.vat_number || null,
      billing_address: data.billing_address || null,
      website: data.website || null,
      phone: data.phone || null,
      show_name: data.show_name ?? true,
      is_active: true,
    })

    if (orgError) {
      if (orgError.code === '23505') return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik.' }, { status: 409 })
      throw orgError
    }

    await supabase
      .from('organization_onboarding_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    console.error('[organization/onboarding POST]', err)
    return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  }
}
