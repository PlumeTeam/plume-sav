import { getSchoolTickets } from '@/features/tickets/queries'
import { SchoolTicketQueue } from './SchoolTicketQueue'

export default async function SchoolPage() {
  const tickets = await getSchoolTickets()

  return (
    <main>
      <div className="border-b border-slate-100 bg-white px-4 py-4">
        <h1 className="text-lg font-semibold text-slate-900">File de tickets</h1>
        <p className="text-sm text-slate-500">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} au total
        </p>
      </div>
      <SchoolTicketQueue tickets={tickets} />
    </main>
  )
}
