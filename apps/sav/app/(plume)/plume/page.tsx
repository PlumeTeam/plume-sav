import Link from 'next/link'
import { getAllTickets, getPartnerSchools, getTicketStats } from '@/features/tickets/queries'
import { STATUS_CONFIG } from '@/features/tickets/types'
import type { RequestStatus, TicketWithPhotos } from '@/features/tickets/types'
import type { TicketWithContacts } from '@/features/tickets/contacts'
import { AdminTicketTable } from './AdminTicketTable'
import { AdminAlerts, type AdminAlertGroup } from './AdminAlerts'

export const dynamic = 'force-dynamic'

const HOUR_MS = 3_600_000
const DAY_MS  = 86_400_000

// Statuts considérés comme "terminés" — un ticket dans ces statuts ne déclenche
// jamais d'alerte de SLA (peu importe son ancienneté).
const CLOSED_STATUSES = new Set<RequestStatus>([
  'completed',
  'school_resolved',
  'wing_returned',
  'cancelled',
  'rejected',
])

function isClosedTicket(t: TicketWithContacts): boolean {
  // closed_at est posé par le flow de clôture explicite (T7) ; certains
  // statuts héritages restent dans CLOSED_STATUSES sans avoir closed_at.
  return t.closed_at !== null || CLOSED_STATUSES.has(t.status)
}

function ageMs(iso: string | null | undefined, now: number): number {
  if (!iso) return 0
  const t = new Date(iso).getTime()
  if (!Number.isFinite(t)) return 0
  return Math.max(0, now - t)
}

function buildAlertGroups(tickets: TicketWithContacts[]): AdminAlertGroup[] {
  const now = Date.now()
  const threeDays = 3 * DAY_MS

  // Important : les groupes sont sérialisés vers AdminAlerts (Client Component).
  // On ne peut PAS passer une fonction `dateOf` à travers la frontière RSC →
  // on pré-calcule la date de référence ici et on l'attache à chaque entrée.
  const noActivity = tickets
    .filter((t) => !isClosedTicket(t) && ageMs(t.updated_at, now) > threeDays)
    .sort((a, b) => ageMs(b.updated_at, now) - ageMs(a.updated_at, now))
    .map((ticket) => ({ ticket, refDate: ticket.updated_at }))

  // En attente école : l'école n'a pas encore accusé réception (status === 'pending')
  // depuis > 24h. On mesure l'ancienneté depuis created_at (school_acknowledged_at
  // est null par définition tant que pending).
  const pendingSchool = tickets
    .filter((t) => t.status === 'pending' && ageMs(t.created_at, now) > HOUR_MS * 24)
    .sort((a, b) => ageMs(b.created_at, now) - ageMs(a.created_at, now))
    .map((ticket) => ({ ticket, refDate: ticket.created_at }))

  // En attente atelier : aile pas encore réceptionnée depuis > 48h. Deux
  // portes d'entrée :
  //  - 'escalated_to_workshop' = escalade école
  //  - 'pending_workshop'      = routage direct client (repair/inspection)
  // Pour pending_workshop, on n'a pas de horodatage d'escalade dédié → on
  // mesure depuis created_at.
  const pendingWorkshop = tickets
    .filter((t) => {
      if (t.status !== 'escalated_to_workshop' && t.status !== 'pending_workshop') return false
      if (t.wing_received_workshop_at !== null) return false
      const start = t.status === 'pending_workshop'
        ? t.created_at
        : (t.escalated_to_workshop_at ?? t.updated_at)
      return ageMs(start, now) > HOUR_MS * 48
    })
    .sort((a, b) => {
      const aStart = a.status === 'pending_workshop'
        ? a.created_at
        : (a.escalated_to_workshop_at ?? a.updated_at)
      const bStart = b.status === 'pending_workshop'
        ? b.created_at
        : (b.escalated_to_workshop_at ?? b.updated_at)
      return ageMs(bStart, now) - ageMs(aStart, now)
    })
    .map((ticket) => ({
      ticket,
      refDate: ticket.status === 'pending_workshop'
        ? ticket.created_at
        : (ticket.escalated_to_workshop_at ?? ticket.updated_at),
    }))

  return [
    {
      key:        'no_activity',
      emoji:      '🔴',
      label:      'Sans activité > 3 j',
      title:      'Tickets sans activité > 3 jours',
      hint:       'Aucune mise à jour récente',
      tone:       'red',
      entries:    noActivity,
      linkPrefix: '/school/ticket',
    },
    {
      key:        'pending_school',
      emoji:      '🟠',
      label:      'En attente école > 24 h',
      title:      'En attente école > 24h',
      hint:       "L'école n'a pas accusé réception",
      tone:       'orange',
      entries:    pendingSchool,
      linkPrefix: '/school/ticket',
    },
    {
      key:        'pending_workshop',
      emoji:      '🟡',
      label:      'En attente atelier > 48 h',
      title:      'En attente atelier > 48h',
      hint:       "L'aile n'est pas arrivée à l'atelier",
      tone:       'yellow',
      entries:    pendingWorkshop,
      linkPrefix: '/workshop/ticket',
    },
  ]
}

