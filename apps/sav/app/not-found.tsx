import Link from 'next/link'
import { PlumeLogo } from '@/app/_components/PlumeLogo'

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-cream px-4 text-center">
      <PlumeLogo size="lg" withWordmark />
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-ink">Page introuvable</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          La page que vous cherchez n’existe pas ou a été déplacée.
        </p>
      </div>
      <Link href="/" className="btn-primary">Retour à l’accueil</Link>
    </main>
  )
}
