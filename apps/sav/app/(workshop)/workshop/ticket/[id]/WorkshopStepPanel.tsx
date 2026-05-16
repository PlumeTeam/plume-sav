'use client'

import { useState, useTransition } from 'react'
import {
  finishWorkshopPreCheckAction,
  markWingReceivedWorkshopAction,
  startWorkshopDiagnosisAction,
  startWorkshopPreCheckAction,
} from '@/features/tickets/actions'
import { ScanGateModal } from '@/features/tickets/components/ScanGateModal'
import { RevertStepLink } from '@/features/tickets/components/RevertStepLink'
import { formatDateTime, statusGte } from '@/features/tickets/utils'
import type {
  RequestStatus,
  WarrantyStatus,
  WarrantyTier,
  WorkshopDecision,
  WorkshopReturnDestination,
} from '@/features/tickets/types'
import { WorkshopDecisionStep } from './WorkshopDecisionStep'
import { WorkshopReturnSteps } from './WorkshopReturnSteps'

interface WorkshopStepPanelProps {
  ticketId:                string
  status:                  RequestStatus
  /** N° de série de l'aile, pour vérification au scan flashcode. */
  wingSerial:              string | null
  wingReceivedWorkshopAt:  string | null
  preCheckStartedAt:       string | null
  preCheckCompletedAt:     string | null
  preCheckFeeEurConfig:    number
  workshopDiagnosisAt:     string | null
  workshopRepairDoneAt:    string | null
  wingReturnedAt:          string | null
  // Étape "Prise de décision"
  workshopDecision:                  WorkshopDecision | null
  workshopDecisionAt:                string | null
  workshopEstimatedRepairCost:       number | null
  workshopDecisionWarrantyStatus:    WarrantyStatus | null
  workshopDecisionNote:              string | null
  /** Branche réparation — date de fin estimée. */
  workshopRepairEstimatedDate:       string | null
  /** Branche irréparable — validation Plume HQ. */
  plumeReplacementApproved:          boolean | null
  plumeReplacementApprovedAt:        string | null
  plumeReplacementRefusalReason:     string | null
  /** Commun — ticket d'envoi + destination. */
  workshopShippingPreparedAt:        string | null
  workshopReturnDestination:         WorkshopReturnDestination | null
  /** Seuils Plume pour la modal de décision. */
  repairReplacementThresholdEur:     number
  repairThresholdExtendedEur:        number
  extendedCoversReplacement:         boolean
  warrantyTier:                      WarrantyTier | null
}

// Seule étape pilotée par statut hors triage : la réception de l'aile.
type ScanGateKey = 'received' | 'diagnose_direct'

