export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'
import { randomBytes } from 'crypto'

// GET — alle influencers ophalen met gebruik-statistieken
export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  const { data: influencers } = await supabase
    .from('influencers')
    .select('*')
    .order('created_at', { ascending: false })

  // Tel betaalde orders per influencer
  const { data: useCounts } = await supabase
    .from('orders')
    .select('influencer_id')
    .eq('status', 'paid')
    .not('influencer_id', 'is', null)

  const useMap: Record<string, number> = {}
  useCounts?.forEach(r => {
    if (r.influencer_id) useMap[r.influencer_id] = (useMap[r.influencer_id] ?? 0) + 1
  })

  const result = (influencers ?? []).map(inf => ({
    ...inf,
    total_uses: useMap[inf.id] ?? 0,
    total_earnings: (useMap[inf.id] ?? 0) * inf.payout_per_use,
  }))

  return NextResponse.json({ influencers: result })
}

// POST — onboarding link genereren voor nieuwe influencer
export async function POST() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const token = randomBytes(32).toString('hex')
  const expires = new Date()
  expires.setDate(expires.getDate() + 7)

  const supabase = createServiceClient()
  const { error } = await supabase.from('influencer_onboarding_tokens').insert({
    token,
    expires_at: expires.toISOString(),
  })

  if (error) return NextResponse.json({ error: 'Link aanmaken mislukt' }, { status: 500 })

  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/influencer/onboarding?token=${token}`
  return NextResponse.json({ url })
}
