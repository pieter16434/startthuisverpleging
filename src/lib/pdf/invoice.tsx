import React from 'react'
import {
  Document, Page, Text, View, StyleSheet, renderToBuffer,
} from '@react-pdf/renderer'

export type InvoiceData = {
  invoice_number: string
  invoice_date: string
  customer_first_name: string
  customer_last_name: string
  customer_email: string
  customer_address_street?: string | null
  customer_address_postal_code?: string | null
  customer_address_city?: string | null
  amount_cents: number
  order_short_id: string
}

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
  white:   '#ffffff',
}

const s = StyleSheet.create({
  page: {
    backgroundColor: C.white,
    paddingTop: 52,
    paddingBottom: 72,
    paddingHorizontal: 52,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: C.ink,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 24,
    marginBottom: 32,
    borderBottom: `1 solid ${C.line}`,
  },
  brandName: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: C.green,
    marginBottom: 3,
  },
  brandMeta: {
    fontSize: 9,
    color: C.inkMute,
  },
  invoiceLabel: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: C.green,
    textAlign: 'right',
  },
  invoiceMeta: {
    fontSize: 10,
    color: C.inkMute,
    textAlign: 'right',
    marginTop: 3,
  },

  // Parties
  partiesRow: {
    flexDirection: 'row',
    marginBottom: 36,
  },
  partyBlock: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.inkMute,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  partyName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: C.ink,
    marginBottom: 4,
  },
  partyLine: {
    fontSize: 10,
    color: C.inkSoft,
    marginBottom: 2,
    lineHeight: 1.4,
  },
  partyMuted: {
    fontSize: 9,
    color: C.inkMute,
    marginBottom: 2,
  },

  // Tabel
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.green,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableHeaderText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: C.butter,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: C.surface,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 4,
    alignItems: 'flex-start',
  },
  colDesc: { flex: 1 },
  colQty:  { width: 44, textAlign: 'center' },
  colAmt:  { width: 90, textAlign: 'right' },
  cellText: { fontSize: 11, color: C.inkSoft },
  cellSub:  { fontSize: 9, color: C.inkMute, marginTop: 2 },

  // Totalen
  totalsSection: {
    marginTop: 20,
    alignItems: 'flex-end',
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 260,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  totalLabel: { fontSize: 11, color: C.inkMute },
  totalValue: { fontSize: 11, color: C.ink },
  divider: {
    width: 260,
    borderBottom: `1 solid ${C.line}`,
    marginBottom: 4,
  },
  grandTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 260,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: C.green,
    borderRadius: 6,
  },
  grandLabel: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.butter },
  grandValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: C.white },

  // Noot
  noteBox: {
    marginTop: 36,
    padding: 14,
    backgroundColor: C.cream,
    borderRadius: 6,
  },
  noteText: {
    fontSize: 9,
    color: C.inkMute,
    lineHeight: 1.6,
  },

  // Footer
  footer: {
    marginTop: 40,
    paddingTop: 12,
    borderTop: `1 solid ${C.line}`,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 9,
    color: C.inkMute,
  },
})

function InvoiceDocument({ data }: { data: InvoiceData }) {
  const amountFormatted = `€ ${(data.amount_cents / 100).toFixed(2).replace('.', ',')}`

  return (
    <Document title={`Factuur ${data.invoice_number} — Vitalion Ascent BV`} author="Vitalion Ascent BV">
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>Vitalion Ascent BV</Text>
            <Text style={s.brandMeta}>startthuisverpleging.be</Text>
          </View>
          <View>
            <Text style={s.invoiceLabel}>FACTUUR</Text>
            <Text style={s.invoiceMeta}>Nr. {data.invoice_number}</Text>
            <Text style={s.invoiceMeta}>{data.invoice_date}</Text>
          </View>
        </View>

        {/* Partijen */}
        <View style={s.partiesRow}>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>Verkoper</Text>
            <Text style={s.partyName}>Vitalion Ascent BV</Text>
            <Text style={s.partyLine}>Elfenbergstraat 31</Text>
            <Text style={s.partyLine}>3511 Kuringen, België</Text>
            <Text style={s.partyMuted}>KBO: 1023728595</Text>
            <Text style={s.partyMuted}>Vrijgesteld van btw</Text>
            <Text style={s.partyMuted}>info@domuscare.be</Text>
          </View>
          <View style={s.partyBlock}>
            <Text style={s.partyLabel}>Klant</Text>
            <Text style={s.partyName}>{data.customer_first_name} {data.customer_last_name}</Text>
            {data.customer_address_street ? (
              <Text style={s.partyLine}>{data.customer_address_street}</Text>
            ) : null}
            {data.customer_address_postal_code && data.customer_address_city ? (
              <Text style={s.partyLine}>{data.customer_address_postal_code} {data.customer_address_city}</Text>
            ) : null}
            <Text style={s.partyLine}>{data.customer_email}</Text>
            <Text style={s.partyMuted}>Ref.: {data.order_short_id}</Text>
          </View>
        </View>

        {/* Tabel */}
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, s.colDesc]}>Omschrijving</Text>
          <Text style={[s.tableHeaderText, s.colQty]}>Aantal</Text>
          <Text style={[s.tableHeaderText, s.colAmt]}>Bedrag</Text>
        </View>
        <View style={s.tableRow}>
          <View style={s.colDesc}>
            <Text style={s.cellText}>Gids: Zelfstandig thuisverpleegkundige worden in Vlaanderen</Text>
            <Text style={s.cellSub}>Digitale download · startthuisverpleging.be</Text>
          </View>
          <Text style={[s.cellText, s.colQty]}>1</Text>
          <Text style={[s.cellText, s.colAmt]}>{amountFormatted}</Text>
        </View>

        {/* Totalen */}
        <View style={s.totalsSection}>
          <View style={s.totalLine}>
            <Text style={s.totalLabel}>Subtotaal excl. btw</Text>
            <Text style={s.totalValue}>{amountFormatted}</Text>
          </View>
          <View style={s.totalLine}>
            <Text style={s.totalLabel}>Btw</Text>
            <Text style={s.totalValue}>Vrijgesteld</Text>
          </View>
          <View style={s.divider} />
          <View style={s.grandTotal}>
            <Text style={s.grandLabel}>Totaal betaald</Text>
            <Text style={s.grandValue}>{amountFormatted}</Text>
          </View>
        </View>

        {/* Noot */}
        <View style={s.noteBox}>
          <Text style={s.noteText}>
            Vitalion Ascent BV is vrijgesteld van btw. Deze factuur geldt als bewijs van betaling voor de aankoop van een digitaal product.{'\n'}
            Betaling volledig ontvangen op {data.invoice_date} via Mollie.
          </Text>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>Vitalion Ascent BV · KBO 1023728595 · Elfenbergstraat 31, 3511 Kuringen</Text>
          <Text style={s.footerText}>info@domuscare.be</Text>
        </View>

      </Page>
    </Document>
  )
}

export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(InvoiceDocument, { data }) as any
  return renderToBuffer(element)
}
