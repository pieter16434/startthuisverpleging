export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getOfficeSession } from '@/lib/office/auth'

export async function GET() {
  try {
    const session = await getOfficeSession()
    if (!session) return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })

    const supabase = createServiceClient()

    // Kantoor info
    const { data: office } = await supabase
      .from('organization_offices')
      .select('name, business_name, province, discount_description, fee_per_customer, is_active')
      .eq('id', session.officeId)
      .single()

    // Org info (voor gedeelde instellingen)
    const { data: org } = await supabase
      .from('organizations')
      .select('business_name, service_type, discount_description, fee_per_customer, code_mode, bundle_invoicing, offices_have_own_billing')
      .eq('id', session.organizationId)
      .single()

    // Codes ophalen
    // - per_office modus: codes waar office_id = dit kantoor
    // - shared modus: codes waar verified_by_office_id = dit kantoor (geverifieerd door dit kantoor)
    let codesQuery = supabase
      .from('organization_codes')
      .select('code, is_verified, verified_at, created_at, office_id, verified_by_office_id, customers(first_name, last_name)')
      .eq('organization_id', session.organizationId)
      .order('created_at', { ascending: false })

    const { data: allCodes } = await codesQuery

    // Voor per_office: filter op office_id
    // Voor shared: toon alleen de codes die dit kantoor geverifieerd heeft + nog niet geverifieerde (voor scannen)
    const codes = org?.code_mode === 'per_office'
      ? (allCodes?.filter(c => c.office_id === session.officeId) ?? [])
      : (allCodes?.filter(c => !c.is_verified || c.verified_by_office_id === session.officeId) ?? [])

    const verifiedCodes = codes.filter(c => c.is_verified)
    const totalCodes = codes.length

    // Facturatiebedrag
    const effectiveFee = Number(office?.fee_per_customer ?? org?.fee_per_customer ?? 0)
    const toInvoice = org?.bundle_invoicing ? 0 : verifiedCodes.length * effectiveFee

    // Huidige maand
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisMonthCodes = verifiedCodes.filter(c =>
      c.verified_at && c.verified_at.slice(0, 7) === thisMonth
    )

    return NextResponse.json({
      office,
      org: { business_name: org?.business_name, service_type: org?.service_type, code_mode: org?.code_mode, bundle_invoicing: org?.bundle_invoicing, discount_description: org?.discount_description, fee_per_customer: org?.fee_per_customer },
      stats: { totalCodes, verifiedCodes: verifiedCodes.length, toInvoice, effectiveFee },
      codes,
      thisMonthCodes,
    })
  } catch (err) {
    console.error('[office/dashboard]', err)
    return NextResponse.json({ error: 'Data ophalen mislukt' }, { status: 500 })
  }
}
