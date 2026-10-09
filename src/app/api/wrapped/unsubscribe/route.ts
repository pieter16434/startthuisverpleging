import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { verifyWrappedUnsubscribeToken } from '@/lib/wrapped/emails'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const encoded = searchParams.get('e') ?? ''
  const token   = searchParams.get('t') ?? ''

  let email = ''
  try { email = Buffer.from(encoded, 'base64url').toString('utf8') } catch {}

  if (!email || !verifyWrappedUnsubscribeToken(email, token)) {
    return NextResponse.redirect(
      new URL('/wrapped/unsubscribe?status=invalid', req.url)
    )
  }

  const db = createServiceClient()
  await db.from('wrapped_leads')
    .update({ unsubscribed_at: new Date().toISOString() })
    .eq('email', email.toLowerCase().trim())
    .is('unsubscribed_at', null)

  return NextResponse.redirect(
    new URL('/wrapped/unsubscribe?status=ok', req.url)
  )
}
