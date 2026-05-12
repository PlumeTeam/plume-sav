'use client'

import { useMemo, useState, useTransition } from 'react'
import { submitRepairDecisionAction } from '@/features/tickets/actions'
import { computeRepairDecision, computeWarrantyStatus, formatDate, formatDateTime } from '@/features/tickets/utils'
import type { WarrantyStatus, WorkshopDecision } from '@/features/tickets/types'

interface WorkshopRepairDecisionPanelProps {
  ticketId:               string
  /** Date d'achat ISO (purchase_date) — sert au calcul de garantie. */
  purchaseDate:           string | null
  /** Seuil en € qui fait basculer repair → replacement. */
  thresholdEur:           number
  /** Durée de garantie en mois, configurable côté Plume. */
  warrantyDurationMonths: number
  /** Décision déjà enregistrée — affichée + permet de réviser. */
  initial: {
    estimatedCost:        number | null
    decision:             WorkshopDecision | null
    warrantyStatus:       WarrantyStatus | null
    warrantyCovered:      boolean | null
    decisionAt:           string | null
    note:                 string | null
  }
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style:    'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

function decisionLabel(d: WorkshopDecision): string {
  return d === 'repair' ? 'Réparation' : 'Aile neuve (remplacement)'
}

function decisionEmoji(d: WorkshopDecision): string {
  return d === 'repair' ? '🔧' : '🆕'
}

export function WorkshopRepairDecisionPanel({
  ticketId,
  purchaseDate,
  thresholdEur,
  warrantyDurationMonths,
  initial,
}: WorkshopRepairDecisionPanelProps) {
  const [isPending, startTransition] = useTransition()
  const [costInput, setCostInput] = useState<string>(
    initial.estimatedCost != null ? String(initial.estimatedCost) : '',
  )
  const [override, setOverride] = useState<boolean>(false)
  const [note, setNote] = useState<string>(initial.note ?? '')
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)
  const [showForm, setShowForm] = useState<boolean>(initial.decision == null)

  // Statut garantie figé live (purchase_date + durée).
  const warrantyStatus = useMemo<WarrantyStatus | null>(
    () => computeWarrantyStatus(purchaseDate, warrantyDurationMonths),
    [purchaseDate, warrantyDurationMonths],
  )

  // Décision live calculée à la saisie — sert d'aperçu, la valeur autoritaire
  // reste celle figée par la Server Action en DB.
  const parsedCost = useMemo<number | null>(() => {
    if (costInput.trim() === '') return null
    const n = Number(costInput)
    return Number.isFinite(n) && n >= 0 ? n : null
  }, [costInput])

  const livePreview = useMemo(() => {
    if (parsedCost == null) return null
    return computeRepairDecision(parsedCost, thresholdEur)
  }, [parsedCost, thresholdEur])

  const isOutOfWarranty = warrantyStatus === 'out_of_warranty'
  const isUnknownWarranty = warrantyStatus === null

