'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  markDeepCheckDoneAction,
  markWingReturnedAction,
  markWorkshopDoneAction,
  prepareReturnShippingAction,
  revertWorkshopStepAction,
} from '@/features/tickets/actions'
import { ScanGateModal } from '@/features/tickets/components/ScanGateModal'
import { formatDateTime } from '@/features/tickets/utils'
import type {
  RequestStatus,
  WorkshopDecision,
  WorkshopRevertStep,
  WorkshopReturnDestination,
} from '@/features/tickets/types'

interface WorkshopReturnStepsProps {
  ticketId:    string
  status:      RequestStatus
  wingSerial:  string | null
  /** Décision atelier — non-null quand ce composant est monté. */
  decision:    WorkshopDecision
  // Branche réparation
  repairEstimatedDate:  string | null
  workshopRepairDoneAt: string | null
  // Branche irréparable — validation Plume HQ
  plumeReplacementApproved:      boolean | null
  plumeReplacementApprovedAt:    string | null
  plumeReplacementRefusalReason: string | null
  // Branches no_issue / replacement — contrôle approfondi
  workshopDeepCheckAt: string | null
  // Commun — ticket d'envoi + expédition
  workshopShippingPreparedAt: string | null
  workshopReturnDestination:  WorkshopReturnDestination | null
  wingReturnedAt:             string | null
}

function formatDay(iso: string | null): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return y && m && d ? `${d}/${m}/${y}` : iso
}

type CardState = 'locked' | 'active' | 'done'

