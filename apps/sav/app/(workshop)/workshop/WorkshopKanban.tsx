'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { formatDate } from '@/features/tickets/utils'
import type { TicketWithPhotos, RequestStatus } from '@/features/tickets/types'

type KanbanColumn = {
  id: string
  label: string
  statuses: RequestStatus[]
  color: string
}

const COLUMNS: KanbanColumn[] = [
  { id: 'processing', label: 'En cours',    statuses: ['processing'], color: 'border-orange-300 bg-orange-50' },
  { id: 'approved',   label: 'Approuvé',    statuses: ['approved'],   color: 'border-green-300 bg-green-50' },
  { id: 'completed',  label: 'Terminé',     statuses: ['completed'],  color: 'border-teal-300 bg-teal-50' },
]

interface WorkshopKanbanProps {
  tickets: TicketWithPhotos[]
}

export function WorkshopKanban({ tickets }: WorkshopKanbanProps) {
  const [activeTab, setActiveTab] = useState<string | null>(null)

  const byColumn = useMemo(
    () =>
      COLUMNS.reduce<Record<string, TicketWithPhotos[]>>((acc, col) => {
        acc[col.id] = tickets.filter((t) => col.statuses.includes(t.status))
        return acc
      }, {}),
    [tickets]
  )

  // Mobile: tab-based list view
  const mobileColumns = activeTab ? COLUMNS.filter((c) => c.id === activeTab) : COLUMNS

  return (
    <div>
      {/* Mobile tab strip */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar px-4 py-3 md:hidden" role="tablist">
        <button
          onClick={() => setActiveTab(null)}
          className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
            activeTab === null ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'
          }`}
        >
          Tous ({tickets.length})
        </button>
        {COLUMNS.map((col) => (
          <button
            key={col.id}
            role="tab"
            aria-selected={activeTab === col.id}
            onClick={() => setActiveTab(col.id)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium ${
              activeTab === col.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'
            }`}
          >
            {col.label} ({(byColumn[col.id] ?? []).length})
          </button>
        ))}
      </div>

      {/* Mobile: stacked list */}
      <div className="space-y-3 px-4 pb-8 md:hidden">
        {mobileColumns.flatMap((col) =>
          (byColumn[col.id] ?? []).map((ticket) => (
            <WorkshopTicketCard key={ticket.id} ticket={ticket} />
          ))
        )}
        {mobileColumns.every((col) => (byColumn[col.id] ?? []).length === 0) && (
          <p className="py-12 text-center text-sm text-slate-400">Aucun ticket dans cette colonne.</p>
        )}
      </div>

      {/* Desktop: kanban columns */}
      <div className="hidden md:grid md:grid-cols-4 md:gap-4 md:p-6">
        {COLUMNS.map((col) => (
          <div key={col.id} className={`rounded-2xl border-2 ${col.color} p-3`}>
            <h3 className="mb-3 text-sm font-semibold text-slate-700">
              {col.label}
              <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                {(byColumn[col.id] ?? []).length}
              </span>
            </h3>
            <div className="space-y-2">
              {(byColumn[col.id] ?? []).map((ticket) => (
                <WorkshopTicketCard key={ticket.id} ticket={ticket} compact />
              ))}
            </div>
          </div>
        ))}
      </div>
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
  return (
    <Link
      href={`/workshop/ticket/${ticket.id}`}
      className="block rounded-xl bg-white p-3 shadow-sm transition-transform active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`font-semibold text-slate-900 ${compact ? 'text-xs' : 'text-sm'}`}>
          {ticket.product_brand} {ticket.product_model}
        </p>
        {ticket.urgency_level === 2 && (
          <span className="flex-shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
            Urgent
          </span>
        )}
      </div>
      <p className={`text-slate-500 ${compact ? 'text-xs' : 'text-xs mt-0.5'}`}>
        {ticket.id.slice(0, 8).toUpperCase()}
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
