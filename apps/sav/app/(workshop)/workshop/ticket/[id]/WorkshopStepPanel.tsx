'use client'

import { useState, useTransition } from 'react'
import {
  finishWorkshopPreCheckAction,
  markWingReceivedWorkshopAction,
  markWorkshopDoneAction,
  markWingReturnedAction,
  startWorkshopDiagnosisAction,
  startWorkshopPreCheckAction,
  startWorkshopRepairAction,
} from '@/features/tickets/actions'
import { ScanGateModal } from '@/features/tickets/components/ScanGateModal'
import { RevertStepLink } from '@/features/tickets/components/RevertStepLink'
import { formatDateTime, statusGte } from '@/features/tickets/utils'
import type { RequestStatus, WarrantyStatus, WorkshopDecision } from '@/features/tickets/types'
import { WorkshopDecisionStep } from './WorkshopDecisionStep'

interface WorkshopStepPanelProps {
  ticketId:                string
  status:                  RequestStatus
  /** N° de série de l'aile, pour vérification au scan flashcode. */
  wingSerial:              string | null
  wingReceivedWorkshopAt:  string | null
  preCheckStartedAt:       string | null
  preCheckCompletedAt:     string | null
  preCheckFeeEurConfig:    number   // tarif courant lu depuis plume_settings
  workshopDiagnosisAt:     string | null
  workshopRepairDoneAt:    string | null
  wingReturnedAt:          string | null
  // T6 — Étape "Prise de décision" insérée entre diagnostic et réparation.
  workshopDecision:                  WorkshopDecision | null
  workshopDecisionAt:                string | null
  workshopEstimatedRepairCost:       number | null
  workshopDecisionWarrantyStatus:    WarrantyStatus | null
  workshopDecisionNote:              string | null
  /** Seuil €€ Plume pour valider une réparation côté modal. */
  repairReplacementThresholdEur:     number
}

// Étapes linéaires (hors triage post-réception et pré-check qui sont des
// branches optionnelles affichées séparément).
type StepKey = 'received' | 'repair' | 'done' | 'returned'

// Clés réutilisées pour la modal de scan flashcode (T4) — comprend aussi
// les transitions hors STEPS (ex: démarrage du diagnostic depuis le triage).
type ScanGateKey = StepKey | 'diagnose_direct'

interface StepDef {
  key:        StepKey
  label:      string
  helpText:   string
  emoji:      string
  /** Statut courant attendu pour activer le bouton. */
  activeWhen: RequestStatus[]
  /** Statut(s) à partir desquels l'étape est franchie. */
  doneFrom:   RequestStatus
  /** Colonne timestamp à afficher quand l'étape est franchie. */
  tsKey:      keyof Pick<WorkshopStepPanelProps,
    'wingReceivedWorkshopAt' | 'workshopRepairDoneAt' | 'wingReturnedAt'
  > | null
  /** Si true, exige un scan flashcode avant l'action (Module Flashcode atelier T4). */
  requiresScan:  boolean
  scanTitle?:    string
  scanSubtitle?: string
}

const STEPS: StepDef[] = [
  {
    key:        'received',
    label:      'Aile reçue',
    helpText:   "À cliquer dès que le colis / l'aile arrive à l'atelier.",
    emoji:      '🏭',
    activeWhen: ['escalated_to_workshop'],
    doneFrom:   'wing_received_workshop',
    tsKey:      'wingReceivedWorkshopAt',
    requiresScan: true,
    scanTitle:    "Réception de l'aile",
    scanSubtitle: "Scannez le QR cousu sur l'aile (ou sur le sac) pour confirmer la réception à l'atelier.",
  },
  // Le diagnostic (T6) est déclenché par la branche pré-check OU par le
  // bouton "problème évident" du bloc triage — on ne le matérialise pas
  // comme une étape unique avec activeWhen ici, il est rendu manuellement.
  {
    key:        'repair',
    label:      'Réparation en cours',
    helpText:   "Confirme le passage en réparation effective.",
    emoji:      '🔧',
    activeWhen: ['workshop_diagnosing'],
    doneFrom:   'workshop_repairing',
    tsKey:      null,
    requiresScan: true,
    scanTitle:    'Avant la réparation',
    scanSubtitle: "Scannez l'aile pour confirmer que vous attaquez la bonne aile.",
  },
  {
    key:        'done',
    label:      'Réparation terminée',
    helpText:   "L'intervention est finie, l'aile est prête à repartir.",
    emoji:      '✓',
    activeWhen: ['workshop_repairing'],
    doneFrom:   'workshop_done',
    tsKey:      'workshopRepairDoneAt',
    requiresScan: false,
  },
  {
    key:        'returned',
    label:      'Aile renvoyée',
    helpText:   "Une fois expédiée à l'école ou directement au client, marquez l'aile comme renvoyée.",
    emoji:      '✈️',
    activeWhen: ['workshop_done'],
    doneFrom:   'wing_returned',
    tsKey:      'wingReturnedAt',
    requiresScan: true,
    scanTitle:    "Avant l'expédition retour",
    scanSubtitle: "Scannez l'aile une dernière fois avant de la confier au transporteur.",
  },
]

