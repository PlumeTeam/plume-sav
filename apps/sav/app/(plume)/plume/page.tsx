import Link from 'next/link'
import { getAllTickets, getTicketStats } from '@/features/tickets/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { formatDate } from '@/features/tickets/utils'
import { STATUS_CONFIG } from '@/features/tickets/types'
import type { TicketStatus } from '@/features/tickets/types'

export default async function PlumeDashboardPage() {
  const [tickets, stats] = await Promise.all([getAllTickets(), getTicketStats()])
  const recent = tickets.slice(0, 10)

  const KPI_STATUS_GROUPS: Array<{ label: string; statuses: TicketStatus[]; color: string }> = [
    { label: 'En attente',    statuses: ['submitted'],                  color: 'bg-blue-50 text-blue-700' },
    { label: 'En révision',   statuses: ['in_review', 'diagnosed'],     color: 'bg-amber-50 text-amber-700' },
    { label: 'En réparation', statuses: ['repair_in_progress'],         color: 'bg-orange-50 text-orange-700' },
    { label: 'Réparés',       statuses: ['repaired', 'shipped'],        color: 'bg-green-50 text-green-700' },
    { label: 'Clôturés',      statuses: ['closed', 'rejected'],         color: 'bg-slate-50 text-slate-500' },
  ]

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 space-y-8">
      {/* KPI cards */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Vue d&apos;ensemble</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total tickets" value={stats.total} color="bg-slate-900 text-white" />
          <KpiCard label="Ce mois-ci" value={stats.thisMonth} color="bg-slate-100 text-slate-900" />
          <KpiCard label="Urgents" value={stats.urgent} color="bg-red-50 text-red-700" />
          <KpiCard
            label="En cours"
            value={
              (stats.byStatus['in_review'] ?? 0) +
              (stats.byStatus['diagnosed'] ?? 0) +
              (stats.byStatus['repair_in_progress'] ?? 0)
            }
            color="bg-orange-50 text-orange-700"
          />
        </div>
      </section>

      {/* Status breakdown */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Par statut</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {KPI_STATUS_GROUPS.map(({ label, statuses, color }) => {
            const count = statuses.reduce((acc, s) => acc + (stats.byStatus[s] ?? 0), 0)
            return (
              <div key={label} className={`rounded-2xl px-4 py-3 ${color}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-medium opacity-80">{label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Recent tickets table */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Tickets récents
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun ticket.</p>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="px-4 py-3 text-xs font-medium text-slate-500">N°</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500">Aile</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500">Statut</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500">Urgence</th>
                    <th className="px-4 py-3 text-xs font-medium text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recent.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/workshop/ticket/${ticket.id}`}
                          className="font-mono text-xs font-medium text-slate-900 hover:underline"
                        >
                          {ticket.ticket_number ?? ticket.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {ticket.wing_brand} {ticket.wing_model}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        {ticket.urgency === 'urgent' && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            Urgent
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDate(ticket.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* By-status detail */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Détail par statut
        </h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {(Object.keys(STATUS_CONFIG) as TicketStatus[]).map((s) => {
            const count = stats.byStatus[s] ?? 0
            if (count === 0) return null
            const cfg = STATUS_CONFIG[s] ?? { label: s, color: 'text-slate-500', bg: 'bg-slate-100' }
            return (
              <div key={s} className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-lg font-bold text-slate-900">{count}</span>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function KpiCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={`rounded-2xl px-5 py-4 ${color}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-70">{label}</p>
    </div>
  )
}
