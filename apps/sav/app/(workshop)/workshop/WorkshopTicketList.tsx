'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { RequestTypeBadge } from '@/features/tickets/components/RequestTypeBadge'
import { TicketContactsBlock } from '@/features/tickets/components/TicketContactsBlock'
import { WarrantyTierBadge } from '@/features/tickets/components/WarrantyTierBadge'
import { formatDate } from '@/features/tickets/utils'
import type { RequestStatus, WarrantyTier } from '@/features/tickets/types'
import type { TicketWithContacts } from '@/features/tickets/contacts'

// Deux types métier visibles côté atelier :
//  - 'advice'   → l'école demande un avis distance, aucune aile envoyée
//  - 'physical' → une aile arrive ou est arrivée physiquement à l'atelier
type TicketKind = 'advice' | 'physical'

function getTicketKind(t: TicketWithContacts): TicketKind {
  return t.school_resolution === 'workshop_advice_requested' ? 'advice' : 'physical'
}

// Regroupement statut → onglet. Couvre les statuts historiques (processing,
// approved, completed) ET les nouveaux statuts du pipeline d'étapes.
type StatusBucket = 'all' | 'incoming' | 'in_progress' | 'done'

const INCOMING_STATUSES: RequestStatus[] = [
  'processing',
  // 'pending_workshop' = routage direct client → atelier (repair / inspection),
  // l'aile n'est pas encore arrivée mais le ticket attend l'atelier.
  'pending_workshop',
  'escalated_to_workshop',
  'wing_received_workshop',
  'workshop_pre_checking',
  'workshop_diagnosing',
]

const IN_PROGRESS_STATUSES: RequestStatus[] = [
  'approved',
  'workshop_repairing',
  'workshop_done',
]

const DONE_STATUSES: RequestStatus[] = ['wing_returned', 'completed']

function matchesStatusBucket(t: TicketWithContacts, bucket: StatusBucket): boolean {
  if (bucket === 'all') return true
  // Les consultations en ligne ne suivent pas le pipeline classique : on les
  // rattache à "À traiter" tant qu'elles ne sont pas clôturées.
  if (getTicketKind(t) === 'advice') {
    if (bucket === 'incoming') {
      return t.status !== 'completed' && t.status !== 'wing_returned'
    }
    if (bucket === 'done') {
      return t.status === 'completed' || t.status === 'wing_returned'
    }
    return false
  }
  if (bucket === 'incoming') return INCOMING_STATUSES.includes(t.status)
  if (bucket === 'in_progress') return IN_PROGRESS_STATUSES.includes(t.status)
  return DONE_STATUSES.includes(t.status)
}

type TypeFilter = 'all' | TicketKind
type UrgencyFilter = 'all' | 'urgent' | 'safety'

const STATUS_TAB_LABELS: Record<StatusBucket, string> = {
  all:         'Tous',
  incoming:    'À traiter',
  in_progress: 'En cours',
  done:        'Terminés',
}

const TYPE_FILTER_LABELS: Record<TypeFilter, string> = {
  all:      'Tous types',
  advice:   '💬 Consultation',
  physical: '🪂 Aile à traiter',
}

const URGENCY_FILTER_LABELS: Record<UrgencyFilter, string> = {
  all:    'Toutes urgences',
  urgent: '🔥 Urgent',
  safety: '⚠ Sécurité',
}

interface WorkshopTicketListProps {
  tickets: TicketWithContacts[]
}

