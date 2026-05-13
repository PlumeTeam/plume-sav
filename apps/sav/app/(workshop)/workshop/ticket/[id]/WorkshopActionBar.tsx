'use client'

import { useTransition, useState } from 'react'
import { saveDiagnosisAction } from '@/features/tickets/actions'
import { formatDateTime } from '@/features/tickets/utils'

interface WorkshopActionBarProps {
  ticketId: string
  diagnosisNotes: string | null
  estimatedCost:  number | null
  estimatedHours: number | null
  partsNeeded:    string | null
}

type Feedback =
  | { type: 'ok'; savedAt: string }
  | { type: 'error'; msg: string }

/**
 * Carte unique du Diagnostic technicien : récap (chips pour heures/coût) +
 * formulaire d'édition en place. Plus de toggle, plus de composer messages
 * (la messagerie passe exclusivement par l'onglet Messages).
 */
export function WorkshopActionBar({
  ticketId,
  diagnosisNotes,
  estimatedCost,
  estimatedHours,
  partsNeeded,
}: WorkshopActionBarProps) {
  const [isPending, startTransition] = useTransition()
  const [notes, setNotes] = useState(diagnosisNotes ?? '')
  const [cost,  setCost]  = useState(estimatedCost?.toString() ?? '')
  const [hours, setHours] = useState(estimatedHours?.toString() ?? '')
  const [parts, setParts] = useState(partsNeeded ?? '')
  const [feedback, setFeedback] = useState<Feedback | null>(null)

  const hasAnyRecap =
    estimatedHours != null || estimatedCost != null

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',       ticketId)
      fd.set('diagnosisNotes', notes)
      fd.set('estimatedCost',  cost)
      fd.set('estimatedHours', hours)
      fd.set('partsNeeded',    parts)
      const result = await saveDiagnosisAction(fd)
      if (result?.error) {
        setFeedback({ type: 'error', msg: 'Erreur lors de la sauvegarde.' })
      } else {
        setFeedback({ type: 'ok', savedAt: new Date().toISOString() })
      }
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      {hasAnyRecap && (
        <div className="flex flex-wrap gap-2">
          {estimatedHours != null && (
            <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-stone">
              ⏱ {estimatedHours} h estimées
            </span>
          )}
          {estimatedCost != null && (
            <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-stone">
              💰 {estimatedCost} € estimés
            </span>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs text-slate-500">Notes de diagnostic</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="field-input resize-none"
          placeholder="Observations, causes, interventions prévues…"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-slate-500">Heures estimées</label>
          <input
            type="number" min="0" step="0.5"
            value={hours} onChange={(e) => setHours(e.target.value)}
            className="field-input" placeholder="0"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-slate-500">Coût estimé (€)</label>
          <input
            type="number" min="0" step="0.01"
            value={cost} onChange={(e) => setCost(e.target.value)}
            className="field-input" placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-slate-500">Pièces nécessaires</label>
        <textarea
          value={parts}
          onChange={(e) => setParts(e.target.value)}
          rows={2}
          className="field-input resize-none"
          placeholder="Liste des pièces…"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary w-full sm:w-auto"
        >
          {isPending ? 'Sauvegarde…' : 'Sauvegarder le diagnostic'}
        </button>
        {feedback?.type === 'ok' && (
          <p className="text-xs font-medium text-emerald-700">
            ✓ Sauvegardé le {formatDateTime(feedback.savedAt)}
          </p>
        )}
        {feedback?.type === 'error' && (
          <p className="text-xs font-medium text-red-700">{feedback.msg}</p>
        )}
      </div>
    </form>
  )
}
