import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.PARTNER_JWT_SECRET ?? 'verander-dit-in-een-lang-geheim'
)
const COOKIE = 'partner_session'

export async function signPartnerToken(partnerId: string, email: string) {
  return new SignJWT({ partnerId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET)
}

export async function verifyPartnerToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { partnerId: string; email: string }
  } catch {
    return null
  }
}

export async function getPartnerSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  return verifyPartnerToken(token)
}

export function setPartnerCookie(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 uur
    path: '/',
  }
}
