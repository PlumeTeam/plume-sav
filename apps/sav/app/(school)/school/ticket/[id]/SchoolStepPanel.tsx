'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  acknowledgeTicketAction,
  markTicketCompletedAction,
  markWingReceivedSchoolAction,
  startSchoolCheckAction,
} from '@/features/tickets/actions'
import { ScanGateModal } from '@/features/tickets/components/ScanGateModal'
import { ShippingLabelButton } from '@/features/tickets/components/ShippingLabelButton'
import { formatDateTime } from '@/features/tickets/utils'
import type { RequestStatus, SchoolResolution } from '@/features/tickets/types'
import { SchoolResolutionPanel } from './SchoolResolutionPanel'

interface SchoolStepPanelProps {
  ticketId:                string
  status:                  RequestStatus
  schoolAcknowledgedAt:    string | null
  wingReceivedSchoolAt:    string | null
  isCheckValidated:        boolean
  /** Nom du moniteur qui a effectué le check (extrait du wizard payload V2). */
  checkInspector:          string | null
  /** N° de série de l'aile, pour vérification au scan flashcode. */
  wingSerial:              string | null
  /** Décision prise au check (null = pas encore décidé). Pilote l'étape 4. */
  schoolResolution:        SchoolResolution | null
  /** Libellé de l'atelier assigné (utilisé par la modal de décision). */
  assignedWorkshopLabel:   string | null
  /** Flag d'urgence Plume HQ (utilisé par la modal de décision). */
  isPlumeUrgent:           boolean
  /** Trackings GLS — utilisés par la modal "Renvoyer l'aile". */
  schoolWorkshopTracking:  string | null
  schoolWorkshopLabelUrl:  string | null
  workshopReturnTracking:  string | null
  workshopReturnLabelUrl:  string | null
}

type StepKey = 'ack' | 'wing' | 'check' | 'decision' | 'return'
type ReturnOption = 'client_pickup' | 'carrier_to_client' | 'to_workshop'

interface StepCtx {
  status:            RequestStatus
  isCheckValidated:  boolean
  schoolResolution:  SchoolResolution | null
}

interface StepDef {
  key:        StepKey
  label:      string
  helpText:   string
  emoji:      string
  isActive:   (ctx: StepCtx) => boolean
  isDone:     (ctx: StepCtx) => boolean
  /** Si true, exige un scan flashcode avant l'action (Module Flashcode v1). */
  requiresScan: boolean
  scanTitle?:    string
  scanSubtitle?: string
}

const STEPS: StepDef[] = [
  // ── 1. Message vu ────────────────────────────────────────────────────────
  {
    key:        'ack',
    label:      'Message vu',
    helpText:   "Confirme que vous avez pris connaissance de la demande. Le client est notifié.",
    emoji:      '👀',
    isActive:   (c) => c.status === 'pending',
    isDone:     (c) => c.status !== 'pending',
    requiresScan: false,
  },
  // ── 2. Aile reçue (scan flashcode) ──────────────────────────────────────
  {
    key:        'wing',
    label:      'Aile reçue',
    helpText:   "À cliquer quand l'aile est physiquement chez vous (en main propre ou via la poste).",
    emoji:      '📥',
    isActive:   (c) => c.status === 'school_acknowledged',
    isDone:     (c) => c.status !== 'pending' && c.status !== 'school_acknowledged',
    requiresScan: true,
    scanTitle:    "Réception de l'aile",
    scanSubtitle: "Scannez le QR cousu sur l'aile (ou sur le sac) pour confirmer la réception.",
  },
  // ── 3. Check de l'aile (scan flashcode + briefing + wizard) ─────────────
  {
    key:        'check',
    label:      "Check de l'aile",
    helpText:   "Inspection visuelle, comportement, structure. Ouvre le wizard de diagnostic.",
    emoji:      '🔍',
    isActive:   (c) => c.status === 'wing_received_school' && !c.isCheckValidated,
    isDone:     (c) => c.isCheckValidated,
    requiresScan: true,
    scanTitle:    "Avant le check",
    scanSubtitle: "Scannez l'aile pour ouvrir le wizard de diagnostic sur le bon ticket.",
  },
  // ── 4. Prendre la décision (qui s'occupe de l'aile) ─────────────────────
  {
    key:        'decision',
    label:      'Prendre la décision',
    helpText:   "Choisir la suite à donner.",
    emoji:      '⚖️',
    isActive:   (c) => c.isCheckValidated && c.schoolResolution === null,
    isDone:     (c) => c.schoolResolution !== null,
    requiresScan: false,
  },
  // ── 5. Renvoyer l'aile (client revient / poste / atelier) ───────────────
  {
    key:        'return',
    label:      "Renvoyer l'aile",
    helpText:   "Comment l'aile retourne au client ou part à l'atelier.",
    emoji:      '✈️',
    isActive:   (c) => c.schoolResolution !== null,
    isDone:     (c) =>
      c.status === 'wing_returned' ||
      c.status === 'escalated_to_workshop' ||
      c.status === 'completed',
    requiresScan: false,
  },
]

