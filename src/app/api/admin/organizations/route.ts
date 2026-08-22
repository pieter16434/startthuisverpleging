export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { randomBytes } from 'crypto'

// GET — alle organisaties ophalen
export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, business_name, email, service_type, fee_per_customer, is_active, code_mode, bundle_invoicing, offices_have_own_description, offices_have_own_billing, notes, vat_number, billing_address, created_at')
    .order('created_at', { ascending: false })

  // Tel kantoren per organisatie
  const { data: offices } = await supabase
    .from('organization_offices')
    .select('id, organization_id, business_name, province, is_active, fee_per_customer')

  // Tel geverifieerde codes per organisatie
  const { data: verifiedCodes } = await supabase
    .from('organization_codes')
    .select('organization_id, office_id, verified_by_office_id')
    .eq('is_verified', true)

  const result = orgs?.map(org => {
    const orgOffices = offices?.filter(o => o.organization_id === org.id) ?? []
    const orgVerified = verifiedCodes?.filter(c => c.organization_id === org.id).length ?? 0
    return { ...org, offices: orgOffices, verified_codes: orgVerified }
  })

  return NextResponse.json({ organizations: result ?? [] })
}

// POST — genereer onboarding link voor een nieuwe organisatie
export async function POST() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const token = randomBytes(32).toString('hex')
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)

  const supabase = createServiceClient()
  const { error } = await supabase.from('organization_onboarding_tokens').insert({
    token,
    expires_at: expires.toISOString(),
  })

  if (error) return NextResponse.json({ error: 'Link aanmaken mislukt' }, { status: 500 })

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/organisatie/onboarding?token=${token}`
  return NextResponse.json({ url })
}
