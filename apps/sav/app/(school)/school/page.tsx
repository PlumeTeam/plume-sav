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
  const urgent  = tickets.filter(t => t.urgency_level === 2 && (t.status === 'pending' || t.status === 'processing')).length

  return (
    <main>
      <div className="border-b border-brand-stone/60 bg-white px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            {school?.name && (
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
                🏫 {school.name}
                {(school.city || school.region) && (
                  <span className="ml-1 font-normal text-slate-400">
                    · {[school.city, school.region].filter(Boolean).join(', ')}
                  </span>
                )}
              </p>
            )}
            <h1 className="mt-0.5 font-display text-xl font-bold text-brand-ink">
              File de tickets
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} au total
              {pending > 0 && ` · ${pending} à traiter`}
              {urgent > 0 && ` · ${urgent} urgent${urgent > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-4xl">
        <SchoolTicketQueue tickets={tickets} />
      </div>
    </main>
  )
}
