export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getInfluencerSession } from '@/lib/influencer/auth'

export async function GET() {
  try {
    const session = await getInfluencerSession()
    if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

    const supabase = createServiceClient()

    const { data: influencer } = await supabase
      .from('influencers')
      .select('id, name, platform, social_handle, profile_url, discount_code, payout_per_use, is_active, deactivated_at')
      .eq('id', session.influencerId)
      .single()

    if (!influencer) return NextResponse.json({ error: 'Account niet gevonden' }, { status: 404 })

    // Alle betaalde orders met deze influencer_id
    const { data: orders } = await supabase
      .from('orders')
      .select('id, paid_at, amount_cents')
      .eq('influencer_id', session.influencerId)
      .eq('status', 'paid')
      .order('paid_at', { ascending: false })

    const totalUses = orders?.length ?? 0
    const totalEarnings = totalUses * influencer.payout_per_use

    // Maandoverzicht opbouwen
    const monthlyMap: Record<string, { uses: number; earnings: number }> = {}
    orders?.forEach(o => {
      const date = new Date(o.paid_at ?? '')
      if (isNaN(date.getTime())) return
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!monthlyMap[key]) monthlyMap[key] = { uses: 0, earnings: 0 }
      monthlyMap[key].uses += 1
      monthlyMap[key].earnings += influencer.payout_per_use
    })

    const monthly = Object.entries(monthlyMap)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([month, data]) => ({ month, ...data }))

    // Grace period berekenen
    let graceEndsAt: string | null = null
    if (influencer.deactivated_at) {
      const graceEnd = new Date(influencer.deactivated_at)
      graceEnd.setMonth(graceEnd.getMonth() + 3)
      graceEndsAt = graceEnd.toISOString()
    }

    return NextResponse.json({
      influencer: { ...influencer, graceEndsAt },
      stats: { totalUses, totalEarnings },
      monthly,
    })
  } catch (err) {
    console.error('[influencer/dashboard]', err)
    return NextResponse.json({ error: 'Data ophalen mislukt' }, { status: 500 })
  }
}
