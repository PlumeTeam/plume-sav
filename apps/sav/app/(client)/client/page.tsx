import Link from 'next/link'
import { getClientTickets, getClientWings } from '@/features/tickets/queries'
import { TicketCard } from '@/features/tickets/components/TicketCard'
import { WingCard } from '@/features/tickets/components/WingCard'

export default async function ClientPage() {
  const [tickets, wings] = await Promise.all([getClientTickets(), getClientWings()])

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-4">
        <h1 className="text-xl font-bold text-slate-900">Mon espace SAV</h1>
      </header>

      <main className="space-y-8 px-4 py-4">
        {/* ── Mes ailes ───────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Mes ailes
            </h2>
            {wings.length > 0 && (
              <span className="text-xs text-slate-400">{wings.length} aile{wings.length > 1 ? 's' : ''}</span>
            )}
          </div>

          {wings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
              <p className="text-2xl" aria-hidden>🪂</p>
              <p className="mt-2 text-sm font-medium text-slate-700">Aucune aile enregistrée</p>
              <p className="mt-1 text-xs text-slate-400">
                Vos ailes Plume apparaissent ici automatiquement après achat.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {wings.map((wing) => (
                <WingCard key={wing.id} wing={wing} />
              ))}
            </div>
          )}
        </section>

        {/* ── Mes tickets ─────────────────────────────────────────── */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              Mes tickets SAV
            </h2>
            {tickets.length > 0 && (
              <span className="text-xs text-slate-400">{tickets.length} ticket{tickets.length > 1 ? 's' : ''}</span>
            )}
          </div>

          {tickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-center">
              <p className="text-2xl" aria-hidden>🎫</p>
              <p className="mt-2 text-sm font-medium text-slate-700">Aucun ticket</p>
              <p className="mt-1 text-xs text-slate-400">
                Créez un ticket depuis une aile ou via le bouton ci-dessous.
              </p>
              <Link
                href="/client/new-ticket"
                className="mt-4 inline-block rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Créer un ticket
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
