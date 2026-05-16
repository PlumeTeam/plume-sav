'use client'

import { useState, useTransition } from 'react'
import {
  acceptWorkshopAssignmentAction,
  refuseWorkshopAssignmentAction,
} from '@/features/tickets/actions'

interface WorkshopAcceptancePanelProps {
  ticketId:              string
  /** TRUE = accepté, FALSE = refusé, NULL = en attente de décision. */
  workshopAccepted:      boolean | null
  /** Raison du refus déjà enregistrée. */
  workshopRefusalReason: string | null
}

/**
 * Panneau "Validation de la demande" côté atelier.
 *
 * Quand une école escalade un ticket vers l'atelier, celui-ci doit confirmer
 * qu'il accepte la demande (et qu'il est disponible) avant que l'école ne
 * génère le bon de transport. Trois états :
 *   - NULL  → CTA double (accepter / refuser + raison)
 *   - TRUE  → bandeau vert "demande acceptée"
 *   - FALSE → bandeau rouge + raison
 */
export function WorkshopAcceptancePanel({
  ticketId,
  workshopAccepted,
  workshopRefusalReason,
}: WorkshopAcceptancePanelProps) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode]     = useState<'idle' | 'refusing'>('idle')
  const [reason, setReason] = useState('')
  const [error, setError]   = useState<string | null>(null)

  function readActionError(err: Record<string, unknown>): string {
    const formErr = err._form
    if (Array.isArray(formErr) && typeof formErr[0] === 'string') return formErr[0]
    const reasonErr = err.reason
    if (Array.isArray(reasonErr) && typeof reasonErr[0] === 'string') return reasonErr[0]
    return 'Erreur'
  }

  function handleAccept() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await acceptWorkshopAssignmentAction(fd)
      if (r && 'error' in r && r.error) {
        setError(readActionError(r.error as Record<string, unknown>))
      }
    })
  }

  function handleRefuse() {
    setError(null)
    if (reason.trim().length < 10) {
      setError('Expliquez la raison du refus (10 caractères min.)')
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('reason', reason.trim())
      const r = await refuseWorkshopAssignmentAction(fd)
      if (r && 'error' in r && r.error) {
        setError(readActionError(r.error as Record<string, unknown>))
        return
      }
      setMode('idle')
    })
  }

  if (workshopAccepted === true) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-sm font-semibold text-emerald-800">
          ✓ Demande acceptée
        </p>
        <p className="mt-0.5 text-xs text-emerald-800/80">
          L&apos;école a été notifiée — elle peut vous expédier l&apos;aile.
        </p>
      </div>
    )
  }

  if (workshopAccepted === false) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-3">
        <p className="text-sm font-semibold text-red-800">
          ✕ Demande refusée
        </p>
        {workshopRefusalReason && (
          <p className="mt-1 whitespace-pre-line text-xs text-red-800/90">
            {workshopRefusalReason}
          </p>
        )}
        <p className="mt-1.5 text-xs text-red-800/80">
          L&apos;école va réorienter la demande vers un autre atelier.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
      <p className="text-sm font-semibold text-amber-900">
        🛠️ Nouvelle demande à valider
      </p>
      <p className="mt-0.5 text-xs text-amber-900/80">
        Confirmez que vous acceptez cette demande et que vous êtes disponible.
        Tant que vous n&apos;avez pas répondu, l&apos;école ne peut pas vous
        envoyer l&apos;aile.
      </p>

      {mode === 'idle' && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleAccept}
            disabled={isPending}
            className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? '…' : '✓ Accepter la demande'}
          </button>
          <button
            type="button"
            onClick={() => setMode('refusing')}
            disabled={isPending}
            className="flex-1 rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-60"
          >
            ✕ Refuser
          </button>
        </div>
      )}

      {mode === 'refusing' && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-semibold text-amber-900">
            Raison du refus (visible par l&apos;école)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Ex : Plan de charge complet jusqu'à fin juin — orientez vers un autre atelier du réseau."
            className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-sm text-brand-ink focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleRefuse}
              disabled={isPending}
              className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? '…' : 'Confirmer le refus'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('idle'); setReason(''); setError(null) }}
              disabled={isPending}
              className="rounded-xl border border-brand-stone bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-brand-cream"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="mt-2 rounded-xl bg-red-100 px-3 py-2 text-xs text-red-800">
          {error}
        </p>
      )}
    </div>
  )
}
