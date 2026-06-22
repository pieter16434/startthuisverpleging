export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

export async function GET() {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()
  const { data: orders } = await supabase
    .from('orders')
    .select('id, amount_cents, status, created_at, paid_at, pdf_main_url, invoice_number, customers(first_name, last_name, email, province)')
    .order('created_at', { ascending: false })
    .limit(200)

  const paidOrders = orders?.filter(o => o.status === 'paid') ?? []
  const total = paidOrders.length
  const revenue = paidOrders.reduce((sum, o) => sum + (o.amount_cents ?? 0), 0) / 100
  const pdfPending = paidOrders.filter(o => !o.pdf_main_url).length

  // Maandelijkse omzet
  const now = new Date()
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

  const revenueThisMonth = paidOrders
    .filter(o => (o.paid_at ?? o.created_at).slice(0, 7) === thisMonth)
    .reduce((sum, o) => sum + (o.amount_cents ?? 0), 0) / 100

  const revenueLastMonth = paidOrders
    .filter(o => (o.paid_at ?? o.created_at).slice(0, 7) === lastMonth)
    .reduce((sum, o) => sum + (o.amount_cents ?? 0), 0) / 100

  return NextResponse.json({ orders: orders ?? [], stats: { total, revenue, pdfPending, revenueThisMonth, revenueLastMonth } })
}
