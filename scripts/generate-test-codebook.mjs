/**
 * Test codebook generator — Antwerpen
 * Haalt echte data op uit Supabase en genereert een PDF zoals de webhook dat doet.
 *
 * Gebruik: node scripts/generate-test-codebook.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Link } from '@react-pdf/renderer'

// ── Supabase ─────────────────────────────────────────────────────────────────
const SUPABASE_URL = 'https://gqwdrgvrxtwehlxkwfoz.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdxd2RyZ3ZyeHR3ZWhseGt3Zm96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDQxODgxNCwiZXhwIjoyMDk1OTk0ODE0fQ.zzsZiVy3Wn0nR5qH4UaolTLPan706cT2WoErzo9UHdY'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const PROVINCE = 'ANT'
const PROVINCE_LABEL = 'Antwerpen'

// Nep-klant
const CUSTOMER = {
  first_name: 'Pieter',
  last_name: 'Janssen',
  province: PROVINCE,
}

function makeCode(length = 6) {
  return Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, length).padEnd(length, 'X')
}

// ── Kleuren ───────────────────────────────────────────────────────────────────
const C = {
  cream:   '#F1ECE0',
  surface: '#FBF8F2',
  green:   '#2A3D2E',
  clay:    '#B65436',
  butter:  '#E8D08A',
  ink:     '#1A1A17',
  inkSoft: '#3A3A33',
  inkMute: '#6E6B62',
  line:    '#D8D0C0',
}

const s = StyleSheet.create({
  page: { backgroundColor: C.cream, paddingTop: 48, paddingBottom: 48, paddingHorizontal: 48, fontFamily: 'Helvetica' },
  header: { backgroundColor: C.green, borderRadius: 10, padding: 20, marginBottom: 24 },
  headerBrand: { fontSize: 11, color: C.butter, letterSpacing: 1, marginBottom: 6, textTransform: 'uppercase' },
  headerTitle: { fontSize: 22, color: '#ffffff', fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  headerSub: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  introBox: { backgroundColor: C.surface, borderRadius: 8, padding: 16, marginBottom: 24, borderLeft: `3 solid ${C.clay}` },
  introText: { fontSize: 11, color: C.inkSoft, lineHeight: 1.6 },
  introHighlight: { fontFamily: 'Helvetica-Bold', color: C.ink },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.green, marginBottom: 12, paddingBottom: 6, borderBottom: `1 solid ${C.line}` },
  partnerCard: { backgroundColor: C.surface, borderRadius: 8, padding: 16, marginBottom: 14, border: `1 solid ${C.line}` },
  partnerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  partnerInfo: { flex: 1 },
  partnerName: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: C.ink, marginBottom: 2 },
  partnerType: { fontSize: 10, color: C.inkMute, textTransform: 'uppercase', letterSpacing: 0.5 },
  codeBadge: { backgroundColor: C.green, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center', minWidth: 110 },
  codeLabel: { fontSize: 8, color: C.butter, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  codeValue: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: '#ffffff', letterSpacing: 2 },
  discountBox: { backgroundColor: C.cream, borderRadius: 6, padding: 10 },
  discountLabel: { fontSize: 8, color: C.inkMute, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  discountText: { fontSize: 11, color: C.inkSoft, lineHeight: 1.5 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  contactLabel: { fontSize: 8, color: C.inkMute, textTransform: 'uppercase', letterSpacing: 0.5, minWidth: 40 },
  contactValue: { fontSize: 10, color: C.inkSoft },
  instructionBox: { backgroundColor: C.clay, borderRadius: 8, padding: 14, marginTop: 24, marginBottom: 16 },
  instructionText: { fontSize: 11, color: '#ffffff', lineHeight: 1.6, textAlign: 'center' },
  referralBox: { backgroundColor: C.surface, borderRadius: 8, padding: 16, marginTop: 20, borderLeft: `3 solid ${C.clay}`, border: `1 solid ${C.line}` },
  referralTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.clay, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  referralText: { fontSize: 10, color: C.inkSoft, lineHeight: 1.5, marginBottom: 12 },
  referralBadge: { backgroundColor: C.clay, borderRadius: 6, paddingVertical: 10, paddingHorizontal: 16, alignSelf: 'flex-start' },
  referralBadgeLabel: { fontSize: 8, color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 3 },
  referralBadgeCode: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: '#ffffff', letterSpacing: 3 },
  referralBadgeNote: { fontSize: 9, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  socialBox: { backgroundColor: C.green, borderRadius: 8, padding: 18, marginTop: 16, marginBottom: 16 },
  socialLabel: { fontSize: 9, color: C.butter, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 },
  socialTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#ffffff', marginBottom: 6 },
  socialDesc: { fontSize: 10, color: 'rgba(255,255,255,0.72)', lineHeight: 1.55, marginBottom: 12 },
  socialRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, padding: 8, marginBottom: 6 },
  socialBadge: { backgroundColor: C.butter, borderRadius: 4, paddingVertical: 3, paddingHorizontal: 8, marginRight: 10, minWidth: 64, alignItems: 'center' },
  socialBadgeText: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.green, textTransform: 'uppercase', letterSpacing: 0.5 },
  socialUrl: { fontSize: 10, color: 'rgba(255,255,255,0.75)' },
  footer: { marginTop: 24, paddingTop: 12, borderTop: `1 solid ${C.line}`, flexDirection: 'row', justifyContent: 'space-between' },
  footerText: { fontSize: 9, color: C.inkMute },
  emptyText: { fontSize: 12, color: C.inkMute, textAlign: 'center', marginTop: 32, lineHeight: 1.6 },
})

function CodebookDocument({ data }) {
  return React.createElement(Document, { title: `Codeboek — ${data.customer_first_name} ${data.customer_last_name}`, author: 'startthuisverpleging' },
    React.createElement(Page, { size: 'A4', style: s.page },
      // Header
      React.createElement(View, { style: s.header },
        React.createElement(Text, { style: s.headerBrand }, 'startthuisverpleging · Jouw persoonlijk codeboek'),
        React.createElement(Text, { style: s.headerTitle }, `${data.customer_first_name} ${data.customer_last_name}`),
        React.createElement(Text, { style: s.headerSub }, `${data.province_label} · Aangemaakt op ${data.generated_date} · Order #${data.order_short_id}`)
      ),
      // Intro
      React.createElement(View, { style: s.introBox },
        React.createElement(Text, { style: s.introText },
          React.createElement(Text, { style: s.introHighlight }, `Hoe gebruik je dit codeboek?\n`),
          `Dit document bevat jouw persoonlijke codes voor geselecteerde partners in ${data.province_label}. Contacteer een partner en vermeld jouw unieke code — je ontvangt dan automatisch het bijhorende voordeel.\n\n`,
          React.createElement(Text, { style: s.introHighlight }, 'Belangrijk:'),
          ' Elke code is uniek aan jou en geldig voor één gebruik. De partner kan de code verifiëren via ons systeem.'
        )
      ),
      // Sectietitel
      React.createElement(Text, { style: s.sectionTitle }, `Partners in ${data.province_label} (${data.partners.length})`),
      // Partner cards
      ...data.partners.map(partner => {
        const hasUrl = !!(partner.partner_url && partner.code === '—')
        return React.createElement(View, { key: partner.business_name, style: s.partnerCard },
          React.createElement(View, { style: s.partnerHeader },
            React.createElement(View, { style: s.partnerInfo },
              React.createElement(Text, { style: s.partnerName }, partner.business_name),
              React.createElement(Text, { style: s.partnerType },
                `${partner.service_type}${partner.deal_name ? ` — ${partner.deal_name}` : ''}${(partner.show_name !== false && partner.name) ? ` · ${partner.name}` : ''}`
              )
            ),
            hasUrl
              ? React.createElement(View, { style: [s.codeBadge, { backgroundColor: C.clay, minWidth: 110 }] },
                  React.createElement(Text, { style: s.codeLabel }, 'Gebruik link'),
                  React.createElement(Text, { style: [s.codeValue, { fontSize: 16 }] }, '→')
                )
              : React.createElement(View, { style: [s.codeBadge, partner.is_product ? { backgroundColor: C.clay } : {}] },
                  React.createElement(Text, { style: s.codeLabel }, partner.is_product ? 'Kortingscode' : 'Jouw code'),
                  React.createElement(Text, { style: [s.codeValue, partner.is_product ? { fontSize: 12, letterSpacing: 1 } : {}] }, partner.code)
                )
          ),
          React.createElement(View, { style: s.discountBox },
            React.createElement(Text, { style: s.discountLabel }, 'Wat jij krijgt'),
            React.createElement(Text, { style: s.discountText }, partner.discount_description)
          ),
          hasUrl && React.createElement(View, { style: { marginTop: 8, backgroundColor: '#FEF3E2', borderRadius: 6, padding: 10, borderLeft: `3 solid ${C.clay}` } },
            React.createElement(Text, { style: [s.discountLabel, { marginBottom: 4, color: C.clay }] }, 'Jouw link'),
            React.createElement(Link, { src: partner.partner_url },
              React.createElement(Text, { style: [s.discountText, { color: C.clay, fontFamily: 'Helvetica-Bold' }] }, partner.partner_url)
            )
          ),
          (partner.website || partner.phone || partner.office_address) && React.createElement(View, { style: { marginTop: 8, paddingTop: 8, borderTop: `1 solid ${C.line}` } },
            React.createElement(Text, { style: [s.discountLabel, { marginBottom: 4 }] }, 'Contact'),
            partner.website && React.createElement(View, { style: s.contactRow },
              React.createElement(Text, { style: s.contactLabel }, 'Web'),
              React.createElement(Text, { style: s.contactValue }, partner.website)
            ),
            partner.phone && React.createElement(View, { style: s.contactRow },
              React.createElement(Text, { style: s.contactLabel }, 'Tel'),
              React.createElement(Text, { style: s.contactValue }, partner.phone)
            ),
            partner.office_address && React.createElement(View, { style: s.contactRow },
              React.createElement(Text, { style: s.contactLabel }, 'Adres'),
              React.createElement(Text, { style: s.contactValue }, partner.office_address)
            )
          )
        )
      }),
      // Instructie
      data.partners.length > 0 && React.createElement(View, { style: s.instructionBox },
        React.createElement(Text, { style: s.instructionText },
          'Toon jouw persoonlijke code bij het eerste contact met de partner.\nDe partner verifieert de code en kent je het voordeel toe.'
        )
      ),
      // Doorverwijzing
      React.createElement(View, { style: s.referralBox },
        React.createElement(Text, { style: s.referralTitle }, 'Deel dit met een vriend of collega'),
        React.createElement(Text, { style: s.referralText },
          'Ken jij iemand die ook als zelfstandig thuisverpleegkundige wil starten? Geef hen onderstaande kortingscode — zij krijgen 20% korting op de gids.\nDe code is enkel geldig voor wie de gids nog niet heeft aangeschaft.'
        ),
        React.createElement(View, { style: s.referralBadge },
          React.createElement(Text, { style: s.referralBadgeLabel }, 'Kortingscode voor een vriend'),
          React.createElement(Text, { style: s.referralBadgeCode }, 'VRIEND20'),
          React.createElement(Text, { style: s.referralBadgeNote }, '20% korting · Gebruiken bij aankoop op startthuisverpleging.be')
        )
      ),
      // Sociale media
      React.createElement(View, { style: s.socialBox },
        React.createElement(Text, { style: s.socialLabel }, 'Volg ons · Exclusieve voordelen'),
        React.createElement(Text, { style: s.socialTitle }, 'Blijf op de hoogte via sociale media'),
        React.createElement(Text, { style: s.socialDesc },
          'Volg ons op Instagram, Facebook of TikTok en ontvang als eerste eenmalige kortingen en aanbiedingen die we enkel via onze sociale media delen.'
        ),
        React.createElement(View, { style: s.socialRow },
          React.createElement(View, { style: s.socialBadge }, React.createElement(Text, { style: s.socialBadgeText }, 'Instagram')),
          React.createElement(Text, { style: s.socialUrl }, '@startthuisverpleging')
        ),
        React.createElement(View, { style: s.socialRow },
          React.createElement(View, { style: s.socialBadge }, React.createElement(Text, { style: s.socialBadgeText }, 'Facebook')),
          React.createElement(Text, { style: s.socialUrl }, 'Start Thuisverpleging')
        ),
        React.createElement(View, { style: [s.socialRow, { marginBottom: 0 }] },
          React.createElement(View, { style: s.socialBadge }, React.createElement(Text, { style: s.socialBadgeText }, 'TikTok')),
          React.createElement(Text, { style: s.socialUrl }, '@startthuisverpleging')
        )
      ),
      // Footer
      React.createElement(View, { style: s.footer },
        React.createElement(Text, { style: s.footerText }, 'startthuisverpleging.be'),
        React.createElement(Text, { style: s.footerText }, 'Persoonlijk document · Niet overdraagbaar')
      )
    )
  )
}

// ── Hoofdlogica ───────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Data ophalen uit Supabase voor provincie Antwerpen…')

  // 1. Service partners ophalen (provincie ANT)
  const { data: servicePartners, error: spErr } = await supabase
    .from('partners')
    .select('id, name, business_name, service_type, discount_description, show_name, partner_type, website, phone, office_address')
    .eq('is_active', true)
    .eq('partner_type', 'service')
    .eq('province', PROVINCE)

  if (spErr) { console.error('Service partners fout:', spErr); process.exit(1) }
  console.log(`✓ ${servicePartners.length} service partner(s) gevonden`)

  // 2. Product partners ophalen (nationaal, province = 'VLA')
  const { data: productPartners, error: ppErr } = await supabase
    .from('partners')
    .select('id, name, business_name, service_type, discount_description, show_name, partner_type, discount_code, partner_url, has_deal2, deal1_name, deal2_name, deal2_description')
    .eq('is_active', true)
    .eq('partner_type', 'product')

  if (ppErr) { console.error('Product partners fout:', ppErr); process.exit(1) }
  console.log(`✓ ${productPartners.length} product partner(s) gevonden`)

  // 3. Organisaties met kantoren ophalen
  const { data: allOffices, error: offErr } = await supabase
    .from('organization_offices')
    .select('id, organization_id, business_name, province, province_2, discount_description, is_active, website, phone, show_name, office_address')
    .eq('is_active', true)

  if (offErr) { console.error('Kantoren fout:', offErr); process.exit(1) }

  const { data: orgs, error: orgErr } = await supabase
    .from('organizations')
    .select('id, business_name, name, service_type, discount_description, code_mode, is_active, show_name')
    .eq('is_active', true)

  if (orgErr) { console.error('Organisaties fout:', orgErr); process.exit(1) }
  console.log(`✓ ${orgs.length} organisatie(s) gevonden, ${allOffices.length} kantoren`)

  // ── Partners samenstellen ──────────────────────────────────────────────────
  const partners = []

  // Service partners
  for (const p of servicePartners) {
    partners.push({
      code: makeCode(6),
      business_name: p.business_name,
      name: p.name ?? '',
      service_type: p.service_type,
      discount_description: p.discount_description,
      show_name: p.show_name ?? true,
      is_product: false,
      website: p.website ?? null,
      phone: p.phone ?? null,
      office_address: p.office_address ?? null,
    })
  }

  // Product partners
  for (const p of productPartners) {
    // Deal 1
    partners.push({
      code: p.discount_code || '—',
      business_name: p.business_name,
      name: p.name ?? '',
      service_type: p.service_type,
      discount_description: p.discount_description,
      show_name: p.show_name ?? true,
      is_product: true,
      deal_name: p.deal1_name ?? null,
      partner_url: p.partner_url ?? null,
    })
    // Deal 2 (indien aanwezig)
    if (p.has_deal2 && p.deal2_description) {
      partners.push({
        code: p.discount_code || '—',
        business_name: p.business_name,
        name: p.name ?? '',
        service_type: p.service_type,
        discount_description: p.deal2_description,
        show_name: p.show_name ?? true,
        is_product: true,
        deal_name: p.deal2_name ?? null,
        partner_url: p.partner_url ?? null,
      })
    }
  }

  // Organisaties / kantoren
  for (const org of orgs) {
    const orgOffices = allOffices.filter(o => o.organization_id === org.id)
    const officeInProvince = orgOffices.find(
      o => o.province === PROVINCE || o.province_2 === PROVINCE
    )
    if (!officeInProvince) continue

    if (org.code_mode === 'shared') {
      // Eén code voor de volledige organisatie
      const hasOfficeInProvince = orgOffices.some(
        o => o.province === PROVINCE || o.province_2 === PROVINCE
      )
      if (!hasOfficeInProvince) continue
      partners.push({
        code: makeCode(6),
        business_name: org.business_name,
        name: org.name ?? '',
        service_type: org.service_type,
        discount_description: org.discount_description,
        show_name: org.show_name ?? true,
        is_product: false,
      })
    } else {
      // Per_office: code voor het specifieke kantoor van de provincie
      const office = officeInProvince
      partners.push({
        code: makeCode(6),
        business_name: office.business_name,
        name: '',
        service_type: org.service_type,
        discount_description: office.discount_description || org.discount_description,
        show_name: office.show_name ?? true,
        is_product: false,
        website: office.website ?? null,
        phone: office.phone ?? null,
        office_address: office.office_address ?? null,
      })
    }
  }

  console.log(`✓ Totaal ${partners.length} partner(s) in het codeboek`)

  if (partners.length === 0) {
    console.warn('⚠️  Geen partners gevonden voor Antwerpen. Controleer of er actieve partners zijn.')
  }

  // ── PDF genereren ──────────────────────────────────────────────────────────
  const now = new Date()
  const generated_date = now.toLocaleDateString('nl-BE', { day: '2-digit', month: 'long', year: 'numeric' })
  const order_short_id = 'TEST-ANT-' + Math.random().toString(36).slice(2, 6).toUpperCase()

  const data = {
    customer_first_name: CUSTOMER.first_name,
    customer_last_name: CUSTOMER.last_name,
    province_label: PROVINCE_LABEL,
    order_short_id,
    partners,
    generated_date,
  }

  console.log('📄 PDF genereren…')
  const element = React.createElement(CodebookDocument, { data })
  const buffer = await renderToBuffer(element)

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = dirname(__filename)
  const outPath = join(__dirname, '..', 'test-codebook-antwerpen.pdf')
  writeFileSync(outPath, buffer)

  console.log(`✅ PDF opgeslagen: ${outPath}`)
}

main().catch(err => { console.error(err); process.exit(1) })
