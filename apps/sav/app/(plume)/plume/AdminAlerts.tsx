'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { TicketWithContacts } from '@/features/tickets/contacts'
import { formatDate } from '@/features/tickets/utils'

export interface AdminAlertGroup {
  /** Identifiant interne (clé React + ouverture par défaut). */
  key:      'no_activity' | 'pending_school' | 'pending_workshop'
  /** Émoji affiché en tête de carte. */
  emoji:    string
  /** Libellé court de l'alerte. */
  label:    string
  /** Phrase complète : ex "Tickets sans activité > 3 jours". */
  title:    string
  /** Sous-titre explicatif sous le titre. */
  hint:     string
  /** Tone palette (bordure + fond + accents). */
  tone:     'red' | 'orange' | 'yellow'
  /** Champ date utilisé pour ordonner et afficher l'ancienneté. */
  dateOf:   (t: TicketWithContacts) => string | null
  /** Tickets concernés, déjà filtrés côté serveur. */
  tickets:  TicketWithContacts[]
  /** Préfixe de route pour le lien — pas de page `/plume/ticket/[id]`, on
   *  redirige vers la vue école ou atelier selon la catégorie. */
  linkPrefix: '/school/ticket' | '/workshop/ticket'
}

interface AdminAlertsProps {
  groups: AdminAlertGroup[]
}

const TONE_STYLES: Record<AdminAlertGroup['tone'], {
  border:      string
  bg:          string
  ring:        string
  countBadge:  string
  rowHover:    string
  daysBadge:   string
  emojiBg:     string
}> = {
  red: {
    border:     'border-red-300',
    bg:         'bg-red-50',
    ring:       'ring-red-200',
    countBadge: 'bg-red-600 text-white',
    rowHover:   'hover:bg-red-100/50',
    daysBadge:  'bg-red-100 text-red-700',
    emojiBg:    'bg-red-100',
  },
  orange: {
    border:     'border-orange-300',
    bg:         'bg-orange-50',
    ring:       'ring-orange-200',
    countBadge: 'bg-orange-500 text-white',
    rowHover:   'hover:bg-orange-100/50',
    daysBadge:  'bg-orange-100 text-orange-800',
    emojiBg:    'bg-orange-100',
  },
  yellow: {
    border:     'border-yellow-300',
    bg:         'bg-yellow-50',
    ring:       'ring-yellow-200',
    countBadge: 'bg-yellow-500 text-white',
    rowHover:   'hover:bg-yellow-100/50',
    daysBadge:  'bg-yellow-100 text-yellow-800',
    emojiBg:    'bg-yellow-100',
  },
}

const HOUR_MS = 3_600_000
const DAY_MS  = 86_400_000

function formatAge(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  if (!Number.isFinite(diff) || diff < 0) return '—'
  const days  = Math.floor(diff / DAY_MS)
  const hours = Math.floor(diff / HOUR_MS)
  if (days >= 1) return `${days} j`
  if (hours >= 1) return `${hours} h`
  return '< 1 h'
}

export function AdminAlerts({ groups }: AdminAlertsProps) {
  const totalAlerts = groups.reduce((sum, g) => sum + g.tickets.length, 0)

  // Ouvrir par défaut uniquement la 1ère catégorie qui contient des alertes.
  const firstWithAlerts = groups.find((g) => g.tickets.length > 0)?.key ?? null
  const [openKeys, setOpenKeys] = useState<Set<AdminAlertGroup['key']>>(
    () => new Set(firstWithAlerts ? [firstWithAlerts] : []),
  )

  const toggle = (key: AdminAlertGroup['key']) => {
    setOpenKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (totalAlerts === 0) {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-2xl">✅</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Aucune alerte
            </p>
            <h2 className="mt-0.5 font-display text-lg font-bold text-brand-ink">
              Le pipeline est sain
            </h2>
            <p className="mt-1 text-xs text-emerald-900/70">
              Aucun ticket ne dépasse les seuils de SLA configurés.
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-3">
      {/* Bandeau compteur global */}
      <div className="flex items-center justify-between gap-3 rounded-3xl border-2 border-red-400 bg-red-50 px-5 py-4">
        <div className="flex items-center gap-3">
          <span aria-hidden className="text-2xl">🚨</span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-700">
              Alertes SLA
            </p>
            <h2 className="mt-0.5 font-display text-lg font-bold text-red-900">
              {totalAlerts} ticket{totalAlerts > 1 ? 's' : ''} en alerte
            </h2>
          </div>
        </div>
        <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-red-600 px-3 text-base font-bold text-white shadow-sm">
          {totalAlerts}
        </span>
      </div>

      {/* Catégories collapsibles */}
      <div className="grid gap-3 md:grid-cols-3">
        {groups.map((g) => {
          const tone = TONE_STYLES[g.tone]
          const isOpen = openKeys.has(g.key)
          const count = g.tickets.length

          return (
            <div
              key={g.key}
              className={`rounded-2xl border ${tone.border} ${tone.bg} ring-1 ${tone.ring}`}
            >
              <button
                type="button"
                onClick={() => toggle(g.key)}
                aria-expanded={isOpen}
                aria-controls={`alert-panel-${g.key}`}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    aria-hidden
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg ${tone.emojiBg}`}
                  >
                    {g.emoji}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-brand-ink">{g.label}</p>
                    <p className="truncate text-[11px] text-brand-ink/60">{g.hint}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold ${tone.countBadge}`}
                  >
                    {count}
                  </span>
                  <svg
                    aria-hidden
                    className={`h-4 w-4 text-brand-ink/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.23 7.21a.75.75 0 011.06.02L10 11.06l3.71-3.83a.75.75 0 111.08 1.04l-4.25 4.39a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </button>

              {isOpen && (
                <div
                  id={`alert-panel-${g.key}`}
                  className="border-t border-current/10 px-3 pb-3 pt-2"
                >
                  {count === 0 ? (
                    <p className="px-2 py-3 text-xs text-brand-ink/60">
                      Aucun ticket dans cette catégorie.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {g.tickets.slice(0, 12).map((t) => {
                        const ref = t.ticket_number ?? `#${t.id.slice(0, 8).toUpperCase()}`
                        const wing = [t.product_brand, t.product_model]
                          .filter(Boolean)
                          .join(' ')
                          .trim() || 'Aile inconnue'
                        const clientName = t.contacts?.client?.name ?? 'Client inconnu'
                        const refDate = g.dateOf(t)
                        return (
                          <li key={t.id}>
                            <Link
                              href={`${g.linkPrefix}/${t.id}`}
                              className={`block rounded-xl bg-white/80 px-3 py-2 text-xs transition-colors ${tone.rowHover}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-[11px] text-slate-500">{ref}</span>
                                <span
                                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.daysBadge}`}
                                >
                                  {formatAge(refDate)}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate font-medium text-brand-ink">
                                {wing}
                              </p>
                              <div className="mt-0.5 flex items-center justify-between gap-2 text-[11px] text-brand-ink/60">
                                <span className="truncate">{clientName}</span>
                                <span className="shrink-0">{formatDate(refDate)}</span>
                              </div>
                            </Link>
                          </li>
                        )
                      })}
                      {count > 12 && (
                        <li className="px-3 pt-1 text-[11px] text-brand-ink/60">
                          + {count - 12} autre{count - 12 > 1 ? 's' : ''} ticket{count - 12 > 1 ? 's' : ''}
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
