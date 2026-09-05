import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Gratis Opstartcheck — zelfstandig thuisverpleegkundige worden in Vlaanderen',
  description:
    'De documenten, de volgorde en de fouten die je duizenden euro\'s kosten. Gratis pdf door twee thuisverpleegkundigen die het in 2024 zelf deden.',
  openGraph: {
    title: 'De Opstartcheck — gratis voor startende thuisverpleegkundigen',
    description:
      'Zelfstandig thuisverpleegkundige worden in Vlaanderen: de juiste volgorde, de juiste documenten, en de drie dure fouten die je vermijdt.',
    url: 'https://startthuisverpleging.be/opstartcheck',
    siteName: 'startthuisverpleging.be',
    locale: 'nl_BE',
    type: 'website',
  },
}

export default function OpstartcheckLayout({ children }: { children: React.ReactNode }) {
  return children
}
