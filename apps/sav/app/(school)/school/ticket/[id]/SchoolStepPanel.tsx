'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  acknowledgeTicketAction,
  markWingReceivedSchoolAction,
  startSchoolCheckAction,
} from '@/features/tickets/actions'
import { ScanGateModal } from '@/features/tickets/components/ScanGateModal'
import { formatDateTime } from '@/features/tickets/utils'
import type { RequestStatus, SchoolResolution } from '@/features/tickets/types'

interface SchoolStepPanelProps {
  ticketId:                string
  status:                  RequestStatus
  schoolAcknowledgedAt:    string | null
  wingReceivedSchoolAt:    string | null
  isCheckValidated:        boolean
  /** N° de série de l'aile, pour vérification au scan flashcode. */
  wingSerial:              string | null
  /** Décision prise au check (null = pas encore décidé). Détermine la destination de renvoi. */
  schoolResolution:        SchoolResolution | null
  /** True si l'école a déjà généré le bon de transport sortant (vers atelier). */
  hasOutboundLabel:        boolean
}

type StepKey = 'ack' | 'wing' | 'check'

interface StepDef {
  key:        StepKey
  label:      string
  helpText:   string
  emoji:      string
  /** Statut courant attendu pour activer le bouton. */
  activeWhen: RequestStatus[]
  /** Statut(s) à partir desquels l'étape est considérée comme franchie. */
  doneWhen:   (status: RequestStatus, isCheckValidated: boolean) => boolean
  /** Si true, exige un scan flashcode avant l'action (Module Flashcode v1). */
  requiresScan: boolean
  /** Titre de la modale de scan (utilisé si requiresScan). */
  scanTitle?:    string
  /** Sous-titre de la modale de scan. */
  scanSubtitle?: string
}

const STEPS: StepDef[] = [
  {
    key:        'ack',
    label:      'Message vu',
    helpText:   "Confirme que vous avez pris connaissance de la demande. Le client est notifié.",
    emoji:      '👀',
    activeWhen: ['pending'],
    doneWhen:   (s) =>
      s !== 'pending',
    requiresScan: false,
  },
  {
    key:        'wing',
    label:      'Aile reçue',
    helpText:   "À cliquer quand l'aile est physiquement chez vous (en main propre ou via la poste).",
    emoji:      '📥',
    activeWhen: ['school_acknowledged'],
    doneWhen:   (s) =>
      s !== 'pending' && s !== 'school_acknowledged',
    requiresScan: true,
    scanTitle:    "Réception de l'aile",
    scanSubtitle: "Scannez le QR cousu sur l'aile (ou sur le sac) pour confirmer la réception.",
  },
  {
    key:        'check',
    label:      'Lancer le check',
    helpText:   "Ouvre le wizard de diagnostic. Vous pourrez ensuite prendre la décision.",
    emoji:      '🔍',
    activeWhen: ['wing_received_school'],
    doneWhen:   (s, isCheckValidated) =>
      isCheckValidated || (
        s !== 'pending' &&
        s !== 'school_acknowledged' &&
        s !== 'wing_received_school'
      ),
    requiresScan: true,
    scanTitle:    "Avant le check",
    scanSubtitle: "Scannez l'aile pour ouvrir le wizard de diagnostic sur le bon ticket.",
  },
]

// ── Étape 4 — Renvoi de l'aile ─────────────────────────────────────────────
// Hors STEPS[] parce que la destination est dynamique (dépend de school_resolution)
// et que le bouton d'action redirige vers la section "Bon de transport" plus
// bas dans la page plutôt que d'exécuter une Server Action directement.

type ReturnDestination = 'client' | 'workshop' | 'plume' | 'kept_at_school' | null

function deriveReturnDestination(resolution: SchoolResolution | null): ReturnDestination {
  if (!resolution) return null
  switch (resolution) {
    case 'resolved_by_school':
    case 'normal_behavior_explained':
      return 'client'
    case 'escalated_to_workshop':
      return 'workshop'
    case 'escalated_to_plume':
      return 'plume'
    case 'workshop_advice_requested':
    case 'reflection':
      return 'kept_at_school'
    default: {
      const _exhaustive: never = resolution
      return null
    }
  }
}

const RETURN_LABELS: Record<Exclude<ReturnDestination, null>, { title: string; help: string; emoji: string }> = {
  client:         { title: 'Renvoyer au client',        help: "Aile à expédier au client après check résolu sur place.",            emoji: '🏠' },
  workshop:       { title: "Envoyer à l'atelier",       help: "Aile à escalader vers l'atelier partenaire pour réparation.",        emoji: '🔧' },
  plume:          { title: 'Envoyer à Plume HQ',        help: "Aile à escalader vers Plume Paragliders pour traitement direct.",    emoji: '🏢' },
  kept_at_school: { title: "Aile gardée à l'école",     help: "Vous conservez l'aile en attendant un avis atelier ou réflexion.",   emoji: '⏸️' },
}

