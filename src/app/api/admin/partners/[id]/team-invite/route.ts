export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { randomBytes } from 'crypto'

// POST — genereer uitnodigingslink voor een nieuw teamlid
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: partner } = await supabase
    .from('partners')
    .select('id, business_name')
    .eq('id', params.id)
    .single()

  if (!partner) return NextResponse.json({ error: 'Partner niet gevonden' }, { status: 404 })

  const token = randomBytes(32).toString('hex')
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)

  const { error } = await supabase.from('partner_team_invite_tokens').insert({
    partner_id: params.id,
    token,
    expires_at: expires.toISOString(),
  })

  if (error) return NextResponse.json({ error: 'Link aanmaken mislukt' }, { status: 500 })

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/partner/teamlid?token=${token}`
  return NextResponse.json({ url, partner_name: partner.business_name })
}
