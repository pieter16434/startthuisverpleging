import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('id, amount_cents, status, created_at, paid_at, customers(first_name, last_name, email, province)')
    .order('created_at', { ascending: false })
    .limit(200)

  const total = orders?.filter(o => o.status === 'paid').length ?? 0
  const revenue = total * 85

  return NextResponse.json({ orders: orders ?? [], stats: { total, revenue } })
}
