export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const PROVINCES: Record<string, string> = {
  ANT: 'Antwerpen', LIM: 'Limburg', OVL: 'Oost-Vlaanderen',
  VBR: 'Vlaams-Brabant', WVL: 'West-Vlaanderen',
}

// GET — token valideren + org-info ophalen
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Geen token' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: tokenRow } = await supabase
    .from('office_onboarding_tokens')
    .select('expires_at, used_at, organization_id')
    .eq('token', token)
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'Ongeldige link.' }, { status: 404 })
  if (tokenRow.used_at) return NextResponse.json({ error: 'Deze link is al gebruikt. Neem contact op via info@domuscare.be.' }, { status: 410 })
  if (new Date(tokenRow.expires_at) < new Date()) return NextResponse.json({ error: 'Deze link is verlopen. Neem contact op via info@domuscare.be.' }, { status: 410 })

  // Haal org-info op zodat het formulier context kan tonen
  const { data: org } = await supabase
    .from('organizations')
    .select('business_name, service_type, discount_description, fee_per_customer, offices_have_own_description, offices_have_own_billing, code_mode, has_deal2, deal1_name, deal2_name, deal2_description, deal2_fee')
    .eq('id', tokenRow.organization_id)
    .single()

  return NextResponse.json({ ok: true, org, provinces: PROVINCES })
}

const Schema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100),
  business_name: z.string().min(1).max(100),
  email: z.string().email(),
  province: z.enum(['ANT', 'LIM', 'OVL', 'VBR', 'WVL']),
  province_2: z.enum(['ANT', 'LIM', 'OVL', 'VBR', 'WVL']).optional(),
  website: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  office_address: z.string().max(300).optional(),
  // Eigen beschrijving (alleen als offices_have_own_description)
  discount_description: z.string().max(500).optional(),
  // Eigen billing (alleen als offices_have_own_billing)
  vat_number: z.string().max(50).optional(),
  billing_address: z.string().max(300).optional(),
  fee_per_customer: z.number().min(0).optional(),
  show_name: z.boolean().optional(),
  deal2_description: z.string().max(500).optional(),
  deal2_fee: z.number().min(0).optional(),
  password: z.string().min(8),
})

// POST — kantoor aanmaken
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = Schema.parse(body)

    const supabase = createServiceClient()

    const { data: tokenRow } = await supabase
      .from('office_onboarding_tokens')
      .select('id, expires_at, used_at, organization_id')
      .eq('token', data.token)
      .single()

    if (!tokenRow) return NextResponse.json({ error: 'Ongeldige link.' }, { status: 404 })
    if (tokenRow.used_at) return NextResponse.json({ error: 'Link al gebruikt.' }, { status: 410 })
    if (new Date(tokenRow.expires_at) < new Date()) return NextResponse.json({ error: 'Link verlopen.' }, { status: 410 })

    // Controleer of er al een kantoor is voor deze provincie in deze org
    const { data: existing } = await supabase
      .from('organization_offices')
      .select('id')
      .eq('organization_id', tokenRow.organization_id)
      .eq('province', data.province)
      .single()

    if (existing) {
      return NextResponse.json({ error: `Er bestaat al een kantoor voor de provincie ${data.province} in deze organisatie.` }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(data.password, 12)

    const { error: officeError } = await supabase.from('organization_offices').insert({
      organization_id: tokenRow.organization_id,
      name: data.name,
      business_name: data.business_name,
      email: data.email.toLowerCase(),
      password_hash,
      province: data.province,
      province_2: data.province_2 || null,
      show_name: data.show_name ?? true,
      is_active: true,
      discount_description: data.discount_description || null,
      fee_per_customer: data.fee_per_customer ?? null,
      vat_number: data.vat_number || null,
      billing_address: data.billing_address || null,
      website: data.website || null,
      phone: data.phone || null,
      office_address: data.office_address || null,
      deal2_description: data.deal2_description || null,
      deal2_fee: data.deal2_fee ?? null,
    })

    if (officeError) {
      if (officeError.code === '23505') return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik.' }, { status: 409 })
      throw officeError
    }

    await supabase
      .from('office_onboarding_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    console.error('[office/onboarding POST]', err)
    return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  }
}
