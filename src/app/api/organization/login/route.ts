import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { signOrganizationToken, setOrganizationCookie } from '@/lib/organization/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const Schema = z.object({ email: z.string().email(), password: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = Schema.parse(body)

    const supabase = createServiceClient()
    const { data: org } = await supabase
      .from('organizations')
      .select('id, email, password_hash, name, business_name, is_active')
      .eq('email', email.toLowerCase())
      .single()

    if (!org || !org.password_hash) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })
    }
    if (!org.is_active) {
      return NextResponse.json({ error: 'Dit account is niet actief. Neem contact op via info@domuscare.be.' }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, org.password_hash)
    if (!valid) return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })

    const token = await signOrganizationToken(org.id, org.email)
    const cookie = setOrganizationCookie(token)
    const res = NextResponse.json({ ok: true, name: org.name })
    res.cookies.set(cookie)
    return res
  } catch (err) {
    console.error('[organization/login]', err)
    return NextResponse.json({ error: 'Inloggen mislukt' }, { status: 500 })
  }
}