export function WorkshopStepPanel(props: WorkshopStepPanelProps) {
  const {
    ticketId,
    status,
    wingSerial,
    preCheckStartedAt,
    preCheckCompletedAt,
    preCheckFeeEurConfig,
    workshopDiagnosisAt,
    workshopDecision,
    workshopDecisionAt,
    workshopEstimatedRepairCost,
    workshopDecisionNote,
    repairReplacementThresholdEur,
  } = props
  const [isPending, startTransition] = useTransition()
  const [recipient, setRecipient] = useState<'school' | 'client'>('school')
  // Errors only — success est exprimé par le timestamp ✓ persistant sur
  // chaque carte une fois l'étape franchie (cf. SequentialStep / pré-check).
  const [feedback, setFeedback] = useState<{ msg: string } | null>(null)
  const [scanGateFor, setScanGateFor] = useState<ScanGateKey | null>(null)

  // Pré-check : observations en cours de saisie + état UI (form ouvert/fermé)
  const [preCheckOpen, setPreCheckOpen] = useState(false)
  const [observations, setObservations] = useState('')

  // Plus de toast success qui s'efface après 1800–2200 ms : chaque carte
  // expose son propre "✓ Validé le …" persistant une fois l'étape franchie
  // (cf. SequentialStep ci-dessous et la carte pré-check). On garde uniquement
  // le feedback d'erreur, qui reste affiché tant qu'une nouvelle action n'est
  // pas tentée.
  function showError(msg: string) {
    setFeedback({ msg })
  }

  function clearError() {
    setFeedback(null)
  }

  function executeStep(key: StepKey) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      if (key === 'returned') fd.set('recipient', recipient)

      const r =
        key === 'received' ? await markWingReceivedWorkshopAction(fd) :
        key === 'repair'   ? await startWorkshopRepairAction(fd)      :
        key === 'done'     ? await markWorkshopDoneAction(fd)         :
        key === 'returned' ? await markWingReturnedAction(fd)         :
        null

      if (!r) return
      if ('error' in r && r.error) {
        const msg = (r.error._form as string[] | undefined)?.[0] ?? 'Erreur'
        showError(msg)
      } else {
        clearError()
      }
    })
  }

  // Intercepte les étapes "scan requis" pour ouvrir la modal flashcode avant
  // d'exécuter l'action. Les étapes sans scan partent directement vers l'action.
  function handleStep(key: StepKey) {
    const step = STEPS.find((s) => s.key === key)
    if (step?.requiresScan) {
      setScanGateFor(key)
    } else {
      executeStep(key)
    }
  }

  function executeDiagnoseDirect() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await startWorkshopDiagnosisAction(fd)
      if (r && 'error' in r && r.error) {
        const msg = (r.error._form as string[] | undefined)?.[0] ?? 'Erreur'
        showError(msg)
      } else {
        clearError()
      }
    })
  }

  function handleStartPreCheck() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await startWorkshopPreCheckAction(fd)
      if (r && 'error' in r && r.error) {
        const flat = r.error as Record<string, string[] | undefined>
        const msg = flat._form?.[0] ?? flat.ticketId?.[0] ?? 'Erreur'
        showError(msg)
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
        const msg = flat._form?.[0] ?? flat.observations?.[0] ?? 'Erreur'
        showError(msg)
      } else {
        setPreCheckOpen(false)
        setObservations('')
        clearError()
      }
    })
  }

  function handleScanSuccess(_method: 'camera' | 'demo' | 'manual') {
    if (!scanGateFor) return
    const k = scanGateFor
    setScanGateFor(null)
    if (k === 'diagnose_direct') {
      executeDiagnoseDirect()
    } else {
      executeStep(k)
    }
  }

  // Métadonnées de la modal de scan — couvre les StepDef + le cas "diagnose_direct".
  const SCAN_META: Record<ScanGateKey, { title: string; subtitle: string }> = {
    received: {
      title:    "Réception de l'aile",
      subtitle: "Scannez le QR cousu sur l'aile (ou sur le sac) pour confirmer la réception à l'atelier.",
    },
    diagnose_direct: {
      title:    'Avant le diagnostic',
      subtitle: "Scannez l'aile pour démarrer le diagnostic sur le bon ticket.",
    },
    repair: {
      title:    'Avant la réparation',
      subtitle: "Scannez l'aile pour confirmer que vous attaquez la bonne aile.",
    },
    done: { title: '', subtitle: '' },
    returned: {
      title:    "Avant l'expédition retour",
      subtitle: "Scannez l'aile une dernière fois avant de la confier au transporteur.",
    },
  }

  const activeScanMeta = scanGateFor ? SCAN_META[scanGateFor] : null

  // Ticket pas encore escaladé → on affiche un placeholder explicatif.
  if (!statusGte(status, 'escalated_to_workshop')) {
    return (
      <div className="rounded-card border border-brand-stone bg-brand-cream p-4 text-sm text-slate-600">
        L&apos;école n&apos;a pas encore escaladé ce ticket vers l&apos;atelier.
        Les étapes apparaîtront ici dès qu&apos;elle aura confié l&apos;aile.
      </div>
    )
  }

  // Visibilité conditionnelle :
  //  - `received` : toujours visible (escalated → wing_received)
  //  - triage     : visible uniquement à wing_received_workshop, avant pré-check
  //  - pre_check  : visible dès que la branche est engagée
  //  - diagnostic : affiché en "fait" dès qu'on a dépassé pre_checking
  //  - repair / done / returned : séquence linéaire post-diagnostic
  const hasPreCheckStarted = status === 'workshop_pre_checking' || !!preCheckStartedAt
  const preCheckIsCurrent  = status === 'workshop_pre_checking'
  const diagnosisDone      = statusGte(status, 'workshop_diagnosing') && status !== 'workshop_pre_checking'

  return (
    <>
      <div className="space-y-3">
        {feedback && (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
            {feedback.msg}
          </p>
        )}

        {STEPS.filter((s) => s.key === 'received').map((step) => (
          <SequentialStep
            key={step.key}
            step={step}
            idx={1}
            status={status}
            props={props}
            isPending={isPending}
            onClick={() => handleStep(step.key)}
            onBypassScan={() => executeStep(step.key)}
          />
        ))}

        {/* Branche triage post-réception : tant que le ticket n'a pas dépassé
            wing_received_workshop / workshop_pre_checking, on propose
            au technicien de choisir la suite. */}
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

        {/* Carte pré-check : visible dès qu'on l'a démarré (en cours ou terminé) */}
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
                  preCheckIsCurrent
                    ? 'bg-brand-gold text-white'
                    : 'bg-emerald-500 text-white'
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

            {/* Variante mobile pleine-largeur — desktop affiche le bouton à droite */}
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
                <label className="block text-xs font-medium text-slate-600">
                  Observations
                </label>
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

        {/* Étape 2 — diagnostic démarré. État "fait" uniquement, pas d'action. */}
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

        {/* Étape 3 — Prise de décision (no_issue / repair / replacement).
            Disponible dès que le diagnostic atelier est engagé. */}
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
            isReachable={diagnosisDone}
          />
        )}

        {/* Étapes 4–6 — Réparation en cours, terminée, aile renvoyée.
            Quand la décision est 'no_issue', on saute repair + done : le
            statut va direct à wing_returned, on n'affiche donc que la 6ᵉ
            étape (renumérotée 4 pour ne pas afficher de "trous"). */}
        {STEPS.filter((s) => {
          if (s.key === 'received') return false
          if (workshopDecision === 'no_issue' && (s.key === 'repair' || s.key === 'done')) return false
          return true
        }).map((step, idx) => (
          <SequentialStep
            key={step.key}
            step={step}
            idx={idx + 4 /* received=1, diagnostic=2, décision=3, donc post-décision commence à 4 */}
            status={status}
            props={props}
            isPending={isPending}
            onClick={() => handleStep(step.key)}
            onBypassScan={() => executeStep(step.key)}
            recipient={step.key === 'returned' ? recipient : undefined}
            onRecipientChange={step.key === 'returned' ? setRecipient : undefined}
            // Garde-fou métier : on n'autorise 'Réparation en cours' (et,
            // par cohérence, 'Réparation terminée') que si la décision
            // atelier est explicitement 'repair'. Pour 'replacement', les
            // deux étapes restent verrouillées — Plume HQ pilote la suite.
            gate={
              step.key === 'repair' || step.key === 'done'
                ? workshopDecision === 'repair'
                : true
            }
          />
        ))}
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