export function WorkshopReturnSteps(props: WorkshopReturnStepsProps) {
  const {
    ticketId, status, wingSerial, decision,
    repairEstimatedDate, workshopRepairDoneAt,
    plumeReplacementApproved, plumeReplacementApprovedAt, plumeReplacementRefusalReason,
    workshopDeepCheckAt,
    workshopShippingPreparedAt, workshopReturnDestination, wingReturnedAt,
  } = props

  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [recipient, setRecipient] = useState<'school' | 'client'>('school')
  const [scanOpen, setScanOpen] = useState(false)

  // ── États dérivés ──────────────────────────────────────────────────────────
  const repairDone       = !!workshopRepairDoneAt
  const repairing        = status === 'workshop_repairing'
  const plumeApproved    = plumeReplacementApproved === true
  const plumeRefused     = plumeReplacementApproved === false
  const plumePending     = plumeReplacementApproved == null
  const deepCheckDone    = !!workshopDeepCheckAt
  const shippingPrepared = !!workshopShippingPreparedAt
  const wingSent         = !!wingReturnedAt

  function run(fn: () => Promise<{ error?: { _form?: string[] } } | null | undefined>) {
    setError(null)
    startTransition(async () => {
      const r = await fn()
      if (r && 'error' in r && r.error) setError(r.error._form?.[0] ?? 'Erreur')
      else router.refresh()
    })
  }

  function fd(extra: Record<string, string> = {}): FormData {
    const f = new FormData()
    f.set('ticketId', ticketId)
    for (const [k, v] of Object.entries(extra)) f.set(k, v)
    return f
  }

  function revert(step: WorkshopRevertStep, label: string) {
    if (typeof window !== 'undefined') {
      const ok = window.confirm(
        `Revenir sur l'étape « ${label} » ?\n\n` +
        `Les étapes suivantes seront ré-ouvertes. Une trace est conservée dans l'historique.`,
      )
      if (!ok) return
    }
    run(() => revertWorkshopStepAction(fd({ step })))
  }

  // ── Numérotation dynamique : la décision est l'étape 3 ──────────────────────
  let n = 3

  return (
    <>
      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      {/* ════════ Branche RÉPARATION ════════ */}
      {decision === 'repair' && (
        <>
          <StepCard
            idx={++n}
            emoji="🔧"
            title="Réparation"
            state={repairDone ? 'done' : 'active'}
            doneAt={null}
          >
            <p className="mt-0.5 text-xs text-slate-500">
              {repairEstimatedDate
                ? <>Fin de réparation estimée le <strong>{formatDay(repairEstimatedDate)}</strong>.</>
                : "Réparation engagée à l'atelier."}
            </p>
          </StepCard>

          <StepCard
            idx={++n}
            emoji="✓"
            title="Réparation terminée"
            helpText="Confirme que l'intervention est finie et l'aile prête à repartir."
            state={repairDone ? 'done' : repairing ? 'active' : 'locked'}
            doneAt={workshopRepairDoneAt}
            actionLabel="Marquer la réparation terminée"
            onAction={repairing && !repairDone ? () => run(() => markWorkshopDoneAction(fd())) : undefined}
            isPending={isPending}
            onRevert={repairDone ? () => revert('repair_done', 'Réparation terminée') : undefined}
          />
        </>
      )}

      {/* ════════ Branche IRRÉPARABLE — validation Plume HQ (sous-étape 3) ════════ */}
      {decision === 'replacement' && (
        <StepCard
          idx="🦅"
          emoji="🦅"
          title="Validation Plume HQ"
          state={plumeApproved ? 'done' : 'active'}
          doneAt={plumeApproved ? plumeReplacementApprovedAt : null}
          onRevert={plumeApproved ? () => revert('plume_validation', 'Validation Plume HQ') : undefined}
        >
          {plumePending && (
            <p className="mt-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 ring-1 ring-amber-200">
              ⏳ En attente — Plume HQ doit valider le remplacement depuis son tableau de bord.
            </p>
          )}
          {plumeRefused && (
            <p className="mt-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs text-red-800 ring-1 ring-red-200">
              🛑 Plume HQ a refusé le remplacement
              {plumeReplacementRefusalReason ? ` : ${plumeReplacementRefusalReason}` : '.'}
              {' '}Reprenez la décision atelier (bouton « Réviser » à l&apos;étape 3).
            </p>
          )}
          {plumeApproved && (
            <p className="mt-0.5 text-xs text-emerald-700">
              ✓ Remplacement validé — poursuivez le workflow.
            </p>
          )}
        </StepCard>
      )}

      {/* ════════ Étape 4 — Check approfondi (branches no_issue / replacement) ════════ */}
      {(decision === 'no_issue' || decision === 'replacement') && (() => {
        const reachable = decision === 'no_issue' ? true : plumeApproved
        const cardState: CardState = deepCheckDone ? 'done' : reachable ? 'active' : 'locked'
        return (
          <StepCard
            idx={++n}
            emoji="🔬"
            title="Check approfondi"
            helpText="Contrôle détaillé de l'aile avant expédition (checklist diagnostic dans l'onglet Diagnostic)."
            state={cardState}
            doneAt={workshopDeepCheckAt}
            actionLabel="Contrôle approfondi terminé"
            onAction={cardState === 'active' ? () => run(() => markDeepCheckDoneAction(fd())) : undefined}
            isPending={isPending}
            onRevert={deepCheckDone ? () => revert('deep_check', 'Check approfondi') : undefined}
          />
        )
      })()}

      {/* ════════ Imprimer le ticket d'envoi ════════ */}
      {(() => {
        const canPrepare =
          decision === 'repair'      ? repairDone :
          decision === 'replacement' ? (plumeApproved && deepCheckDone) :
          /* no_issue */               deepCheckDone
        const cardState: CardState = shippingPrepared ? 'done' : canPrepare ? 'active' : 'locked'
        const isPlume = decision === 'replacement'
        const destLabel =
          workshopReturnDestination === 'plume'  ? 'Plume HQ' :
          workshopReturnDestination === 'client' ? 'Client direct' :
          workshopReturnDestination === 'school' ? 'École partenaire' : '—'

        function prepare() {
          run(() => prepareReturnShippingAction(fd({ recipient: isPlume ? 'plume' : recipient })))
        }

        return (
          <StepCard
            idx={++n}
            emoji="🖨️"
            title="Imprimer le ticket d'envoi"
            helpText="Génère le bon de transport retour et fige le destinataire."
            state={cardState}
            doneAt={workshopShippingPreparedAt}
            actionLabel="Imprimer le ticket d'envoi"
            onAction={cardState === 'active' ? prepare : undefined}
            isPending={isPending}
            onRevert={shippingPrepared ? () => revert('shipping_prepared', "Ticket d'envoi") : undefined}
          >
            {cardState === 'done' && (
              <p className="mt-0.5 text-xs text-slate-500">Destination : <strong>{destLabel}</strong>.</p>
            )}
            {cardState === 'active' && isPlume && (
              <p className="mt-1 text-xs text-slate-500">
                Aile irréparable → renvoi vers <strong>Plume HQ</strong>.
              </p>
            )}
            {cardState === 'active' && !isPlume && (
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                <span className="text-slate-500">Destination&nbsp;:</span>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio" name="return-recipient" value="school"
                    checked={recipient === 'school'}
                    onChange={() => setRecipient('school')}
                    className="h-3.5 w-3.5 accent-brand-gold"
                  />
                  <span>École partenaire</span>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio" name="return-recipient" value="client"
                    checked={recipient === 'client'}
                    onChange={() => setRecipient('client')}
                    className="h-3.5 w-3.5 accent-brand-gold"
                  />
                  <span>Client direct</span>
                </label>
              </div>
            )}
          </StepCard>
        )
      })()}

      {/* ════════ Voile envoyée ════════ */}
      <StepCard
        idx={++n}
        emoji="✈️"
        title="Voile envoyée"
        helpText="Une fois le colis confié au transporteur, confirmez le départ de l'aile."
        state={wingSent ? 'done' : shippingPrepared ? 'active' : 'locked'}
        doneAt={wingReturnedAt}
        scanBadge={!wingSent}
        actionLabel="Marquer la voile envoyée"
        onAction={shippingPrepared && !wingSent ? () => setScanOpen(true) : undefined}
        onBypassScan={shippingPrepared && !wingSent ? () => run(() => markWingReturnedAction(fd())) : undefined}
        isPending={isPending}
        onRevert={wingSent ? () => revert('wing_sent', 'Voile envoyée') : undefined}
      />

      <ScanGateModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScanSuccess={() => { setScanOpen(false); run(() => markWingReturnedAction(fd())) }}
        expectedSerial={wingSerial}
        title="Avant l'expédition retour"
        subtitle="Scannez l'aile une dernière fois avant de la confier au transporteur."
      />
    </>
  )
}

