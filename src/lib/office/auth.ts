import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.OFFICE_JWT_SECRET ?? 'office-verander-dit-in-een-lang-geheim'
)
const COOKIE = 'office_session'

export async function signOfficeToken(officeId: string, organizationId: string, email: string) {
  return new SignJWT({ officeId, organizationId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET)
}

export async function verifyOfficeToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { officeId: string; organizationId: string; email: string }
  } catch {
    return null
  }
}

export async function getOfficeSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  return verifyOfficeToken(token)
}

export function setOfficeCookie(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8,
    path: '/',
  }
}
