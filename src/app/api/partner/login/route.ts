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

    // ── 1. Probeer als owner (partners tabel) ─────────────────────────
    const { data: partner } = await supabase
      .from('partners')
      .select('id, email, password_hash, name, business_name, is_active, deactivated_at')
      .eq('email', email.toLowerCase())
      .single()

    if (partner) {
      if (!partner.is_active) {
        if (partner.deactivated_at) {
          const graceEnd = new Date(partner.deactivated_at)
          graceEnd.setMonth(graceEnd.getMonth() + 3)
          if (new Date() > graceEnd) {
            return NextResponse.json({ error: 'Dit partneraccount is beëindigd. Neem contact op met info@domuscare.be' }, { status: 403 })
          }
        } else {
          return NextResponse.json({ error: 'Dit account is niet actief. Neem contact op met info@domuscare.be' }, { status: 403 })
        }
      }

      if (!partner.password_hash) {
        return NextResponse.json({ error: 'Je hebt nog geen wachtwoord ingesteld. Gebruik de uitnodigingslink die je per e-mail ontvangen hebt.' }, { status: 401 })
      }

      const valid = await bcrypt.compare(password, partner.password_hash)
      if (!valid) return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })

      const token = await signPartnerToken(partner.id, partner.email, 'owner')
      const cookie = setPartnerCookie(token)
      const res = NextResponse.json({ ok: true, name: partner.name, role: 'owner' })
      res.cookies.set(cookie)
      return res
    }

    // ── 2. Probeer als teamlid (partner_team_members tabel) ───────────
    const { data: member } = await supabase
      .from('partner_team_members')
      .select('id, partner_id, email, password_hash, name, is_active')
      .eq('email', email.toLowerCase())
      .single()

    if (!member) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })
    }

    if (!member.is_active) {
      return NextResponse.json({ error: 'Dit account is niet actief. Neem contact op met info@domuscare.be' }, { status: 403 })
    }

    const validMember = await bcrypt.compare(password, member.password_hash)
    if (!validMember) return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })

    const token = await signPartnerToken(member.partner_id, member.email, 'member', member.id)
    const cookie = setPartnerCookie(token)
    const res = NextResponse.json({ ok: true, name: member.name, role: 'member' })
    res.cookies.set(cookie)
    return res

  } catch (err) {
    console.error('[partner/login]', err)
    return NextResponse.json({ error: 'Inloggen mislukt' }, { status: 500 })
  }
}
