import Link from 'next/link'

export default function SchoolTicketNotFound() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-4 p-12 text-center">
      <p className="text-4xl" aria-hidden>🎫</p>
      <h1 className="font-display text-xl font-bold text-brand-ink">Ticket introuvable</h1>
      <p className="text-sm text-slate-500">
        Ce ticket n’existe pas ou n’est pas accessible avec votre compte école.
      </p>
      <Link href="/school" className="btn-primary">Retour à la file</Link>
    </main>
  )
}