// KPI groups alignés sur le pipeline d'étapes (migration 20260509000000).
// On inclut les statuts hérités (processing/approved) dans leurs colonnes
// logiques pour rester compatible avec les tickets antérieurs.
const KPI_GROUPS: Array<{ key: string; label: string; statuses: RequestStatus[]; tone: string }> = [
  {
    key:   'school_pending',
    label: 'En attente école',
    statuses: ['pending', 'school_acknowledged', 'wing_received_school', 'school_checking'],
    tone:  'bg-amber-50 text-amber-800 ring-amber-200',
  },
  {
    key:   'school_in_progress',
    label: 'En cours école',
    statuses: ['processing', 'approved'],
    tone:  'bg-sky-50 text-sky-800 ring-sky-200',
  },
  {
    key:   'workshop',
    label: "Chez l'atelier",
    statuses: [
      // Routage direct client → atelier (repair / inspection) avant arrivée
      // physique de l'aile.
      'pending_workshop',
      'escalated_to_workshop',
      'wing_received_workshop',
      'workshop_pre_checking',
      'workshop_diagnosing',
      'workshop_repairing',
      'workshop_done',
    ],
    tone:  'bg-violet-50 text-violet-800 ring-violet-200',
  },
  {
    key:   'done',
    label: 'Terminés',
    statuses: ['completed', 'school_resolved', 'wing_returned'],
    tone:  'bg-emerald-50 text-emerald-800 ring-emerald-200',
  },
]

const ACTIVE_STATUSES = new Set<RequestStatus>(
  KPI_GROUPS.filter((g) => g.key !== 'done')
    .flatMap((g) => g.statuses)
)

function daysSince(iso: string | null | undefined): number {
  if (!iso) return 0
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY_MS))
}

interface StagnantTicket {
  ticket: TicketWithPhotos
  reason: 'pending_too_long' | 'wing_not_arrived'
  days:   number
}

// Tickets stagnants — défaut grave de SLA :
//  - pending depuis > 5 jours : l'école n'a même pas accusé réception
//  - school_acknowledged depuis > 7 jours : l'aile n'est pas arrivée
function findStagnantTickets(tickets: TicketWithPhotos[]): StagnantTicket[] {
  const out: StagnantTicket[] = []
  for (const t of tickets) {
    if (t.status === 'pending') {
      const days = daysSince(t.created_at)
      if (days > 5) {
        out.push({ ticket: t, reason: 'pending_too_long', days })
      }
    } else if (t.status === 'school_acknowledged') {
      const days = daysSince(t.school_acknowledged_at ?? t.created_at)
      if (days > 7) {
        out.push({ ticket: t, reason: 'wing_not_arrived', days })
      }
    }
  }
  return out.sort((a, b) => b.days - a.days)
}

