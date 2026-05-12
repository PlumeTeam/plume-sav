'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { TicketContactsBlock } from '@/features/tickets/components/TicketContactsBlock'
import { formatDate } from '@/features/tickets/utils'
import type { RequestStatus } from '@/features/tickets/types'
import type { TicketWithContacts } from '@/features/tickets/contacts'

type KanbanColumn = {
  id:       string
  label:    string
  statuses: RequestStatus[]
  hint:     string
}

// Colonnes Kanban — chaque colonne couvre à la fois les statuts hérités
// (processing/approved/completed) et les nouveaux statuts du pipeline d'étapes
// (migration 20260509000000) pour qu'aucun ticket ne soit invisible.
//
// "Terminés" est splitté en "À expédier" (workshop_done = réparé non renvoyé)
// et "Renvoyés" (wing_returned + completed) pour que l'atelier sache d'un
// coup d'œil ce qui reste à mettre en colis.
const COLUMNS: KanbanColumn[] = [
  {
    id:       'processing',
    label:    'En diagnostic',
    statuses: ['processing', 'escalated_to_workshop', 'wing_received_workshop', 'workshop_diagnosing'],
    hint:     'À réceptionner, inspecter et chiffrer',
  },
  {
    id:       'approved',
    label:    'En réparation',
    statuses: ['approved', 'workshop_repairing'],
    hint:     'Devis validé, travail en cours',
  },
  {
    id:       'to_ship',
    label:    'À expédier',
    statuses: ['workshop_done'],
    hint:     'Réparé, étiquette retour à imprimer',
  },
  {
    id:       'returned',
    label:    'Renvoyés',
    statuses: ['wing_returned', 'completed'],
    hint:     'Aile renvoyée ou ticket clôturé',
  },
]

type UrgencyFilter = 'all' | 'urgent' | 'safety'

const URGENCY_LABELS: Record<UrgencyFilter, string> = {
  all:    'Tous',
  urgent: 'Urgents',
  safety: 'Sécurité',
}

interface WorkshopKanbanProps {
  tickets: TicketWithContacts[]
}

