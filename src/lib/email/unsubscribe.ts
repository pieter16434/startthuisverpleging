import { createHmac, timingSafeEqual } from 'crypto'

const SECRET = process.env.UNSUBSCRIBE_SECRET ?? 'fallback-change-in-production'

export function generateUnsubscribeToken(email: string): string {
  return createHmac('sha256', SECRET).update(email.toLowerCase().trim()).digest('hex')
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  try {
    const expected = Buffer.from(generateUnsubscribeToken(email), 'hex')
    const received = Buffer.from(token, 'hex')
    if (expected.length !== received.length) return false
    return timingSafeEqual(expected, received)
  } catch {
    return false
  }
}

export function buildUnsubscribeUrl(email: string): string {
  const token = generateUnsubscribeToken(email)
  const encoded = Buffer.from(email.toLowerCase().trim()).toString('base64url')
  return `https://startthuisverpleging.be/api/unsubscribe?e=${encoded}&t=${token}`
}
