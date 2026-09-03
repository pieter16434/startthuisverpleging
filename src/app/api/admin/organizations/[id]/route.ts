export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

// PATCH — organisatie bijwerken
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  try {
    const body = await req.json()
    const supabase = createServiceClient()

    const update: Record<string, unknown> = {}
    if (body.notes !== undefined) update.notes = body.notes
    if (body.fee_per_customer !== undefined) update.fee_per_customer = body.fee_per_customer
    if (body.vat_number !== undefined) update.vat_number = body.vat_number
    if (body.billing_address !== undefined) update.billing_address = body.billing_address
    if (body.bundle_invoicing !== undefined) update.bundle_invoicing = body.bundle_invoicing
    if (body.discount_description !== undefined) update.discount_description = body.discount_description
    if (body.is_active !== undefined) update.is_active = body.is_active
    if (body.show_name !== undefined) update.show_name = body.show_name
    if (body.has_deal2 !== undefined) update.has_deal2 = body.has_deal2
    if (body.deal1_name !== undefined) update.deal1_name = body.deal1_name || null
    if (body.deal2_name !== undefined) update.deal2_name = body.deal2_name || null
    if (body.deal2_description !== undefined) update.deal2_description = body.deal2_description || null
    if (body.deal2_fee !== undefined) update.deal2_fee = body.deal2_fee ?? null

    const { error } = await supabase.from('organizations').update(update).eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/organizations PATCH]', err)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
}

// PATCH kantoor (office) bijwerken — via /api/admin/organizations/[id]/offices/[officeId]
// Hier: GET detail van één organisatie + kantoren + codes
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: org } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', params.id)
    .single()

  const { data: offices } = await supabase
    .from('organization_offices')
    .select('*')
    .eq('organization_id', params.id)
    .order('province', { ascending: true })

  const { data: codes } = await supabase
    .from('organization_codes')
    .select('id, code, is_verified, verified_at, verified_by_office_id, office_id, created_at, customers(first_name, last_name, province)')
    .eq('organization_id', params.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ org, offices: offices ?? [], codes: codes ?? [] })
}

// DELETE — organisatie verwijderen (alleen als inactief)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: org } = await supabase.from('organizations').select('id, is_active').eq('id', params.id).single()
  if (!org) return NextResponse.json({ error: 'Niet gevonden' }, { status: 404 })
  if (org.is_active) return NextResponse.json({ error: 'Deactiveer eerst' }, { status: 400 })

  await supabase.from('organization_codes').delete().eq('organization_id', params.id)
  await supabase.from('organization_offices').delete().eq('organization_id', params.id)
  const { error } = await supabase.from('organizations').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
