import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET ?? 'admin-jwt-geheim-vervang-dit'
)
const COOKIE = 'admin_session'

export async function signAdminToken() {
  return new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(SECRET)
}

export async function verifyAdminToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { role: string }
  } catch {
    return null
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  return verifyAdminToken(token)
}

export function setAdminCookie(token: string) {
  return {
    name: COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 12,
    path: '/',
  }
}
