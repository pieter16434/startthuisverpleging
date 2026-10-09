import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { resend } from '@/lib/resend/client'
import { buildWrappedUnsubscribeUrl, buildEmail1 } from '@/lib/wrapped/emails'

const FROM = process.env.RESEND_WRAPPED_FROM_EMAIL ?? process.env.RESEND_FROM_EMAIL!

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email: string = (body.email ?? '').trim().toLowerCase()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'invalid_email' }, { status: 400 })
    }

    const db = createServiceClient()

    // Upsert — duplicate e-mail updates consent + provincie, nooit fout
    const { data: rows, error: upsertErr } = await db.from('wrapped_leads').upsert(
      {
        email,
        consent:      body.consent      === true,
        rol:          body.rol          ?? null,
        provincie:    body.provincie    ?? null,
        utm_source:   body.utm_source   ?? null,
        utm_medium:   body.utm_medium   ?? null,
        utm_campaign: body.utm_campaign ?? null,
      },
      { onConflict: 'email', ignoreDuplicates: false }
    ).select('seq_step')

    if (upsertErr) throw upsertErr

    // Stuur email 1 direct als deze lead nog geen email 1 heeft ontvangen
    const seqStep: number = rows?.[0]?.seq_step ?? 0
    if (seqStep === 0 && body.consent === true) {
      try {
        const unsubUrl = buildWrappedUnsubscribeUrl(email)
        const mail = buildEmail1(unsubUrl)
        const { error: mailErr } = await resend.emails.send({
          from: FROM, to: email,
          subject: mail.subject, html: mail.html,
          headers: { 'X-Entity-Ref-ID': `wrapped-seq1-${email}` },
        })
        if (!mailErr) {
          await db.from('wrapped_leads')
            .update({ seq_step: 1, seq_updated_at: new Date().toISOString() })
            .eq('email', email)
        }
      } catch {
        // Mail mislukt: cron pikt dit op als safety-net, UX breekt nooit
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
