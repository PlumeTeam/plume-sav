'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  acknowledgeTicketAction,
  confirmWingSentBySchoolAction,
  markWingReceivedSchoolAction,
  schoolConfirmReceptionByScanAction,
  startSchoolCheckAction,
} from '@/features/tickets/actions'
import { ScanGateModal } from '@/features/tickets/components/ScanGateModal'
import { RevertStepLink } from '@/features/tickets/components/RevertStepLink'
import { formatDateTime, statusGte } from '@/features/tickets/utils'
import type { PartnerWorkshop } from '@/features/tickets/constants'
import type { DeliveryMethod, RequestStatus, SchoolResolution, WarrantyTier } from '@/features/tickets/types'
import { SchoolResolutionModal } from './SchoolResolutionModal'
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
  /** Ateliers affiliés (chargés côté serveur, passés à la modal décision). */
  workshops:                             PartnerWorkshop[]
  /** Horodatage de confirmation d'envoi par l'école (étape 6). NULL = pas
   *  encore expédiée. Posé par confirmWingSentBySchoolAction. */
  wingReturnedAt:                        string | null
}

type StepKey = 'ack' | 'wing' | 'check' | 'decision' | 'return' | 'ship'

interface StepCtx {
  status:                  RequestStatus
  isCheckValidated:        boolean
  schoolResolution:        SchoolResolution | null
  /** Tracking GLS école → atelier — présent = aile effectivement expédiée. */
  schoolWorkshopTracking:  string | null
  /** Tracking GLS atelier/école → client — présent = aile effectivement expédiée. */
  workshopReturnTracking:  string | null
  /** Horodatage de confirmation d'envoi manuelle par l'école (étape 6). */
  wingReturnedAt:          string | null
}

// L'étape « Envoyer l'aile » est franchie quand l'école confirme l'envoi
// (wing_returned_at posé), ou que l'aile est déjà passée en aval (atelier
// l'a réceptionnée, ticket clôturé). Pas de transition de statut côté école.
function wingShipped(c: StepCtx): boolean {
  return (
    c.wingReturnedAt !== null ||
    c.status === 'wing_returned' ||
    c.status === 'completed' ||
    statusGte(c.status, 'wing_received_workshop')
  )
}

