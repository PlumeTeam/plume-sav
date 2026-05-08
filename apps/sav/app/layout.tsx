import type { Metadata, Viewport } from 'next'
import { Quicksand } from 'next/font/google'
import './globals.css'

// Quicksand pour tout — Light 300 (légendes), Regular 400 (corps),
// Medium 500 (boutons / labels), Semibold 600 (sous-titres), Bold 700 (titres).
const quicksand = Quicksand({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-quicksand',
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
  themeColor: '#0F2430',
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
    <html lang="fr" className={quicksand.variable}>
      <body className="min-h-screen bg-white font-sans text-brand-ink antialiased tracking-brand">
        {children}
      </body>
    </html>
  )
}
