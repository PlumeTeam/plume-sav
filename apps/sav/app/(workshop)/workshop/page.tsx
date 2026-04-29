import { getWorkshopTickets } from '@/features/tickets/queries'
import { WorkshopKanban } from './WorkshopKanban'

export default async function WorkshopPage() {
  const tickets = await getWorkshopTickets()

  return (
    <main>
      <div className="border-b border-slate-100 bg-white px-4 py-4">
        <h1 className="text-lg font-semibold text-slate-900">File de réparation</h1>
        <p className="text-sm text-slate-500">
          {tickets.length} ticket{tickets.length !== 1 ? 's' : ''} actifs
        </p>
      </div>
      <WorkshopKanban tickets={tickets} />
    </main>
  )
}
