/**
 * Codeboek-regeneratie helper
 *
 * Gebruik dit om het persoonlijk codeboek-PDF van een bestaande order opnieuw
 * te genereren (bijv. na een provincieverandering van een partner of kantoor).
 * Het bestand wordt overschreven op 'codebooks/orders/{orderId}.pdf'.
 */

import { createServiceClient } from '@/lib/supabase/server'
import { generateCodebookPdf, type CodebookData, type CodebookPartner } from '@/lib/pdf/codebook'

const PROVINCES: Record<string, string> = {
  ANT: 'Antwerpen', LIM: 'Limburg', OVL: 'Oost-Vlaanderen',
  VBR: 'Vlaams-Brabant', WVL: 'West-Vlaanderen', VLA: 'Vlaanderen',
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generateCode(province: string): string {
  let rand = ''
  for (let i = 0; i < 6; i++) rand += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return `STH-${province}-${rand}`
}

// ─── Types ────────────────────────────────────────────────────────────────────
type CustomerRow = { first_name: string; last_name: string; province: string }
type PCPartner = {
  id: string; business_name: string; name: string; service_type: string
  discount_description: string; partner_url: string | null; website: string | null
  phone: string | null; office_address: string | null; show_name: boolean
  has_deal2: boolean; deal1_name: string | null; deal2_name: string | null
  deal2_description: string | null
}
type OrgRow = {
  id: string; name: string; service_type: string; discount_description: string
  has_deal2: boolean; deal1_name: string | null; deal2_name: string | null
  deal2_description: string | null
}
type OfficeRow = {
  id: string; business_name: string; website: string | null
  phone: string | null; discount_description: string | null; show_name: boolean
} | null

// ─── Regenereer codeboek voor één order ──────────────────────────────────────
export async function regenerateCodebookForOrder(orderId: string): Promise<boolean> {
  const supabase = createServiceClient()

  // 1. Order + klant
  const { data: order } = await supabase
    .from('orders')
    .select('id, status, customers(first_name, last_name, province)')
    .eq('id', orderId)
    .single()

  if (!order || order.status !== 'paid') return false
  const customer = order.customers as unknown as CustomerRow

  // 2. Partner codes (service partners — unieke codes)
  const { data: partnerCodes } = await supabase
    .from('partner_codes')
    .select(`
      code, deal_number,
      partners(id, business_name, name, service_type, discount_description,
               partner_url, website, phone, office_address, show_name,
               has_deal2, deal1_name, deal2_name, deal2_description)
    `)
    .eq('order_id', orderId)

  // 3. Product partners (vaste kortingscode, altijd in elk codeboek)
  const { data: productPartners } = await supabase
    .from('partners')
    .select('id, business_name, name, service_type, discount_description, partner_url, discount_code, website, phone, office_address, show_name')
    .eq('partner_type', 'product')
    .eq('is_active', true)

  // 4. Organisatie codes
  const { data: orgCodes } = await supabase
    .from('organization_codes')
    .select(`
      code, deal_number,
      organizations(id, name, service_type, discount_description, has_deal2, deal1_name, deal2_name, deal2_description),
      organization_offices(id, business_name, website, phone, discount_description, show_name)
    `)
    .eq('order_id', orderId)

  // 5. Bouw codeboek entries
  const entries: CodebookPartner[] = []

  // Service partners (deal1 + eventueel deal2)
  const deal1: Record<string, { code: string; p: PCPartner }> = {}
  const deal2: Record<string, string> = {}

  for (const pc of (partnerCodes ?? [])) {
    const p = pc.partners as unknown as PCPartner
    if (!p) continue
    if ((pc.deal_number ?? 1) === 1) deal1[p.id] = { code: pc.code, p }
    else deal2[p.id] = pc.code
  }

  for (const { code, p } of Object.values(deal1)) {
    entries.push({
      code, business_name: p.business_name, name: p.name,
      service_type: p.service_type, discount_description: p.discount_description,
      show_name: p.show_name, is_product: false,
      deal_name: p.has_deal2 ? p.deal1_name : null,
      partner_url: p.partner_url, website: p.website,
      phone: p.phone, office_address: p.office_address,
    })
    if (deal2[p.id]) {
      entries.push({
        code: deal2[p.id], business_name: p.business_name, name: p.name,
        service_type: p.service_type,
        discount_description: p.deal2_description ?? p.discount_description,
        show_name: p.show_name, is_product: false, deal_name: p.deal2_name,
        partner_url: null, website: null, phone: null, office_address: null,
      })
    }
  }

  // Product partners
  for (const pp of (productPartners ?? [])) {
    entries.push({
      code: (pp.discount_code as string | null) ?? '—',
      business_name: pp.business_name, name: pp.name,
      service_type: pp.service_type, discount_description: pp.discount_description,
      show_name: (pp.show_name as boolean) ?? true, is_product: true, deal_name: null,
      partner_url: pp.partner_url as string | null,
      website: pp.website as string | null,
      phone: pp.phone as string | null,
      office_address: pp.office_address as string | null,
    })
  }

  // Organisatie entries (deal1 & deal2 per code)
  for (const oc of (orgCodes ?? [])) {
    const org = oc.organizations as unknown as OrgRow
    const office = oc.organization_offices as unknown as OfficeRow
    if (!org) continue
    const desc = office?.discount_description ?? org.discount_description
    const biz = office?.business_name ?? org.name
    if ((oc.deal_number ?? 1) === 1) {
      entries.push({
        code: oc.code, business_name: biz, name: org.name,
        service_type: org.service_type, discount_description: desc,
        show_name: office?.show_name ?? true, is_product: false,
        deal_name: org.has_deal2 ? org.deal1_name : null,
        partner_url: null, website: office?.website ?? null,
        phone: office?.phone ?? null, office_address: null,
      })
    } else {
      entries.push({
        code: oc.code, business_name: biz, name: org.name,
        service_type: org.service_type,
        discount_description: org.deal2_description ?? desc,
        show_name: office?.show_name ?? true, is_product: false,
        deal_name: org.deal2_name,
        partner_url: null, website: null, phone: null, office_address: null,
      })
    }
  }

  const codebookData: CodebookData = {
    customer_first_name: customer.first_name,
    customer_last_name: customer.last_name,
    province_label: PROVINCES[customer.province] ?? 'Vlaanderen',
    order_short_id: orderId.slice(0, 8).toUpperCase(),
    generated_date: new Date().toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' }),
    partners: entries,
  }

  const buf = await generateCodebookPdf(codebookData)
  const { error } = await supabase.storage.from('guides').upload(
    `codebooks/orders/${orderId}.pdf`, buf,
    { contentType: 'application/pdf', upsert: true }
  )
  if (error) { console.error('[regenerate] upload fout:', error); return false }
  return true
}

// ─── Migreer partner-codes bij provincieverandering ───────────────────────────
/**
 * Verwijdert onbevestigde codes voor de oude provincie,
 * genereert codes voor bestaande betaalde orders in de nieuwe provincie.
 * Geeft de volledige lijst van geraakte order-IDs terug (voor PDF-regeneratie).
 */
export async function migratePartnerProvince(
  partnerId: string,
  oldProvince: string,
  newProvince: string,
  hasDeal2: boolean,
): Promise<string[]> {
  const supabase = createServiceClient()
  const ALL = ['ANT', 'LIM', 'OVL', 'VBR', 'WVL']
  const affectedOrderIds: Set<string> = new Set()

  // ── Verwijderen ──
  // VLA → specifiek: verwijder codes voor alle provincies behalve newProvince
  // specifiek → specifiek/VLA: verwijder codes voor oldProvince
  const removeProvinces = oldProvince === 'VLA'
    ? ALL.filter(p => p !== newProvince)
    : [oldProvince]

  if (removeProvinces.length > 0) {
    const { data: custToRemove } = await supabase
      .from('customers').select('id').in('province', removeProvinces)
    const ids = (custToRemove ?? []).map(c => c.id)
    if (ids.length > 0) {
      const { data: aff } = await supabase
        .from('orders').select('id').eq('status', 'paid').in('customer_id', ids)
      ;(aff ?? []).forEach(o => affectedOrderIds.add(o.id))

      await supabase
        .from('partner_codes')
        .delete()
        .eq('partner_id', partnerId)
        .eq('is_verified', false)
        .in('customer_id', ids)
    }
  }

  // ── Toevoegen ──
  // specifiek → VLA: voeg toe voor alle provincies behalve oldProvince (heeft al codes)
  // VLA → specifiek: newProvince-klanten hebben al codes → niets toevoegen
  // specifiek A → specifiek B: voeg toe voor B
  const addProvinces = newProvince === 'VLA'
    ? ALL.filter(p => p !== oldProvince)
    : (oldProvince === 'VLA' ? [] : [newProvince])

  if (addProvinces.length > 0) {
    const { data: custToAdd } = await supabase
      .from('customers').select('id, province').in('province', addProvinces)
    const addIds = (custToAdd ?? []).map(c => c.id)

    if (addIds.length > 0) {
      const { data: ordersToAdd } = await supabase
        .from('orders').select('id, customer_id')
        .eq('status', 'paid').in('customer_id', addIds)

      // Welke orders hebben nog géén code voor deze partner?
      const { data: existing } = await supabase
        .from('partner_codes').select('order_id')
        .eq('partner_id', partnerId)
        .in('order_id', (ordersToAdd ?? []).map(o => o.id))
      const existingSet = new Set((existing ?? []).map(c => c.order_id))

      const provMap: Record<string, string> = {}
      ;(custToAdd ?? []).forEach(c => { provMap[c.id] = c.province })

      for (const order of (ordersToAdd ?? []).filter(o => !existingSet.has(o.id))) {
        const provCode = provMap[order.customer_id] ?? 'VLA'
        // Deal 1
        let code = generateCode(provCode)
        for (let i = 0; i < 5; i++) {
          const { error } = await supabase.from('partner_codes').insert({
            partner_id: partnerId, order_id: order.id, customer_id: order.customer_id,
            code, deal_number: 1,
          })
          if (!error) break
          code = generateCode(provCode)
        }
        // Deal 2
        if (hasDeal2) {
          let code2 = generateCode(provCode)
          for (let i = 0; i < 5; i++) {
            const { error } = await supabase.from('partner_codes').insert({
              partner_id: partnerId, order_id: order.id, customer_id: order.customer_id,
              code: code2, deal_number: 2,
            })
            if (!error) break
            code2 = generateCode(provCode)
          }
        }
        affectedOrderIds.add(order.id)
      }
    }
  }

  return Array.from(affectedOrderIds)
}

// ─── Migreer organisatie-kantoor codes bij provincieverandering ───────────────
/**
 * Werkt voor per_office mode: verwijdert onbevestigde codes voor dit kantoor,
 * genereert codes voor betaalde orders in de nieuwe provincie.
 * Geeft de volledige lijst van geraakte order-IDs terug (voor PDF-regeneratie).
 */
export async function migrateOfficeProvince(
  organizationId: string,
  officeId: string,
  newProvince: string,
  hasDeal2: boolean,
  deal2Description: string | null,
): Promise<string[]> {
  const supabase = createServiceClient()
  const affectedOrderIds: Set<string> = new Set()

  // Verwijder onbevestigde codes van dit kantoor (old province)
  const { data: oldCodes } = await supabase
    .from('organization_codes')
    .select('order_id')
    .eq('office_id', officeId)
    .eq('is_verified', false)
  ;(oldCodes ?? []).forEach(c => affectedOrderIds.add(c.order_id))

  await supabase
    .from('organization_codes')
    .delete()
    .eq('office_id', officeId)
    .eq('is_verified', false)

  // Voeg codes toe voor betaalde orders in de nieuwe provincie
  const { data: custNew } = await supabase
    .from('customers').select('id, province').eq('province', newProvince)
  const custIds = (custNew ?? []).map(c => c.id)

  if (custIds.length > 0) {
    const { data: ordersNew } = await supabase
      .from('orders').select('id, customer_id')
      .eq('status', 'paid').in('customer_id', custIds)

    const { data: existing } = await supabase
      .from('organization_codes').select('order_id')
      .eq('organization_id', organizationId)
      .in('order_id', (ordersNew ?? []).map(o => o.id))
    const existingSet = new Set((existing ?? []).map(c => c.order_id))

    for (const order of (ordersNew ?? []).filter(o => !existingSet.has(o.id))) {
      let code = generateCode(newProvince)
      for (let i = 0; i < 5; i++) {
        const { error } = await supabase.from('organization_codes').insert({
          organization_id: organizationId, office_id: officeId,
          order_id: order.id, customer_id: order.customer_id,
          code, deal_number: 1,
        })
        if (!error) break
        code = generateCode(newProvince)
      }
      if (hasDeal2 && deal2Description) {
        let code2 = generateCode(newProvince)
        for (let i = 0; i < 5; i++) {
          const { error } = await supabase.from('organization_codes').insert({
            organization_id: organizationId, office_id: officeId,
            order_id: order.id, customer_id: order.customer_id,
            code: code2, deal_number: 2,
          })
          if (!error) break
          code2 = generateCode(newProvince)
        }
      }
      affectedOrderIds.add(order.id)
    }
  }

  return Array.from(affectedOrderIds)
}