  // Couverture Plume prévisualisée — la Server Action recalculera.
  const previewCovered = useMemo(() => {
    if (warrantyStatus === 'under_warranty') return true
    if (isOutOfWarranty && override) return true
    return false
  }, [warrantyStatus, isOutOfWarranty, override])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFeedback(null)
    if (parsedCost == null) {
      setFeedback({ type: 'error', msg: 'Saisissez un coût valide.' })
      return
    }
    if (isOutOfWarranty && override && !note.trim()) {
      setFeedback({ type: 'error', msg: 'Justification requise pour une prise en charge hors garantie.' })
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId',         ticketId)
      fd.set('estimatedCost',    String(parsedCost))
      fd.set('warrantyOverride', String(Boolean(isOutOfWarranty && override)))
      if (note.trim()) fd.set('note', note.trim())

      const r = await submitRepairDecisionAction(fd)
      if (r && 'error' in r && r.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.note?.[0] ?? err.estimatedCost?.[0] ?? 'Erreur lors de la sauvegarde.'
        setFeedback({ type: 'error', msg })
        return
      }
      setShowForm(false)
      setFeedback({ type: 'ok', msg: 'Décision enregistrée.' })
    })
  }

  const hasDecision = initial.decision != null

  return (
    <div className="space-y-4">
      {/* Bandeau garantie — affiché en permanence pour donner le contexte. */}
      <div
        className={`rounded-card border p-3 text-sm ${
          warrantyStatus === 'under_warranty'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : isOutOfWarranty
              ? 'border-amber-200 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-slate-50 text-slate-700'
        }`}
      >
        <p className="font-medium">
          {warrantyStatus === 'under_warranty' && '✅ Sous garantie'}
          {isOutOfWarranty && '⚠️ Hors garantie'}
          {isUnknownWarranty && '❔ Garantie indéterminée'}
        </p>
        <p className="mt-1 text-xs">
          {purchaseDate
            ? <>Achat le <strong>{formatDate(purchaseDate)}</strong> — garantie {warrantyDurationMonths} mois.</>
            : <>Aucune date d&apos;achat enregistrée sur le ticket — impossible de statuer.</>}
        </p>
        {isOutOfWarranty && (
          <p className="mt-1 text-xs">
            Par défaut, <strong>Plume ne prend pas en charge</strong>. Possibilité de prise en charge exceptionnelle ci-dessous (justification obligatoire).
          </p>
        )}
      </div>

      {/* Récap décision enregistrée. */}
      {hasDecision && !showForm && (
        <div className="space-y-2 rounded-card border border-brand-stone bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-500">Décision atelier</p>
              <p className="mt-1 text-base font-semibold text-brand-ink">
                <span className="mr-1.5" aria-hidden>{decisionEmoji(initial.decision!)}</span>
                {decisionLabel(initial.decision!)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-full border border-brand-stone bg-white px-3 py-1 text-xs font-medium text-brand-ink hover:bg-brand-cream"
            >
              Réviser
            </button>
          </div>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {initial.estimatedCost != null && (
              <>
                <dt className="text-slate-500">Coût estimé</dt>
                <dd className="text-right font-medium text-brand-ink">{formatEur(initial.estimatedCost)}</dd>
              </>
            )}
            <dt className="text-slate-500">Seuil Plume</dt>
            <dd className="text-right text-brand-ink">{formatEur(thresholdEur)}</dd>
            {initial.warrantyStatus && (
              <>
                <dt className="text-slate-500">Garantie</dt>
                <dd className="text-right text-brand-ink">
                  {initial.warrantyStatus === 'under_warranty' ? 'Sous garantie' : 'Hors garantie'}
                </dd>
              </>
            )}
            <dt className="text-slate-500">Prise en charge Plume</dt>
            <dd className={`text-right font-medium ${initial.warrantyCovered ? 'text-emerald-700' : 'text-amber-700'}`}>
              {initial.warrantyCovered ? 'Oui' : 'Non'}
            </dd>
            {initial.decisionAt && (
              <>
                <dt className="text-slate-500">Le</dt>
                <dd className="text-right text-brand-ink">{formatDateTime(initial.decisionAt)}</dd>
              </>
            )}
          </dl>
          {initial.note && (
            <p className="rounded-xl bg-brand-cream p-2 text-xs italic text-brand-ink">
              « {initial.note} »
            </p>
          )}
        </div>
      )}

      {/* Formulaire — saisie ou révision. */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-card border border-brand-stone bg-brand-cream p-4">
          <div>
            <label htmlFor="estimatedCost" className="mb-1 block text-xs font-medium text-slate-600">
              Coût estimé de la réparation (€)
            </label>
            <input
              id="estimatedCost"
              type="number"
              min="0"
              step="1"
              value={costInput}
              onChange={(e) => setCostInput(e.target.value)}
              className="field-input"
              placeholder={`Ex. ${Math.round(thresholdEur / 2)}`}
              required
              inputMode="decimal"
            />
            <p className="mt-1 text-xs text-slate-500">
              Seuil Plume : <strong>{formatEur(thresholdEur)}</strong> — au-delà, on remplace l&apos;aile.
            </p>
          </div>

          {/* Aperçu décision auto */}
          {livePreview && (
            <div
              className={`rounded-xl border p-3 text-sm ${
                livePreview === 'repair'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                  : 'border-violet-200 bg-violet-50 text-violet-900'
              }`}
            >
              <p className="font-semibold">
                <span className="mr-1.5" aria-hidden>{decisionEmoji(livePreview)}</span>
                Décision auto : {decisionLabel(livePreview)}
              </p>
              <p className="mt-1 text-xs">
                {livePreview === 'repair'
                  ? `Coût ${formatEur(parsedCost!)} ≤ seuil ${formatEur(thresholdEur)} → on répare.`
                  : `Coût ${formatEur(parsedCost!)} > seuil ${formatEur(thresholdEur)} → remplacement aile neuve.`}
              </p>
            </div>
          )}

          {/* Override hors garantie */}
          {isOutOfWarranty && (
            <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <label className="flex cursor-pointer items-start gap-2 text-sm text-brand-ink">
                <input
                  type="checkbox"
                  checked={override}
                  onChange={(e) => setOverride(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-gold"
                />
                <span>
                  <strong>Prise en charge exceptionnelle Plume</strong>
                  <span className="block text-xs text-slate-600">
                    Décocher si le client paie l&apos;intégralité (hors garantie standard).
                  </span>
                </span>
              </label>
              {override && (
                <div>
                  <label htmlFor="note" className="mb-1 block text-xs font-medium text-slate-600">
                    Justification (obligatoire)
                  </label>
                  <textarea
                    id="note"
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="field-input resize-none"
                    placeholder="Geste commercial, défaut connu, fidélité…"
                    maxLength={2000}
                  />
                </div>
              )}
            </div>
          )}

          {/* Note libre pour le cas sous garantie aussi */}
          {!isOutOfWarranty && (
            <div>
              <label htmlFor="note" className="mb-1 block text-xs font-medium text-slate-600">
                Note (optionnelle)
              </label>
              <textarea
                id="note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="field-input resize-none"
                placeholder="Contexte technique ou financier…"
                maxLength={2000}
              />
            </div>
          )}

          {/* Récap couverture prévisualisée */}
          <p className="text-xs text-slate-600">
            Prise en charge Plume :{' '}
            <strong className={previewCovered ? 'text-emerald-700' : 'text-amber-700'}>
              {previewCovered ? 'oui' : 'non'}
            </strong>
            {isUnknownWarranty && ' (date d\'achat manquante — Plume HQ devra trancher manuellement)'}
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isPending || parsedCost == null}
              className="btn-primary"
            >
              {isPending ? 'Enregistrement…' : hasDecision ? 'Mettre à jour la décision' : 'Enregistrer la décision'}
            </button>
            {hasDecision && (
              <button
                type="button"
                onClick={() => { setShowForm(false); setFeedback(null) }}
                className="rounded-full border border-brand-stone bg-white px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-cream"
              >
                Annuler
              </button>
            )}
          </div>
        </form>
      )}

      {feedback && (
        <p
          role="status"
          aria-live="polite"
          className={`rounded-xl px-3 py-2 text-sm ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.msg}
        </p>
      )}
    </div>
  )
}
