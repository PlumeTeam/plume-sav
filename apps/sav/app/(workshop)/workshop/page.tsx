import { getWorkshopTickets } from '@/features/tickets/queries'
import { WorkshopKanban } from './WorkshopKanban'

export const dynamic = 'force-dynamic'

export default async function WorkshopPage() {
  const tickets = await getWorkshopTickets()
  const inDiagnosis = tickets.filter(t => t.status === 'processing').length
  const inRepair    = tickets.filter(t => t.status === 'approved').length
  const urgent      = tickets.filter(t => t.urgency_level === 2 && t.status !== 'completed').length

  return (
    <main>
      <div className="border-b border-brand-stone/60 bg-white px-4 py-5 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-bold text-brand-ink">File de réparation</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              {inDiagnosis} en diagnostic · {inRepair} en réparation
              {urgent > 0 && ` · ${urgent} urgent${urgent > 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
      </div>
      <WorkshopKanban tickets={tickets} />
    </main>
  )
}
