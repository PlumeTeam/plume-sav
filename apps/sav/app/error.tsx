'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('App error boundary caught:', error)
  }, [error])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-cream px-4 text-center">
      <p className="text-5xl" aria-hidden>🪂</p>
      <div>
        <h1 className="font-display text-2xl font-bold text-brand-ink">Une erreur est survenue</h1>
        <p className="mt-2 max-w-md text-sm text-slate-500">
          Quelque chose s’est mal passé. Vous pouvez réessayer ou revenir à l’accueil.
          Si le problème persiste, contactez{' '}
          <a href="mailto:sav@plumeparagliders.com" className="font-medium text-brand-gold hover:underline">
            sav@plumeparagliders.com
          </a>.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button onClick={reset} className="btn-primary">Réessayer</button>
        <a href="/" className="btn-secondary">Retour à l’accueil</a>
      </div>
    </main>
  )
}
