export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

type CustomerRow = {
  first_name: string
  last_name: string
  email: string
  marketing_consent: boolean
} | null

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()
  const format = req.nextUrl.searchParams.get('format') ?? 'csv'
  const filter = req.nextUrl.searchParams.get('filter') ?? 'all'

  const { data: paidOrders, error } = await supabase
    .from('orders')
    .select('paid_at, created_at, customers(first_name, last_name, email, marketing_consent)')
    .eq('status', 'paid')
    .order('paid_at', { ascending: false, nullsFirst: false })

  if (error) return NextResponse.json({ error: 'Ophalen mislukt' }, { status: 500 })

  // Dedupliceer op e-mail (meest recente aankoop eerst door sort hierboven)
  const seen = new Set<string>()
  const unique = (paidOrders ?? []).filter(o => {
    const c = o.customers as CustomerRow
    if (!c?.email || seen.has(c.email)) return false
    seen.add(c.email)
    return true
  })

  const filtered = filter === 'consent'
    ? unique.filter(o => (o.customers as CustomerRow)?.marketing_consent)
    : unique

  if (format === 'json') {
    return NextResponse.json({
      total: unique.length,
      with_consent: unique.filter(o => (o.customers as CustomerRow)?.marketing_consent).length,
    })
  }

  // CSV met BOM zodat Excel de accenten correct toont
  const header = ['Voornaam', 'Achternaam', 'E-mail', 'Aankoopdatum', 'Marketingtoestemming'].join(';')
  const rows = filtered.map(o => {
    const c = o.customers as CustomerRow
    if (!c) return ''
    const date = new Date(o.paid_at ?? o.created_at).toLocaleDateString('nl-BE')
    return [c.first_name, c.last_name, c.email, date, c.marketing_consent ? 'Ja' : 'Nee'].join(';')
  }).filter(Boolean)

  const csv = '﻿' + [header, ...rows].join('\r\n')
  const tag = filter === 'consent' ? '-met-toestemming' : '-alle-kopers'
  const filename = `emaillijst${tag}-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
