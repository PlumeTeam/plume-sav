import {
  CLOSER_ROLE_LABELS,
  CLOSURE_OUTCOME_LABELS,
  type CloserRole,
  type ClosureOutcome,
} from '@/features/tickets/types'
import { formatDateTime } from '@/features/tickets/utils'

interface TicketClosureCardProps {
  closedAt:       string | null
  closedByRole:   CloserRole | null
  closureOutcome: ClosureOutcome | null
  closureNote:    string | null
}

/**
 * Bandeau affiché en tête du ticket quand celui-ci a été clôturé (T7).
 * Indique le statut final, l'acteur qui a clôturé et la date.
 *
 * Server Component — pas d'état interne, juste un rendu read-only.
 * Affiché côté client / école / atelier / Plume HQ — l'info est publique.
 * Renvoie null si le ticket n'est pas clôturé (caller-friendly).
 */
export function TicketClosureCard({
  closedAt,
  closedByRole,
  closureOutcome,
  closureNote,
}: TicketClosureCardProps) {
  if (!closedAt || !closedByRole || !closureOutcome) return null

  const outcomeLabel = CLOSURE_OUTCOME_LABELS[closureOutcome]
  const roleLabel    = CLOSER_ROLE_LABELS[closedByRole]

  return (
    <section className="card border-2 border-emerald-200 bg-emerald-50/60 p-5">
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-2xl">🎉</span>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
            Ticket clôturé
          </p>
          <p className="mt-0.5 text-base font-semibold text-emerald-900">
            Statut final : {outcomeLabel}
          </p>
          <p className="mt-1 text-xs text-emerald-800/80">
            Clôturé par {roleLabel} · {formatDateTime(closedAt)}
          </p>
          {closureNote && (
            <p className="mt-3 whitespace-pre-line rounded-xl bg-white/70 px-3 py-2 text-sm text-emerald-900">
              {closureNote}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
