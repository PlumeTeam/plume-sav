import type { Metadata, Viewport } from 'next'
import { Quicksand, Playfair_Display } from 'next/font/google'
import './globals.css'

const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-quicksand',
  display: 'swap',
})

// iBrand isn't a Google Font; Playfair Display is the closest editorial serif
// that pairs well with Quicksand and ships with Next's font optimizer.
const display = Playfair_Display({
  subsets: ['latin'],
  weight: ['600', '700'],
  variable: '--font-display',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default:  'Plume SAV — Service après-vente',
    template: '%s · Plume SAV',
  },
  description: 'Suivi des réparations et services pour les parapentes Plume Paragliders.',
  applicationName: 'Plume SAV',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, statusBarStyle: 'black-translucent', title: 'Plume SAV' },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  themeColor: '#1a1a2e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={`${quicksand.variable} ${display.variable}`}>
      <body className="min-h-screen bg-brand-cream font-sans text-slate-900 antialiased">
        {children}
      </body>
    </html>
  )
}
