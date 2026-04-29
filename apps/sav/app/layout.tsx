import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Plume SAV',
  description: 'Service après-vente Plume Paragliders',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
