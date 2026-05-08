import { getWorkshopTickets } from '@/features/tickets/queries'
import { getCurrentUserWorkshop } from '@/features/auth/queries'
import { WorkshopKanban } from './WorkshopKanban'

export const dynamic = 'force-dynamic'

export default async function WorkshopPage() {
  const [tickets, workshop] = await Promise.all([
    getWorkshopTickets(),
    getCurrentUserWorkshop(),
  ])
  const inDiagnosis = tickets.filter(t => t.status === 'processing').length
  const inRepair    = tickets.filter(t => t.status === 'approved').length
  const urgent      = tickets.filter(t => t.urgency_level === 2 && t.status !== 'completed').length
  const adviceCount = tickets.filter(
    (t) => (t as { school_resolution?: string | null }).school_resolution === 'workshop_advice_requested'
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
          {inDiagnosis} en diagnostic · {inRepair} en réparation
          {urgent > 0 && ` · ${urgent} urgent${urgent > 1 ? 's' : ''}`}
          {adviceCount > 0 && ` · ${adviceCount} avis demandé${adviceCount > 1 ? 's' : ''}`}
        </p>
        {workshop && (workshop.city || workshop.region) && (
          <p className="mt-1 text-xs text-white/50">
            {[workshop.city, workshop.region].filter(Boolean).join(' · ')}
          </p>
        )}
      </section>

      {/* ── File de réparation ──────────────────────────────────── */}
      <section>
        <h2 className="section-title mb-3 px-1">File de réparation</h2>
        <WorkshopKanban tickets={tickets} />
      </section>
    </main>
  )
}
