import Link from 'next/link'
import { getAllTickets, getTicketStats } from '@/features/tickets/queries'
import { STATUS_CONFIG } from '@/features/tickets/types'
import type { RequestStatus } from '@/features/tickets/types'
import { AdminTicketTable } from './AdminTicketTable'

export const dynamic = 'force-dynamic'

export default async function PlumeDashboardPage() {
  const [tickets, stats] = await Promise.all([getAllTickets(), getTicketStats()])

  // Tickets explicitly escalated to Plume HQ (cas exceptionnels) — show on top.
  const escalatedToPlume = tickets.filter(
    (t) => t.school_resolution === 'escalated_to_plume'
  )

  // Tickets flagged "défaut grave" by the school — sécurité, alerte HQ.
  // These appear in workshop's queue too; HQ is alerted in parallel.
  const plumeUrgent = tickets.filter(
    (t) => t.is_plume_urgent && t.status !== 'completed' && t.status !== 'cancelled'
  )

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

      {/* Défauts graves — alerte sécurité de plus haut niveau */}
      {plumeUrgent.length > 0 && (
        <section className="rounded-3xl border-2 border-red-400 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">🚨</span>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-red-700">Alerte sécurité — niveau 3</p>
              <h2 className="mt-0.5 font-display text-lg font-bold text-red-900">
                {plumeUrgent.length} défaut{plumeUrgent.length > 1 ? 's' : ''} grave{plumeUrgent.length > 1 ? 's' : ''} signalé{plumeUrgent.length > 1 ? 's' : ''} par une école
              </h2>
              <p className="mt-1 text-xs text-red-900/80">
                Une école a identifié un risque sécurité (suspentes, structure, malfaçon visible).
                L&apos;atelier a été notifié en parallèle.
              </p>
              <ul className="mt-3 space-y-1.5">
                {plumeUrgent.slice(0, 5).map((t) => {
                  const ref = t.ticket_number ?? `#${t.id.slice(0, 8).toUpperCase()}`
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/workshop/ticket/${t.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm transition-colors hover:bg-red-100/50"
                      >
                        <span className="truncate font-medium text-red-900">
                          <span className="font-mono text-xs text-red-700">{ref}</span>{' '}
                          — {t.product_brand} {t.product_model}
                          {t.assigned_workshop_label && (
                            <span className="ml-2 text-xs font-normal opacity-70">→ {t.assigned_workshop_label}</span>
                          )}
                        </span>
                        <span className="shrink-0 text-xs text-red-700">À examiner →</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Escalations exceptionnelles — bandeau prioritaire */}
      {escalatedToPlume.length > 0 && (
        <section className="rounded-3xl border-2 border-brand-coral/40 bg-brand-coral/10 p-5">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">🦅</span>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-coral">À traiter en priorité</p>
              <h2 className="mt-0.5 font-display text-lg font-bold text-brand-ink">
                {escalatedToPlume.length} cas exceptionnel{escalatedToPlume.length > 1 ? 's' : ''} escaladé{escalatedToPlume.length > 1 ? 's' : ''} à Plume HQ
              </h2>
              <p className="mt-1 text-xs text-brand-ink/70">
                Une école n&apos;a pas su classer ces tickets et a demandé un triage Plume.
              </p>
              <ul className="mt-3 space-y-1.5">
                {escalatedToPlume.slice(0, 5).map((t) => {
                  const ref = t.ticket_number ?? `#${t.id.slice(0, 8).toUpperCase()}`
                  return (
                    <li key={t.id}>
                      <Link
                        href={`/workshop/ticket/${t.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm transition-colors hover:bg-brand-cream"
                      >
                        <span className="truncate font-medium text-brand-ink">
                          <span className="font-mono text-xs text-slate-500">{ref}</span>{' '}
                          — {t.product_brand} {t.product_model}
                        </span>
                        <span className="shrink-0 text-xs text-brand-coral">Triage requis →</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </section>
      )}

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

      {/* Tickets table with filter + search */}
      <section>
        <h2 className="section-title mb-3">Tickets</h2>
        <AdminTicketTable tickets={tickets} />
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
