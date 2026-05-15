'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  acknowledgeTicketAction,
  markWingReceivedSchoolAction,
  startSchoolCheckAction,
} from '@/features/tickets/actions'
import { ScanGateModal } from '@/features/tickets/components/ScanGateModal'
import { RevertStepLink } from '@/features/tickets/components/RevertStepLink'
import { formatDateTime } from '@/features/tickets/utils'
import type { DeliveryMethod, RequestStatus, SchoolResolution, WarrantyTier } from '@/features/tickets/types'
import { SchoolDecisionModal } from './SchoolDecisionModal'
import { SchoolReturnFlowModal } from './SchoolReturnFlowModal'
import { SchoolShippingApprovalCard } from './SchoolShippingApprovalCard'

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
  /** Méthode de remise choisie par le client — drive la sous-étape "Valider l'envoi". */
  deliveryMethod:          DeliveryMethod | null
  /** Décision école sur l'envoi postal (NULL = pas encore décidé). */
  shippingApproved:        boolean | null
  /** Raison saisie par l'école en cas de refus. */
  shippingRefusalReason:   string | null
  /** Tier de garantie figé sur le ticket. Détermine si Plume couvre le
   *  transport école → atelier. */
  warrantyTier:                          WarrantyTier | null
  /** Toggle Plume HQ — la garantie étendue couvre-t-elle le transport
   *  école → atelier ? Lu depuis plume_settings. */
  extendedCoversSchoolWorkshopShipping:  boolean
}

type StepKey = 'ack' | 'wing' | 'check' | 'decision' | 'return'
type ReturnOption = 'client_pickup' | 'carrier_to_client' | 'to_workshop' | 'workshop_pickup'

/**
 * Suggère l'option logique selon la décision prise à l'étape 4 :
 *  - Niveau 1 (mineur, école gère)         → client revient chercher
 *  - Niveau 2/3/4 (besoin atelier)         → envoi à l'atelier
 *
 * L'utilisateur peut toujours basculer sur une autre option via le toggle
 * "Autre option" (carrier_to_client si l'école renvoie par poste, ou
 * workshop_pickup si l'atelier vient chercher l'aile sur place).
 */
function getRecommendedReturnOption(resolution: SchoolResolution | null): ReturnOption {
  if (resolution === 'resolved_by_school' || resolution === 'normal_behavior_explained') {
    return 'client_pickup'
  }
  return 'to_workshop'
}

