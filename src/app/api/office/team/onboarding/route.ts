export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// GET — token valideren en kantoor-info ophalen
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Geen token' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: invite } = await supabase
    .from('office_team_invite_tokens')
    .select('id, office_id, expires_at, used_at')
    .eq('token', token)
    .single()

  if (!invite) return NextResponse.json({ error: 'Deze link is ongeldig.' }, { status: 404 })
  if (invite.used_at) return NextResponse.json({ error: 'Deze link is al gebruikt.' }, { status: 410 })
  if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Deze link is verlopen.' }, { status: 410 })

  const { data: office } = await supabase
    .from('organization_offices')
    .select('business_name, organization_id, organizations(business_name)')
    .eq('id', invite.office_id)
    .single()

  return NextResponse.json({ office })
}

const Schema = z.object({
  token: z.string().min(1),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
})

// POST — teamlid account aanmaken
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, name, email, password } = Schema.parse(body)

    const supabase = createServiceClient()

    const { data: invite } = await supabase
      .from('office_team_invite_tokens')
      .select('id, office_id, expires_at, used_at')
      .eq('token', token)
      .single()

    if (!invite) return NextResponse.json({ error: 'Ongeldige link.' }, { status: 400 })
    if (invite.used_at) return NextResponse.json({ error: 'Link al gebruikt.' }, { status: 410 })
    if (new Date(invite.expires_at) < new Date()) return NextResponse.json({ error: 'Link verlopen.' }, { status: 410 })

    const password_hash = await bcrypt.hash(password, 12)

    const { error } = await supabase.from('office_team_members').insert({
      office_id: invite.office_id,
      name,
      email: email.toLowerCase(),
      password_hash,
    })

    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'Dit e-mailadres is al in gebruik.' }, { status: 409 })
      throw error
    }

    // Token markeren als gebruikt
    await supabase.from('office_team_invite_tokens').update({ used_at: new Date().toISOString() }).eq('id', invite.id)

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: 'Ongeldige gegevens.' }, { status: 400 })
    console.error('[office/team/onboarding POST]', err)
    return NextResponse.json({ error: 'Aanmaken mislukt' }, { status: 500 })
  }
}
