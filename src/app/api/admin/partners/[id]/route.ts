export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

// PATCH — partner updaten
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  try {
    const body = await req.json()
    const supabase = createServiceClient()

    // Bouw update object (alleen velden die meegegeven zijn)
    const update: Record<string, unknown> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.business_name !== undefined) update.business_name = body.business_name
    if (body.service_type !== undefined) update.service_type = body.service_type
    if (body.discount_description !== undefined) update.discount_description = body.discount_description
    if (body.fee_per_customer !== undefined) update.fee_per_customer = body.fee_per_customer
    if (body.notes !== undefined) update.notes = body.notes
    if (body.is_active !== undefined) {
      if (body.is_active === false) {
        // Haal huidige status op zodat we deactivated_at alleen zetten bij eerste deactivatie
        const { data: current } = await supabase
          .from('partners')
          .select('is_active')
          .eq('id', params.id)
          .single()
        update.is_active = false
        if (current?.is_active === true) {
          update.deactivated_at = new Date().toISOString()
        }
      } else {
        update.is_active = true
        update.deactivated_at = null
      }
    }
    if (body.vat_number !== undefined) update.vat_number = body.vat_number
    if (body.billing_address !== undefined) update.billing_address = body.billing_address
    if (body.website !== undefined) update.website = body.website || null
    if (body.phone !== undefined) update.phone = body.phone || null
    if (body.office_address !== undefined) update.office_address = body.office_address || null
    if (body.partner_url !== undefined) update.partner_url = body.partner_url || null
    if (body.has_deal2 !== undefined) update.has_deal2 = body.has_deal2
    if (body.deal1_name !== undefined) update.deal1_name = body.deal1_name || null
    if (body.deal2_name !== undefined) update.deal2_name = body.deal2_name || null
    if (body.deal2_description !== undefined) update.deal2_description = body.deal2_description || null
    if (body.deal2_fee !== undefined) update.deal2_fee = body.deal2_fee || null
    if (body.show_name !== undefined) update.show_name = body.show_name

    const { error } = await supabase.from('partners').update(update).eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/partners PATCH]', err)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
}

// DELETE — partner permanent verwijderen (alleen als inactief)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: partner } = await supabase
    .from('partners')
    .select('id, is_active')
    .eq('id', params.id)
    .single()

  if (!partner) return NextResponse.json({ error: 'Partner niet gevonden' }, { status: 404 })
  if (partner.is_active) return NextResponse.json({ error: 'Deactiveer de partner eerst' }, { status: 400 })

  // Verwijder gekoppelde codes eerst (foreign key constraint)
  await supabase.from('partner_codes').delete().eq('partner_id', params.id)

  const { error } = await supabase.from('partners').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })

  return NextResponse.json({ ok: true })
}

// GET — detailpagina één partner (codes overzicht)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: partner } = await supabase
    .from('partners')
    .select('*')
    .eq('id', params.id)
    .single()

  const { data: codes } = await supabase
    .from('partner_codes')
    .select('code, is_verified, verified_at, created_at, deal_number, customers(first_name, last_name, email)')
    .eq('partner_id', params.id)
    .order('created_at', { ascending: false })

  const deal1Verified = codes?.filter(c => c.is_verified && (c.deal_number ?? 1) === 1).length ?? 0
  const deal2Verified = codes?.filter(c => c.is_verified && c.deal_number === 2).length ?? 0
  const verified = deal1Verified + deal2Verified
  const toInvoice = deal1Verified * Number(partner?.fee_per_customer ?? 0)
    + deal2Verified * Number((partner as unknown as { deal2_fee?: number })?.deal2_fee ?? 0)

  const { data: teamMembers } = await supabase
    .from('partner_team_members')
    .select('id, name, email, is_active, created_at')
    .eq('partner_id', params.id)
    .order('created_at', { ascending: true })

  return NextResponse.json({ partner, codes: codes ?? [], stats: { verified, toInvoice, deal1Verified, deal2Verified }, team_members: teamMembers ?? [] })
}
