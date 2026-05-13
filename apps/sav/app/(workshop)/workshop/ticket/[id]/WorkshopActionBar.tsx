'use client'

import { useTransition, useState } from 'react'
import { saveDiagnosisAction } from '@/features/tickets/actions'

interface WorkshopActionBarProps {
  ticketId: string
  diagnosisNotes: string | null
  estimatedCost:  number | null
  estimatedHours: number | null
  partsNeeded:    string | null
}

/**
 * Panneau de saisie du diagnostic atelier — toujours édit, pré-rempli avec les
 * valeurs sauvegardées. C'est la source unique de vérité : pas de carte récap
 * séparée, les champs eux-mêmes montrent l'état courant.
 *
 * Anciennement, ce composant contenait aussi un composer de messages avec
 * picker d'audience (all / workshop_plume / plume_only). Supprimé : la
 * messagerie passe par `TicketChannelSwitch` (canaux Client / École) dans
 * l'onglet Messages, qui gère déjà la visibilité par canal.
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
  const [feedback, setFeedback] = useState<{ type: 'error' | 'ok'; msg: string } | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',        ticketId)
      fd.set('diagnosisNotes',  notes)
      fd.set('estimatedCost',   cost)
      fd.set('estimatedHours',  hours)
      fd.set('partsNeeded',     parts)
      const result = await saveDiagnosisAction(fd)
      if (result?.error) {
        setFeedback({ type: 'error', msg: 'Erreur sauvegarde.' })
      } else {
        setFeedback({ type: 'ok', msg: '✓ Diagnostic sauvegardé.' })
        setTimeout(() => setFeedback(null), 2000)
      }
    })
  }

  return (
    <form onSubmit={handleSave} className="space-y-3">
      <div>
        <label htmlFor="ws-notes" className="mb-1 block text-xs text-slate-500">
          Notes de diagnostic
        </label>
        <textarea
          id="ws-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="field-input resize-none"
          placeholder="Observations, causes, interventions prévues…"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="ws-hours" className="mb-1 block text-xs text-slate-500">
            Heures estimées
          </label>
          <input
            id="ws-hours"
            type="number" min="0" step="0.5"
            value={hours} onChange={(e) => setHours(e.target.value)}
            className="field-input" placeholder="0"
          />
        </div>
        <div>
          <label htmlFor="ws-cost" className="mb-1 block text-xs text-slate-500">
            Coût estimé (€)
          </label>
          <input
            id="ws-cost"
            type="number" min="0" step="0.01"
            value={cost} onChange={(e) => setCost(e.target.value)}
            className="field-input" placeholder="0.00"
          />
        </div>
      </div>
      <div>
        <label htmlFor="ws-parts" className="mb-1 block text-xs text-slate-500">
          Pièces nécessaires
        </label>
        <textarea
          id="ws-parts"
          value={parts}
          onChange={(e) => setParts(e.target.value)}
          rows={2}
          className="field-input resize-none"
          placeholder="Liste des pièces…"
        />
      </div>
      {feedback && (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
          role={feedback.type === 'error' ? 'alert' : undefined}
        >
          {feedback.msg}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="btn-primary w-full sm:w-auto"
      >
        {isPending ? 'Sauvegarde…' : 'Sauvegarder le diagnostic'}
      </button>
    </form>
  )
}
