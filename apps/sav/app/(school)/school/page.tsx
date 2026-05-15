import { getSchoolTickets } from '@/features/tickets/queries'
import { getCurrentUserSchool } from '@/features/auth/queries'
import { SchoolTicketQueue } from './SchoolTicketQueue'

export const dynamic = 'force-dynamic'

export default async function SchoolPage() {
  const [tickets, school] = await Promise.all([
    getSchoolTickets(),
    getCurrentUserSchool(),
  ])
  const pending = tickets.filter(t => t.status === 'pending').length
  // Les tickets actifs (pipeline d'étapes ou hérité) qui sont marqués urgents
  // remontent dans le hero pour rappel — on exclut ce qui est définitivement clos.
  const urgent  = tickets.filter(
    t =>
      t.urgency_level === 2 &&
      t.status !== 'completed' &&
      t.status !== 'school_resolved' &&
      t.status !== 'cancelled' &&
      t.status !== 'rejected'
  ).length

  const greetingName = school?.name ?? 'École'

  return (
    <main className="space-y-6 px-4 py-6 sm:px-6">
      {/* ── Hero / Greeting ─────────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-800 to-brand-ink px-5 py-6 text-white shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
          🏫 Espace École
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">Bonjour {greetingName}</h1>
        <p className="mt-1 text-sm text-white/70">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} au total
        </p>
        {(pending > 0 || urgent > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {pending > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-semibold text-amber-100 ring-1 ring-amber-300/40">
                <span aria-hidden>📥</span>
                {pending} à traiter
              </span>
            )}
            {urgent > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-400/20 px-3 py-1 text-xs font-semibold text-red-100 ring-1 ring-red-300/40">
                <span aria-hidden>🔥</span>
                {urgent} urgent{urgent > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}
        {school && (school.city || school.region) && (
          <p className="mt-3 text-xs text-white/50">
            {[school.city, school.region].filter(Boolean).join(' · ')}
          </p>
        )}
      </section>

      {/* ── File de tickets ─────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="section-title">File de tickets</h2>
          {tickets.length > 0 && (
            <span className="text-xs text-slate-400">{tickets.length} au total</span>
          )}
        </div>
        <SchoolTicketQueue tickets={tickets} />
      </section>
    </main>
  )
}
