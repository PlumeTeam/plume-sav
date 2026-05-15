'use client'

import { useState, useMemo } from 'react'
import { TicketCard } from '@/features/tickets/components/TicketCard'
import type { RequestStatus } from '@/features/tickets/types'
import type { TicketWithContacts } from '@/features/tickets/contacts'

type FilterTab = 'all' | 'pending' | 'active' | 'done'

// "À traiter" — l'école doit accuser réception ou récupérer l'aile.
const PENDING: RequestStatus[] = ['pending']

// "En cours" — toutes les étapes intermédiaires côté école ET côté atelier
// (l'école garde la visibilité tant que le ticket n'est pas clôturé).
// Inclut les statuts hérités (processing/approved) pour les tickets antérieurs
// au pipeline d'étapes (migration 20260509000000).
const ACTIVE: RequestStatus[]  = [
  'school_acknowledged',
  'wing_received_school',
  'school_checking',
  'processing',
  'approved',
  'escalated_to_workshop',
  'wing_received_workshop',
  'workshop_diagnosing',
  'workshop_repairing',
  'workshop_done',
  'wing_returned',
]

// "Terminés" — école-résolu compte comme terminé (parcours école-only).
const DONE: RequestStatus[]    = ['school_resolved', 'completed', 'rejected', 'cancelled']

const TAB_LABELS: Record<FilterTab, string> = {
  all:     'Tous',
  pending: 'À traiter',
  active:  'En cours',
  done:    'Terminés',
}

function matchesFilter(status: RequestStatus, tab: FilterTab): boolean {
  if (tab === 'all') return true
  if (tab === 'pending') return PENDING.includes(status)
  if (tab === 'active') return ACTIVE.includes(status)
  return DONE.includes(status)
}

interface SchoolTicketQueueProps {
  tickets: TicketWithContacts[]
}

export function SchoolTicketQueue({ tickets }: SchoolTicketQueueProps) {
  const [tab, setTab] = useState<FilterTab>('pending')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets
      .filter((t) => matchesFilter(t.status, tab))
      .filter((t) => {
        if (!q) return true
        return (
          t.id.toLowerCase().includes(q) ||
          t.product_brand?.toLowerCase().includes(q) ||
          t.product_model?.toLowerCase().includes(q) ||
          t.serial_number?.toLowerCase().includes(q)
        )
      })
  }, [tickets, tab, search])

  const countByTab = useMemo(
    () => ({
      all:     tickets.length,
      pending: tickets.filter((t) => matchesFilter(t.status, 'pending')).length,
      active:  tickets.filter((t) => matchesFilter(t.status, 'active')).length,
      done:    tickets.filter((t) => matchesFilter(t.status, 'done')).length,
    }),
    [tickets]
  )

  return (
    <div className="space-y-3">
      {/* Search */}
      <input
        type="search"
        placeholder="Rechercher par n°, marque, modèle, série…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="field-input"
        aria-label="Rechercher un ticket"
      />

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1" role="tablist">
        {(Object.keys(TAB_LABELS) as FilterTab[]).map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium ring-1 transition-colors ${
              tab === t
                ? 'bg-brand-navy text-white ring-brand-navy'
                : 'bg-white text-slate-600 ring-brand-stone hover:bg-brand-cream hover:text-brand-ink'
            }`}
          >
            {TAB_LABELS[t]}
            <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              tab === t ? 'bg-white/20 text-white' : 'bg-brand-cream text-brand-ink/70'
            }`}>
              {countByTab[t]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-10 text-center">
          <p className="text-3xl" aria-hidden>📭</p>
          <p className="mt-2 text-sm font-medium text-slate-700">
            {search ? 'Aucun résultat' : 'Aucun ticket dans cet onglet'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {search ? 'Essayez avec d’autres mots-clés.' : 'Les nouveaux tickets s’affichent ici dès leur création.'}
          </p>
        </div>
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
