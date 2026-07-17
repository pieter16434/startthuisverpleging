export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// GET — token valideren
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Geen token' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: influencer } = await supabase
    .from('influencers')
    .select('name, email, reset_token_expires_at')
    .eq('reset_token', token)
    .single()

  if (!influencer) {
    return NextResponse.json({ error: 'Ongeldige of verlopen link.' }, { status: 404 })
  }
  if (new Date(influencer.reset_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Deze link is verlopen (geldig 24 uur). Vraag een nieuwe aan via de inlogpagina.' }, { status: 410 })
  }

  return NextResponse.json({ name: influencer.name, email: influencer.email })
}

// POST — wachtwoord instellen en token verbruiken
const Schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens bevatten'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, password } = Schema.parse(body)

    const supabase = createServiceClient()
    const { data: influencer } = await supabase
      .from('influencers')
      .select('id, reset_token_expires_at')
      .eq('reset_token', token)
      .single()

    if (!influencer) {
      return NextResponse.json({ error: 'Ongeldige of verlopen link.' }, { status: 404 })
    }
    if (new Date(influencer.reset_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Link verlopen. Vraag een nieuwe aan.' }, { status: 410 })
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { error } = await supabase
      .from('influencers')
      .update({ password_hash, reset_token: null, reset_token_expires_at: null })
      .eq('id', influencer.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    }
    console.error('[influencer/set-password POST]', err)
    return NextResponse.json({ error: 'Wachtwoord instellen mislukt' }, { status: 500 })
  }
}
