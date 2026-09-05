export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getAdminSession } from '@/lib/admin/auth'

const PROVINCIE_LABELS: Record<string, string> = {
  ANT: 'Antwerpen', LIM: 'Limburg', OVL: 'Oost-Vlaanderen',
  VBR: 'Vlaams-Brabant', WVL: 'West-Vlaanderen',
}
const PROVINCE_CODES = ['ANT', 'LIM', 'OVL', 'VBR', 'WVL']

export async function GET(req: NextRequest) {
  const session = await getAdminSession()
  if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

  const supabase = createServiceClient()
  const url = new URL(req.url)
  const filterProvince = url.searchParams.get('province')
  const filterConsent  = url.searchParams.get('consent')

  let query = supabase
    .from('leads')
    .select('id, email, province, profile, source, utm_campaign, utm_content, marketing_consent, converted_order_id, created_at, unsubscribed_at')
    .order('created_at', { ascending: false })

  if (filterProvince) query = query.eq('province', filterProvince)
  if (filterConsent === 'true') query = query.eq('marketing_consent', true)

  const { data: leads, error } = await query
  if (error) return NextResponse.json({ error: 'Ophalen mislukt' }, { status: 500 })

  // Tellers per provincie
  const { data: allLeads } = await supabase
    .from('leads')
    .select('province, created_at, unsubscribed_at')
    .is('unsubscribed_at', null)

  const perProvince: Record<string, { label: string; total: number; last7: number }> = {}
  const now = Date.now()
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000

  for (const code of PROVINCE_CODES) {
    const rows = (allLeads ?? []).filter(l => l.province === code)
    perProvince[code] = {
      label:  PROVINCIE_LABELS[code],
      total:  rows.length,
      last7:  rows.filter(l => now - new Date(l.created_at).getTime() < sevenDaysMs).length,
    }
  }

  const total   = (allLeads ?? []).length
  const last7   = (allLeads ?? []).filter(l => now - new Date(l.created_at).getTime() < sevenDaysMs).length

  // Conversies: koppel leads aan klanten op e-mail
  const emails = (leads ?? []).map(l => l.email)
  let convertedEmails = new Set<string>()
  if (emails.length > 0) {
    const { data: customers } = await supabase
      .from('customers')
      .select('email')
      .in('email', emails)
    convertedEmails = new Set((customers ?? []).map((c: { email: string }) => c.email.toLowerCase()))
  }

  const leadsWithConversion = (leads ?? []).map(l => ({
    ...l,
    is_converted: convertedEmails.has(l.email.toLowerCase()),
  }))

  return NextResponse.json({
    leads:       leadsWithConversion,
    perProvince,
    total,
    last7,
  })
}
