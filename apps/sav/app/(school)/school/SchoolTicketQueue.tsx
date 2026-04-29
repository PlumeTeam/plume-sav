'use client'

import { useState, useMemo } from 'react'
import { TicketCard } from '@/features/tickets/components/TicketCard'
import type { TicketWithPhotos, TicketStatus } from '@/features/tickets/types'

type FilterTab = 'all' | 'pending' | 'active' | 'done'

const PENDING: TicketStatus[] = ['submitted']
const ACTIVE: TicketStatus[] = ['in_review', 'diagnosed', 'repair_in_progress', 'repaired']
const DONE: TicketStatus[] = ['shipped', 'closed', 'rejected']

const TAB_LABELS: Record<FilterTab, string> = {
  all: 'Tous',
  pending: 'En attente',
  active: 'En cours',
  done: 'Terminés',
}

function matchesFilter(status: TicketStatus, tab: FilterTab): boolean {
  if (tab === 'all') return true
  if (tab === 'pending') return PENDING.includes(status)
  if (tab === 'active') return ACTIVE.includes(status)
  return DONE.includes(status)
}

interface SchoolTicketQueueProps {
  tickets: TicketWithPhotos[]
}

export function SchoolTicketQueue({ tickets }: SchoolTicketQueueProps) {
  const [tab, setTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets
      .filter((t) => matchesFilter(t.status, tab))
      .filter((t) => {
        if (!q) return true
        return (
          t.ticket_number?.toLowerCase().includes(q) ||
          t.wing_brand?.toLowerCase().includes(q) ||
          t.wing_model?.toLowerCase().includes(q)
        )
      })
  }, [tickets, tab, search])

  const countByTab = useMemo(
    () => ({
      all: tickets.length,
      pending: tickets.filter((t) => matchesFilter(t.status, 'pending')).length,
      active: tickets.filter((t) => matchesFilter(t.status, 'active')).length,
      done: tickets.filter((t) => matchesFilter(t.status, 'done')).length,
    }),
    [tickets]
  )

  return (
    <div className="space-y-4 px-4 py-5">
      {/* Search */}
      <input
        type="search"
        placeholder="Rechercher par n°, marque, modèle…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="field-input"
        aria-label="Rechercher un ticket"
      />

      {/* Filter tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist">
        {(Object.keys(TAB_LABELS) as FilterTab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-100'
            }`}
          >
            {TAB_LABELS[t]}
            <span className="ml-1.5 text-xs opacity-70">({countByTab[t]})</span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-slate-400">Aucun ticket trouvé.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              basePath="/school"
              showUrgency
            />
          ))}
        </div>
      )}
    </div>
  )
}
