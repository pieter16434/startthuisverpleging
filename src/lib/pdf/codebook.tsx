import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, renderToBuffer,
} from '@react-pdf/renderer'

// ── Types ────────────────────────────────────────────────────────────────────
export type CodebookPartner = {
  code: string
  business_name: string
  name: string
  service_type: string
  discount_description: string
  is_product?: boolean
}

export type CodebookData = {
  customer_first_name: string
  customer_last_name: string
  province_label: string
  order_short_id: string
  partners: CodebookPartner[]
  generated_date: string
}

// ── Kleuren (zelfde als de website) ─────────────────────────────────────────
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

// ── Stijlen ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    backgroundColor: C.cream,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    fontFamily: 'Helvetica',
  },

  // Header
  header: {
    backgroundColor: C.green,
    borderRadius: 10,
    padding: 20,
    marginBottom: 24,
  },
  headerBrand: {
    fontSize: 11,
    color: C.butter,
    letterSpacing: 1,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 22,
    color: '#ffffff',
    fontFamily: 'Helvetica-Bold',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
  },

  // Intro blok
  introBox: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    borderLeft: `3 solid ${C.clay}`,
  },
  introText: {
    fontSize: 11,
    color: C.inkSoft,
    lineHeight: 1.6,
  },
  introHighlight: {
    fontFamily: 'Helvetica-Bold',
    color: C.ink,
  },

  // Sectie titel
  sectionTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.green,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: `1 solid ${C.line}`,
  },

  // Partner card
  partnerCard: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 16,
    marginBottom: 14,
    border: `1 solid ${C.line}`,
  },
  partnerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  partnerInfo: {
    flex: 1,
  },
  partnerName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.ink,
    marginBottom: 2,
  },
  partnerType: {
    fontSize: 10,
    color: C.inkMute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Code badge
  codeBadge: {
    backgroundColor: C.green,
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    minWidth: 110,
  },
  codeLabel: {
    fontSize: 8,
    color: C.butter,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  codeValue: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 2,
  },

  // Aanbod tekst
  discountBox: {
    backgroundColor: C.cream,
    borderRadius: 6,
    padding: 10,
  },
  discountLabel: {
    fontSize: 8,
    color: C.inkMute,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  discountText: {
    fontSize: 11,
    color: C.inkSoft,
    lineHeight: 1.5,
  },

  // Instructie
  instructionBox: {
    backgroundColor: C.clay,
    borderRadius: 8,
    padding: 14,
    marginTop: 24,
    marginBottom: 16,
  },
  instructionText: {
    fontSize: 11,
    color: '#ffffff',
    lineHeight: 1.6,
    textAlign: 'center',
  },

  // Doorverwijzing
  referralBox: {
    backgroundColor: C.surface,
    borderRadius: 8,
    padding: 16,
    marginTop: 20,
    borderLeft: `3 solid ${C.clay}`,
    border: `1 solid ${C.line}`,
  },
  referralTitle: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.clay,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  referralText: {
    fontSize: 10,
    color: C.inkSoft,
    lineHeight: 1.5,
    marginBottom: 12,
  },
  referralBadge: {
    backgroundColor: C.clay,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  referralBadgeLabel: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.75)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 3,
  },
  referralBadgeCode: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    letterSpacing: 3,
  },
  referralBadgeNote: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },

  // Sociale media
  socialBox: {
    backgroundColor: C.green,
    borderRadius: 8,
    padding: 18,
    marginTop: 16,
    marginBottom: 16,
  },
  socialLabel: {
    fontSize: 9,
    color: C.butter,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  socialTitle: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: '#ffffff',
    marginBottom: 6,
  },
  socialDesc: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 1.55,
    marginBottom: 12,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
  },
  socialBadge: {
    backgroundColor: C.butter,
    borderRadius: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 10,
    minWidth: 64,
    alignItems: 'center',
  },
  socialBadgeText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.green,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  socialUrl: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.75)',
  },

  // Footer
  footer: {
    marginTop: 24,
    paddingTop: 12,
    borderTop: `1 solid ${C.line}`,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: C.inkMute,
  },

  // Geen partners
  emptyText: {
    fontSize: 12,
    color: C.inkMute,
    textAlign: 'center',
    marginTop: 32,
    lineHeight: 1.6,
  },
})

