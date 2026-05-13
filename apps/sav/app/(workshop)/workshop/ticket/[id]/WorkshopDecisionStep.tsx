'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { submitWorkshopDecisionAction } from '@/features/tickets/actions'
import { formatDateTime } from '@/features/tickets/utils'
import type { WarrantyStatus, WarrantyTier, WorkshopDecision } from '@/features/tickets/types'

interface WorkshopDecisionStepProps {
  ticketId:       string
  /** Numéro de séquence (3 après diagnostic démarré). */
  idx:            number
  /** Décision déjà enregistrée — null tant que l'étape n'est pas franchie. */
  decision:       WorkshopDecision | null
  decisionAt:     string | null
  estimatedCost:  number | null
  warrantyStatus: WarrantyStatus | null
  note:           string | null
  /** Seuil Plume (€) — utilisé pour valider l'option Réparation côté client.
   *  Pour tier='extended' on utilise thresholdExtendedEur ; pour tier=
   *  'out_of_warranty' il n'y a pas de plafond (devis libre à valider par
   *  le client). */
  thresholdEur:   number
  /** Seuil garantie étendue (généralement plus bas, ex. 150 €). */
  thresholdExtendedEur:      number
  /** Toggle HQ : la garantie étendue couvre-t-elle le remplacement ? */
  extendedCoversReplacement: boolean
  /** Tier figé sur le ticket — pilote l'UI (plafond, options disponibles,
   *  flow devis client en cas de hors garantie). */
  warrantyTier:   WarrantyTier | null
  /** True quand le ticket est dans la fenêtre de décision (workshop_diagnosing
   *  + statuts ultérieurs). Sinon l'étape reste verrouillée. */
  isReachable:    boolean
}

const DECISION_LABEL: Record<WorkshopDecision, string> = {
  no_issue:    'Pas de problème détecté',
  repair:      'Réparation',
  replacement: 'Remplacement de l\'aile',
}

const DECISION_EMOJI: Record<WorkshopDecision, string> = {
  no_issue:    '✅',
  repair:      '🔧',
  replacement: '🆕',
}

function formatEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style:    'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n)
}