export default async function PlumeDashboardPage() {
  const [tickets, stats, schools] = await Promise.all([
    getAllTickets(),
    getTicketStats(),
    getPartnerSchools(),
  ])

  // Tickets explicitly escalated to Plume HQ (cas exceptionnels) — show on top.
  const escalatedToPlume = tickets.filter(
    (t) => t.school_resolution === 'escalated_to_plume'
  )

  // Tickets flagged "défaut grave" by the school — sécurité, alerte HQ.
  const plumeUrgent = tickets.filter(
    (t) => t.is_plume_urgent && t.status !== 'completed' && t.status !== 'cancelled'
  )

  // KPIs alignés (T4) — comptés une seule fois sur la liste complète.
  const groupCounts: Record<string, number> = {}
  for (const g of KPI_GROUPS) {
    groupCounts[g.key] = tickets.filter((t) => g.statuses.includes(t.status)).length
  }
  const urgentActive = tickets.filter(
    (t) => t.urgency_level === 2 && ACTIVE_STATUSES.has(t.status)
  ).length

  // Stagnant tickets (T3)
  const stagnant = findStagnantTickets(tickets)

  // Alertes SLA (T8) — 3 catégories : sans activité > 3 j, attente école > 24 h,
  // attente atelier > 48 h. Calcul côté serveur, ouverture/fermeture côté client.
  const alertGroups = buildAlertGroups(tickets)

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
      {/* Hero / Greeting — cohérent avec école / atelier */}
      <section className="rounded-3xl bg-gradient-to-br from-brand-navy via-brand-ink to-black px-5 py-6 text-white shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
              🦅 Plume HQ
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold">Tableau de bord</h1>
            <p className="mt-1 text-sm text-white/70">
              {tickets.length} ticket{tickets.length > 1 ? 's' : ''} au total
            </p>
            {(urgentActive > 0 || stagnant.length > 0) && (
              <div className="mt-3 flex flex-wrap gap-2">
                {urgentActive > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-400/20 px-3 py-1 text-xs font-semibold text-red-100 ring-1 ring-red-300/40">
                    <span aria-hidden>🔥</span>
                    {urgentActive} urgent{urgentActive > 1 ? 's' : ''}
                  </span>
                )}
                {stagnant.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-400/20 px-3 py-1 text-xs font-semibold text-orange-100 ring-1 ring-orange-300/40">
                    <span aria-hidden>⏰</span>
                    {stagnant.length} stagnant{stagnant.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/school"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-colors"
            >
              <span aria-hidden>🏫</span>
              Vue École
            </Link>
            <Link
              href="/workshop"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white ring-1 ring-white/20 hover:bg-white/20 transition-colors"
            >
              <span aria-hidden>🛠️</span>
              Vue Atelier
            </Link>
          </div>
        </div>
      </section>

      {/* Alertes SLA — bandeau compteur + 3 catégories collapsibles */}
      <AdminAlerts groups={alertGroups} />

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
        <section className="rounded-3xl border-2 border-brand-gold/40 bg-brand-gold/10 p-5">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">🦅</span>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">À traiter en priorité</p>
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
                        <span className="shrink-0 text-xs text-brand-gold">Triage requis →</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </section>
      )}

      {/* Tickets stagnants (T3) */}
      {stagnant.length > 0 && (
        <section className="rounded-3xl border border-orange-300 bg-orange-50 p-5">
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">⏰</span>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-orange-700">SLA dépassé</p>
              <h2 className="mt-0.5 font-display text-lg font-bold text-brand-ink">
                {stagnant.length} ticket{stagnant.length > 1 ? 's' : ''} stagnant{stagnant.length > 1 ? 's' : ''}
              </h2>
              <p className="mt-1 text-xs text-brand-ink/70">
                Tickets qui n&apos;ont pas avancé dans les délais attendus — pensez à relancer l&apos;école.
              </p>
              <ul className="mt-3 space-y-1.5">
                {stagnant.slice(0, 8).map(({ ticket, reason, days }) => {
                  const ref = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
                  const overdueLevel = days >= 14 ? 'red' : 'orange'
                  const reasonLabel = reason === 'pending_too_long'
                    ? "École n'a pas accusé réception"
                    : "Aile pas reçue"
                  return (
                    <li key={ticket.id}>
                      <Link
                        href={`/school/ticket/${ticket.id}`}
                        className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-sm transition-colors hover:bg-orange-100/40"
                      >
                        <span className="truncate font-medium text-brand-ink">
                          <span className="font-mono text-xs text-slate-500">{ref}</span>{' '}
                          — {ticket.product_brand} {ticket.product_model}
                          <span className="ml-2 text-xs font-normal text-slate-500">· {reasonLabel}</span>
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider ${
                          overdueLevel === 'red'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {days} j de retard
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              {stagnant.length > 8 && (
                <p className="mt-2 text-xs text-orange-800/70">
                  + {stagnant.length - 8} autre{stagnant.length - 8 > 1 ? 's' : ''} ticket{stagnant.length - 8 > 1 ? 's' : ''} stagnant{stagnant.length - 8 > 1 ? 's' : ''}.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* KPI cards — top-level overview */}
      <section>
        <h2 className="section-title mb-3">Vue d&apos;ensemble</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <KpiCard label="Total tickets" value={stats.total} variant="navy" />
          <KpiCard label="Ce mois-ci"    value={stats.thisMonth} variant="cream" />
          <KpiCard label="Urgents (en cours)" value={urgentActive} variant="coral" />
          <KpiCard label="Stagnants" value={stagnant.length} variant="sky" />
        </div>
      </section>

      {/* Pipeline groups (T4) */}
      <section>
        <h2 className="section-title mb-3">Par étape du pipeline</h2>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {KPI_GROUPS.map((g) => (
            <div key={g.key} className={`rounded-2xl px-4 py-3 ring-1 ${g.tone}`}>
              <p className="text-2xl font-bold">{groupCounts[g.key] ?? 0}</p>
              <p className="text-xs font-medium opacity-80">{g.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tickets table */}
      <section>
        <h2 className="section-title mb-3">Tickets</h2>
        <AdminTicketTable tickets={tickets} schools={schools} />
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
    coral: 'bg-brand-gold text-white shadow-plume',
    sky:   'bg-sky-50 text-sky-900 ring-1 ring-sky-200',
  }
  return (
    <div className={`rounded-3xl px-5 py-4 ${tones[variant]}`}>
      <p className="text-3xl font-bold leading-tight">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-75">{label}</p>
    </div>
  )
}
