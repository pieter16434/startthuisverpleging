import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { signOfficeToken, setOfficeCookie } from '@/lib/office/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const Schema = z.object({ email: z.string().email(), password: z.string().min(1) })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = Schema.parse(body)

    const supabase = createServiceClient()
    const { data: office } = await supabase
      .from('organization_offices')
      .select('id, email, password_hash, name, business_name, is_active, organization_id')
      .eq('email', email.toLowerCase())
      .single()

    if (!office || !office.password_hash) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })
    }
    if (!office.is_active) {
      return NextResponse.json({ error: 'Dit kantoor is niet actief. Neem contact op via info@domuscare.be.' }, { status: 403 })
    }

    const valid = await bcrypt.compare(password, office.password_hash)
    if (!valid) return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })

    const token = await signOfficeToken(office.id, office.organization_id, office.email)
    const cookie = setOfficeCookie(token)
    const res = NextResponse.json({ ok: true, name: office.name })
    res.cookies.set(cookie)
    return res
  } catch (err) {
    console.error('[office/login]', err)
    return NextResponse.json({ error: 'Inloggen mislukt' }, { status: 500 })
  }
}