export function WorkshopStepPanel(props: WorkshopStepPanelProps) {
  const {
    ticketId,
    status,
    wingSerial,
    wingReceivedWorkshopAt,
    preCheckStartedAt,
    preCheckCompletedAt,
    preCheckFeeEurConfig,
    workshopDiagnosisAt,
    workshopRepairDoneAt,
    wingReturnedAt,
    workshopDecision,
    workshopDecisionAt,
    workshopEstimatedRepairCost,
    workshopDecisionNote,
    workshopRepairEstimatedDate,
    plumeReplacementApproved,
    plumeReplacementApprovedAt,
    plumeReplacementRefusalReason,
    workshopShippingPreparedAt,
    workshopReturnDestination,
    repairReplacementThresholdEur,
    repairThresholdExtendedEur,
    extendedCoversReplacement,
    warrantyTier,
  } = props

  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ msg: string } | null>(null)
  const [scanGateFor, setScanGateFor] = useState<ScanGateKey | null>(null)

  // Pré-check : observations + état UI (form ouvert/fermé)
  const [preCheckOpen, setPreCheckOpen] = useState(false)
  const [observations, setObservations] = useState('')

  function showError(msg: string) { setFeedback({ msg }) }
  function clearError() { setFeedback(null) }

  function readErr(r: unknown): string {
    const err = (r as { error?: Record<string, string[] | undefined> } | null)?.error
    return err?._form?.[0] ?? 'Erreur'
  }

  function executeReceived() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await markWingReceivedWorkshopAction(fd)
      if (r && 'error' in r && r.error) showError(readErr(r))
      else clearError()
    })
  }

  function executeDiagnoseDirect() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await startWorkshopDiagnosisAction(fd)
      if (r && 'error' in r && r.error) showError(readErr(r))
      else clearError()
    })
  }

  function handleStartPreCheck() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await startWorkshopPreCheckAction(fd)
      if (r && 'error' in r && r.error) {
        const flat = r.error as Record<string, string[] | undefined>
        showError(flat._form?.[0] ?? flat.ticketId?.[0] ?? 'Erreur')
      } else {
        setPreCheckOpen(true)
        clearError()
      }
    })
  }

  function handleFinishPreCheck(e: React.FormEvent) {
    e.preventDefault()
    if (observations.trim().length < 10) {
      showError('Observations trop courtes (10 caractères min)')
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('observations', observations.trim())
      const r = await finishWorkshopPreCheckAction(fd)
      if (r && 'error' in r && r.error) {
        const flat = r.error as Record<string, string[] | undefined>
        showError(flat._form?.[0] ?? flat.observations?.[0] ?? 'Erreur')
      } else {
        setPreCheckOpen(false)
        setObservations('')
        clearError()
      }
    })
  }

  function handleScanSuccess() {
    const k = scanGateFor
    setScanGateFor(null)
    if (k === 'diagnose_direct') executeDiagnoseDirect()
    else if (k === 'received') executeReceived()
  }

  const SCAN_META: Record<ScanGateKey, { title: string; subtitle: string }> = {
    received: {
      title:    "Réception de l'aile",
      subtitle: "Scannez le QR cousu sur l'aile (ou sur le sac) pour confirmer la réception à l'atelier.",
    },
    diagnose_direct: {
      title:    'Avant le diagnostic',
      subtitle: "Scannez l'aile pour démarrer le diagnostic sur le bon ticket.",
    },
  }
  const activeScanMeta = scanGateFor ? SCAN_META[scanGateFor] : null

  // Ticket pas encore dans le pipeline atelier.
  if (!statusGte(status, 'pending_workshop')) {
    return (
      <div className="rounded-card border border-brand-stone bg-brand-cream p-4 text-sm text-slate-600">
        L&apos;école n&apos;a pas encore escaladé ce ticket vers l&apos;atelier.
        Les étapes apparaîtront ici dès qu&apos;elle aura confié l&apos;aile.
      </div>
    )
  }

  const receivedDone = statusGte(status, 'wing_received_workshop')
  const receivedActive =
    !receivedDone && (status === 'pending_workshop' || status === 'escalated_to_workshop')

  const hasPreCheckStarted = status === 'workshop_pre_checking' || !!preCheckStartedAt
  const preCheckIsCurrent  = status === 'workshop_pre_checking'
  const diagnosisDone      = statusGte(status, 'workshop_diagnosing') && status !== 'workshop_pre_checking'

  return (
    <>
      <div className="space-y-3">
        {feedback && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{feedback.msg}</p>
        )}

        {/* Étape 1 — Aile reçue */}
        <div
          className={`rounded-card border p-4 transition-colors ${
            receivedDone
              ? 'border-emerald-200 bg-emerald-50/50'
              : receivedActive
                ? 'border-brand-gold bg-brand-gold/5 shadow-plume'
                : 'border-brand-stone bg-white opacity-60'
          }`}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                receivedDone ? 'bg-emerald-500 text-white' : 'bg-brand-gold text-white'
              }`}
              aria-hidden
            >
              {receivedDone ? '✓' : 1}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${receivedDone ? 'text-slate-500 line-through decoration-emerald-500/60' : 'text-brand-ink'}`}>
                <span className="mr-1.5" aria-hidden>🏭</span>
                Aile reçue
                {!receivedDone && (
                  <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                    📷 Scan requis
                  </span>
                )}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                À cliquer dès que le colis / l&apos;aile arrive à l&apos;atelier.
              </p>
              {wingReceivedWorkshopAt && receivedDone && (
                <p className="mt-1 text-[11px] text-emerald-700">
                  ✓ Validé le {formatDateTime(wingReceivedWorkshopAt)}
                </p>
              )}
              {receivedDone && (
                <RevertStepLink
                  ticketId={ticketId}
                  targetStatus="wing_received_workshop"
                  stepLabel="Aile reçue"
                />
              )}
            </div>
            {receivedActive && (
              <button
                type="button"
                onClick={() => setScanGateFor('received')}
                disabled={isPending}
                className="btn-primary hidden shrink-0 sm:inline-flex"
              >
                {isPending ? '…' : 'Aile reçue'}
              </button>
            )}
          </div>
          {receivedActive && (
            <>
              <button
                type="button"
                onClick={() => setScanGateFor('received')}
                disabled={isPending}
                className="btn-primary mt-3 w-full sm:hidden"
              >
                {isPending ? '…' : 'Aile reçue'}
              </button>
              <button
                type="button"
                onClick={executeReceived}
                disabled={isPending}
                className="mt-2 w-full text-center text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
              >
                Passer le scan (test)
              </button>
            </>
          )}
        </div>

        {/* Branche triage post-réception */}
        {status === 'wing_received_workshop' && !hasPreCheckStarted && (
          <div className="rounded-card border border-brand-gold bg-brand-gold/5 p-4 shadow-plume">
            <p className="text-sm font-semibold text-brand-ink">
              <span className="mr-1.5" aria-hidden>🧭</span>
              Quelle est la prochaine étape&nbsp;?
            </p>
            <p className="mt-1 text-xs text-slate-600">
              À la réception, indique si le problème est évident ou s&apos;il faut
              un pré-check rapide (~1h, facturé {preCheckFeeEurConfig} € à Plume).
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setScanGateFor('diagnose_direct')}
                disabled={isPending}
                className="btn-primary text-sm"
              >
                🎯 Problème évident → diagnostic
              </button>
              <button
                type="button"
                onClick={handleStartPreCheck}
                disabled={isPending}
                className="btn-secondary text-sm"
              >
                🔎 Pas clair → démarrer pré-check
              </button>
            </div>
            <button
              type="button"
              onClick={executeDiagnoseDirect}
              disabled={isPending}
              className="mt-2 w-full text-center text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
            >
              Passer le scan & démarrer diagnostic (test)
            </button>
          </div>
        )}

        {/* Carte pré-check */}
        {hasPreCheckStarted && (
          <div
            className={`rounded-card border p-4 ${
              preCheckIsCurrent
                ? 'border-brand-gold bg-brand-gold/5 shadow-plume'
                : 'border-emerald-200 bg-emerald-50/50'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                  preCheckIsCurrent ? 'bg-brand-gold text-white' : 'bg-emerald-500 text-white'
                }`}
                aria-hidden
              >
                {preCheckIsCurrent ? '⏱' : '✓'}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${preCheckIsCurrent ? 'text-brand-ink' : 'text-slate-500'}`}>
                  <span className="mr-1.5" aria-hidden>🔎</span>
                  Pré-check ({preCheckFeeEurConfig} € facturés à Plume)
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Durée &lt; 1 h. Documente les observations pour décider la suite.
                </p>
                {preCheckStartedAt && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    Démarré le {formatDateTime(preCheckStartedAt)}
                  </p>
                )}
                {preCheckCompletedAt && (
                  <p className="mt-0.5 text-[11px] text-emerald-700">
                    ✓ Terminé le {formatDateTime(preCheckCompletedAt)}
                  </p>
                )}
              </div>
              {preCheckIsCurrent && !preCheckOpen && (
                <button
                  type="button"
                  onClick={() => setPreCheckOpen(true)}
                  disabled={isPending}
                  className="btn-primary hidden shrink-0 sm:inline-flex"
                >
                  Clôturer le pré-check
                </button>
              )}
            </div>

            {preCheckIsCurrent && !preCheckOpen && (
              <button
                type="button"
                onClick={() => setPreCheckOpen(true)}
                disabled={isPending}
                className="btn-primary mt-3 w-full sm:hidden"
              >
                Clôturer le pré-check
              </button>
            )}

            {preCheckIsCurrent && preCheckOpen && (
              <form onSubmit={handleFinishPreCheck} className="mt-3 space-y-2">
                <label className="block text-xs font-medium text-slate-600">Observations</label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={4}
                  maxLength={5000}
                  placeholder="Ce que vous avez constaté pendant le pré-check (état général, déformations, suspentes, etc.)…"
                  className="field-input resize-none"
                  required
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isPending || observations.trim().length < 10}
                    className="btn-primary flex-1"
                  >
                    {isPending ? '…' : 'Terminer & démarrer diagnostic'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreCheckOpen(false)}
                    className="btn-secondary"
                    disabled={isPending}
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Étape 2 — diagnostic démarré */}
        {diagnosisDone && (
          <div className="flex items-start gap-4 rounded-card border border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-base font-bold text-white" aria-hidden>
              ✓
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-500 line-through decoration-emerald-500/60">
                <span className="mr-1.5" aria-hidden>🔬</span>
                Diagnostic démarré
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                Remplissez la checklist diagnostic et notez le devis dans la section dédiée.
              </p>
              {workshopDiagnosisAt && (
                <p className="mt-1 text-[11px] text-emerald-700">
                  ✓ Validé le {formatDateTime(workshopDiagnosisAt)}
                </p>
              )}
              <RevertStepLink
                ticketId={ticketId}
                targetStatus="workshop_diagnosing"
                stepLabel="Diagnostic démarré"
              />
            </div>
          </div>
        )}

        {/* Étape 3 — Prise de décision */}
        {diagnosisDone && (
          <WorkshopDecisionStep
            ticketId={ticketId}
            idx={3}
            decision={workshopDecision}
            decisionAt={workshopDecisionAt}
            estimatedCost={workshopEstimatedRepairCost}
            warrantyStatus={props.workshopDecisionWarrantyStatus}
            note={workshopDecisionNote}
            thresholdEur={repairReplacementThresholdEur}
            thresholdExtendedEur={repairThresholdExtendedEur}
            extendedCoversReplacement={extendedCoversReplacement}
            warrantyTier={warrantyTier}
            isReachable={diagnosisDone}
            repairEstimatedDate={workshopRepairEstimatedDate}
            plumeReplacementApproved={plumeReplacementApproved}
            plumeReplacementRefusalReason={plumeReplacementRefusalReason}
          />
        )}

        {/* Étapes 4+ — sous-pipeline post-décision (3 branches) */}
        {diagnosisDone && workshopDecision && (
          <WorkshopReturnSteps
            ticketId={ticketId}
            status={status}
            wingSerial={wingSerial}
            decision={workshopDecision}
            repairEstimatedDate={workshopRepairEstimatedDate}
            workshopRepairDoneAt={workshopRepairDoneAt}
            plumeReplacementApproved={plumeReplacementApproved}
            plumeReplacementApprovedAt={plumeReplacementApprovedAt}
            plumeReplacementRefusalReason={plumeReplacementRefusalReason}
            workshopShippingPreparedAt={workshopShippingPreparedAt}
            workshopReturnDestination={workshopReturnDestination}
            wingReturnedAt={wingReturnedAt}
          />
        )}
      </div>

      <ScanGateModal
        open={scanGateFor !== null}
        onClose={() => setScanGateFor(null)}
        onScanSuccess={handleScanSuccess}
        expectedSerial={wingSerial}
        title={activeScanMeta?.title ?? 'Scan flashcode'}
        subtitle={activeScanMeta?.subtitle ?? ''}
      />
    </>
  )
}