interface StepCtx {
  status:                  RequestStatus
  isCheckValidated:        boolean
  schoolResolution:        SchoolResolution | null
  /** Tracking GLS école → atelier — présent = aile effectivement expédiée. */
  schoolWorkshopTracking:  string | null
  /** Tracking GLS atelier/école → client — présent = aile effectivement expédiée. */
  workshopReturnTracking:  string | null
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
  /** Statut auquel revenir si l'utilisateur clique "Modifier" sous l'étape
   *  validée. Null = pas de revert (étape sans cible safe ou aux effets de
   *  bord trop complexes — ex. décision / renvoi côté école). */
  revertTarget?: RequestStatus | null
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
    revertTarget: 'school_acknowledged',
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
    revertTarget: 'wing_received_school',
  },
  // ── 3. Check de l'aile (scan flashcode + briefing + wizard) ─────────────
  //
  // Bug historique (cul-de-sac) : si le moniteur lançait le wizard puis fermait
  // l'onglet sans le valider, le statut restait à `school_checking` et
  // `isCheckValidated` à false. L'ancienne condition `c.status === 'wing_received_school'`
  // rendait l'étape ni active ni done → aucun bouton cliquable, blocage total.
  // On inclut donc `school_checking` dans isActive pour permettre de reprendre
  // le check à tout moment tant qu'il n'est pas validé.
  {
    key:        'check',
    label:      "Check de l'aile",
    helpText:   "Inspection visuelle, comportement, structure. Ouvre le wizard de diagnostic.",
    emoji:      '🔍',
    isActive:   (c) =>
      (c.status === 'wing_received_school' || c.status === 'school_checking') &&
      !c.isCheckValidated,
    isDone:     (c) => c.isCheckValidated,
    requiresScan: true,
    scanTitle:    "Avant le check",
    scanSubtitle: "Scannez l'aile pour ouvrir le wizard de diagnostic sur le bon ticket.",
    // Le check terrain (school_checklist) reste préservé sur revert —
    // school_checklist n'est PAS dans FIELDS_BY_STATUS_ENTRY.
    revertTarget: 'school_checking',
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
  //
  // Bug historique : `escalated_to_workshop` est positionné DÈS la prise de
  // décision (étape 4) par `applySchoolResolutionAction` via
  // `resolutionToRequestStatus`. Se baser sur ce status pour `isDone` cochait
  // l'étape 5 alors que l'aile n'avait pas encore été expédiée. On se base
  // donc sur des signaux d'expédition effective : ticket complété (remise en
  // main propre), ou tracking GLS généré (atelier ou retour client).
  {
    key:        'return',
    label:      "Renvoyer l'aile",
    helpText:   "Comment l'aile retourne au client ou part à l'atelier.",
    emoji:      '✈️',
    isActive:   (c) => c.schoolResolution !== null,
    isDone:     (c) =>
      c.status === 'wing_returned' ||
      c.status === 'completed' ||
      c.schoolWorkshopTracking !== null ||
      c.workshopReturnTracking !== null,
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
  deliveryMethod,
  shippingApproved,
  shippingRefusalReason,
  warrantyTier,
  extendedCoversSchoolWorkshopShipping,
}: SchoolStepPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [scanGateFor, setScanGateFor] = useState<StepKey | null>(null)
  const [decisionModalOpen, setDecisionModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)

  const recommendedOption = getRecommendedReturnOption(schoolResolution)

  const ctx: StepCtx = {
    status,
    isCheckValidated,
    schoolResolution,
    schoolWorkshopTracking,
    workshopReturnTracking,
  }

  function executeStep(key: StepKey) {
    if (key === 'decision') {
      // Ouvre la modal contenant SchoolResolutionPanel — remplace l'ancien
      // mécanisme de switch d'onglet + scroll vers la section "Décision".
      setDecisionModalOpen(true)
      return
    }
    if (key === 'return') {
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
                  {isDone && step.revertTarget && (
                    <RevertStepLink
                      ticketId={ticketId}
                      targetStatus={step.revertTarget}
                      stepLabel={step.label}
                    />
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

              {/* Bypass scan QR — réservé à la phase de test/démo. Permet de
                  passer l'étape sans déclencher la caméra (utile pour démos
                  client / iteration sans aile physique). À retirer ou gater par
                  feature flag avant la mise en ligne client. */}
              {isActive && step.requiresScan && (
                <button
                  type="button"
                  onClick={() => executeStep(step.key)}
                  disabled={isPending}
                  className="mt-2 w-full text-center text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
                >
                  Passer le scan (test)
                </button>
              )}

              {/* Sous-étape "Valider l'envoi" — uniquement pour les tickets
                  postaux. Greffée à l'étape "Message vu" : elle apparaît dès
                  que l'école a accusé réception (ou même avant si delivery
                  postal), et reste visible une fois la décision prise pour
                  servir de récap. */}
              {step.key === 'ack' && deliveryMethod === 'postal' && (
                <SchoolShippingApprovalCard
                  ticketId={ticketId}
                  shippingApproved={shippingApproved}
                  shippingRefusalReason={shippingRefusalReason}
                />
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
        <SchoolDecisionModal
          ticketId={ticketId}
          currentResolution={schoolResolution}
          assignedWorkshopLabel={assignedWorkshopLabel}
          isPlumeUrgent={isPlumeUrgent}
          onClose={() => setDecisionModalOpen(false)}
        />
      )}

      {returnModalOpen && (
        <SchoolReturnFlowModal
          ticketId={ticketId}
          recommendedOption={recommendedOption}
          schoolResolution={schoolResolution}
          assignedWorkshopLabel={assignedWorkshopLabel}
          wingSerial={wingSerial}
          warrantyTier={warrantyTier}
          extendedCoversSchoolWorkshopShipping={extendedCoversSchoolWorkshopShipping}
          schoolWorkshopTracking={schoolWorkshopTracking}
          schoolWorkshopLabelUrl={schoolWorkshopLabelUrl}
          workshopReturnTracking={workshopReturnTracking}
          workshopReturnLabelUrl={workshopReturnLabelUrl}
          onClose={() => setReturnModalOpen(false)}
        />
      )}
    </>
  )
}
