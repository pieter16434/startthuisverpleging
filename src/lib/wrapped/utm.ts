const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const
export type UtmParams = Partial<Record<typeof UTM_KEYS[number], string>>

// Leest UTM-params uit de URL en slaat ze op in sessionStorage (enkel bij aanwezigheid)
export function captureAndStoreUtms(): void {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const utms: UtmParams = {}
  for (const key of UTM_KEYS) {
    const val = params.get(key)
    if (val) utms[key] = val
  }
  if (Object.keys(utms).length > 0) {
    try { sessionStorage.setItem('zw_utms', JSON.stringify(utms)) } catch {}
  }
}

export function getStoredUtms(): UtmParams {
  try {
    const s = sessionStorage.getItem('zw_utms')
    return s ? (JSON.parse(s) as UtmParams) : {}
  } catch { return {} }
}
