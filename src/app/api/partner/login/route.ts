import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { signPartnerToken, setPartnerCookie } from '@/lib/partner/auth'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = Schema.parse(body)

    const supabase = createServiceClient()
    const { data: partner, error } = await supabase
      .from('partners')
      .select('id, email, password_hash, name, business_name, is_active, deactivated_at')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !partner) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })
    }

    if (!partner.is_active) {
      // Grace period: 3 maanden na deactivatie mag partner nog inloggen
      if (partner.deactivated_at) {
        const graceEnd = new Date(partner.deactivated_at)
        graceEnd.setMonth(graceEnd.getMonth() + 3)
        if (new Date() > graceEnd) {
          return NextResponse.json({ error: 'Dit partneraccount is beëindigd. Neem contact op met info@domuscare.be' }, { status: 403 })
        }
        // Binnen grace period → inloggen toegestaan
      } else {
        return NextResponse.json({ error: 'Dit account is niet actief. Neem contact op met info@domuscare.be' }, { status: 403 })
      }
    }

    if (!partner.password_hash) {
      return NextResponse.json({ error: 'Je hebt nog geen wachtwoord ingesteld. Gebruik de uitnodigingslink die je per e-mail ontvangen hebt.' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, partner.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })
    }

    const token = await signPartnerToken(partner.id, partner.email)
    const cookie = setPartnerCookie(token)

    const res = NextResponse.json({ ok: true, name: partner.name })
    res.cookies.set(cookie)
    return res
  } catch (err) {
    console.error('[partner/login]', err)
    return NextResponse.json({ error: 'Inloggen mislukt' }, { status: 500 })
  }
}
