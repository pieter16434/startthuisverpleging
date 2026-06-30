export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { randomBytes } from 'crypto'

export async function POST() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const token = randomBytes(32).toString('hex')
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)

  const supabase = createServiceClient()
  const { error } = await supabase.from('partner_onboarding_tokens').insert({
    token,
    expires_at: expires.toISOString(),
  })

  if (error) return NextResponse.json({ error: 'Link aanmaken mislukt' }, { status: 500 })

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/partner/onboarding?token=${token}`
  return NextResponse.json({ url })
}
