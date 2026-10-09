// Zorg Wrapped — e-mailsequentie cron
// Volledig los van de bestaande nurture (/api/cron/nurture).
// Leest uitsluitend uit wrapped_leads — raakt leads-tabel nooit aan.
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend/client'
import { buildWrappedUnsubscribeUrl, buildEmail1, buildEmail2, buildEmail3 } from '@/lib/wrapped/emails'

const FROM = process.env.RESEND_WRAPPED_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL!

// Hoeveel dagen na aanmelding elke stap verstuurd wordt
const DELAYS = { 1: 0, 2: 3, 7: 3 } // step → minDaysAfterPrev
// step 1: stuur zodra created_at ≤ nu (safety-net voor leads die email 1 niet ontvingen)
// step 2: ≥ 3 dagen na seq_step 1
// step 3: ≥ 7 dagen na seq_step 2
const STEP2_DAYS = 3
const STEP3_DAYS = 7

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db  = createServiceClient()
  const now = new Date()

  let sent = 0

  // ── Stap 1 (safety-net): seq_step = 0, aangemeld ≥ 30 minuten geleden ──────
  const cutoff1 = new Date(now.getTime() - 30 * 60 * 1000).toISOString()
  const { data: stap1Leads } = await db
    .from('wrapped_leads')
    .select('email')
    .eq('seq_step', 0)
    .eq('consent', true)
    .is('unsubscribed_at', null)
    .lte('created_at', cutoff1)

  for (const lead of stap1Leads ?? []) {
    const unsubUrl = buildWrappedUnsubscribeUrl(lead.email)
    const mail = buildEmail1(unsubUrl)
    const { error } = await resend.emails.send({
      from: FROM, to: lead.email,
      subject: mail.subject, html: mail.html,
      headers: { 'X-Entity-Ref-ID': `wrapped-seq1-${lead.email}` },
    })
    if (error) { console.error('[wrapped-cron] seq1 fout', lead.email, error); continue }
    await db.from('wrapped_leads')
      .update({ seq_step: 1, seq_updated_at: now.toISOString() })
      .eq('email', lead.email)
    sent++
  }

  // ── Stap 2: seq_step = 1, seq_updated_at ≥ STEP2_DAYS geleden ───────────────
  const cutoff2 = new Date(now)
  cutoff2.setDate(cutoff2.getDate() - STEP2_DAYS)
  const { data: stap2Leads } = await db
    .from('wrapped_leads')
    .select('email')
    .eq('seq_step', 1)
    .eq('consent', true)
    .is('unsubscribed_at', null)
    .lte('seq_updated_at', cutoff2.toISOString())

  for (const lead of stap2Leads ?? []) {
    const unsubUrl = buildWrappedUnsubscribeUrl(lead.email)
    const mail = buildEmail2(unsubUrl)
    const { error } = await resend.emails.send({
      from: FROM, to: lead.email,
      subject: mail.subject, html: mail.html,
      headers: { 'X-Entity-Ref-ID': `wrapped-seq2-${lead.email}` },
    })
    if (error) { console.error('[wrapped-cron] seq2 fout', lead.email, error); continue }
    await db.from('wrapped_leads')
      .update({ seq_step: 2, seq_updated_at: now.toISOString() })
      .eq('email', lead.email)
    sent++
  }

  // ── Stap 3: seq_step = 2, seq_updated_at ≥ STEP3_DAYS geleden ───────────────
  const cutoff3 = new Date(now)
  cutoff3.setDate(cutoff3.getDate() - STEP3_DAYS)
  const { data: stap3Leads } = await db
    .from('wrapped_leads')
    .select('email')
    .eq('seq_step', 2)
    .eq('consent', true)
    .is('unsubscribed_at', null)
    .lte('seq_updated_at', cutoff3.toISOString())

  for (const lead of stap3Leads ?? []) {
    const unsubUrl = buildWrappedUnsubscribeUrl(lead.email)
    const mail = buildEmail3(unsubUrl)
    const { error } = await resend.emails.send({
      from: FROM, to: lead.email,
      subject: mail.subject, html: mail.html,
      headers: { 'X-Entity-Ref-ID': `wrapped-seq3-${lead.email}` },
    })
    if (error) { console.error('[wrapped-cron] seq3 fout', lead.email, error); continue }
    await db.from('wrapped_leads')
      .update({ seq_step: 3, seq_updated_at: now.toISOString() })
      .eq('email', lead.email)
    sent++
  }

  console.log(`[wrapped-cron] klaar — ${sent} mail(s) verstuurd`)
  return NextResponse.json({ ok: true, sent })
}
