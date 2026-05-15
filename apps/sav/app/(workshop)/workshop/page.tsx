import { getWorkshopTickets } from '@/features/tickets/queries'
import { getCurrentUserWorkshop } from '@/features/auth/queries'
import { WorkshopTicketList } from './WorkshopTicketList'

export const dynamic = 'force-dynamic'

export default async function WorkshopPage() {
  const [tickets, workshop] = await Promise.all([
    getWorkshopTickets(),
    getCurrentUserWorkshop(),
  ])

  // Compteurs hero — typologie nouvelle (consultation / aile) + urgence.
  const adviceCount = tickets.filter(
    (t) => t.school_resolution === 'workshop_advice_requested'
  ).length
  const physicalCount = tickets.length - adviceCount
  const urgentCount = tickets.filter(
    (t) =>
      t.urgency_level === 2 &&
      t.status !== 'completed' &&
      t.status !== 'wing_returned' &&
      t.status !== 'workshop_done'
  ).length

  const greetingName = workshop?.label ?? 'Atelier'

  return (
    <main className="space-y-6 px-4 py-6 sm:px-6">
      {/* ── Hero / Greeting ─────────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-br from-orange-600 via-orange-700 to-brand-ink px-5 py-6 text-white shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">
          🛠️ Espace Atelier
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">Bonjour {greetingName}</h1>
        <p className="mt-1 text-sm text-white/70">
          {tickets.length} ticket{tickets.length > 1 ? 's' : ''} au total
        </p>
        {(physicalCount > 0 || adviceCount > 0 || urgentCount > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {physicalCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-300/20 px-3 py-1 text-xs font-semibold text-orange-100 ring-1 ring-orange-300/40">
                <span aria-hidden>🪂</span>
                {physicalCount} aile{physicalCount > 1 ? 's' : ''}
              </span>
            )}
            {adviceCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-300/20 px-3 py-1 text-xs font-semibold text-sky-100 ring-1 ring-sky-300/40">
                <span aria-hidden>💬</span>
                {adviceCount} consultation{adviceCount > 1 ? 's' : ''}
              </span>
            )}
            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-400/20 px-3 py-1 text-xs font-semibold text-red-100 ring-1 ring-red-300/40">
                <span aria-hidden>🔥</span>
                {urgentCount} urgent{urgentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
        {workshop && (workshop.city || workshop.region) && (
          <p className="mt-3 text-xs text-white/50">
            {[workshop.city, workshop.region].filter(Boolean).join(' · ')}
          </p>
        )}
      </section>

      {/* ── Liste de tickets ────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="section-title">Tickets</h2>
        <WorkshopTicketList tickets={tickets} />
      </section>
    </main>
  )
}
