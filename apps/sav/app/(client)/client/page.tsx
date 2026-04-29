import Link from 'next/link'
import { getClientTickets } from '@/features/tickets/queries'
import { TicketCard } from '@/features/tickets/components/TicketCard'

export default async function ClientPage() {
  const tickets = await getClientTickets()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-4">
        <h1 className="text-xl font-bold text-slate-900">Mes tickets SAV</h1>
      </header>

      <main className="px-4 py-4">
        {tickets.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </main>

      {/* FAB — create new ticket */}
      <Link
        href="/client/new-ticket"
        className="fixed bottom-24 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg text-2xl active:scale-95 transition-transform"
        aria-label="Créer un nouveau ticket"
      >
        +
      </Link>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-6xl" aria-hidden>🪂</div>
      <h2 className="text-lg font-semibold text-slate-900">Aucun ticket</h2>
      <p className="mt-2 max-w-xs text-sm text-slate-500">
        Vous n&apos;avez pas encore de demande SAV. Créez-en une si votre voile nécessite une attention.
      </p>
      <Link
        href="/client/new-ticket"
        className="mt-6 btn-primary inline-flex"
      >
        Créer un ticket
      </Link>
    </div>
  )
}
