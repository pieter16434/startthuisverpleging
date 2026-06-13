export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()

  // Alle geverifieerde codes ophalen met partner info
  const { data: codes } = await supabase
    .from('partner_codes')
    .select('partner_id, verified_at, partners(name, business_name, fee_per_customer, province)')
    .eq('is_verified', true)
    .not('verified_at', 'is', null)
    .order('verified_at', { ascending: false })

  if (!codes) return NextResponse.json({ monthly: {} })

  // Groepeer per partner, per maand
  type MonthEntry = { count: number; amount: number }
  type PartnerMonthly = {
    name: string
    business_name: string
    province: string
    fee: number
    months: Record<string, MonthEntry> // key: "2026-06"
  }
  const result: Record<string, PartnerMonthly> = {}

  for (const code of codes) {
    const p = code.partners as unknown as { name: string; business_name: string; fee_per_customer: number; province: string } | null
    if (!p || !code.verified_at) continue

    const partnerId = code.partner_id
    const monthKey = code.verified_at.slice(0, 7) // "2026-06"

    if (!result[partnerId]) {
      result[partnerId] = {
        name: p.name,
        business_name: p.business_name,
        province: p.province,
        fee: Number(p.fee_per_customer),
        months: {},
      }
    }

    const entry = result[partnerId]
    if (!entry.months[monthKey]) {
      entry.months[monthKey] = { count: 0, amount: 0 }
    }
    entry.months[monthKey].count += 1
    entry.months[monthKey].amount += Number(p.fee_per_customer)
  }

  return NextResponse.json({ monthly: result })
}
