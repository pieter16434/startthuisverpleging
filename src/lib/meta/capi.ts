import { createHash } from 'crypto'

const PIXEL_ID = process.env.META_PIXEL_ID ?? '1885798712582280'
const ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE
const API_URL = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

export type MetaEventProps = {
  eventName: string
  eventId: string
  email?: string
  firstName?: string
  value?: number
  currency?: string
  orderId?: string
  fbp?: string
  fbc?: string
  clientIp?: string
  userAgent?: string
  sourceUrl?: string
}

export async function sendMetaEvent(props: MetaEventProps): Promise<void> {
  if (!ACCESS_TOKEN) return

  const userData: Record<string, string> = {
    country: sha256('be'),
  }
  if (props.email) {
    userData.em = sha256(props.email)
    userData.external_id = sha256(props.email)
  }
  if (props.firstName) userData.fn = sha256(props.firstName)
  if (props.clientIp) userData.client_ip_address = props.clientIp
  if (props.userAgent) userData.client_user_agent = props.userAgent
  if (props.fbp) userData.fbp = props.fbp
  if (props.fbc) userData.fbc = props.fbc

  const eventData: Record<string, unknown> = {
    event_name: props.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: props.eventId,
    action_source: 'website',
    event_source_url: props.sourceUrl ?? 'https://www.startthuisverpleging.be',
    user_data: userData,
  }

  if (props.value !== undefined) {
    eventData.custom_data = {
      value: props.value,
      currency: props.currency ?? 'EUR',
      ...(props.orderId ? { order_id: props.orderId } : {}),
    }
  }

  const body: Record<string, unknown> = { data: [eventData] }
  if (TEST_EVENT_CODE) body.test_event_code = TEST_EVENT_CODE

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    await fetch(`${API_URL}?access_token=${ACCESS_TOKEN}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(timeout)
  } catch (err) {
    console.error('[meta-capi]', props.eventName, 'mislukt:', err)
  }
}
