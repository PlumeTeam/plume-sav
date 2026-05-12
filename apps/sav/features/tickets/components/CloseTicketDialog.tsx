'use client'

import { useState, useTransition } from 'react'
import { closeTicketAction } from '@/features/tickets/actions'
import {
  CLOSURE_OUTCOME_OPTIONS,
  type CloserRole,
  type ClosureOutcome,
} from '@/features/tickets/types'

interface CloseTicketDialogProps {
  ticketId:  string
  ticketRef: string
  /** Rôle de l'acteur qui ouvre le dialog — sert à pré-sélectionner et
   *  à ordonner les outcomes pertinents. Non passé côté serveur :
   *  c'est getCurrentUserRoles qui fait foi pour l'autorisation. */
  closerRole: CloserRole
  open:       boolean
  onClose:    () => void
  /** Appelé après une clôture réussie (avant le close du dialog). */
  onClosed?:  () => void
}

/**
 * Modal de clôture explicite d'un ticket SAV (T7).
 *
 * Flow :
 *   1. menu  → liste des outcomes (Réparé / Résolu en consultation / …)
 *   2. note  → note libre optionnelle (obligatoire si outcome = 'other')
 *   3. confirm → résumé + bouton "Confirmer la clôture"
 *
 * La clôture est définitive : le bouton "Confirmer" appelle closeTicketAction
 * qui passe le ticket en status=completed + sav_status=closed et écrit
 * closed_by / closed_at / closure_outcome / closure_note.
 */
export function CloseTicketDialog({
  ticketId,
  ticketRef,
  closerRole,
  open,
  onClose,
  onClosed,
}: CloseTicketDialogProps) {
  const [step, setStep] = useState<'menu' | 'note' | 'confirm'>('menu')
  const [outcome, setOutcome] = useState<ClosureOutcome | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  if (!open) return null

  function reset() {
    setStep('menu')
    setOutcome(null)
    setNote('')
    setError(null)
  }

  function handleSelectOutcome(o: ClosureOutcome) {
    setOutcome(o)
    setError(null)
    // 'other' impose la note avant la confirmation
    if (o === 'other') setStep('note')
    else setStep('confirm')
  }

  function handleSubmit() {
    if (!outcome) return
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('outcome', outcome)
      if (note.trim()) fd.set('note', note.trim())
      const r = await closeTicketAction(fd)
      if (r && 'error' in r && r.error) {
        const errs = r.error as Record<string, string[] | undefined>
        const msg = errs._form?.[0] ?? errs.outcome?.[0] ?? errs.note?.[0] ?? 'Erreur lors de la clôture.'
        setError(msg)
        return
      }
      onClosed?.()
      reset()
      onClose()
    })
  }

  function handleClose() {
    if (isPending) return
    reset()
    onClose()
  }

  const selectedMeta = outcome
    ? CLOSURE_OUTCOME_OPTIONS.find((o) => o.value === outcome) ?? null
    : null

  // Ordonne les outcomes : ceux pertinents pour le rôle courant en premier.
  const sortedOptions = [...CLOSURE_OUTCOME_OPTIONS].sort((a, b) => {
    const aPrimary = a.primaryRoles.includes(closerRole) ? 0 : 1
    const bPrimary = b.primaryRoles.includes(closerRole) ? 0 : 1
    return aPrimary - bPrimary
  })

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={`Clôturer le ticket ${ticketRef}`}
    >
      <div className="w-full max-w-md rounded-3xl bg-white p-5 shadow-soft">
        <div className="mb-3 flex items-baseline justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Clôture du ticket</p>
            <p className="font-mono text-xs text-slate-500">{ticketRef}</p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="rounded-full px-2 py-1 text-sm text-slate-400 hover:bg-brand-cream disabled:opacity-50"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {error && (
          <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {step === 'menu' && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Choisissez le statut final du ticket. Cette action est définitive.
            </p>
            <ul className="space-y-1.5">
              {sortedOptions.map((opt) => {
                const isPrimary = opt.primaryRoles.includes(closerRole)
                return (
                  <li key={opt.value}>
                    <button
                      type="button"
                      onClick={() => handleSelectOutcome(opt.value)}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition-colors ${
                        isPrimary
                          ? 'border-brand-stone bg-white hover:border-brand-gold hover:bg-brand-cream'
                          : 'border-brand-stone/50 bg-brand-cream/30 hover:bg-brand-cream/60'
                      }`}
                    >
                      <span className="flex-1">
                        <span className="block text-sm font-medium text-brand-ink">{opt.label}</span>
                        <span className="block text-xs text-slate-500">{opt.description}</span>
                      </span>
                      <span aria-hidden className="text-slate-400">→</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        )}

        {step === 'note' && selectedMeta && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => { setStep('menu'); setError(null) }}
              className="text-xs text-slate-500 hover:underline"
            >
              ← Choisir un autre statut
            </button>
            <div className="rounded-2xl bg-brand-cream p-3 text-sm">
              <p className="font-medium text-brand-ink">Statut final : {selectedMeta.label}</p>
              <p className="text-xs text-slate-500">{selectedMeta.description}</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">
                Note de clôture {outcome === 'other' ? '(obligatoire)' : '(optionnelle)'}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                maxLength={2000}
                className="field-input resize-none"
                placeholder={
                  outcome === 'other'
                    ? 'Précisez la raison de la clôture…'
                    : 'Ajoutez un commentaire visible côté client (optionnel).'
                }
                required={outcome === 'other'}
                minLength={outcome === 'other' ? 3 : undefined}
              />
            </div>
            <button
              type="button"
              onClick={() => setStep('confirm')}
              disabled={outcome === 'other' && note.trim().length < 3}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continuer →
            </button>
          </div>
        )}

        {step === 'confirm' && selectedMeta && (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => { setStep(outcome === 'other' ? 'note' : 'menu'); setError(null) }}
              className="text-xs text-slate-500 hover:underline"
              disabled={isPending}
            >
              ← Modifier
            </button>
            <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">
              <p>
                Vous allez clôturer le ticket <strong>{ticketRef}</strong> avec le statut final
                : <strong>{selectedMeta.label}</strong>.
              </p>
              <p className="mt-1 text-xs">
                Cette action est définitive. Le ticket reste consultable mais ne pourra plus être
                réouvert depuis l&apos;interface.
              </p>
            </div>
            {outcome !== 'other' && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">
                  Note de clôture (optionnelle)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  className="field-input resize-none"
                  placeholder="Commentaire visible côté client (optionnel)…"
                />
              </div>
            )}
            {outcome === 'other' && note && (
              <div className="rounded-2xl bg-brand-cream p-3 text-xs">
                <p className="font-medium text-slate-600">Note :</p>
                <p className="mt-1 whitespace-pre-line text-brand-ink">{note}</p>
              </div>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Clôture en cours…' : 'Confirmer la clôture'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
