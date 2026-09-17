import { createHash } from 'crypto'

const PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID
const ACCESS_TOKEN = process.env.TIKTOK_EVENTS_ACCESS_TOKEN
const API_URL = 'https://business-api.tiktok.com/open_api/v1.3/event/track/'

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

type TikTokUser = {
  email?: string
  ip?: string
  user_agent?: string
}

type TikTokPurchaseProps = {
  value: number
  currency: string
  content_id: string
  content_name: string
}

async function sendEvent(eventName: string, eventId: string, user: TikTokUser, properties: Record<string, unknown>, pageUrl: string): Promise<void> {
  if (!PIXEL_ID || !ACCESS_TOKEN) return

  const userData: Record<string, string> = {}
  if (user.email) userData.email = sha256(user.email)
  if (user.ip) userData.ip = user.ip
  if (user.user_agent) userData.user_agent = user.user_agent

  const payload = {
    pixel_code: PIXEL_ID,
    event_source: 'web',
    event_source_id: PIXEL_ID,
    data: [
      {
        event: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        user: userData,
        properties: { ...properties, content_type: 'product' },
        page: { url: pageUrl },
      },
    ],
  }

  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Access-Token': ACCESS_TOKEN },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error(`[tiktok-events] ${eventName} mislukt:`, err)
  }
}

export async function trackPurchase(
  eventId: string,
  user: TikTokUser,
  props: TikTokPurchaseProps,
): Promise<void> {
  await sendEvent('Purchase', eventId, user, {
    value: props.value,
    currency: props.currency,
    content_id: props.content_id,
    content_name: props.content_name,
  }, 'https://www.startthuisverpleging.be/checkout')
}

export async function trackInitiateCheckout(
  eventId: string,
  user: TikTokUser,
  props: TikTokPurchaseProps,
): Promise<void> {
  await sendEvent('InitiateCheckout', eventId, user, {
    value: props.value,
    currency: props.currency,
    content_id: props.content_id,
    content_name: props.content_name,
  }, 'https://www.startthuisverpleging.be/checkout')
}
