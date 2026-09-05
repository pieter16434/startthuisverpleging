export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()
  const url = new URL(req.url)
  const filterProvince = url.searchParams.get('province')
  const filterConsent  = url.searchParams.get('consent')

  let query = supabase
    .from('leads')
    .select('email, province, profile, source, utm_campaign, utm_content, marketing_consent, created_at')
    .order('created_at', { ascending: false })

  if (filterProvince) query = query.eq('province', filterProvince)
  if (filterConsent === 'true') query = query.eq('marketing_consent', true)

  const { data: leads, error } = await query
  if (error) return NextResponse.json({ error: 'Export mislukt' }, { status: 500 })

  const rows = leads ?? []
  const header = 'email,provincie,profiel,bron,utm_campaign,utm_content,marketing_consent,datum\r\n'
  const csv = header + rows.map(l =>
    [
      `"${l.email}"`,
      l.province,
      l.profile ?? '',
      l.source ?? '',
      l.utm_campaign ?? '',
      l.utm_content ?? '',
      l.marketing_consent ? 'ja' : 'nee',
      new Date(l.created_at).toLocaleDateString('nl-BE'),
    ].join(',')
  ).join('\r\n')

  const filename = filterProvince
    ? `leads-${filterProvince.toLowerCase()}.csv`
    : 'leads-alle-provincies.csv'

  return new NextResponse(csv, {
    headers: {
      'Content-Type':        'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
