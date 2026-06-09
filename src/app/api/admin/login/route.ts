import { NextRequest, NextResponse } from 'next/server'
import { signAdminToken, setAdminCookie } from '@/lib/admin/auth'

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const adminPassword = process.env.ADMIN_PASSWORD

    if (!adminPassword || password !== adminPassword) {
      return NextResponse.json({ error: 'Ongeldig wachtwoord' }, { status: 401 })
    }

    const token = await signAdminToken()
    const cookie = setAdminCookie(token)
    const res = NextResponse.json({ ok: true })
    res.cookies.set(cookie)
    return res
  } catch {
    return NextResponse.json({ error: 'Inloggen mislukt' }, { status: 500 })
  }
}
