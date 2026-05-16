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
  /** Étape "Check approfondi" (branches no_issue / replacement). */
  workshopDeepCheckAt:               string | null
  /** Étape "Imprimer le ticket d'envoi" + destination. */
  workshopShippingPreparedAt:        string | null
  workshopReturnDestination:         WorkshopReturnDestination | null
  /** Seuils Plume pour la modal de décision. */
  repairReplacementThresholdEur:     number
  repairThresholdExtendedEur:        number
  extendedCoversReplacement:         boolean
  warrantyTier:                      WarrantyTier | null
}

export function WorkshopStepPanel(props: WorkshopStepPanelProps) {
  const {
    ticketId,
    status,
    wingSerial,
    wingReceivedWorkshopAt,
    preCheckStartedAt,
    preCheckCompletedAt,
    preCheckFeeEurConfig,
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
    workshopDeepCheckAt,
    workshopShippingPreparedAt,
    workshopReturnDestination,
    repairReplacementThresholdEur,
    repairThresholdExtendedEur,
    extendedCoversReplacement,
    warrantyTier,
  } = props

  const [isPending, startTransition] = useTransition()
  const [feedback, setFeedback] = useState<{ msg: string } | null>(null)
  const [scanOpen, setScanOpen] = useState(false)

  // Pré-check : observations + état UI (form ouvert/fermé)
  const [preCheckFormOpen, setPreCheckFormOpen] = useState(false)
  const [observations, setObservations] = useState('')

  function showError(msg: string) { setFeedback({ msg }) }
  function clearError() { setFeedback(null) }

  function readErr(r: unknown): string {
    const err = (r as { error?: Record<string, string[] | undefined> } | null)?.error
    return err?._form?.[0] ?? err?.observations?.[0] ?? err?.ticketId?.[0] ?? 'Erreur'
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

  // Pré-check « Non » → diagnostic direct (pas de pré-check).
  function skipPreCheck() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await startWorkshopDiagnosisAction(fd)
      if (r && 'error' in r && r.error) showError(readErr(r))
      else clearError()
    })
  }

  // Pré-check « Oui » → ouvre la checklist de pré-check.
  function startPreCheck() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await startWorkshopPreCheckAction(fd)
      if (r && 'error' in r && r.error) showError(readErr(r))
      else { setPreCheckFormOpen(true); clearError() }
    })
  }

  // Clôture du pré-check — `skip` = checklist passée (observations vides OK).
  function finishPreCheck(skip: boolean) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      if (!skip && observations.trim()) fd.set('observations', observations.trim())
      const r = await finishWorkshopPreCheckAction(fd)
      if (r && 'error' in r && r.error) showError(readErr(r))
      else { setPreCheckFormOpen(false); setObservations(''); clearError() }
    })
  }

  // Ticket pas encore dans le pipeline atelier.
  if (!statusGte(status, 'pending_workshop')) {
    return (
      <div className="rounded-card border border-brand-stone bg-brand-cream p-4 text-sm text-slate-600">
        L&apos;école n&apos;a pas encore escaladé ce ticket vers l&apos;atelier.
        Les étapes apparaîtront ici dès qu&apos;elle aura confié l&apos;aile.
      </div>
    )
  }

  const receivedDone   = statusGte(status, 'wing_received_workshop')
  const receivedActive = !receivedDone && (status === 'pending_workshop' || status === 'escalated_to_workshop')

  // Étape 2 — Pré-check.
  const preCheckQuestion   = status === 'wing_received_workshop'   // doit choisir oui/non
  const preCheckInProgress = status === 'workshop_pre_checking'
  const preCheckResolved   = statusGte(status, 'workshop_diagnosing')
  const preCheckWasRun     = !!preCheckStartedAt
  // Verrouillée tant que l'aile n'est pas reçue : la carte reste visible mais grisée.
  const preCheckLocked     = !receivedDone
  const preCheckActive     = preCheckQuestion || preCheckInProgress

  const diagnosisDone = preCheckResolved

  return (
    <>
      <div className="space-y-3">
        {feedback && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{feedback.msg}</p>
        )}

        {/* ════════ Étape 1 — Aile reçue ════════ */}
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
                <RevertStepLink ticketId={ticketId} targetStatus="wing_received_workshop" stepLabel="Aile reçue" />
              )}
            </div>
            {receivedActive && (
              <button
                type="button"
                onClick={() => setScanOpen(true)}
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
                onClick={() => setScanOpen(true)}
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

        {/* ════════ Étape 2 — Pré-check (toujours visible, verrouillée avant réception) ════════ */}
        <div
          className={`rounded-card border p-4 transition-colors ${
            preCheckResolved
              ? 'border-emerald-200 bg-emerald-50/50'
              : preCheckActive
                ? 'border-brand-gold bg-brand-gold/5 shadow-plume'
                : 'border-brand-stone bg-white opacity-60'
          }`}
        >
          <div className="flex items-start gap-3 sm:gap-4">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${
                preCheckResolved
                  ? 'bg-emerald-500 text-white'
                  : preCheckActive
                    ? 'bg-brand-gold text-white'
                    : 'bg-brand-stone text-slate-400'
              }`}
              aria-hidden
            >
              {preCheckResolved ? '✓' : 2}
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-sm font-semibold ${
                preCheckResolved
                  ? 'text-slate-500 line-through decoration-emerald-500/60'
                  : preCheckLocked
                    ? 'text-slate-400'
                    : 'text-brand-ink'
              }`}>
                <span className="mr-1.5" aria-hidden>🔎</span>
                Pré-check
              </p>

              {/* État : verrouillé (aile pas encore reçue) */}
              {preCheckLocked && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Disponible dès la réception de l&apos;aile à l&apos;atelier.
                </p>
              )}

              {/* État : question oui / non */}
              {preCheckQuestion && (
                <p className="mt-0.5 text-xs text-slate-500">
                  Un pré-check est-il nécessaire&nbsp;? Si oui (~1 h, facturé{' '}
                  {preCheckFeeEurConfig} € à Plume), vous remplissez la checklist.
                  Sinon, on passe directement à la prise de décision.
                </p>
              )}

              {/* État : résolu (effectué ou non) */}
              {preCheckResolved && (
                <p className="mt-0.5 text-xs text-slate-500">
                  {preCheckWasRun ? 'Pré-check effectué.' : 'Pré-check jugé non nécessaire.'}
                </p>
              )}
              {preCheckResolved && preCheckCompletedAt && (
                <p className="mt-1 text-[11px] text-emerald-700">
                  ✓ Clôturé le {formatDateTime(preCheckCompletedAt)}
                </p>
              )}
              {preCheckResolved && (
                <RevertStepLink ticketId={ticketId} targetStatus="wing_received_workshop" stepLabel="Pré-check" />
              )}
            </div>
          </div>

          {/* Boutons oui / non */}
          {preCheckQuestion && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={startPreCheck} disabled={isPending} className="btn-primary text-sm">
                🔎 Oui — faire un pré-check
              </button>
              <button type="button" onClick={skipPreCheck} disabled={isPending} className="btn-secondary text-sm">
                ⏭️ Non — passer à la décision
              </button>
            </div>
          )}

          {/* Pré-check en cours : checklist d'observations (skippable) */}
          {preCheckInProgress && !preCheckFormOpen && (
            <button
              type="button"
              onClick={() => setPreCheckFormOpen(true)}
              disabled={isPending}
              className="btn-primary mt-3 w-full"
            >
              Remplir la checklist de pré-check
            </button>
          )}
          {preCheckInProgress && preCheckFormOpen && (
            <div className="mt-3 space-y-2">
              <label className="block text-xs font-medium text-slate-600">
                Observations du pré-check <span className="text-slate-400">(optionnel)</span>
              </label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="État général, déformations, suspentes… (laissez vide pour passer la checklist)"
                className="field-input resize-none"
              />
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => finishPreCheck(false)}
                  disabled={isPending}
                  className="btn-primary flex-1"
                >
                  {isPending ? '…' : 'Terminer le pré-check'}
                </button>
                <button
                  type="button"
                  onClick={() => finishPreCheck(true)}
                  disabled={isPending}
                  className="btn-secondary"
                >
                  Passer la checklist
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ════════ Étape 3 — Prise de décision (toujours visible, verrouillée avant diagnostic) ════════ */}
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

        {/* ════════ Étapes 4-7 — sous-pipeline post-décision (toujours visible, verrouillé
            tant que la décision n'est pas prise) ════════ */}
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
          workshopDeepCheckAt={workshopDeepCheckAt}
          workshopShippingPreparedAt={workshopShippingPreparedAt}
          workshopReturnDestination={workshopReturnDestination}
          wingReturnedAt={wingReturnedAt}
        />

      </div>

      <ScanGateModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScanSuccess={() => { setScanOpen(false); executeReceived() }}
        expectedSerial={wingSerial}
        title="Réception de l'aile"
        subtitle="Scannez le QR cousu sur l'aile (ou sur le sac) pour confirmer la réception à l'atelier."
      />
    </>
  )
}
