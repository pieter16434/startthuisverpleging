export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

// DELETE — teamlid verwijderen
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; memberId: string } }
) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  // Controleer dat het teamlid bij deze partner hoort
  const { data: member } = await supabase
    .from('partner_team_members')
    .select('id, partner_id, name, email')
    .eq('id', params.memberId)
    .eq('partner_id', params.id)
    .single()

  if (!member) return NextResponse.json({ error: 'Teamlid niet gevonden' }, { status: 404 })

  const { error } = await supabase
    .from('partner_team_members')
    .delete()
    .eq('id', params.memberId)

  if (error) return NextResponse.json({ error: 'Verwijderen mislukt' }, { status: 500 })

  return NextResponse.json({ ok: true, name: member.name })
}
