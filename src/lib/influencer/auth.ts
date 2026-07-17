import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(
  process.env.INFLUENCER_JWT_SECRET ?? 'influencer-geheim-verander-dit-in-productie'
)
const COOKIE = 'influencer_session'

export async function signInfluencerToken(influencerId: string, email: string) {
  return new SignJWT({ influencerId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(SECRET)
}

export async function verifyInfluencerToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as { influencerId: string; email: string }
  } catch {
    return null
  }
}

export async function getInfluencerSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE)?.value
  if (!token) return null
  return verifyInfluencerToken(token)
}

export function setInfluencerCookie(token: string) {
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
