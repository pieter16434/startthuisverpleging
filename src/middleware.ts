import { NextRequest, NextResponse } from 'next/server'

// Herschrijft verzoeken op zorgwrapped.be intern naar /wrapped/...
// Heeft geen invloed op startthuisverpleging.be of de statische coming-soon.html
export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? ''

  if (host === 'zorgwrapped.be' || host === 'www.zorgwrapped.be') {
    const { pathname, search } = req.nextUrl

    // Root-domein → /wrapped
    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/wrapped', req.url))
    }

    // Subpaden (bv. /pxl → /wrapped/pxl, /stand → /wrapped/stand)
    if (!pathname.startsWith('/wrapped')) {
      return NextResponse.rewrite(new URL(`/wrapped${pathname}${search}`, req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  // Sluit statische bestanden en _next uit zodat de middleware niet op assets draait
  matcher: [
    '/((?!_next/static|_next/image|favicon|.*\\.(?:png|jpg|jpeg|svg|ico|css|js|woff2?)).*)',
  ],
}