export function WorkshopDecisionStep({
  ticketId,
  idx,
  decision,
  decisionAt,
  estimatedCost,
  note,
  thresholdEur,
  thresholdExtendedEur,
  extendedCoversReplacement,
  warrantyTier,
  isReachable,
}: WorkshopDecisionStepProps) {
  const [modalOpen, setModalOpen] = useState(false)

  // Plafond effectif selon le tier de garantie. 'plume_override' est traité
  // comme 'standard' (cf. spec Tâche 6). 'out_of_warranty' = pas de plafond
  // (devis libre — c'est le client qui décide via le canal de messages).
  const effectiveThreshold =
    warrantyTier === 'extended'        ? thresholdExtendedEur :
    warrantyTier === 'out_of_warranty' ? null :
    thresholdEur

  const isDone   = decision != null
  const isActive = isReachable && !isDone
  const isLocked = !isActive && !isDone

  return (
    <>
      <div
        className={`rounded-card border p-4 transition-colors ${
          isDone
            ? 'border-emerald-200 bg-emerald-50/50'
            : isActive
              ? 'border-brand-gold bg-brand-gold/5 shadow-plume'
              : 'border-brand-stone bg-white opacity-60'
        }`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${
              isDone
                ? 'bg-emerald-500 text-white'
                : isActive
                  ? 'bg-brand-gold text-white'
                  : 'bg-brand-stone text-slate-400'
            }`}
            aria-hidden
          >
            {isDone ? '✓' : idx}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-semibold ${
                isDone
                  ? 'text-slate-500 line-through decoration-emerald-500/60'
                  : isLocked
                    ? 'text-slate-400'
                    : 'text-brand-ink'
              }`}
            >
              <span className="mr-1.5" aria-hidden>🧭</span>
              Prise de décision
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {warrantyTier === 'out_of_warranty'
                ? "Hors garantie : devis libre à soumettre au client pour validation, ou remplacement (à sa charge)."
                : warrantyTier === 'extended'
                  ? `Garantie étendue : réparation couverte jusqu'à ${formatEur(thresholdExtendedEur)} HT.`
                  : `Choisir entre renvoi sans intervention, réparation (coût ≤ ${formatEur(thresholdEur)} HT) ou remplacement.`}
            </p>

            {decision && (
              <div className="mt-2 space-y-0.5 text-xs">
                <p className="text-brand-ink">
                  <span className="mr-1" aria-hidden>{DECISION_EMOJI[decision]}</span>
                  <strong>{DECISION_LABEL[decision]}</strong>
                  {decision === 'repair' && estimatedCost != null && (
                    <span className="text-slate-500"> — {formatEur(estimatedCost)}</span>
                  )}
                </p>
                {note && (
                  <p className="italic text-slate-500">« {note} »</p>
                )}
                {decisionAt && (
                  <p className="text-emerald-700">✓ Validé le {formatDateTime(decisionAt)}</p>
                )}
              </div>
            )}
          </div>

          {(isActive || isDone) && (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={`hidden shrink-0 sm:inline-flex ${
                isDone
                  ? 'rounded-full border border-brand-stone bg-white px-3 py-1.5 text-xs font-medium text-brand-ink hover:bg-brand-cream'
                  : 'btn-primary'
              }`}
            >
              {isDone ? 'Réviser' : 'Choisir la décision'}
            </button>
          )}
        </div>

        {/* Variante mobile pleine-largeur — desktop garde le bouton à droite */}
        {(isActive || isDone) && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={`mt-3 w-full sm:hidden ${
              isDone
                ? 'rounded-full border border-brand-stone bg-white px-3 py-1.5 text-xs font-medium text-brand-ink hover:bg-brand-cream'
                : 'btn-primary'
            }`}
          >
            {isDone ? 'Réviser' : 'Choisir la décision'}
          </button>
        )}
      </div>

      {modalOpen && (
        <WorkshopDecisionModal
          ticketId={ticketId}
          effectiveThreshold={effectiveThreshold}
          warrantyTier={warrantyTier}
          extendedCoversReplacement={extendedCoversReplacement}
          initialDecision={decision}
          initialCost={estimatedCost}
          initialNote={note}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Modal de décision — 3 options exclusives
// ────────────────────────────────────────────────────────────────────────────
interface ModalProps {
  ticketId:                  string
  /** Plafond Plume effectif. null = pas de plafond (hors garantie : devis
   *  libre, validation par le client). */
  effectiveThreshold:        number | null
  warrantyTier:              WarrantyTier | null
  extendedCoversReplacement: boolean
  initialDecision:           WorkshopDecision | null
  initialCost:               number | null
  initialNote:               string | null
  onClose:                   () => void
}

function WorkshopDecisionModal({
  ticketId,
  effectiveThreshold,
  warrantyTier,
  extendedCoversReplacement,
  initialDecision,
  initialCost,
  initialNote,
  onClose,
}: ModalProps) {
  const [choice, setChoice] = useState<WorkshopDecision | null>(initialDecision)
  const [costInput, setCostInput] = useState(initialCost != null ? String(initialCost) : '')
  const [note, setNote] = useState(initialNote ?? '')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isOutOfWarranty   = warrantyTier === 'out_of_warranty'
  const isExtendedTier    = warrantyTier === 'extended'
  const replacementBlocked = isExtendedTier && !extendedCoversReplacement

  // Esc ferme la modale.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const parsedCost = useMemo<number | null>(() => {
    if (costInput.trim() === '') return null
    const n = Number(costInput)
    return Number.isFinite(n) && n >= 0 ? n : null
  }, [costInput])

  // En hors garantie, il n'y a pas de plafond : le client validera le devis
  // via le canal client_workshop. Le check 'cost > seuil' n'a donc lieu
  // qu'en standard / extended / override.
  const costExceedsThreshold =
    effectiveThreshold != null && parsedCost != null && parsedCost > effectiveThreshold
  const costWithinBudget =
    effectiveThreshold != null && parsedCost != null && parsedCost <= effectiveThreshold

  // Auto-bascule vers Remplacement : seulement si Plume couvre le
  // remplacement pour ce tier (standard, override) ou si étendu+toggle.
  // Hors garantie → pas d'autoswitch (devis libre soumis au client).
  useEffect(() => {
    if (!isOutOfWarranty && !replacementBlocked && costExceedsThreshold && choice === 'repair') {
      setChoice('replacement')
    }
  }, [isOutOfWarranty, replacementBlocked, costExceedsThreshold, choice])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!choice) {
      setError('Sélectionnez une option.')
      return
    }
    if (choice === 'repair' && parsedCost == null) {
      setError('Saisissez le coût estimé HT de la réparation.')
      return
    }
    if (choice === 'repair' && costExceedsThreshold) {
      setError(`Devis refusé : coût > seuil ${formatEur(effectiveThreshold!)} HT — choisissez « Remplacement ».`)
      return
    }
    if (choice === 'replacement' && replacementBlocked) {
      setError("Plume ne couvre pas le remplacement en garantie étendue. Coordonnez avec Plume HQ pour un override.")
      return
    }

    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('decision', choice)
      if (choice === 'repair' && parsedCost != null) {
        fd.set('estimatedCost', String(parsedCost))
      }
      if (note.trim()) fd.set('note', note.trim())

      const r = await submitWorkshopDecisionAction(fd)
      if (r && 'error' in r && r.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? err.decision?.[0] ?? err.estimatedCost?.[0] ?? err.note?.[0] ?? 'Erreur lors de la sauvegarde.'
        setError(msg)
        return
      }
      onClose()
    })
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-3 sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Prise de décision atelier"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-5 shadow-soft"
      >
        <div className="flex items-baseline justify-between">
          <p className="text-base font-semibold text-brand-ink">
            <span className="mr-1.5" aria-hidden>🧭</span>
            Prise de décision
          </p>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full px-2 py-1 text-sm text-slate-400 hover:bg-brand-cream disabled:opacity-50"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Bandeau contextualisé selon le tier du ticket. */}
        {isOutOfWarranty ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs leading-relaxed text-red-900">
            <p className="font-semibold">Aile hors garantie — devis à valider par le client</p>
            <p className="mt-1 text-red-800/90">
              Pas de plafond Plume. Le coût saisi sera envoyé au client dans le
              canal de discussion ; il devra l&apos;accepter avant toute intervention.
            </p>
          </div>
        ) : isExtendedTier ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
            <p className="font-semibold">Garantie étendue</p>
            <p className="mt-1 text-amber-800/90">
              Seuil Plume : <strong>{formatEur(effectiveThreshold ?? 0)} HT</strong>.
              {' '}Remplacement {extendedCoversReplacement ? 'couvert' : (
                <span className="text-red-800"><strong>non couvert</strong> par Plume</span>
              )}.
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Seuil Plume : <strong>{formatEur(effectiveThreshold ?? 0)} HT</strong>.
            Au-delà du plafond garanti, on remplace l&apos;aile plutôt que de la réparer.
          </p>
        )}

        <fieldset className="space-y-2">
          <legend className="sr-only">Décision</legend>

          <OptionCard
            value="no_issue"
            checked={choice === 'no_issue'}
            onSelect={() => setChoice('no_issue')}
            emoji="✅"
            title="Pas de problème détecté"
            subtitle="L'aile n'a rien. On la renvoie au client directement (skip réparation)."
          />

          <OptionCard
            value="repair"
            checked={choice === 'repair'}
            onSelect={() => setChoice('repair')}
            emoji="🔧"
            title={isOutOfWarranty ? 'Devis à soumettre au client' : 'Réparation'}
            subtitle={
              isOutOfWarranty
                ? 'Saisissez le coût estimé HT. Un message sera posté dans le canal client pour validation avant intervention.'
                : 'Coût estimé HT requis. Doit rester ≤ seuil Plume HT pour valider.'
            }
          >
            {choice === 'repair' && (
              <div className="mt-2 space-y-2">
                <div>
                  <label htmlFor="decision-cost" className="block text-xs font-medium text-slate-600">
                    Coût estimé de la réparation HT (€)
                  </label>
                  <input
                    id="decision-cost"
                    type="number"
                    min="0"
                    step="1"
                    value={costInput}
                    onChange={(e) => setCostInput(e.target.value)}
                    className="field-input mt-1"
                    placeholder={effectiveThreshold != null ? `Ex. ${Math.round(effectiveThreshold / 2)}` : 'Ex. 250'}
                    inputMode="decimal"
                    autoFocus
                  />
                </div>
                {!isOutOfWarranty && costWithinBudget && (
                  <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                    ✅ Devis dans le budget — réparation autorisée
                  </p>
                )}
                {isOutOfWarranty && parsedCost != null && (
                  <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900 ring-1 ring-amber-200">
                    📨 À valider : un message sera posté au client avec le devis de {formatEur(parsedCost)} HT.
                  </p>
                )}
              </div>
            )}
          </OptionCard>

          <OptionCard
            value="replacement"
            checked={choice === 'replacement'}
            onSelect={() => { if (!replacementBlocked) setChoice('replacement') }}
            emoji="🆕"
            title="Remplacement de l'aile"
            subtitle={
              replacementBlocked
                ? 'Non couvert par Plume en garantie étendue — coordonnez avec Plume HQ pour un override.'
                : isOutOfWarranty
                  ? "Hors garantie : le client doit financer le remplacement. Plume HQ pilote la mise à disposition."
                  : "Coût > seuil, réparation impossible, ou aile irrécupérable. Plume HQ pilote la suite."
            }
            disabled={replacementBlocked}
          >
            {choice === 'replacement' && costExceedsThreshold && !replacementBlocked && (
              <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-800">
                <p className="font-bold">
                  ❌ Devis refusé — le montant dépasse le plafond garanti.
                </p>
                <p className="mt-1 font-normal text-red-700">
                  {formatEur(parsedCost!)} HT &gt; seuil {formatEur(effectiveThreshold!)} HT.
                  Une aile neuve sera envoyée au client. Le client devra nous renvoyer
                  l&apos;aile défectueuse.
                </p>
              </div>
            )}
          </OptionCard>
        </fieldset>

        <div>
          <label htmlFor="decision-note" className="mb-1 block text-xs font-medium text-slate-600">
            Note (optionnelle)
          </label>
          <textarea
            id="decision-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="field-input resize-none"
            placeholder="Contexte technique, justification…"
            maxLength={2000}
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-full border border-brand-stone bg-white px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-cream disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isPending || !choice || (choice === 'repair' && costExceedsThreshold)}
            className="btn-primary"
          >
            {isPending ? 'Enregistrement…' : 'Valider la décision'}
          </button>
        </div>
      </form>
    </div>
  )
}

