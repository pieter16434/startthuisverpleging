export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import crypto from 'crypto'

// POST — uitnodigingslink genereren voor een kantoor-teamlid
export async function POST(
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

  const token = crypto.randomBytes(32).toString('hex')
  const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await supabase.from('office_team_invite_tokens').insert({
    office_id: params.officeId,
    token,
    expires_at,
  })

  if (error) return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://startthuisverpleging.be'
  return NextResponse.json({ url: `${baseUrl}/office/teamlid?token=${token}` })
}
