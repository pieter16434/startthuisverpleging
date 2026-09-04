export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { randomBytes } from 'crypto'

// GET — alle organisaties ophalen
export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  // Probeer met alle kolommen inclusief show_name en deal2; fallback zonder als migratie nog niet is uitgevoerd
  const { data: orgs, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, business_name, email, service_type, discount_description, fee_per_customer, is_active, code_mode, bundle_invoicing, offices_have_own_description, offices_have_own_billing, notes, vat_number, billing_address, website, phone, created_at, show_name, has_deal2, deal1_name, deal2_name, deal2_description, deal2_fee')
    .order('created_at', { ascending: false })

  const orgRows = orgsError
    ? ((await supabase.from('organizations').select('id, name, business_name, email, service_type, discount_description, fee_per_customer, is_active, code_mode, bundle_invoicing, offices_have_own_description, offices_have_own_billing, notes, vat_number, billing_address, website, phone, created_at').order('created_at', { ascending: false })).data ?? [])
    : (orgs ?? [])

  // Tel kantoren per organisatie — inclusief show_name en deal2 velden
  const { data: offices, error: officesError } = await supabase
    .from('organization_offices')
    .select('id, organization_id, name, business_name, email, province, province_2, is_active, fee_per_customer, phone, website, office_address, discount_description, vat_number, billing_address, notes, show_name, deal2_description, deal2_fee')

  // Fallback als nieuwere kolommen nog niet bestaan in de DB
  const officeRows = officesError
    ? ((await supabase.from('organization_offices').select('id, organization_id, name, business_name, email, province, is_active, fee_per_customer, phone, website, office_address, discount_description, vat_number, billing_address, notes')).data ?? [])
    : (offices ?? [])

  // Tel geverifieerde codes per organisatie
  const { data: verifiedCodes } = await supabase
    .from('organization_codes')
    .select('organization_id, office_id, verified_by_office_id')
    .eq('is_verified', true)

  const result = orgRows?.map((org: Record<string, unknown>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orgOffices = (officeRows as any[])?.filter((o: { organization_id: string }) => o.organization_id === org.id) ?? []
    const orgVerified = verifiedCodes?.filter((c: { organization_id: string }) => c.organization_id === org.id).length ?? 0
    return {
      ...org,
      show_name: (org.show_name as boolean | undefined) ?? true,
      has_deal2: (org.has_deal2 as boolean | undefined) ?? false,
      deal1_name: (org.deal1_name as string | null | undefined) ?? null,
      deal2_name: (org.deal2_name as string | null | undefined) ?? null,
      deal2_description: (org.deal2_description as string | null | undefined) ?? null,
      deal2_fee: (org.deal2_fee as number | null | undefined) ?? null,
      offices: orgOffices.map((o: Record<string, unknown>) => ({
        ...o,
        show_name: (o.show_name as boolean | undefined) ?? true,
        deal2_description: (o.deal2_description as string | null | undefined) ?? null,
        deal2_fee: (o.deal2_fee as number | null | undefined) ?? null,
      })),
      verified_codes: orgVerified,
    }
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