// ────────────────────────────────────────────────────────────────────────────
// Carte d'étape générique (post-décision)
// ────────────────────────────────────────────────────────────────────────────
interface StepCardProps {
  idx:          number | string
  emoji:        string
  title:        string
  helpText?:    string
  state:        CardState
  doneAt:       string | null
  actionLabel?: string
  onAction?:    () => void
  onBypassScan?: () => void
  onRevert?:    () => void
  isPending?:   boolean
  scanBadge?:   boolean
  children?:    React.ReactNode
}

function StepCard({
  idx, emoji, title, helpText, state, doneAt,
  actionLabel, onAction, onBypassScan, onRevert, isPending, scanBadge, children,
}: StepCardProps) {
  const isDone   = state === 'done'
  const isActive = state === 'active'

  return (
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
          <p className={`text-sm font-semibold ${
            isDone ? 'text-slate-500 line-through decoration-emerald-500/60'
                   : isActive ? 'text-brand-ink' : 'text-slate-400'
          }`}>
            <span className="mr-1.5" aria-hidden>{emoji}</span>
            {title}
            {scanBadge && isActive && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                📷 Scan requis
              </span>
            )}
          </p>
          {helpText && <p className="mt-0.5 text-xs text-slate-500">{helpText}</p>}
          {children}
          {doneAt && isDone && (
            <p className="mt-1 text-[11px] text-emerald-700">✓ Validé le {formatDateTime(doneAt)}</p>
          )}
          {onRevert && (
            <button
              type="button"
              onClick={onRevert}
              disabled={isPending}
              className="mt-1 text-[11px] font-medium text-slate-400 underline-offset-2 hover:text-brand-gold hover:underline disabled:opacity-50"
            >
              ↩︎ Modifier
            </button>
          )}
        </div>

        {isActive && onAction && (
          <button
            type="button"
            onClick={onAction}
            disabled={isPending}
            className="btn-primary hidden shrink-0 sm:inline-flex"
          >
            {isPending ? '…' : (actionLabel ?? 'Valider')}
          </button>
        )}
      </div>

      {isActive && onAction && (
        <button
          type="button"
          onClick={onAction}
          disabled={isPending}
          className="btn-primary mt-3 w-full sm:hidden"
        >
          {isPending ? '…' : (actionLabel ?? 'Valider')}
        </button>
      )}

      {isActive && onBypassScan && (
        <button
          type="button"
          onClick={onBypassScan}
          disabled={isPending}
          className="mt-2 w-full text-center text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
        >
          Passer le scan (test)
        </button>
      )}
    </div>
  )
}
