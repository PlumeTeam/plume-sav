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
  const urgent  = tickets.filter(
    t => t.urgency_level === 2 && (t.status === 'pending' || t.status === 'processing')
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
          {pending > 0 && ` · ${pending} à traiter`}
          {urgent > 0 && ` · ${urgent} urgent${urgent > 1 ? 's' : ''}`}
        </p>
        {school && (school.city || school.region) && (
          <p className="mt-1 text-xs text-white/50">
            {[school.city, school.region].filter(Boolean).join(' · ')}
          </p>
        )}
      </section>

      {/* ── File de tickets ─────────────────────────────────────── */}
      <section>
        <h2 className="section-title mb-3 px-1">File de tickets</h2>
        <SchoolTicketQueue tickets={tickets} />
      </section>
    </main>
  )
}
