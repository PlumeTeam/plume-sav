'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { formatDate } from '@/features/tickets/utils'
import type { TicketWithPhotos, RequestStatus } from '@/features/tickets/types'

type KanbanColumn = {
  id:       string
  label:    string
  statuses: RequestStatus[]
  hint:     string
}

const COLUMNS: KanbanColumn[] = [
  { id: 'processing', label: 'En diagnostic', statuses: ['processing'], hint: 'À inspecter et chiffrer' },
  { id: 'approved',   label: 'En réparation', statuses: ['approved'],   hint: 'Devis validé, travail en cours' },
  { id: 'completed',  label: 'Terminés',      statuses: ['completed'],  hint: 'Réparation finalisée' },
]

interface WorkshopKanbanProps {
  tickets: TicketWithPhotos[]
}

export function WorkshopKanban({ tickets }: WorkshopKanbanProps) {
  const [activeTab, setActiveTab] = useState<string>(COLUMNS[0]!.id)

  const byColumn = useMemo(
    () =>
      COLUMNS.reduce<Record<string, TicketWithPhotos[]>>((acc, col) => {
        acc[col.id] = tickets.filter((t) => col.statuses.includes(t.status))
        return acc
      }, {}),
    [tickets]
  )

  const visibleColumn = COLUMNS.find((c) => c.id === activeTab) ?? COLUMNS[0]!
  const visibleTickets = byColumn[visibleColumn.id] ?? []

  return (
    <div>
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
          <EmptyState hint={visibleColumn.hint} />
        ) : (
          visibleTickets.map((ticket) => (
            <WorkshopTicketCard key={ticket.id} ticket={ticket} />
          ))
        )}
      </div>

      {/* Desktop: kanban columns */}
      <div className="hidden md:grid md:grid-cols-3 md:gap-4 md:p-6">
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

function EmptyState({ hint }: { hint: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-brand-stone bg-white px-4 py-10 text-center">
      <p className="text-3xl" aria-hidden>🔧</p>
      <p className="mt-2 text-sm font-medium text-brand-ink">Aucun ticket dans cet onglet</p>
      <p className="mt-1 text-xs text-slate-500">{hint}</p>
    </div>
  )
}

function WorkshopTicketCard({
  ticket,
  compact = false,
}: {
  ticket: TicketWithPhotos
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
        <div className="mt-2 flex items-center justify-between">
          <StatusBadge status={ticket.status} size="sm" />
          <span className="text-xs text-slate-400">{formatDate(ticket.created_at)}</span>
        </div>
      )}
    </Link>
  )
}
