export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// GET — token valideren + partner info ophalen
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Geen token' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: tokenRow } = await supabase
    .from('partner_team_invite_tokens')
    .select('expires_at, used_at, partner_id')
    .eq('token', token)
    .single()

  if (!tokenRow) return NextResponse.json({ error: 'Ongeldige link.' }, { status: 404 })
  if (tokenRow.used_at) return NextResponse.json({ error: 'Deze link is al gebruikt. Neem contact op via info@domuscare.be.' }, { status: 410 })
  if (new Date(tokenRow.expires_at) < new Date()) return NextResponse.json({ error: 'Deze link is verlopen (geldig 7 dagen). Neem contact op via info@domuscare.be.' }, { status: 410 })

  const { data: partner } = await supabase
    .from('partners')
    .select('business_name, service_type')
    .eq('id', tokenRow.partner_id)
    .single()

  return NextResponse.json({ ok: true, partner })
}

const Schema = z.object({
  token: z.string().min(1),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8),
})

// POST — teamlid aanmaken
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = Schema.parse(body)

    const supabase = createServiceClient()

    const { data: tokenRow } = await supabase
      .from('partner_team_invite_tokens')
      .select('id, expires_at, used_at, partner_id')
      .eq('token', data.token)
      .single()

    if (!tokenRow) return NextResponse.json({ error: 'Ongeldige link.' }, { status: 404 })
    if (tokenRow.used_at) return NextResponse.json({ error: 'Link al gebruikt.' }, { status: 410 })
    if (new Date(tokenRow.expires_at) < new Date()) return NextResponse.json({ error: 'Link verlopen.' }, { status: 410 })

    const password_hash = await bcrypt.hash(data.password, 12)

    const { error: memberError } = await supabase.from('partner_team_members').insert({
      partner_id: tokenRow.partner_id,
      name: data.name,
      email: data.email.toLowerCase(),
      password_hash,
      is_active: true,
    })

    if (memberError) {
      if (memberError.code === '23505') return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik.' }, { status: 409 })
      throw memberError
    }

    // Markeer token als gebruikt
    await supabase
      .from('partner_team_invite_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenRow.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    console.error('[partner/team/onboarding POST]', err)
    return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  }
}
