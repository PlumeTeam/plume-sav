'use client'

import { useState, useTransition } from 'react'
import {
  approveShippingAction,
  refuseShippingAction,
} from '@/features/tickets/actions'

interface SchoolShippingApprovalCardProps {
  ticketId:              string
  /** TRUE = autorisé, FALSE = refusé, NULL = pas encore décidé. */
  shippingApproved:      boolean | null
  /** Raison renseignée par l'école lors d'un refus. */
  shippingRefusalReason: string | null
}

/**
 * Validation école de l'envoi postal du client.
 *
 * Trois états visuels :
 *  - shippingApproved === null  → CTA double (autoriser / refuser)
 *  - shippingApproved === true  → badge vert "autorisé"
 *  - shippingApproved === false → badge rouge + raison
 *
 * Affichée UNIQUEMENT pour les tickets `delivery_method='postal'` — le parent
 * (SchoolStepPanel) garantit cette condition avant de monter le composant.
 */
export function SchoolShippingApprovalCard({
  ticketId,
  shippingApproved,
  shippingRefusalReason,
}: SchoolShippingApprovalCardProps) {
  const [isPending, startTransition] = useTransition()
  const [mode, setMode]     = useState<'idle' | 'refusing'>('idle')
  const [reason, setReason] = useState('')
  const [error, setError]   = useState<string | null>(null)

  function readActionError(err: Record<string, unknown>): string {
    const formErr = err._form
    if (Array.isArray(formErr) && typeof formErr[0] === 'string') return formErr[0]
    const reasonErr = err.reason
    if (Array.isArray(reasonErr) && typeof reasonErr[0] === 'string') return reasonErr[0]
    const ticketErr = err.ticketId
    if (Array.isArray(ticketErr) && typeof ticketErr[0] === 'string') return ticketErr[0]
    return 'Erreur'
  }

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await approveShippingAction(fd)
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
      const r = await refuseShippingAction(fd)
      if (r && 'error' in r && r.error) {
        setError(readActionError(r.error as Record<string, unknown>))
        return
      }
      setMode('idle')
    })
  }

  // État décidé — résumé read-only (l'école peut revoir l'historique).
  if (shippingApproved === true) {
    return (
      <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3">
        <p className="text-sm font-semibold text-emerald-800">
          ✓ Envoi autorisé
        </p>
        <p className="mt-0.5 text-xs text-emerald-800/80">
          Le client peut générer son bon de transport depuis son tableau de bord.
        </p>
      </div>
    )
  }

  if (shippingApproved === false) {
    return (
      <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3">
        <p className="text-sm font-semibold text-red-800">
          ✕ Envoi refusé
        </p>
        {shippingRefusalReason && (
          <p className="mt-1 whitespace-pre-line text-xs text-red-800/90">
            {shippingRefusalReason}
          </p>
        )}
      </div>
    )
  }

  // État NULL — l'école doit trancher.
  return (
    <div className="mt-3 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
      <p className="text-sm font-semibold text-amber-900">
        📮 Le client souhaite envoyer son aile par la poste
      </p>
      <p className="mt-0.5 text-xs text-amber-900/80">
        Autorisez ou refusez l&apos;envoi. Le client est notifié dans son tableau de bord.
      </p>

      {mode === 'idle' && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending}
            className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? '…' : "✓ Oui, autoriser l'envoi"}
          </button>
          <button
            type="button"
            onClick={() => setMode('refusing')}
            disabled={isPending}
            className="flex-1 rounded-xl border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 disabled:opacity-60"
          >
            ✕ Non, refuser l&apos;envoi
          </button>
        </div>
      )}

      {mode === 'refusing' && (
        <div className="mt-3 space-y-2">
          <label className="block text-xs font-semibold text-amber-900">
            Raison du refus + piste de résolution
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="Ex : Apportez plutôt votre aile en main propre lundi prochain — nous l'inspecterons sur place."
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