export function SchoolStepPanel({
  ticketId,
  status,
  schoolAcknowledgedAt,
  wingReceivedSchoolAt,
  isCheckValidated,
  wingSerial,
  schoolResolution,
  hasOutboundLabel,
}: SchoolStepPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [scanGateFor, setScanGateFor] = useState<StepKey | null>(null)

  function executeStep(key: StepKey) {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)

      const r =
        key === 'ack'  ? await acknowledgeTicketAction(fd)         :
        key === 'wing' ? await markWingReceivedSchoolAction(fd)    :
        key === 'check'? await startSchoolCheckAction(fd)          :
        null

      if (!r) return

      if ('error' in r && r.error) {
        const msg = (r.error._form as string[] | undefined)?.[0] ?? 'Erreur'
        alert(msg)
        return
      }

      // Pour le check, on ouvre le wizard tout de suite après la transition.
      if (key === 'check') {
        router.push(`/school/ticket/${ticketId}/check`)
      }
    })
  }

  function handleStep(key: StepKey) {
    const step = STEPS.find((s) => s.key === key)
    if (step?.requiresScan) {
      setScanGateFor(key)
    } else {
      executeStep(key)
    }
  }

  function handleScanSuccess(_method: 'camera' | 'demo' | 'manual') {
    if (scanGateFor) {
      const k = scanGateFor
      setScanGateFor(null)
      executeStep(k)
    }
  }

  function scrollToShippingSection() {
    // Tente de scroller vers la section "Bon de transport" plus bas dans la page.
    const target = document.querySelector('[data-section="shipping"]')
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const activeScanStep = scanGateFor ? STEPS.find((s) => s.key === scanGateFor) : null

  const timestampByKey: Record<StepKey, string | null> = {
    ack:   schoolAcknowledgedAt,
    wing:  wingReceivedSchoolAt,
    check: null, // matérialisé par le remplissage de school_checklist
  }

  // ── Étape 4 : état dérivé ────────────────────────────────────────────────
  const returnDest = deriveReturnDestination(schoolResolution)
  // Active : décision prise + bon pas encore généré (pour escalades) OU pas
  // encore marqué expédié (pour client direct, on n'a pas de signal côté DB
  // pour l'instant — on considère active dès qu'une résolution existe).
  const returnIsDone = returnDest === 'kept_at_school'
    ? false  // pas une "complétion", juste un état d'attente
    : hasOutboundLabel
  const returnIsActive = returnDest !== null && !returnIsDone
  const returnIsLocked = returnDest === null

  const returnConfig = returnDest && returnDest !== 'kept_at_school' ? RETURN_LABELS[returnDest] : null
  const returnHelpFallback = returnIsLocked
    ? "S'activera après votre décision au check (renvoi au client, à l'atelier, ou à Plume)."
    : returnDest === 'kept_at_school'
      ? RETURN_LABELS.kept_at_school.help
      : returnConfig?.help ?? ''

  return (
    <>
      <div className="space-y-3">
        {STEPS.map((step, idx) => {
          const isDone   = step.doneWhen(status, isCheckValidated)
          const isActive = step.activeWhen.includes(status) && !isDone
          const isLocked = !isActive && !isDone
          const at       = timestampByKey[step.key]

          return (
            <div
              key={step.key}
              className={`flex items-start gap-4 rounded-card border p-4 transition-colors ${
                isDone
                  ? 'border-emerald-200 bg-emerald-50/50'
                  : isActive
                    ? 'border-brand-gold bg-brand-gold/5 shadow-plume'
                    : 'border-brand-stone bg-white opacity-60'
              }`}
            >
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
                {isDone ? '✓' : idx + 1}
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
                {at && (
                  <p className="mt-1 text-[11px] text-emerald-700">
                    ✓ Validé le {formatDateTime(at)}
                  </p>
                )}
              </div>

              {isActive && (
                <button
                  type="button"
                  onClick={() => handleStep(step.key)}
                  disabled={isPending}
                  className="btn-primary shrink-0"
                >
                  {isPending ? '…' : step.label}
                </button>
              )}
            </div>
          )
        })}

        {/* ── Étape 4 — Renvoi de l'aile (dynamique) ───────────────────── */}
        <div
          className={`flex items-start gap-4 rounded-card border p-4 transition-colors ${
            returnIsDone
              ? 'border-emerald-200 bg-emerald-50/50'
              : returnIsActive
                ? 'border-brand-gold bg-brand-gold/5 shadow-plume'
                : 'border-brand-stone bg-white opacity-60'
          }`}
        >
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base font-bold ${
              returnIsDone
                ? 'bg-emerald-500 text-white'
                : returnIsActive
                  ? 'bg-brand-gold text-white'
                  : 'bg-brand-stone text-slate-400'
            }`}
            aria-hidden
          >
            {returnIsDone ? '✓' : 4}
          </div>

          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${returnIsDone ? 'text-slate-500 line-through decoration-emerald-500/60' : returnIsLocked ? 'text-slate-400' : 'text-brand-ink'}`}>
              <span className="mr-1.5" aria-hidden>
                {returnConfig?.emoji ?? (returnDest === 'kept_at_school' ? RETURN_LABELS.kept_at_school.emoji : '🚚')}
              </span>
              {returnIsLocked
                ? "Renvoi de l'aile"
                : returnDest === 'kept_at_school'
                  ? RETURN_LABELS.kept_at_school.title
                  : returnConfig?.title ?? "Renvoi de l'aile"}
              {returnIsActive && returnDest !== 'kept_at_school' && (
                <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                  📷 Scan requis pour le bon
                </span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{returnHelpFallback}</p>
          </div>

          {returnIsActive && returnDest !== 'kept_at_school' && (
            <button
              type="button"
              onClick={scrollToShippingSection}
              className="btn-primary shrink-0"
            >
              Préparer le bon
            </button>
          )}
        </div>
      </div>

      <ScanGateModal
        open={scanGateFor !== null}
        onClose={() => setScanGateFor(null)}
        onScanSuccess={handleScanSuccess}
        expectedSerial={wingSerial}
        title={activeScanStep?.scanTitle ?? 'Scan flashcode'}
        subtitle={activeScanStep?.scanSubtitle ?? ''}
      />
    </>
  )
}