export function WorkshopKanban({ tickets }: WorkshopKanbanProps) {
  const [activeTab, setActiveTab] = useState<string>(COLUMNS[0]!.id)
  const [search,    setSearch]    = useState('')
  const [urgency,   setUrgency]   = useState<UrgencyFilter>('all')

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets.filter((t) => {
      if (urgency === 'urgent' && t.urgency_level !== 2) return false
      if (urgency === 'safety' && !t.is_plume_urgent)    return false
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
  }, [tickets, search, urgency])

  const byColumn = useMemo(
    () =>
      COLUMNS.reduce<Record<string, TicketWithContacts[]>>((acc, col) => {
        acc[col.id] = filteredTickets.filter((t) => col.statuses.includes(t.status))
        return acc
      }, {}),
    [filteredTickets]
  )

  const visibleColumn = COLUMNS.find((c) => c.id === activeTab) ?? COLUMNS[0]!
  const visibleTickets = byColumn[visibleColumn.id] ?? []

  return (
    <div>
      {/* Search + urgency filter */}
      <div className="space-y-3 px-4 pt-3 pb-1 md:px-6 md:pt-0 md:pb-3">
        <input
          type="search"
          placeholder="Rechercher modèle, série, client, description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input"
          aria-label="Rechercher un ticket atelier"
        />
        <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist" aria-label="Filtre urgence">
          {(Object.keys(URGENCY_LABELS) as UrgencyFilter[]).map((u) => (
            <button
              key={u}
              role="tab"
              aria-selected={urgency === u}
              onClick={() => setUrgency(u)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                urgency === u
                  ? 'bg-brand-navy text-white'
                  : 'bg-white text-slate-500 ring-1 ring-brand-stone hover:bg-brand-cream'
              }`}
            >
              {URGENCY_LABELS[u]}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile tab strip */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar px-4 py-3 md:hidden" role="tablist">
        {COLUMNS.map((col) => (
          <button
            key={col.id}
            role="tab"
            aria-selected={activeTab === col.id}
            onClick={() => setActiveTab(col.id)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === col.id
                ? 'bg-brand-navy text-white'
                : 'bg-white text-slate-500 ring-1 ring-brand-stone'
            }`}
          >
            {col.label} ({(byColumn[col.id] ?? []).length})
          </button>
        ))}
      </div>

      {/* Mobile: stacked list */}
      <div className="space-y-3 px-4 pb-8 md:hidden">
        {visibleTickets.length === 0 ? (
          <EmptyState hint={visibleColumn.hint} hasSearch={search.trim().length > 0 || urgency !== 'all'} />
        ) : (
          visibleTickets.map((ticket) => (
            <WorkshopTicketCard key={ticket.id} ticket={ticket} />
          ))
        )}
      </div>

      {/* Desktop: kanban columns */}
      <div className="hidden md:grid md:grid-cols-4 md:gap-4 md:p-6 md:pt-0">
        {COLUMNS.map((col) => (
          <div key={col.id} className="rounded-3xl border border-brand-stone/60 bg-white p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <h3 className="text-sm font-semibold text-brand-ink">{col.label}</h3>
              <span className="rounded-full bg-brand-cream px-2 py-0.5 text-xs font-semibold text-brand-navy">
                {(byColumn[col.id] ?? []).length}
              </span>
            </div>
            <p className="mb-3 text-xs text-slate-500">{col.hint}</p>
            <div className="space-y-2">
              {(byColumn[col.id] ?? []).length === 0 ? (
                <p className="rounded-xl border border-dashed border-brand-stone bg-brand-cream/50 p-4 text-center text-xs text-slate-400">
                  Aucun ticket
                </p>
              ) : (
                (byColumn[col.id] ?? []).map((ticket) => (
                  <WorkshopTicketCard key={ticket.id} ticket={ticket} compact />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ hint, hasSearch }: { hint: string; hasSearch: boolean }) {
  return (
    <div className="rounded-3xl border border-dashed border-brand-stone bg-white px-4 py-10 text-center">
      <p className="text-3xl" aria-hidden>🔧</p>
      <p className="mt-2 text-sm font-medium text-brand-ink">
        {hasSearch ? 'Aucun résultat' : 'Aucun ticket dans cet onglet'}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        {hasSearch ? 'Essayez avec d’autres mots-clés ou un autre filtre.' : hint}
      </p>
    </div>
  )
}

function WorkshopTicketCard({
  ticket,
  compact = false,
}: {
  ticket: TicketWithContacts
  compact?: boolean
}) {
  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
  return (
    <Link
      href={`/workshop/ticket/${ticket.id}`}
      className="block rounded-2xl border border-brand-stone bg-white p-3 transition-all hover:-translate-y-0.5 hover:shadow-soft active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`font-semibold text-brand-ink ${compact ? 'text-xs' : 'text-sm'}`}>
          {ticket.product_brand} {ticket.product_model}
        </p>
        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-1">
          {ticket.is_plume_urgent && (
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              ⚠ Sécurité
            </span>
          )}
          {ticket.school_resolution === 'workshop_advice_requested' && (
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-sky-800">
              💬 Avis demandé
            </span>
          )}
          {ticket.urgency_level === 2 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-red-700">
              Urgent
            </span>
          )}
        </div>
      </div>
      <p className={`text-slate-500 ${compact ? 'mt-0.5 font-mono text-[11px]' : 'mt-1 font-mono text-xs'}`}>
        {ticketRef}
      </p>
      {!compact && (
        <>
          <div className="mt-2 flex items-center justify-between">
            <StatusBadge status={ticket.status} size="sm" />
            <span className="text-xs text-slate-400">{formatDate(ticket.created_at)}</span>
          </div>
          {/* Coordonnées des parties prenantes — uniquement sur les cartes
              pleine largeur. Le kanban desktop (compact) reste dense. */}
          <div className="mt-3">
            <TicketContactsBlock contacts={ticket.contacts} />
          </div>
        </>
      )}
    </Link>
  )
}
