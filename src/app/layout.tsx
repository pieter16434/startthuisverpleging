import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'startthuisverpleging — Zelfstandig thuisverpleegkundige worden in Vlaanderen',
    template: '%s — startthuisverpleging',
  },
  description:
    'Het complete stappenplan om als zelfstandig thuisverpleegkundige te starten in Vlaanderen. Geschreven door twee verpleegkundigen die het in 2024 zelf deden.',
  metadataBase: new URL('https://www.startthuisverpleging.be'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'nl_BE',
    url: 'https://www.startthuisverpleging.be',
    siteName: 'startthuisverpleging',
    title: 'startthuisverpleging — Zelfstandig thuisverpleegkundige worden in Vlaanderen',
    description:
      'Het complete stappenplan om als zelfstandig thuisverpleegkundige te starten in Vlaanderen. Geschreven door twee verpleegkundigen die het in 2024 zelf deden.',
  },
  twitter: {
    card: 'summary',
    title: 'startthuisverpleging — Zelfstandig thuisverpleegkundige worden in Vlaanderen',
    description:
      'Het complete stappenplan om als zelfstandig thuisverpleegkundige te starten in Vlaanderen. Nu beschikbaar voor €50.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="nl-BE">
      <head>
        <link rel="icon" type="image/png" href="/favicon.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
