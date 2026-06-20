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

    const { error } = await supabase.from('partners').update(update).eq('id', params.id)
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/partners PATCH]', err)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
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
    .select('code, is_verified, verified_at, created_at, customers(first_name, last_name, email)')
    .eq('partner_id', params.id)
    .order('created_at', { ascending: false })

  const verified = codes?.filter(c => c.is_verified).length ?? 0
  const toInvoice = verified * Number(partner?.fee_per_customer ?? 0)

  return NextResponse.json({ partner, codes: codes ?? [], stats: { verified, toInvoice } })
}
