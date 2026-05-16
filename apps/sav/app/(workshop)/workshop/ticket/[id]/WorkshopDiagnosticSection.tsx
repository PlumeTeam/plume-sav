'use client'

import { useState } from 'react'
import { WorkshopDiagnosticChecklist } from '@/features/tickets/components/WorkshopDiagnosticChecklist'
import { WorkshopCheckSummary } from '@/features/tickets/inspection/WorkshopCheckSummary'
import type { WorkshopChecklistPayload } from '@/features/tickets/workshop-checklist'

interface Props {
  ticketId:             string
  payload:              WorkshopChecklistPayload
  defaultInspectorName: string
  /** Vrai si le checklist a déjà été saisi — décide résumé vs éditeur. */
  isFilled:             boolean
}

/**
 * Colonne « Diagnostic atelier » de la vue comparative :
 *  - checklist vide      → formulaire éditeur (l'atelier saisit son diagnostic).
 *  - checklist rempli    → résumé read-only + bouton « Modifier » qui révèle
 *                          le formulaire éditeur (avec retour au résumé).
 */
export function WorkshopDiagnosticSection({ ticketId, payload, defaultInspectorName, isFilled }: Props) {
  const [editing, setEditing] = useState(false)

  if (!isFilled || editing) {
    return (
      <div className="space-y-3">
        {isFilled && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="text-xs font-semibold text-brand-gold hover:underline"
          >
            ← Revenir au résumé
          </button>
        )}
        <WorkshopDiagnosticChecklist
          ticketId={ticketId}
          initial={payload}
          defaultInspectorName={defaultInspectorName}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded-xl border border-brand-stone bg-white px-3 py-1.5 text-xs font-semibold text-brand-ink hover:border-brand-gold/40"
        >
          ✏️ Modifier le diagnostic
        </button>
      </div>
      <WorkshopCheckSummary payload={payload} />
    </div>
  )
}
