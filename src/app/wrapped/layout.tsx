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

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function WrappedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
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
      {children}
    </>
  )
}
