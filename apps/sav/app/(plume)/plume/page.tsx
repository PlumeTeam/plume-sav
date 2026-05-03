import Link from 'next/link'
import { getAllTickets, getTicketStats } from '@/features/tickets/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { formatDate } from '@/features/tickets/utils'
import { STATUS_CONFIG } from '@/features/tickets/types'
import type { RequestStatus } from '@/features/tickets/types'

export const dynamic = 'force-dynamic'

export default async function PlumeDashboardPage() {
  const [tickets, stats] = await Promise.all([getAllTickets(), getTicketStats()])
  const recent = tickets.slice(0, 12)

  const KPI_STATUS_GROUPS: Array<{ label: string; statuses: RequestStatus[]; tone: string }> = [
    { label: 'À traiter',   statuses: ['pending'],                tone: 'bg-amber-50 text-amber-800 ring-amber-200' },
    { label: 'En cours',    statuses: ['processing'],             tone: 'bg-sky-50 text-sky-800 ring-sky-200' },
    { label: 'Approuvés',   statuses: ['approved'],               tone: 'bg-violet-50 text-violet-800 ring-violet-200' },
    { label: 'Terminés',    statuses: ['completed'],              tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
    { label: 'Autres',      statuses: ['rejected', 'cancelled'],  tone: 'bg-slate-50 text-slate-700 ring-slate-200' },
  ]

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-coral">Plume HQ</p>
          <h1 className="mt-0.5 font-display text-2xl font-bold text-brand-ink">Tableau de bord</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/school" className="btn-secondary text-xs px-4 py-2">Vue École</Link>
          <Link href="/workshop" className="btn-secondary text-xs px-4 py-2">Vue Atelier</Link>
        </div>
      </header>

      {/* KPI cards */}
      <section>
        <h2 className="section-title mb-3">Vue d&apos;ensemble</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total tickets" value={stats.total} variant="navy" />
          <KpiCard label="Ce mois-ci"    value={stats.thisMonth} variant="cream" />
          <KpiCard label="Urgents"       value={stats.urgent}    variant="coral" />
          <KpiCard label="En cours"      value={stats.byStatus.processing ?? 0} variant="sky" />
        </div>
      </section>

      {/* Status breakdown */}
      <section>
        <h2 className="section-title mb-3">Par statut</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          {KPI_STATUS_GROUPS.map(({ label, statuses, tone }) => {
            const count = statuses.reduce((acc, s) => acc + (stats.byStatus[s] ?? 0), 0)
            return (
              <div key={label} className={`rounded-2xl px-4 py-3 ring-1 ${tone}`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs font-medium opacity-80">{label}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Recent tickets table */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="section-title">Tickets récents</h2>
          <span className="text-xs text-slate-400">12 derniers</span>
        </div>
        {recent.length === 0 ? (
          <div className="card border-dashed p-8 text-center">
            <p className="text-3xl" aria-hidden>📭</p>
            <p className="mt-2 text-sm text-slate-500">Aucun ticket pour l’instant.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-cream/60">
                  <tr className="text-left">
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">N°</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Aile</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Urgence</th>
                    <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-stone/50">
                  {recent.map((ticket) => {
                    const ref = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
                    return (
                      <tr key={ticket.id} className="hover:bg-brand-cream/40">
                        <td className="px-4 py-3">
                          <Link
                            href={`/workshop/ticket/${ticket.id}`}
                            className="font-mono text-xs font-medium text-brand-ink hover:underline"
                          >
                            {ref}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {ticket.product_brand} {ticket.product_model}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={ticket.status} size="sm" />
                        </td>
                        <td className="px-4 py-3">
                          {ticket.urgency_level === 2 && (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-red-700">
                              Urgent
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-400">
                          {formatDate(ticket.created_at)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* By-status detail */}
      <section>
        <h2 className="section-title mb-3">Détail par statut</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {(Object.keys(STATUS_CONFIG) as RequestStatus[]).map((s) => {
            const count = stats.byStatus[s] ?? 0
            if (count === 0) return null
            const cfg = STATUS_CONFIG[s] ?? { label: s, color: 'text-slate-500', bg: 'bg-slate-100' }
            return (
              <div key={s} className="card flex items-center justify-between p-4">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                  {cfg.label}
                </span>
                <span className="text-lg font-bold text-brand-ink">{count}</span>
              </div>
            )
          })}
        </div>
      </section>
    </main>
  )
}

function KpiCard({ label, value, variant }: { label: string; value: number; variant: 'navy' | 'cream' | 'coral' | 'sky' }) {
  const tones: Record<typeof variant, string> = {
    navy:  'bg-brand-navy text-white',
    cream: 'bg-white text-brand-ink ring-1 ring-brand-stone',
    coral: 'bg-brand-coral text-white shadow-plume',
    sky:   'bg-sky-50 text-sky-900 ring-1 ring-sky-200',
  }
  return (
    <div className={`rounded-3xl px-5 py-4 ${tones[variant]}`}>
      <p className="text-3xl font-bold leading-tight">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-75">{label}</p>
    </div>
  )
}
