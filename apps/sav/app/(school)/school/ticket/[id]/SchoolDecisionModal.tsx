'use client'

import { SchoolResolutionPanel } from './SchoolResolutionPanel'
import type { SchoolResolution } from '@/features/tickets/types'

// Modal de décision école — wrapper autour de SchoolResolutionPanel.
// Extrait du SchoolStepPanel pour réduire sa taille — le modal lui-même
// est purement présentationnel : tout l'état (resolution, escalation,
// note) vit dans SchoolResolutionPanel.
interface Props {
  ticketId:              string
  currentResolution:     SchoolResolution | null
  assignedWorkshopLabel: string | null
  isPlumeUrgent:         boolean
  onClose:               () => void
}

export function SchoolDecisionModal({
  ticketId, currentResolution, assignedWorkshopLabel, isPlumeUrgent, onClose,
}: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-modal-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
        <div className="flex items-start justify-between gap-3 border-b border-brand-stone px-5 py-4">
          <div>
            <h2 id="decision-modal-title" className="text-base font-semibold text-brand-ink">
              ⚖️ Prendre la décision
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Choisissez la suite à donner à ce ticket.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-brand-cream hover:text-brand-ink"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">
          <SchoolResolutionPanel
            ticketId={ticketId}
            currentResolution={currentResolution}
            assignedWorkshopLabel={assignedWorkshopLabel}
            isPlumeUrgent={isPlumeUrgent}
          />
        </div>
      </div>
    </div>
  )
}
