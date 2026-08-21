export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { getPartnerSession } from '@/lib/partner/auth'

export async function GET() {
  try {
    const session = await getPartnerSession()
    if (!session) {
      return NextResponse.json({ error: 'Niet ingelogd' }, { status: 401 })
    }

    const supabase = createServiceClient()

    // Partnerinfo ophalen
    const { data: partner } = await supabase
      .from('partners')
      .select('name, business_name, province, service_type, discount_description, fee_per_customer, has_deal2, deal1_name, deal2_name, deal2_description, deal2_fee')
      .eq('id', session.partnerId)
      .single()

    // Alle codes van deze partner ophalen (incl. deal_number voor facturatie)
    const { data: codes } = await supabase
      .from('partner_codes')
      .select('code, is_verified, verified_at, created_at, deal_number, customers(first_name, last_name)')
      .eq('partner_id', session.partnerId)
      .order('created_at', { ascending: false })

    const totalCodes = codes?.length ?? 0
    const deal1Verified = codes?.filter(c => c.is_verified && (c.deal_number ?? 1) === 1).length ?? 0
    const deal2Verified = codes?.filter(c => c.is_verified && c.deal_number === 2).length ?? 0
    const verifiedCodes = deal1Verified + deal2Verified
    const deal1ToInvoice = deal1Verified * Number(partner?.fee_per_customer ?? 0)
    const deal2ToInvoice = deal2Verified * Number(partner?.deal2_fee ?? 0)
    const toInvoice = deal1ToInvoice + deal2ToInvoice

    // Huidige maand geverifieerde codes
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const thisMonthCodes = codes?.filter(c =>
      c.is_verified && c.verified_at && c.verified_at.slice(0, 7) === thisMonth
    ) ?? []

    return NextResponse.json({
      partner,
      stats: { totalCodes, verifiedCodes, toInvoice, deal1Verified, deal2Verified, deal1ToInvoice, deal2ToInvoice },
      codes: codes ?? [],
      thisMonthCodes,
    })
  } catch (err) {
    console.error('[partner/dashboard]', err)
    return NextResponse.json({ error: 'Data ophalen mislukt' }, { status: 500 })
  }
}
