export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

// GET — token valideren (toont naam + e-mail zodat de pagina de partner kan begroeten)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Geen token' }, { status: 400 })

  const supabase = createServiceClient()
  const { data: partner } = await supabase
    .from('partners')
    .select('name, email, invite_token_expires_at')
    .eq('invite_token', token)
    .single()

  if (!partner) {
    return NextResponse.json({ error: 'Ongeldige of verlopen link.' }, { status: 404 })
  }
  if (new Date(partner.invite_token_expires_at) < new Date()) {
    return NextResponse.json({ error: 'Deze link is verlopen. Vraag een nieuwe aan via info@domuscare.be.' }, { status: 410 })
  }

  return NextResponse.json({ name: partner.name, email: partner.email })
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
    const { data: partner } = await supabase
      .from('partners')
      .select('id, invite_token_expires_at')
      .eq('invite_token', token)
      .single()

    if (!partner) {
      return NextResponse.json({ error: 'Ongeldige of verlopen link.' }, { status: 404 })
    }
    if (new Date(partner.invite_token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Deze link is verlopen. Vraag een nieuwe aan via info@domuscare.be.' }, { status: 410 })
    }

    const password_hash = await bcrypt.hash(password, 12)

    const { error } = await supabase
      .from('partners')
      .update({
        password_hash,
        invite_token: null,
        invite_token_expires_at: null,
      })
      .eq('id', partner.id)

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 })
    }
    console.error('[partner/set-password POST]', err)
    return NextResponse.json({ error: 'Wachtwoord instellen mislukt' }, { status: 500 })
  }
}