interface OptionCardProps {
  value:    WorkshopDecision
  checked:  boolean
  onSelect: () => void
  emoji:    string
  title:    string
  subtitle: string
  /** Quand true, la card est grisée et le radio désactivé. */
  disabled?: boolean
  children?: React.ReactNode
}

function OptionCard({ value, checked, onSelect, emoji, title, subtitle, disabled, children }: OptionCardProps) {
  return (
    <label
      className={`flex flex-col gap-1 rounded-xl border p-3 transition-colors ${
        disabled
          ? 'cursor-not-allowed border-brand-stone bg-slate-50 opacity-60'
          : checked
            ? 'cursor-pointer border-brand-gold bg-brand-gold/10'
            : 'cursor-pointer border-brand-stone bg-white hover:bg-brand-cream/40'
      }`}
    >
      <div className="flex items-start gap-2">
        <input
          type="radio"
          name="workshop-decision"
          value={value}
          checked={checked}
          onChange={onSelect}
          disabled={disabled}
          className="mt-0.5 h-4 w-4 accent-brand-gold disabled:cursor-not-allowed"
        />
        <span className="flex-1">
          <span className="block text-sm font-medium text-brand-ink">
            <span className="mr-1.5" aria-hidden>{emoji}</span>
            {title}
          </span>
          <span className="block text-xs text-slate-500">{subtitle}</span>
        </span>
      </div>
      {children}
    </label>
  )
}
