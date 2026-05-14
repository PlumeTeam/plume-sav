'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { RequestTypeBadge } from '@/features/tickets/components/RequestTypeBadge'
import { WarrantyTierBadge } from '@/features/tickets/components/WarrantyTierBadge'
import { formatDate, resolveWarrantyTierForDisplay } from '@/features/tickets/utils'
import type { RequestStatus } from '@/features/tickets/types'
import type { PartnerSchool } from '@/features/tickets/queries'
import type { TicketWithContacts } from '@/features/tickets/contacts'
import { AdminTicketActions } from './AdminTicketActions'

type StatusFilter = 'all' | 'pending' | 'processing' | 'approved' | 'completed' | 'rejected'

const FILTER_LABELS: Record<StatusFilter, string> = {
  all:        'Tous',
  pending:    'À traiter',
  processing: 'En cours',
  approved:   'Approuvés',
  completed:  'Terminés',
  rejected:   'Rejetés',
}

const PAGE_SIZE = 20

interface AdminTicketTableProps {
  tickets: TicketWithContacts[]
  /** Liste des écoles partenaires — utilisée par le filtre + l'action de réassignation. */
  schools: PartnerSchool[]
}

export function AdminTicketTable({ tickets, schools }: AdminTicketTableProps) {
  const [filter, setFilter]       = useState<StatusFilter>('all')
  const [search, setSearch]       = useState('')
  const [schoolFilter, setSchoolFilter]     = useState<string>('all')
  const [workshopFilter, setWorkshopFilter] = useState<string>('all')
  const [page, setPage]           = useState(0)
  const [actionsOpenFor, setActionsOpenFor] = useState<string | null>(null)

  // Map id → label pour affichage (école)
  const schoolLabelById = useMemo(() => {
    const m = new Map<string, string>()
    for (const s of schools) m.set(s.id, s.name)
    return m
  }, [schools])

  // Écoles présentes dans les tickets — réduit la dropdown aux choix utiles.
  const schoolOptions = useMemo(() => {
    const ids = new Set<string>()
    for (const t of tickets) {
      if (t.school_id) ids.add(t.school_id)
    }
    return Array.from(ids)
      .map((id) => ({ id, label: schoolLabelById.get(id) ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [tickets, schoolLabelById])

  // Ateliers présents dans les tickets (assigned_workshop_*).
  const workshopOptions = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of tickets) {
      if (t.assigned_workshop_id) {
        map.set(t.assigned_workshop_id, t.assigned_workshop_label ?? t.assigned_workshop_id)
      }
    }
    return Array.from(map.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [tickets])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tickets.filter((t) => {
      if (filter !== 'all' && (t.status as RequestStatus) !== filter) return false
      if (schoolFilter !== 'all' && t.school_id !== schoolFilter) return false
      if (workshopFilter !== 'all' && t.assigned_workshop_id !== workshopFilter) return false
      if (!q) return true
      return (
        t.id.toLowerCase().includes(q) ||
        t.product_brand?.toLowerCase().includes(q) ||
        t.product_model?.toLowerCase().includes(q) ||
        t.serial_number?.toLowerCase().includes(q) ||
        t.ticket_number?.toLowerCase().includes(q) ||
        t.first_name?.toLowerCase().includes(q) ||
        t.last_name?.toLowerCase().includes(q)
      )
    })
  }, [tickets, filter, search, schoolFilter, workshopFilter])

  // Reset page si les filtres changent et la page dépasse
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages - 1)
  const pageStart  = safePage * PAGE_SIZE
  const visible    = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setter(v)
    setPage(0)
  }

  return (
    <div className="space-y-3">
      {/* Search + filtres dropdown */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          placeholder="Rechercher par n°, marque, modèle, série, client…"
          value={search}
          onChange={(e) => resetAndSet(setSearch, e.target.value)}
          className="field-input flex-1 min-w-[200px]"
          aria-label="Rechercher un ticket"
        />
        <select
          value={schoolFilter}
          onChange={(e) => resetAndSet(setSchoolFilter, e.target.value)}
          className="field-input w-auto min-w-[160px]"
          aria-label="Filtre école"
        >
          <option value="all">Toutes les écoles</option>
          {schoolOptions.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
        <select
          value={workshopFilter}
          onChange={(e) => resetAndSet(setWorkshopFilter, e.target.value)}
          className="field-input w-auto min-w-[160px]"
          aria-label="Filtre atelier"
        >
          <option value="all">Tous les ateliers</option>
          {workshopOptions.map((w) => (
            <option key={w.id} value={w.id}>{w.label}</option>
          ))}
        </select>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto no-scrollbar" role="tablist">
        {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            onClick={() => resetAndSet(setFilter, f)}
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
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Type</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Aile</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">École</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Atelier</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Statut</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Garantie</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Urgence</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Achat</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Date</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-stone/50">
                {visible.map((ticket) => {
                  const ref  = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
                  const href = ticket.status === 'pending' || ticket.status === 'processing'
                    ? `/school/ticket/${ticket.id}`
                    : `/workshop/ticket/${ticket.id}`
                  const fallbackSchoolName = ticket.school_id
                    ? schoolLabelById.get(ticket.school_id) ?? ticket.school_id
                    : '—'
                  const client   = ticket.contacts?.client
                  const school   = ticket.contacts?.school
                  const workshop = ticket.contacts?.workshop
                  return (
                    <tr key={ticket.id} className="transition-colors hover:bg-brand-cream/40 align-top">
                      <td className="px-4 py-3">
                        <Link href={href} className="font-mono text-xs font-medium text-brand-ink hover:underline">
                          {ref}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <RequestTypeBadge type={ticket.request_type} size="xs" />
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        <p className="text-sm">{ticket.product_brand} {ticket.product_model}</p>
                        {client && (client.name || client.email || client.phone) && (
                          <div className="mt-1 text-xs text-slate-500">
                            {client.name && <p className="font-medium text-slate-700">{client.name}</p>}
                            <ContactLines email={client.email} phone={client.phone} />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <p className="font-medium text-slate-700">{school?.name ?? fallbackSchoolName}</p>
                        {school && <ContactLines email={school.email} phone={school.phone} />}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <p className="font-medium text-slate-700">{workshop?.label ?? ticket.assigned_workshop_label ?? '—'}</p>
                        {workshop && <ContactLines email={workshop.email} phone={workshop.phone} />}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={ticket.status} size="sm" />
                      </td>
                      <td className="px-4 py-3">
                        <WarrantyTierBadge
                          tier={resolveWarrantyTierForDisplay(ticket.warranty_tier, ticket.purchase_date)}
                          size="sm"
                          compact
                        />
                      </td>
                      <td className="px-4 py-3">
                        {ticket.urgency_level === 2 && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-red-700">
                            Urgent
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {ticket.purchase_date ? formatDate(ticket.purchase_date) : '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-400">
                        {formatDate(ticket.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => setActionsOpenFor(ticket.id)}
                          className="rounded-full px-2 py-1 text-xs font-medium text-brand-navy hover:bg-brand-cream"
                          aria-label={`Actions admin pour ${ref}`}
                        >
                          ⋯
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-stone/50 bg-brand-cream/40 px-4 py-2 text-xs text-slate-500">
            <span>
              {filtered.length === 0
                ? '0 résultat'
                : `${pageStart + 1}–${Math.min(pageStart + PAGE_SIZE, filtered.length)} sur ${filtered.length}`}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage(Math.max(0, safePage - 1))}
                disabled={safePage === 0}
                className="rounded-full px-3 py-1 font-medium text-brand-ink disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white"
              >
                ← Précédent
              </button>
              <span className="px-2 text-slate-400">
                Page {safePage + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages - 1, safePage + 1))}
                disabled={safePage >= totalPages - 1}
                className="rounded-full px-3 py-1 font-medium text-brand-ink disabled:cursor-not-allowed disabled:opacity-40 hover:bg-white"
              >
                Suivant →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Actions modal */}
      {actionsOpenFor && (() => {
        const target = tickets.find((t) => t.id === actionsOpenFor)
        if (!target) return null
        return (
          <AdminTicketActions
            ticket={target}
            schools={schools}
            currentSchoolLabel={target.school_id ? schoolLabelById.get(target.school_id) ?? null : null}
            onClose={() => setActionsOpenFor(null)}
          />
        )
      })()}
    </div>
  )
}

function ContactLines({ email, phone }: { email: string | null; phone: string | null }) {
  if (!email && !phone) return null
  return (
    <div className="mt-0.5 space-y-0.5 text-[11px] text-slate-500">
      {phone && (
        <p className="truncate">
          <span aria-hidden className="mr-1">📞</span>
          {phone}
        </p>
      )}
      {email && (
        <p className="truncate">
          <span aria-hidden className="mr-1">✉️</span>
          {email}
        </p>
      )}
    </div>
  )
}
