import type { Metadata } from 'next'
import Script from 'next/script'

const isLaunched = process.env.NEXT_PUBLIC_WRAPPED_LAUNCHED === 'true'

export const metadata: Metadata = {
  title: 'Zorg Wrapped 2026 — jouw jaar in de zorg',
  description: 'Nachten, weekends, kilometers. Tijd dat iemand het eens optelt.',
  robots: isLaunched ? 'index, follow' : 'noindex, nofollow',
  openGraph: {
    title: 'Zorg Wrapped 2026',
    description: 'Jouw jaar in de zorg, in 90 seconden.',
    locale: 'nl_BE',
    type: 'website',
  },
}

const META_PIXEL_ID    = process.env.NEXT_PUBLIC_META_PIXEL_ID
const TIKTOK_PIXEL_ID  = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID

export default function WrappedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Google Fonts — Bricolage Grotesque (UI) + Fraunces (display/serif) */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&family=Fraunces:ital,opsz,wght@0,9..144,600;0,9..144,800;1,9..144,500&display=swap"
        rel="stylesheet"
      />
      {/* Meta-pixel — alleen laden als cookietoestemming is gegeven (stv_cookie_consent = 'yes') */}
      {META_PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          (function() {
            var consent = null;
            try { consent = localStorage.getItem('stv_cookie_consent'); } catch(e) {}
            if (consent !== 'yes') return;
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          })();
        `}</Script>
      )}
      {/* TikTok-pixel — zelfde consent-gate */}
      {TIKTOK_PIXEL_ID && (
        <Script id="tiktok-pixel" strategy="afterInteractive">{`
          (function() {
            var consent = null;
            try { consent = localStorage.getItem('stv_cookie_consent'); } catch(e) {}
            if (consent !== 'yes') return;
            !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
            ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
            ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
            ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
            ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";
            ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
            var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;
            var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
            ttq.load('${TIKTOK_PIXEL_ID}');
            ttq.page();}(window,document,'ttq');
          })();
        `}</Script>
      )}
      {children}
    </>
  )
}
