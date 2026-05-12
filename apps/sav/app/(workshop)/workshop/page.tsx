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
          {physicalCount > 0 && ` · ${physicalCount} aile${physicalCount > 1 ? 's' : ''} à traiter`}
          {adviceCount > 0 && ` · ${adviceCount} consultation${adviceCount > 1 ? 's' : ''}`}
          {urgentCount > 0 && ` · ${urgentCount} urgent${urgentCount > 1 ? 's' : ''}`}
        </p>
        {workshop && (workshop.city || workshop.region) && (
          <p className="mt-1 text-xs text-white/50">
            {[workshop.city, workshop.region].filter(Boolean).join(' · ')}
          </p>
        )}
      </section>

      {/* ── Liste de tickets ────────────────────────────────────── */}
      <section>
        <h2 className="section-title mb-3 px-1">Tickets</h2>
        <WorkshopTicketList tickets={tickets} />
      </section>
    </main>
  )
}
