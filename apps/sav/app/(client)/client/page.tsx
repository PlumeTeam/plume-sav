import { getClientTickets, getClientWings } from '@/features/tickets/queries'
import { TicketCard } from '@/features/tickets/components/TicketCard'
import { WingCard } from '@/features/tickets/components/WingCard'

export const dynamic = 'force-dynamic'

export default async function ClientPage() {
  const [tickets, wings] = await Promise.all([getClientTickets(), getClientWings()])

  const activeCount = tickets.filter(
    (t) => t.status !== 'completed' && t.status !== 'cancelled' && t.status !== 'rejected'
  ).length

  return (
    <main className="space-y-8 px-4 py-6">
      {/* ── Hero / Greeting ─────────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-br from-brand-navy via-brand-navy to-brand-ink px-5 py-6 text-white shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-coral">Mon espace SAV</p>
        <h1 className="mt-1 font-display text-2xl font-bold">Bonjour, pilote 🪂</h1>
        <p className="mt-1 text-sm text-white/70">
          {activeCount === 0
            ? 'Aucune demande en cours pour le moment.'
            : `${activeCount} demande${activeCount > 1 ? 's' : ''} en cours.`}
        </p>
      </section>

      {/* ── Mes ailes ───────────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Mes ailes</h2>
          {wings.length > 0 && (
            <span className="text-xs text-slate-400">{wings.length} aile{wings.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {wings.length === 0 ? (
          <div className="card border-dashed px-4 py-6 text-center">
            <p className="text-3xl" aria-hidden>🪂</p>
            <p className="mt-2 text-sm font-medium text-brand-ink">Aucune aile enregistrée</p>
            <p className="mt-1 text-xs text-slate-500">
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
          <h2 className="section-title">Mes tickets SAV</h2>
          {tickets.length > 0 && (
            <span className="text-xs text-slate-400">{tickets.length} ticket{tickets.length > 1 ? 's' : ''}</span>
          )}
        </div>

        {tickets.length === 0 ? (
          <div className="card border-dashed px-4 py-8 text-center">
            <p className="text-3xl" aria-hidden>🎫</p>
            <p className="mt-2 text-sm font-medium text-brand-ink">Aucun ticket pour l’instant</p>
            <p className="mt-1 text-xs text-slate-500">
              Pour créer un ticket SAV, sélectionnez une de vos ailes ci-dessus.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
        )}
      </section>

      {/* ── Help ─────────────────────────────────────────────────── */}
      <section className="card flex items-start gap-3 p-4">
        <span aria-hidden className="text-xl">💬</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-brand-ink">Besoin d’aide ?</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Écrivez-nous à{' '}
            <a href="mailto:sav@plumeparagliders.com" className="font-medium text-brand-coral hover:underline">
              sav@plumeparagliders.com
            </a>{' '}
            ou contactez votre école partenaire.
          </p>
        </div>
      </section>
    </main>
  )
}
