'use client'

import { useState, useTransition } from 'react'
import {
  approveReplacementAction,
  refuseReplacementAction,
} from '@/features/tickets/actions'

interface PlumeReplacementApprovalCardProps {
  ticketId: string
}

// Boutons Approuver / Refuser pour un remplacement d'aile irréparable.
// Calque PlumeShippingApprovalCard mais cible la décision Plume HQ sur le
// remplacement (colonnes plume_replacement_*).
//
// Mode "idle"     : approuver / refuser côte à côte.
// Mode "refusing" : saisie du motif + confirmer / annuler.
export function PlumeReplacementApprovalCard({ ticketId }: PlumeReplacementApprovalCardProps) {
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

  function handleApprove() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await approveReplacementAction(fd)
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
      const r = await refuseReplacementAction(fd)
      if (r && 'error' in r && r.error) {
        setError(readActionError(r.error as Record<string, unknown>))
        return
      }
      setMode('idle')
      setReason('')
    })
  }

  return (
    <div className="space-y-2">
      {mode === 'idle' && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending}
            className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
          >
            {isPending ? '…' : '✓ Valider le remplacement'}
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
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-brand-ink/80">
            Raison du refus (visible par l&apos;atelier)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Ex : Réparation encore possible — retentez un diagnostic avant de conclure à l'irréparable."
            className="w-full rounded-xl border border-brand-stone bg-white px-3 py-2 text-sm text-brand-ink focus:border-brand-gold focus:outline-none focus:ring-1 focus:ring-brand-gold"
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
        <p className="rounded-xl bg-red-100 px-3 py-2 text-xs text-red-800">{error}</p>
      )}
    </div>
  )
}
