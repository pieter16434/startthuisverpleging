export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { randomBytes } from 'crypto'

// POST — genereer een uitnodigingslink voor een partner (nieuw of wachtwoord resetten)
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const token = randomBytes(32).toString('hex')
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)

  const supabase = createServiceClient()
  const { error } = await supabase
    .from('partners')
    .update({
      invite_token: token,
      invite_token_expires_at: expires.toISOString(),
    })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: 'Token aanmaken mislukt' }, { status: 500 })

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/partner/instellen?token=${token}`
  return NextResponse.json({ url })
}
