export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

// PATCH — kantoor bijwerken (fee, description, notes, is_active)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; officeId: string } }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  try {
    const body = await req.json()
    const supabase = createServiceClient()

    const update: Record<string, unknown> = {}
    if (body.notes !== undefined) update.notes = body.notes
    if (body.fee_per_customer !== undefined) update.fee_per_customer = body.fee_per_customer ?? null
    if (body.discount_description !== undefined) update.discount_description = body.discount_description || null
    if (body.vat_number !== undefined) update.vat_number = body.vat_number || null
    if (body.billing_address !== undefined) update.billing_address = body.billing_address || null
    if (body.is_active !== undefined) update.is_active = body.is_active
    if (body.website !== undefined) update.website = body.website || null
    if (body.phone !== undefined) update.phone = body.phone || null
    if (body.office_address !== undefined) update.office_address = body.office_address || null

    const { error } = await supabase
      .from('organization_offices')
      .update(update)
      .eq('id', params.officeId)
      .eq('organization_id', params.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/offices PATCH]', err)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
}
