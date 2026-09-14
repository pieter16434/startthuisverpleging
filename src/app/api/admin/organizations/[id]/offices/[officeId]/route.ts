export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { migrateOfficeProvince, regenerateCodebookForOrder } from '@/lib/codebook/regenerate'

// PATCH — kantoor bijwerken
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
    if (body.province_2 !== undefined) update.province_2 = body.province_2 || null
    if (body.name !== undefined) update.name = body.name
    if (body.email !== undefined) update.email = body.email
    if (body.business_name !== undefined) update.business_name = body.business_name
    if (body.fee_per_customer !== undefined) update.fee_per_customer = body.fee_per_customer ?? null
    if (body.discount_description !== undefined) update.discount_description = body.discount_description || null
    if (body.vat_number !== undefined) update.vat_number = body.vat_number || null
    if (body.billing_address !== undefined) update.billing_address = body.billing_address || null
    if (body.is_active !== undefined) update.is_active = body.is_active
    if (body.website !== undefined) update.website = body.website || null
    if (body.phone !== undefined) update.phone = body.phone || null
    if (body.office_address !== undefined) update.office_address = body.office_address || null
    if (body.show_name !== undefined) update.show_name = body.show_name
    if (body.deal2_description !== undefined) update.deal2_description = body.deal2_description || null
    if (body.deal2_fee !== undefined) update.deal2_fee = body.deal2_fee ?? null

    // ── Provincie-wijziging: migreer codeboeken ──────────────────────────────
    let provinceMigration: {
      newProvince: string; hasDeal2: boolean; deal2Description: string | null
    } | null = null

    if (body.province !== undefined) {
      // Haal huidige status op
      const { data: current } = await supabase
        .from('organization_offices')
        .select('province, is_active, organization_id, deal2_description')
        .eq('id', params.officeId)
        .eq('organization_id', params.id)
        .single()

      const oldProvince = current?.province as string | undefined
      const newProvince = body.province as string

      update.province = newProvince

      // Migreer alleen als provincie daadwerkelijk verandert én kantoor actief is
      if (oldProvince && oldProvince !== newProvince && current?.is_active === true) {
        // Controleer code_mode van de organisatie
        const { data: org } = await supabase
          .from('organizations')
          .select('code_mode, has_deal2, deal2_description')
          .eq('id', params.id)
          .single()

        // Alleen per_office mode: codes zijn gekoppeld aan het kantoor
        if (org?.code_mode === 'per_office') {
          provinceMigration = {
            newProvince,
            hasDeal2: org.has_deal2 ?? false,
            deal2Description: current.deal2_description ?? org.deal2_description ?? null,
          }
        }
        // shared mode: codes zitten op org-niveau → niet automatisch migreren
        // (shared codes worden door de org gedeeld ongeacht kantoor)
      }
    }

    const { error } = await supabase
      .from('organization_offices')
      .update(update)
      .eq('id', params.officeId)
      .eq('organization_id', params.id)

    if (error) throw error

    // ── Codeboek-migratie uitvoeren na de update ─────────────────────────────
    if (provinceMigration) {
      const { newProvince, hasDeal2, deal2Description } = provinceMigration
      console.log(`[office province] ${params.officeId}: → ${newProvince}`)
      const affectedOrderIds = await migrateOfficeProvince(
        params.id, params.officeId, newProvince, hasDeal2, deal2Description
      )
      console.log(`[office province] Codeboeken regenereren voor ${affectedOrderIds.length} orders…`)
      for (const orderId of affectedOrderIds) {
        await regenerateCodebookForOrder(orderId)
      }
      console.log(`[office province] Migratie voltooid.`)
      return NextResponse.json({ ok: true, migrated: affectedOrderIds.length })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/offices PATCH]', err)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
}

// GET — kantoor detail incl. teamleden
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; officeId: string } }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: teamMembers } = await supabase
    .from('office_team_members')
    .select('id, name, email, is_active, created_at')
    .eq('office_id', params.officeId)
    .order('created_at', { ascending: true })

  return NextResponse.json({ team_members: teamMembers ?? [] })
}

// DELETE — kantoor permanent verwijderen
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; officeId: string } }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  // Verifieer dat het kantoor bij deze organisatie hoort
  const { data: office } = await supabase
    .from('organization_offices')
    .select('id')
    .eq('id', params.officeId)
    .eq('organization_id', params.id)
    .single()

  if (!office) return NextResponse.json({ error: 'Kantoor niet gevonden' }, { status: 404 })

  const { error } = await supabase
    .from('organization_offices')
    .delete()
    .eq('id', params.officeId)

  if (error) return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
