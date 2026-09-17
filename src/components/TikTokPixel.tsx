'use client'

/**
 * TikTok Pixel
 *
 * Laadt de TikTok Pixel eenmalig en stuurt een page()-event bij elke
 * client-side navigatie (Next.js App Router gebruikt geen volledige page reloads).
 *
 * Pixel ID via NEXT_PUBLIC_TIKTOK_PIXEL_ID.
 */

import Script from 'next/script'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'

const PIXEL_ID = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID

// Stuurt ttq.page() bij elke route-wisseling
function TikTokPageTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!PIXEL_ID) return
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ttq = (window as any).ttq
    if (typeof ttq?.page === 'function') {
      ttq.page()
    }
  }, [pathname, searchParams])

  return null
}

export default function TikTokPixel() {
  if (!PIXEL_ID) return null

  return (
    <>
      <Script
        id="tiktok-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;
  var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
  ttq.load=function(e,n){
    var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;
    ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;
    ttq._t=ttq._t||{};ttq._t[e]=+new Date;
    ttq._o=ttq._o||{};ttq._o[e]=n||{};
    n=document.createElement("script");n.type="text/javascript";n.async=!0;
    n.src=r+"?sdkid="+e+"&lib="+t;
    e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)
  };
  ttq.load('${PIXEL_ID}');
  ttq.page();
}(window, document, 'ttq');
          `,
        }}
      />
      <Suspense fallback={null}>
        <TikTokPageTracker />
      </Suspense>
    </>
  )
}