interface SequentialStepProps {
  step:               StepDef
  idx:                number
  status:             RequestStatus
  props:              WorkshopStepPanelProps
  isPending:          boolean
  onClick:            () => void
  onBypassScan:       () => void
  recipient?:         'school' | 'client'
  onRecipientChange?: (r: 'school' | 'client') => void
  /** Garde-fou métier additionnel : si false, l'étape reste verrouillée
   *  même si le statut autoriserait l'activation. Utilisé pour gater
   *  'Réparation en cours' sur workshop_decision === 'repair'. */
  gate?:              boolean
}

function SequentialStep({
  step, idx, status, props, isPending, onClick, onBypassScan, recipient, onRecipientChange,
  gate = true,
}: SequentialStepProps) {
  const isDone   = statusGte(status, step.doneFrom)
  const isActive = gate && step.activeWhen.includes(status) && !isDone
  const isLocked = !isActive && !isDone
  const at       = step.tsKey ? props[step.tsKey] : null

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
          <p className={`text-sm font-semibold ${isDone ? 'text-slate-500 line-through decoration-emerald-500/60' : isLocked ? 'text-slate-400' : 'text-brand-ink'}`}>
            <span className="mr-1.5" aria-hidden>{step.emoji}</span>
            {step.label}
            {step.requiresScan && !isDone && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                📷 Scan requis
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{step.helpText}</p>

          {/* Recipient picker — only on the "returned" active step */}
          {step.key === 'returned' && isActive && onRecipientChange && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
              <span className="text-slate-500">Destination&nbsp;:</span>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="recipient"
                  value="school"
                  checked={recipient === 'school'}
                  onChange={() => onRecipientChange('school')}
                  className="h-3.5 w-3.5 accent-brand-gold"
                />
                <span>École partenaire</span>
              </label>
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="recipient"
                  value="client"
                  checked={recipient === 'client'}
                  onChange={() => onRecipientChange('client')}
                  className="h-3.5 w-3.5 accent-brand-gold"
                />
                <span>Client direct</span>
              </label>
            </div>
          )}

          {at && (
            <p className="mt-1 text-[11px] text-emerald-700">
              ✓ Validé le {formatDateTime(at)}
            </p>
          )}
          {isDone && (
            <RevertStepLink
              ticketId={props.ticketId}
              targetStatus={step.doneFrom}
              stepLabel={step.label}
            />
          )}
        </div>

        {isActive && (
          <button
            type="button"
            onClick={onClick}
            disabled={isPending}
            className="btn-primary hidden shrink-0 sm:inline-flex"
          >
            {isPending ? '…' : step.label}
          </button>
        )}
      </div>

      {/* Variante mobile pleine-largeur — desktop garde le bouton à droite */}
      {isActive && (
        <button
          type="button"
          onClick={onClick}
          disabled={isPending}
          className="btn-primary mt-3 w-full sm:hidden"
        >
          {isPending ? '…' : step.label}
        </button>
      )}

      {/* Bypass scan QR — réservé à la phase de test/démo (cf. T4). */}
      {isActive && step.requiresScan && (
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