// L'étape « Imprimer le ticket d'envoi » est franchie dès qu'un bon de
// transport a été généré (tracking GLS présent), ou que l'aile a quitté
// l'école d'une autre façon (remise en main propre, atelier venu chercher).
function ticketPrinted(c: StepCtx): boolean {
  return (
    c.schoolWorkshopTracking !== null ||
    c.workshopReturnTracking !== null ||
    wingShipped(c)
  )
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
  // ── 5. Imprimer le ticket d'envoi ───────────────────────────────────────
  //
  // Ouvre la modal de renvoi : choix de l'option (retour client / atelier),
  // puis génération + impression du bon de transport GLS. L'étape est
  // franchie dès qu'un tracking est généré — `escalated_to_workshop`, posé
  // dès la décision (étape 4), ne suffit donc PAS à la cocher.
  {
    key:        'return',
    label:      "Imprimer le ticket d'envoi",
    helpText:   "Générez et imprimez le bon de transport à joindre au colis.",
    emoji:      '🖨️',
    isActive:   (c) => c.schoolResolution !== null,
    isDone:     ticketPrinted,
    requiresScan: false,
  },
  // ── 6. Envoyer l'aile (confirmation manuelle école) ─────────────────────
  //
  // Une fois le ticket d'envoi imprimé et le colis remis au transporteur,
  // l'école valide manuellement cet envoi. confirmWingSentBySchoolAction
  // pose `wing_returned_at` sans changer le statut.
  {
    key:        'ship',
    label:      "Envoyer l'aile",
    helpText:   "Confirmez que l'aile a été remise au transporteur (ou déposée).",
    emoji:      '✈️',
    isActive:   ticketPrinted,
    isDone:     wingShipped,
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
  workshops,
  wingReturnedAt,
}: SchoolStepPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [scanGateFor, setScanGateFor] = useState<StepKey | null>(null)
  const [decisionModalOpen, setDecisionModalOpen] = useState(false)
  const [returnModalOpen, setReturnModalOpen] = useState(false)
  // Raccourci "Confirmer la réception (scan QR)" — bypass shipping. Sépare le
  // scan du flow step 2 standard pour qu'on puisse l'ouvrir même quand status
  // === 'pending' (étape 2 verrouillée). Voir schoolConfirmReceptionByScanAction.
  const [bypassScanOpen, setBypassScanOpen] = useState(false)

  const ctx: StepCtx = {
    status,
    isCheckValidated,
    schoolResolution,
    schoolWorkshopTracking,
    workshopReturnTracking,
    wingReturnedAt,
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
        key === 'ship' ? await confirmWingSentBySchoolAction(fd)   :
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

  // Bypass shipping : on appelle l'action dédiée qui accepte `pending` ET
  // `school_acknowledged` comme statut de départ. On envoie le wingSerial
  // comme `scannedSerial` (la ScanGateModal a déjà vérifié le match en amont
  // côté client). En mode démo, le wingSerial est utilisé tel quel.
  function handleBypassScanSuccess(_method: 'camera' | 'demo' | 'manual') {
    setBypassScanOpen(false)
    if (!wingSerial) {
      alert("N° de série introuvable sur ce ticket — impossible de valider la réception par scan.")
      return
    }
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      fd.set('scannedSerial', wingSerial)
      const r = await schoolConfirmReceptionByScanAction(fd)
      if (r && 'error' in r && r.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0]
          ?? err.scannedSerial?.[0]
          ?? err.ticketId?.[0]
          ?? 'Erreur'
        alert(msg)
      }
    })
  }

  const activeScanStep = scanGateFor ? STEPS.find((s) => s.key === scanGateFor) : null

  const timestampByKey: Record<StepKey, string | null> = {
    ack:      schoolAcknowledgedAt,
    wing:     wingReceivedSchoolAt,
    check:    null, // matérialisé par le remplissage de school_checklist
    decision: null, // matérialisé par le remplissage de school_resolution
    return:   null, // matérialisé par le tracking GLS / passage en completed
    ship:     wingReturnedAt, // confirmation manuelle d'envoi (étape 6)
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

              {/* Raccourci bypass — "Confirmer la réception (scan QR)".
                  Visible dans le bloc step 2 tant que l'aile n'est pas reçue
                  (status ∈ pending | school_acknowledged). Permet de
                  court-circuiter le flow shipping (client en main propre,
                  pas de bon GLS généré, démo). Greffé ici plutôt que dans
                  une carte séparée pour rester sur l'étape pertinente. */}
              {step.key === 'wing'
                && (status === 'pending' || status === 'school_acknowledged')
                && wingSerial && (
                <div className="mt-3 rounded-xl border-2 border-dashed border-brand-gold/40 bg-brand-gold/5 p-3">
                  <p className="text-xs font-semibold text-brand-ink">
                    🤝 L&apos;aile est déjà chez vous ?
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-600">
                    Dépôt en main propre ou colis arrivé sans bon d&apos;envoi —
                    scannez le QR pour valider la réception et passer à l&apos;étape suivante.
                  </p>
                  <button
                    type="button"
                    onClick={() => setBypassScanOpen(true)}
                    disabled={isPending}
                    className="mt-2 w-full rounded-xl border-2 border-brand-gold bg-white px-4 py-2 text-sm font-semibold text-brand-ink hover:bg-brand-gold/10 disabled:opacity-50"
                  >
                    📷 Confirmer la réception (scan QR)
                  </button>
                </div>
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

      {/* Modal du raccourci bypass — scan QR pour valider la réception
          même quand aucun bon d'envoi n'a été généré. Réutilise la même
          ScanGateModal (caméra + fallback manuel + mode démo). */}
      <ScanGateModal
        open={bypassScanOpen}
        onClose={() => setBypassScanOpen(false)}
        onScanSuccess={handleBypassScanSuccess}
        expectedSerial={wingSerial}
        title="Confirmer la réception (raccourci)"
        subtitle="Scannez le QR cousu sur l'aile pour confirmer sa réception — bypass shipping."
      />

      <SchoolResolutionModal
        open={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        ticketId={ticketId}
        schoolResolution={schoolResolution}
        assignedWorkshopLabel={assignedWorkshopLabel}
        isPlumeUrgent={isPlumeUrgent}
        workshops={workshops}
      />

      <SchoolReturnFlowModal
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        ticketId={ticketId}
        wingSerial={wingSerial}
        schoolResolution={schoolResolution}
        assignedWorkshopLabel={assignedWorkshopLabel}
        schoolWorkshopTracking={schoolWorkshopTracking}
        schoolWorkshopLabelUrl={schoolWorkshopLabelUrl}
        workshopReturnTracking={workshopReturnTracking}
        workshopReturnLabelUrl={workshopReturnLabelUrl}
        warrantyTier={warrantyTier}
        extendedCoversSchoolWorkshopShipping={extendedCoversSchoolWorkshopShipping}
      />
    </>
  )
}
