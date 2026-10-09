// Pixel tracking helpers — Meta en TikTok
// Alle calls zijn no-ops als het pixel niet geladen is (geen consent of niet geïnit).

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
    ttq?: { track: (event: string, params?: Record<string, unknown>) => void }
  }
}

export function trackMeta(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('track', event, params ?? {})
}

export function trackMetaCustom(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.fbq) return
  window.fbq('trackCustom', event, params ?? {})
}

export function trackTikTok(event: string, params?: Record<string, unknown>) {
  if (typeof window === 'undefined' || !window.ttq) return
  window.ttq.track(event, params ?? {})
}
