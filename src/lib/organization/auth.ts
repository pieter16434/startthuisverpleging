import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.ORGANIZATION_JWT_SECRET ?? 'org-verander-dit-in-een-lang-geheim'
)
const COOKIE = 'org_session'

export async function signOrganizationToken(organizationId: string, email: string) {
  return new SignJWT({ organizationId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET)
}

export async function verifyOrganizationToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { organizationId: string; email: string }
  } catch {
    return null
  }
}

export async function getOrganizationSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  return verifyOrganizationToken(token)
}

export function setOrganizationCookie(token: string) {
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
