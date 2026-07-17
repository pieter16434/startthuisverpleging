export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

// PATCH — influencer gegevens aanpassen (inclusief kortingscode)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  try {
    const body = await req.json()
    const supabase = createServiceClient()

    const update: Record<string, unknown> = {}
    if (body.name !== undefined) update.name = body.name
    if (body.email !== undefined) update.email = body.email?.toLowerCase()
    if (body.platform !== undefined) update.platform = body.platform
    if (body.social_handle !== undefined) update.social_handle = body.social_handle
    if (body.profile_url !== undefined) update.profile_url = body.profile_url || null
    if (body.discount_code !== undefined) update.discount_code = body.discount_code?.trim().toUpperCase()
    if (body.iban !== undefined) update.iban = body.iban || null
    if (body.iban_name !== undefined) update.iban_name = body.iban_name || null
    if (body.notes !== undefined) update.notes = body.notes || null

    const { error } = await supabase.from('influencers').update(update).eq('id', params.id)
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Deze kortingscode is al in gebruik' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[admin/influencers PATCH]', err)
    return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
  }
}

// DELETE — influencer deactiveren (soft delete, 3 maanden grace period)
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  const { error } = await supabase
    .from('influencers')
    .update({ is_active: false, deactivated_at: new Date().toISOString() })
    .eq('id', params.id)
    .is('deactivated_at', null)

  if (error) return NextResponse.json({ error: 'Deactiveren mislukt' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
