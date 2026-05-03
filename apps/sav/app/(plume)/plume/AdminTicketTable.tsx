'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { formatDate } from '@/features/tickets/utils'
import type { TicketWithPhotos, RequestStatus } from '@/features/tickets/types'

type StatusFilter = 'all' | 'pending' | 'processing' | 'approved' | 'completed' | 'rejected'

const FILTER_LABELS: Record<StatusFilter, string> = {
  all:        'Tous',
  pending:    'À traiter',
  processing: 'En cours',
  approved:   'Approuvés',
  completed:  'Terminés',
  rejected:   'Rejetés',
}

interface AdminTicketTableProps {
  tickets: TicketWithPhotos[]
}

export function AdminTicketTable({ tickets }: AdminTicketTableProps) {
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets
      .filter((t) => {
        if (filter === 'all') return true
        return (t.status as RequestStatus) === filter
      })
      .filter((t) => {
        if (!q) return true
        return (
          t.id.toLowerCase().includes(q) ||
          t.product_brand?.toLowerCase().includes(q) ||
          t.product_model?.toLowerCase().includes(q) ||
          t.serial_number?.toLowerCase().includes(q) ||
          t.ticket_number?.toLowerCase().includes(q)
        )
      })
      .slice(0, 50)
  }, [tickets, filter, search])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Rechercher par n°, marque, modèle, série…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="field-input flex-1 min-w-[200px]"
          aria-label="Rechercher un ticket"
        />
      </div>
      <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist">
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f
                ? 'bg-brand-navy text-white'
                : 'bg-white text-slate-500 ring-1 ring-brand-stone hover:bg-brand-cream'
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card border-dashed p-8 text-center">
          <p className="text-3xl" aria-hidden>📭</p>
          <p className="mt-2 text-sm text-slate-500">Aucun résultat.</p>
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
                {filtered.map((ticket) => {
                  const ref  = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
                  // Send the admin to the role-relevant detail view
                  const href = ticket.status === 'pending' || ticket.status === 'processing'
                    ? `/school/ticket/${ticket.id}`
                    : `/workshop/ticket/${ticket.id}`
                  return (
                    <tr key={ticket.id} className="transition-colors hover:bg-brand-cream/40">
                      <td className="px-4 py-3">
                        <Link href={href} className="font-mono text-xs font-medium text-brand-ink hover:underline">
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
          {tickets.length > filtered.length && (
            <div className="border-t border-brand-stone/50 bg-brand-cream/40 px-4 py-2 text-center text-xs text-slate-400">
              {filtered.length} ticket{filtered.length > 1 ? 's' : ''} affiché{filtered.length > 1 ? 's' : ''} sur {tickets.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
