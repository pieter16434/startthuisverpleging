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

    if (office && office.password_hash) {
      if (!office.is_active) {
        return NextResponse.json({ error: 'Dit kantoor is niet actief. Neem contact op via info@domuscare.be.' }, { status: 403 })
      }
      const valid = await bcrypt.compare(password, office.password_hash)
      if (valid) {
        const token = await signOfficeToken(office.id, office.organization_id, office.email, 'owner')
        const cookie = setOfficeCookie(token)
        const res = NextResponse.json({ ok: true, name: office.name })
        res.cookies.set(cookie)
        return res
      }
    }

    // Probeer office teamlid
    const { data: member } = await supabase
      .from('office_team_members')
      .select('id, email, password_hash, name, office_id, is_active')
      .eq('email', email.toLowerCase())
      .single()

    if (!member || !member.password_hash) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })
    }
    if (!member.is_active) {
      return NextResponse.json({ error: 'Dit account is niet actief.' }, { status: 403 })
    }
    const validMember = await bcrypt.compare(password, member.password_hash)
    if (!validMember) return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })

    // Haal de office op voor organizationId
    const { data: memberOffice } = await supabase
      .from('organization_offices')
      .select('id, organization_id')
      .eq('id', member.office_id)
      .single()

    if (!memberOffice) return NextResponse.json({ error: 'Kantoor niet gevonden' }, { status: 404 })

    const token = await signOfficeToken(member.office_id, memberOffice.organization_id, member.email, 'member', member.id)
    const cookie = setOfficeCookie(token)
    const res = NextResponse.json({ ok: true, name: member.name })
    res.cookies.set(cookie)
    return res
  } catch (err) {
    console.error('[office/login]', err)
    return NextResponse.json({ error: 'Inloggen mislukt' }, { status: 500 })
  }
}