// Libellés humains pour chaque résolution — utilisés dans le helpText de
// l'étape 4 une fois la décision prise.
const RESOLUTION_LABEL: Record<SchoolResolution, string> = {
  resolved_by_school:        'Résolu sur place — renvoi au client',
  normal_behavior_explained: "Comportement normal expliqué — renvoi au client",
  escalated_to_workshop:     'Escalade atelier partenaire',
  escalated_to_plume:        'Escalade Plume HQ',
  workshop_advice_requested: "Aile gardée — demande d'avis atelier",
  reflection:                'En réflexion — aile gardée à l\'école',
}

export function SchoolStepPanel({
  ticketId,
  status,
  schoolAcknowledgedAt,
  wingReceivedSchoolAt,
  isCheckValidated,
  checkInspector,
  wingSerial,
  schoolResolution,
  assignedWorkshopLabel,
  isPlumeUrgent,
  schoolWorkshopTracking,
  schoolWorkshopLabelUrl,
  workshopReturnTracking,
  workshopReturnLabelUrl,
}: SchoolStepPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [scanGateFor, setScanGateFor] = useState<StepKey | null>(null)
  const [decisionModalOpen, setDecisionModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  const [returnOption, setReturnOption] = useState<ReturnOption | null>(null)
  const [returnError, setReturnError] = useState<string | null>(null)

  const ctx: StepCtx = { status, isCheckValidated, schoolResolution }

  function executeStep(key: StepKey) {
    if (key === 'decision') {
      // Ouvre la modal contenant SchoolResolutionPanel — remplace l'ancien
      // mécanisme de switch d'onglet + scroll vers la section "Décision".
      setDecisionModalOpen(true)
      return
    }
    if (key === 'return') {
      setReturnOption(null)
      setReturnError(null)
      setReturnModalOpen(true)
      return
    }

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

  function handleClientPickupConfirm() {
    setReturnError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await markTicketCompletedAction(fd)
      if (r && 'error' in r && r.error) {
        const msg = (r.error._form as string[] | undefined)?.[0] ?? 'Erreur'
        setReturnError(msg)
        return
      }
      setReturnModalOpen(false)
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

  const activeScanStep = scanGateFor ? STEPS.find((s) => s.key === scanGateFor) : null

  const timestampByKey: Record<StepKey, string | null> = {
    ack:      schoolAcknowledgedAt,
    wing:     wingReceivedSchoolAt,
    check:    null, // matérialisé par le remplissage de school_checklist
    decision: null, // matérialisé par le remplissage de school_resolution
    return:   null, // matérialisé par le tracking GLS / passage en completed
  }

  return (
    <>
      <div className="space-y-3">
        {STEPS.map((step, idx) => {
          const isDone   = step.isDone(ctx)
          const isActive = step.isActive(ctx) && !isDone
          const isLocked = !isActive && !isDone
          const at       = timestampByKey[step.key]

          // Helptext dynamique :
          //  - étape 4 (decision) : on affiche la résolution choisie au lieu de la description
          //  - étape 3 (check)    : si validée, on indique le moniteur pour traçabilité
          const helpText =
            step.key === 'decision' && schoolResolution
              ? `Décision : ${RESOLUTION_LABEL[schoolResolution]}`
              : step.key === 'check' && isDone && checkInspector
                ? `Effectué par ${checkInspector}`
                : step.helpText

          return (
            <div
              key={step.key}
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
                  {/* helpText caché sur mobile (gain de place) ; line-clamp-2 sur desktop. */}
                  <p className="mt-0.5 hidden text-xs text-slate-500 sm:line-clamp-2 sm:block">{helpText}</p>
                  {at && (
                    <p className="mt-1 text-[11px] text-emerald-700">
                      ✓ Validé le {formatDateTime(at)}
                    </p>
                  )}
                </div>

                {/* Bouton desktop : à droite, sur la même ligne. */}
                {isActive && (
                  <button
                    type="button"
                    onClick={() => handleStep(step.key)}
                    disabled={isPending}
                    className="btn-primary hidden shrink-0 sm:inline-flex"
                  >
                    {isPending ? '…' : step.label}
                  </button>
                )}
              </div>

              {/* Bouton mobile : pleine largeur, sur sa propre ligne. */}
              {isActive && (
                <button
                  type="button"
                  onClick={() => handleStep(step.key)}
                  disabled={isPending}
                  className="btn-primary mt-3 w-full sm:hidden"
                >
                  {isPending ? '…' : step.label}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <ScanGateModal
        open={scanGateFor !== null}
        onClose={() => setScanGateFor(null)}
        onScanSuccess={handleScanSuccess}
        expectedSerial={wingSerial}
        title={activeScanStep?.scanTitle ?? 'Scan flashcode'}
        subtitle={activeScanStep?.scanSubtitle ?? ''}
      />

      {decisionModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="decision-modal-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDecisionModalOpen(false)
          }}
        >
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3 border-b border-brand-stone px-5 py-4">
              <div>
                <h2
                  id="decision-modal-title"
                  className="text-base font-semibold text-brand-ink"
                >
                  ⚖️ Prendre la décision
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Choisissez la suite à donner à ce ticket.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                aria-label="Fermer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-brand-cream hover:text-brand-ink"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              <SchoolResolutionPanel
                ticketId={ticketId}
                currentResolution={schoolResolution}
                assignedWorkshopLabel={assignedWorkshopLabel}
                isPlumeUrgent={isPlumeUrgent}
              />
            </div>
          </div>
        </div>
      )}

      {returnModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="return-modal-title"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setReturnModalOpen(false)
          }}
        >
          <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-3 border-b border-brand-stone px-5 py-4">
              <div>
                <h2
                  id="return-modal-title"
                  className="text-base font-semibold text-brand-ink"
                >
                  ✈️ Renvoyer l&apos;aile
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">
                  Comment l&apos;aile quitte l&apos;école ?
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReturnModalOpen(false)}
                aria-label="Fermer"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-brand-cream hover:text-brand-ink"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto px-5 py-4 space-y-3">
              {/* Card 1 — Client pickup */}
              <ReturnOptionCard
                emoji="🤝"
                title="Le client revient chercher son aile"
                description="Le client se déplace à l'école. Pas d'expédition."
                isSelected={returnOption === 'client_pickup'}
                onClick={() => { setReturnOption('client_pickup'); setReturnError(null) }}
              >
                <p className="text-xs text-slate-600">
                  Confirmer fermera le ticket (passage en <strong>completed</strong>).
                </p>
                <button
                  type="button"
                  onClick={handleClientPickupConfirm}
                  disabled={isPending}
                  className="btn-primary mt-3 w-full"
                >
                  {isPending ? '…' : '✓ Confirmer — l\'aile est remise au client'}
                </button>
              </ReturnOptionCard>

              {/* Card 2 — Carrier to client */}
              <ReturnOptionCard
                emoji="📦"
                title="Renvoyer par transporteur au client"
                description="Envoi postal GLS depuis l'école vers l'adresse du client."
                isSelected={returnOption === 'carrier_to_client'}
                onClick={() => { setReturnOption('carrier_to_client'); setReturnError(null) }}
              >
                <ShippingLabelButton
                  ticketId={ticketId}
                  leg="workshop_to_return"
                  initialTracking={workshopReturnTracking}
                  initialLabelUrl={workshopReturnLabelUrl}
                  defaultReturnDestination="client"
                  triggerLabel="Générer le bon de transport retour client"
                  hint="GLS viendra chercher le colis à l'école."
                />
              </ReturnOptionCard>

              {/* Card 3 — To workshop */}
              <ReturnOptionCard
                emoji="🔧"
                title="Envoyer à l'atelier"
                description={
                  assignedWorkshopLabel
                    ? `L'aile part chez ${assignedWorkshopLabel}.`
                    : "L'aile part à l'atelier choisi lors de la décision."
                }
                isSelected={returnOption === 'to_workshop'}
                onClick={() => { setReturnOption('to_workshop'); setReturnError(null) }}
              >
                <ShippingLabelButton
                  ticketId={ticketId}
                  leg="school_to_workshop"
                  initialTracking={schoolWorkshopTracking}
                  initialLabelUrl={schoolWorkshopLabelUrl}
                  triggerLabel="Générer le bon école → atelier"
                  requireScan
                  wingSerial={wingSerial}
                />
              </ReturnOptionCard>

              {returnError && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                  {returnError}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function ReturnOptionCard({
  emoji,
  title,
  description,
  isSelected,
  onClick,
  children,
}: {
  emoji:       string
  title:       string
  description: string
  isSelected:  boolean
  onClick:     () => void
  children:    React.ReactNode
}) {
  return (
    <div
      className={`rounded-2xl border-2 transition-all ${
        isSelected
          ? 'border-brand-gold bg-brand-gold/5 shadow-soft'
          : 'border-brand-stone bg-white hover:border-brand-gold/40'
      }`}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-start gap-3 p-4 text-left active:scale-[0.99]"
      >
        <span aria-hidden className="text-2xl">{emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-brand-ink">{title}</p>
          <p className="mt-0.5 text-xs text-slate-600">{description}</p>
        </div>
        <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
          isSelected ? 'border-brand-gold bg-brand-gold text-white'
                     : 'border-brand-stone bg-white text-transparent'
        }`} aria-hidden>✓</span>
      </button>
      {isSelected && (
        <div className="border-t border-brand-stone/60 p-4">{children}</div>
      )}
    </div>
  )
}
