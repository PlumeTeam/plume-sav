import Link from 'next/link'

export default function TicketNotFound() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col items-center justify-center gap-4 p-12 text-center">
      <p className="text-4xl" aria-hidden>🎫</p>
      <h1 className="font-display text-xl font-bold text-brand-ink">Demande introuvable</h1>
      <p className="text-sm text-slate-500">
        Cette demande n’existe pas ou n’est pas accessible avec votre compte.
      </p>
      <Link href="/client" className="btn-primary">Retour à mes demandes</Link>
    </main>
  )
}
