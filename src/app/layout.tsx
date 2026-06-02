import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'startthuisverpleging — Zelfstandig thuisverpleegkundige worden in Vlaanderen',
  description:
    'Het complete stappenplan om als zelfstandig thuisverpleegkundige te starten. Geschreven door twee verpleegkundigen die het in 2024 zelf deden.',
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
