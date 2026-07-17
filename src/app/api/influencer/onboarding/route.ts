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
  const { data } = await supabase
    .from('influencer_onboarding_tokens')
    .select('expires_at, used_at')
    .eq('token', token)
    .single()

  if (!data) return NextResponse.json({ error: 'Ongeldige link.' }, { status: 404 })
  if (data.used_at) return NextResponse.json({ error: 'Deze link is al gebruikt. Neem contact op via info@domuscare.be.' }, { status: 410 })
  if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: 'Deze link is verlopen (geldig 7 dagen). Neem contact op via info@domuscare.be.' }, { status: 410 })

  return NextResponse.json({ ok: true })
}

// POST — influencer aanmaken vanuit onboarding formulier
const Schema = z.object({
  token: z.string().min(1),
  name: z.string().min(1, 'Naam is verplicht').max(100),
  email: z.string().email('Ongeldig e-mailadres'),
  platform: z.enum(['instagram', 'tiktok', 'youtube', 'facebook', 'other'], { error: 'Kies een platform' }),
  social_handle: z.string().min(1, 'Gebruikersnaam is verplicht').max(100),
  profile_url: z.string().max(300).optional(),
  discount_code: z.string().min(3, 'Kortingscode moet minstens 3 tekens hebben').max(30, 'Maximaal 30 tekens').regex(/^[A-Z0-9_-]+$/, 'Enkel hoofdletters, cijfers, - en _ toegestaan'),
  iban: z.string().min(1, 'IBAN is verplicht').max(50),
  iban_name: z.string().min(1, 'Naam rekeninghouder is verplicht').max(100),
  password: z.string().min(8, 'Wachtwoord moet minimaal 8 tekens bevatten'),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // Kortingscode altijd in hoofdletters
    if (body.discount_code) body.discount_code = body.discount_code.trim().toUpperCase()
    const data = Schema.parse(body)

    const supabase = createServiceClient()

    // Token valideren
    const { data: tokenRow } = await supabase
      .from('influencer_onboarding_tokens')
      .select('id, expires_at, used_at')
      .eq('token', data.token)
      .single()

    if (!tokenRow) return NextResponse.json({ error: 'Ongeldige link.' }, { status: 404 })
    if (tokenRow.used_at) return NextResponse.json({ error: 'Deze link is al gebruikt.' }, { status: 410 })
    if (new Date(tokenRow.expires_at) < new Date()) return NextResponse.json({ error: 'Link verlopen.' }, { status: 410 })

    // Check of kortingscode al bestaat (bij partners of andere influencers)
    const { data: existingCode } = await supabase
      .from('influencers')
      .select('id')
      .eq('discount_code', data.discount_code)
      .maybeSingle()

    if (existingCode) {
      return NextResponse.json({ error: 'Deze kortingscode is al in gebruik. Kies een andere.' }, { status: 409 })
    }

    const password_hash = await bcrypt.hash(data.password, 12)

    const { error: influencerError } = await supabase.from('influencers').insert({
      name: data.name,
      email: data.email.toLowerCase(),
      platform: data.platform,
      social_handle: data.social_handle,
      profile_url: data.profile_url || null,
      discount_code: data.discount_code,
      iban: data.iban,
      iban_name: data.iban_name,
      password_hash,
      is_active: true,
    })

    if (influencerError) {
      if (influencerError.code === '23505') {
        return NextResponse.json({ error: 'Dit e-mailadres of deze kortingscode is al in gebruik.' }, { status: 409 })
      }
      throw influencerError
    }

    // Token als gebruikt markeren
    await supabase
      .from('influencer_onboarding_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    }
    console.error('[influencer/onboarding POST]', err)
    return NextResponse.json({ error: 'Profiel aanmaken mislukt' }, { status: 500 })
  }
}
