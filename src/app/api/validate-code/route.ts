export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

const REFERRAL_CODE = (process.env.REFERRAL_CODE ?? 'VRIEND20').toUpperCase()

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.trim().toUpperCase()
  if (!code) return NextResponse.json({ valid: false })

  if (code === REFERRAL_CODE) {
    return NextResponse.json({ valid: true, type: 'referral' })
  }

  const supabase = createServiceClient()
  const { data: influencer } = await supabase
    .from('influencers')
    .select('id, is_active, deactivated_at')
    .eq('discount_code', code)
    .maybeSingle()

  if (!influencer) return NextResponse.json({ valid: false })

  if (!influencer.is_active) {
    if (!influencer.deactivated_at) return NextResponse.json({ valid: false })
    const graceEnd = new Date(influencer.deactivated_at)
    graceEnd.setMonth(graceEnd.getMonth() + 3)
    if (new Date() > graceEnd) return NextResponse.json({ valid: false })
  }

  return NextResponse.json({ valid: true, type: 'influencer' })
}