export function WorkshopTicketList({ tickets }: WorkshopTicketListProps) {
  const [statusBucket, setStatusBucket] = useState<StatusBucket>('all')
  const [typeFilter,   setTypeFilter]   = useState<TypeFilter>('all')
  const [urgency,      setUrgency]      = useState<UrgencyFilter>('all')
  const [search,       setSearch]       = useState('')

  // Tri par date — du plus récent au plus ancien.
  const sortedTickets = useMemo(
    () => [...tickets].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [tickets]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return sortedTickets.filter((t) => {
      if (!matchesStatusBucket(t, statusBucket)) return false
      if (typeFilter !== 'all' && getTicketKind(t) !== typeFilter) return false
      if (urgency === 'urgent' && t.urgency_level !== 2) return false
      if (urgency === 'safety' && !t.is_plume_urgent) return false
      if (!q) return true
      return (
        t.product_model?.toLowerCase().includes(q) ||
        t.product_brand?.toLowerCase().includes(q) ||
        t.serial_number?.toLowerCase().includes(q) ||
        t.first_name?.toLowerCase().includes(q) ||
        t.last_name?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.ticket_number?.toLowerCase().includes(q)
      )
    })
  }, [sortedTickets, statusBucket, typeFilter, urgency, search])

  // Compteurs par onglet calculés sur le set non filtré (search + autres
  // filtres ignorés) pour donner un repère stable.
  const countByStatus = useMemo(
    () => ({
      all:         tickets.length,
      incoming:    tickets.filter((t) => matchesStatusBucket(t, 'incoming')).length,
      in_progress: tickets.filter((t) => matchesStatusBucket(t, 'in_progress')).length,
      done:        tickets.filter((t) => matchesStatusBucket(t, 'done')).length,
    }),
    [tickets]
  )

  const hasActiveFilter =
    statusBucket !== 'all' || typeFilter !== 'all' || urgency !== 'all' || search.trim().length > 0

  return (
    <div className="space-y-4">
      {/* Recherche */}
      <input
        type="search"
        placeholder="Rechercher modèle, série, client, description…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="field-input"
        aria-label="Rechercher un ticket atelier"
      />

      {/* Onglets statut */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filtre statut">
        {(Object.keys(STATUS_TAB_LABELS) as StatusBucket[]).map((b) => (
          <button
            key={b}
            type="button"
            role="tab"
            aria-selected={statusBucket === b}
            onClick={() => setStatusBucket(b)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              statusBucket === b
                ? 'bg-brand-navy text-white'
                : 'bg-white text-slate-500 ring-1 ring-brand-stone hover:bg-brand-cream'
            }`}
          >
            {STATUS_TAB_LABELS[b]}
            <span className="ml-1.5 text-xs opacity-70">({countByStatus[b]})</span>
          </button>
        ))}
      </div>

      {/* Filtres secondaires : type + urgence */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 overflow-x-auto no-scrollbar" role="group" aria-label="Filtre type">
          {(Object.keys(TYPE_FILTER_LABELS) as TypeFilter[]).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={typeFilter === t}
              onClick={() => setTypeFilter(t)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-brand-ink text-white'
                  : 'bg-white text-slate-500 ring-1 ring-brand-stone hover:bg-brand-cream'
              }`}
            >
              {TYPE_FILTER_LABELS[t]}
            </button>
          ))}
        </div>
        <span className="hidden h-4 w-px bg-brand-stone sm:block" aria-hidden />
        <div className="flex gap-1 overflow-x-auto no-scrollbar" role="group" aria-label="Filtre urgence">
          {(Object.keys(URGENCY_FILTER_LABELS) as UrgencyFilter[]).map((u) => (
            <button
              key={u}
              type="button"
              aria-pressed={urgency === u}
              onClick={() => setUrgency(u)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                urgency === u
                  ? 'bg-brand-ink text-white'
                  : 'bg-white text-slate-500 ring-1 ring-brand-stone hover:bg-brand-cream'
              }`}
            >
              {URGENCY_FILTER_LABELS[u]}
            </button>
          ))}
        </div>
      </div>

      {/* Compteur de résultats */}
      <p className="px-1 text-xs text-slate-500">
        {filtered.length} ticket{filtered.length > 1 ? 's' : ''}
        {hasActiveFilter && ' (filtrés)'}
        {' · '}trié par date
      </p>

      {/* Liste */}
      {filtered.length === 0 ? (
        <EmptyState hasFilter={hasActiveFilter} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((ticket) => (
            <li key={ticket.id}>
              <WorkshopTicketRow ticket={ticket} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EmptyState({ hasFilter }: { hasFilter: boolean }) {
  return (
    <div className="rounded-card border border-dashed border-brand-stone bg-white px-4 py-10 text-center">
      <p className="text-3xl" aria-hidden>🛠️</p>
      <p className="mt-2 text-sm font-medium text-brand-ink">
        {hasFilter ? 'Aucun ticket ne correspond à ces filtres' : 'Aucun ticket atelier pour le moment'}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {hasFilter
          ? 'Essayez d’élargir les filtres ou la recherche.'
          : 'Les nouveaux tickets escaladés par les écoles s’afficheront ici.'}
      </p>
    </div>
  )
}

function WorkshopTicketRow({ ticket }: { ticket: TicketWithContacts }) {
  const kind = getTicketKind(ticket)
  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
  const productLine = [ticket.product_brand, ticket.product_model].filter(Boolean).join(' ') || 'Aile'
  // Sous-ligne aile : taille + n° série. Cohérence avec le bandeau d'info de
  // la page détail (taille à côté de la marque/modèle).
  const wingMeta = [
    ticket.wing_size && `Taille ${ticket.wing_size}`,
    ticket.serial_number,
  ].filter(Boolean) as string[]

  return (
    <Link
      href={`/workshop/ticket/${ticket.id}`}
      className="card group block p-4 transition-all hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.99]"
    >
      {/* Ligne 1 — badges type + statut + urgence */}
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge kind={kind} />
        <RequestTypeBadge type={ticket.request_type} size="xs" />
        <StatusBadge status={ticket.status} size="sm" />
        {ticket.warranty_tier && (
          <WarrantyTierBadge
            tier={ticket.warranty_tier as WarrantyTier}
            size="sm"
            compact
          />
        )}
        {ticket.is_plume_urgent && (
          <span className="inline-flex items-center rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
            ⚠ Sécurité
          </span>
        )}
        {ticket.urgency_level === 2 && (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700">
            Urgent
          </span>
        )}
        <span className="ml-auto font-mono text-[11px] text-slate-400">{ticketRef}</span>
      </div>

      {/* Ligne 2 — produit + aile */}
      <div className="mt-2 flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-semibold text-brand-ink">{productLine}</p>
        <span className="shrink-0 text-lg text-slate-300 transition-colors group-hover:text-brand-gold" aria-hidden>›</span>
      </div>
      {wingMeta.length > 0 && (
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {wingMeta.map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1.5 text-slate-300">•</span>}
              <span className={i === wingMeta.length - 1 && ticket.serial_number ? 'font-mono' : ''}>
                {part}
              </span>
            </span>
          ))}
        </p>
      )}

      {/* Ligne 3 — date */}
      <p className="mt-2 text-xs text-slate-400">{formatDate(ticket.created_at)}</p>

      {/* Ligne 4 — contacts (Client, École, Atelier) — partage le composant
          déjà utilisé sur la file école pour cohérence visuelle. */}
      <TicketContactsBlock contacts={ticket.contacts} />
    </Link>
  )
}

function TypeBadge({ kind }: { kind: TicketKind }) {
  if (kind === 'advice') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-800 ring-1 ring-sky-200">
        💬 Consultation
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-orange-800 ring-1 ring-orange-200">
      🪂 Aile à traiter
    </span>
  )
}
