import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { signInfluencerToken, setInfluencerCookie } from '@/lib/influencer/auth'
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
    const { data: influencer, error } = await supabase
      .from('influencers')
      .select('id, email, password_hash, name, is_active, deactivated_at')
      .eq('email', email.toLowerCase())
      .single()

    if (error || !influencer) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })
    }

    if (!influencer.is_active) {
      // Grace period: 3 maanden na deactivatie mag influencer nog inloggen
      if (influencer.deactivated_at) {
        const graceEnd = new Date(influencer.deactivated_at)
        graceEnd.setMonth(graceEnd.getMonth() + 3)
        if (new Date() > graceEnd) {
          return NextResponse.json({ error: 'Dit account is beëindigd. Neem contact op via info@domuscare.be.' }, { status: 403 })
        }
      } else {
        return NextResponse.json({ error: 'Dit account is niet actief. Neem contact op via info@domuscare.be.' }, { status: 403 })
      }
    }

    if (!influencer.password_hash) {
      return NextResponse.json({ error: 'Geen wachtwoord ingesteld. Gebruik de onboarding link die je ontvangen hebt.' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, influencer.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Ongeldig e-mailadres of wachtwoord' }, { status: 401 })
    }

    const token = await signInfluencerToken(influencer.id, influencer.email)
    const cookie = setInfluencerCookie(token)

    const res = NextResponse.json({ ok: true, name: influencer.name })
    res.cookies.set(cookie)
    return res
  } catch (err) {
    console.error('[influencer/login]', err)
    return NextResponse.json({ error: 'Inloggen mislukt' }, { status: 500 })
  }
}