// ── Component ────────────────────────────────────────────────────────────────
function CodebookDocument({ data }: { data: CodebookData }) {
  return (
    <Document
      title={`Codeboek — ${data.customer_first_name} ${data.customer_last_name}`}
      author="startthuisverpleging"
    >
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerBrand}>startthuisverpleging · Jouw persoonlijk codeboek</Text>
          <Text style={s.headerTitle}>
            {data.customer_first_name} {data.customer_last_name}
          </Text>
          <Text style={s.headerSub}>
            {data.province_label} · Aangemaakt op {data.generated_date} · Order #{data.order_short_id}
          </Text>
        </View>

        {/* Intro */}
        <View style={s.introBox}>
          <Text style={s.introText}>
            <Text style={s.introHighlight}>Hoe gebruik je dit codeboek?{'\n'}</Text>
            Dit document bevat jouw persoonlijke codes voor geselecteerde partners in {data.province_label}.
            Contacteer een partner en vermeld jouw unieke code — je ontvangt dan automatisch het bijhorende voordeel.
            {'\n\n'}
            <Text style={s.introHighlight}>Belangrijk:</Text> Elke code is uniek aan jou en geldig voor één gebruik.
            De partner kan de code verifiëren via ons systeem.
          </Text>
        </View>

        {/* Sectietitel */}
        <Text style={s.sectionTitle}>
          Partners in {data.province_label} ({data.partners.length})
        </Text>

        {/* Partner cards */}
        {data.partners.length === 0 ? (
          <Text style={s.emptyText}>
            Er zijn momenteel nog geen partners beschikbaar voor jouw provincie.{'\n'}
            We voegen regelmatig nieuwe partners toe. Je ontvangt een update zodra er partners zijn voor {data.province_label}.
          </Text>
        ) : (
          data.partners.map((partner) => (
            <View key={partner.code} style={s.partnerCard}>
              <View style={s.partnerHeader}>
                <View style={s.partnerInfo}>
                  <Text style={s.partnerName}>{partner.business_name}</Text>
                  <Text style={s.partnerType}>{partner.service_type} · {partner.name}</Text>
                </View>
                <View style={[s.codeBadge, partner.is_product ? { backgroundColor: C.clay } : {}]}>
                  <Text style={s.codeLabel}>{partner.is_product ? 'Kortingscode' : 'Jouw code'}</Text>
                  <Text style={[s.codeValue, partner.is_product ? { fontSize: 12, letterSpacing: 1 } : {}]}>{partner.code}</Text>
                </View>
              </View>
              <View style={s.discountBox}>
                <Text style={s.discountLabel}>Wat jij krijgt</Text>
                <Text style={s.discountText}>{partner.discount_description}</Text>
              </View>
            </View>
          ))
        )}

        {/* Instructie onderaan */}
        {data.partners.length > 0 && (
          <View style={s.instructionBox}>
            <Text style={s.instructionText}>
              Toon jouw persoonlijke code bij het eerste contact met de partner.{'\n'}
              De partner verifieert de code en kent je het voordeel toe.
            </Text>
          </View>
        )}

        {/* Doorverwijzing — kortingscode voor een vriend */}
        <View style={s.referralBox}>
          <Text style={s.referralTitle}>Deel dit met een vriend of collega</Text>
          <Text style={s.referralText}>
            Ken jij iemand die ook als zelfstandig thuisverpleegkundige wil starten?
            Geef hen onderstaande kortingscode — zij krijgen 20% korting op de gids.{'\n'}
            De code is enkel geldig voor wie de gids nog niet heeft aangeschaft.
          </Text>
          <View style={s.referralBadge}>
            <Text style={s.referralBadgeLabel}>Kortingscode voor een vriend</Text>
            <Text style={s.referralBadgeCode}>VRIEND20</Text>
            <Text style={s.referralBadgeNote}>20% korting · Gebruiken bij aankoop op startthuisverpleging.be</Text>
          </View>
        </View>

        {/* Sociale media */}
        <View style={s.socialBox}>
          <Text style={s.socialLabel}>Volg ons · Exclusieve voordelen</Text>
          <Text style={s.socialTitle}>Blijf op de hoogte via sociale media</Text>
          <Text style={s.socialDesc}>
            Volg ons op Instagram, Facebook of TikTok en ontvang als eerste eenmalige kortingen en aanbiedingen die we enkel via onze sociale media delen.
          </Text>
          <View style={s.socialRow}>
            <View style={s.socialBadge}><Text style={s.socialBadgeText}>Instagram</Text></View>
            <Text style={s.socialUrl}>@startthuisverpleging</Text>
          </View>
          <View style={s.socialRow}>
            <View style={s.socialBadge}><Text style={s.socialBadgeText}>Facebook</Text></View>
            <Text style={s.socialUrl}>Start Thuisverpleging</Text>
          </View>
          <View style={[s.socialRow, { marginBottom: 0 }]}>
            <View style={s.socialBadge}><Text style={s.socialBadgeText}>TikTok</Text></View>
            <Text style={s.socialUrl}>@startthuisverpleging</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>startthuisverpleging.be</Text>
          <Text style={s.footerText}>Persoonlijk document · Niet overdraagbaar</Text>
        </View>

      </Page>
    </Document>
  )
}

// ── Exportfunctie ─────────────────────────────────────────────────────────────
export async function generateCodebookPdf(data: CodebookData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(CodebookDocument, { data }) as any
  return renderToBuffer(element)
}
