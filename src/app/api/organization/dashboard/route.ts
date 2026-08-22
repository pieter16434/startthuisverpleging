export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getOrganizationSession } from '@/lib/organization/auth'

export async function GET() {
  try {
    const session = await getOrganizationSession()
    if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

    const supabase = createServiceClient()

    // Org info
    const { data: org } = await supabase
      .from('organizations')
      .select('name, business_name, service_type, discount_description, fee_per_customer, code_mode, bundle_invoicing, offices_have_own_description, offices_have_own_billing')
      .eq('id', session.organizationId)
      .single()

    // Alle kantoren
    const { data: offices } = await supabase
      .from('organization_offices')
      .select('id, name, business_name, province, is_active, fee_per_customer')
      .eq('organization_id', session.organizationId)
      .order('province', { ascending: true })

    // Alle codes van deze organisatie
    const { data: codes } = await supabase
      .from('organization_codes')
      .select('id, code, is_verified, verified_at, verified_by_office_id, office_id, created_at, customers(first_name, last_name, province)')
      .eq('organization_id', session.organizationId)
      .order('created_at', { ascending: false })

    // Bouw maandoverzicht per kantoor
    // Voor gedeelde code: kantoor = verified_by_office_id
    // Voor per_office: kantoor = office_id
    const officeMap: Record<string, string> = {}
    offices?.forEach(o => { officeMap[o.id] = o.business_name })

    const feeMap: Record<string, number> = {}
    offices?.forEach(o => {
      feeMap[o.id] = Number(o.fee_per_customer ?? org?.fee_per_customer ?? 0)
    })

    // Maandoverzicht: { [officeId]: { [YYYY-MM]: { count, amount } } }
    type MonthEntry = { count: number; amount: number }
    type OfficeMonths = Record<string, MonthEntry>
    const monthly: Record<string, { business_name: string; province: string; months: OfficeMonths }> = {}

    const verifiedCodes = codes?.filter(c => c.is_verified) ?? []

    for (const code of verifiedCodes) {
      const officeId = org?.code_mode === 'per_office'
        ? (code.office_id ?? 'unknown')
        : (code.verified_by_office_id ?? 'onbekend')

      const monthKey = code.verified_at
        ? code.verified_at.slice(0, 7)
        : code.created_at.slice(0, 7)

      if (!monthly[officeId]) {
        const office = offices?.find(o => o.id === officeId)
        monthly[officeId] = {
          business_name: office?.business_name ?? 'Onbekend kantoor',
          province: office?.province ?? '—',
          months: {},
        }
      }
      if (!monthly[officeId].months[monthKey]) {
        monthly[officeId].months[monthKey] = { count: 0, amount: 0 }
      }
      monthly[officeId].months[monthKey].count++
      monthly[officeId].months[monthKey].amount += feeMap[officeId] ?? 0
    }

    // Totaalstats
    const totalVerified = verifiedCodes.length
    const totalToInvoice = verifiedCodes.reduce((sum, code) => {
      const officeId = org?.code_mode === 'per_office'
        ? (code.office_id ?? '')
        : (code.verified_by_office_id ?? '')
      return sum + (feeMap[officeId] ?? Number(org?.fee_per_customer ?? 0))
    }, 0)

    return NextResponse.json({
      org,
      offices: offices ?? [],
      stats: { totalCodes: codes?.length ?? 0, totalVerified, totalToInvoice },
      monthly,
    })
  } catch (err) {
    console.error('[organization/dashboard]', err)
    return NextResponse.json({ error: 'Data ophalen mislukt' }, { status: 500 })
  }
}
