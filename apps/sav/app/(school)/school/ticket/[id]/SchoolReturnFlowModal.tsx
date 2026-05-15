'use client'

import { useState, useTransition, type ReactNode } from 'react'
import {
  markTicketCompletedAction,
  markWingReceivedWorkshopAction,
} from '@/features/tickets/actions'
import { ScanGateModal } from '@/features/tickets/components/ScanGateModal'
import { ShippingLabelButton } from '@/features/tickets/components/ShippingLabelButton'
import type { SchoolResolution, WarrantyTier } from '@/features/tickets/types'

// Modal "Renvoyer l'aile" — étape 5 du SchoolStepPanel.
// Encapsule tout le state local lié au renvoi (option sélectionnée, scans
// QR effectués, gate de scan en cours, erreurs) qui pollluait SchoolStepPanel.
// L'état partagé avec le panel parent (status du ticket, tracking GLS) est
// passé en props.

type ReturnOption = 'client_pickup' | 'carrier_to_client' | 'to_workshop' | 'workshop_pickup'

interface ReturnOptionMeta {
  key:          ReturnOption
  emoji:        string
  title:        string
  description:  string
  requiresScan: boolean
}

function buildReturnOptions(assignedWorkshopLabel: string | null): ReturnOptionMeta[] {
  return [
    {
      key:          'client_pickup',
      emoji:        '🤝',
      title:        'Le client revient chercher son aile',
      description:  "Le client se déplace à l'école. Pas d'expédition.",
      requiresScan: false,
    },
    {
      key:          'carrier_to_client',
      emoji:        '📦',
      title:        'Renvoyer par transporteur au client',
      description:  "Envoi postal GLS depuis l'école vers l'adresse du client.",
      requiresScan: true,
    },
    {
      key:          'to_workshop',
      emoji:        '🛠️',
      title:        assignedWorkshopLabel
        ? `Envoyer à ${assignedWorkshopLabel}`
        : "Envoyer à l'atelier partenaire",
      description:  "Envoi postal GLS depuis l'école vers l'atelier.",
      requiresScan: true,
    },
    {
      key:          'workshop_pickup',
      emoji:        '🚐',
      title:        "L'atelier vient chercher l'aile",
      description:  "Pas d'expédition — l'atelier se déplace.",
      requiresScan: false,
    },
  ]
}

interface Props {
  ticketId:                            string
  /** Pré-sélection : option recommandée par la décision école (étape 4). */
  recommendedOption:                   ReturnOption
  schoolResolution:                    SchoolResolution | null
  assignedWorkshopLabel:               string | null
  wingSerial:                          string | null
  warrantyTier:                        WarrantyTier | null
  extendedCoversSchoolWorkshopShipping: boolean
  schoolWorkshopTracking:              string | null
  schoolWorkshopLabelUrl:              string | null
  workshopReturnTracking:              string | null
  workshopReturnLabelUrl:              string | null
  onClose:                             () => void
}

export function SchoolReturnFlowModal({
  ticketId,
  recommendedOption,
  assignedWorkshopLabel,
  wingSerial,
  warrantyTier,
  extendedCoversSchoolWorkshopShipping,
  schoolWorkshopTracking,
  schoolWorkshopLabelUrl,
  workshopReturnTracking,
  workshopReturnLabelUrl,
  onClose,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [returnOption, setReturnOption] = useState<ReturnOption | null>(recommendedOption)
  const [showOtherReturnOptions, setShowOtherReturnOptions] = useState(false)
  const [returnError, setReturnError] = useState<string | null>(null)
  // Le scan QR (options carrier_to_client / to_workshop) doit être lu AVANT
  // d'afficher le bouton "Générer le bon de transport". Si une étiquette a
  // déjà été générée pour ce leg, on considère le scan implicitement validé.
  const [returnScanGateFor, setReturnScanGateFor] = useState<ReturnOption | null>(null)
  const [scannedReturnOptions, setScannedReturnOptions] = useState<Set<ReturnOption>>(() => {
    const s = new Set<ReturnOption>()
    if (workshopReturnLabelUrl) s.add('carrier_to_client')
    if (schoolWorkshopLabelUrl) s.add('to_workshop')
    return s
  })

  const returnOptions = buildReturnOptions(assignedWorkshopLabel)

  function selectReturnOption(opt: ReturnOption) {
    setReturnError(null)
    setReturnOption(opt)
  }
  function requestReturnScan(opt: ReturnOption) {
    setReturnError(null)
    setReturnScanGateFor(opt)
  }
  // Bypass scan QR — phase test/démo. À gater par feature flag avant prod.
  function skipReturnScan(opt: ReturnOption) {
    setReturnError(null)
    setScannedReturnOptions((prev) => {
      const next = new Set(prev)
      next.add(opt)
      return next
    })
    setReturnOption(opt)
  }
  function handleReturnScanSuccess(_method: 'camera' | 'demo' | 'manual') {
    if (!returnScanGateFor) return
    const opt = returnScanGateFor
    setScannedReturnOptions((prev) => {
      const next = new Set(prev)
      next.add(opt)
      return next
    })
    setReturnOption(opt)
    setReturnScanGateFor(null)
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
      onClose()
    })
  }
  // "L'atelier vient chercher" — pas de scan ni de bon, on avance le ticket
  // vers wing_received_workshop (statut habituellement atteint après réception
  // du colis GLS par l'atelier).
  function handleWorkshopPickupConfirm() {
    setReturnError(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      const r = await markWingReceivedWorkshopAction(fd)
      if (r && 'error' in r && r.error) {
        const msg = (r.error._form as string[] | undefined)?.[0] ?? 'Erreur'
        setReturnError(msg)
        return
      }
      onClose()
    })
  }

  function renderReturnContent(opt: ReturnOption): ReactNode {
    switch (opt) {
      case 'client_pickup':
        return (
          <>
            <p className="text-xs text-slate-600">
              Confirmer fermera le ticket (passage en <strong>completed</strong>).
            </p>
            <button
              type="button"
              onClick={handleClientPickupConfirm}
              disabled={isPending}
              className="btn-primary mt-3 w-full"
            >
              {isPending ? '…' : "✓ Confirmer — l'aile est remise au client"}
            </button>
          </>
        )
      case 'workshop_pickup':
        return (
          <>
            <p className="text-xs text-slate-600">
              {assignedWorkshopLabel
                ? <>Confirmer signale que <strong>{assignedWorkshopLabel}</strong> a récupéré l&apos;aile sur place.</>
                : "Confirmer signale que l'atelier a récupéré l'aile sur place."}
              {' '}Pas de bon de transport généré.
            </p>
            <button
              type="button"
              onClick={handleWorkshopPickupConfirm}
              disabled={isPending}
              className="btn-primary mt-3 w-full"
            >
              {isPending ? '…' : "✓ Confirmer — l'atelier a récupéré l'aile"}
            </button>
          </>
        )
      case 'carrier_to_client':
        if (!scannedReturnOptions.has('carrier_to_client')) {
          return (
            <>
              <p className="text-xs text-slate-600">
                Scannez le QR cousu sur l&apos;aile avant de générer le bon de transport.
              </p>
              <button
                type="button"
                onClick={() => requestReturnScan('carrier_to_client')}
                className="btn-primary mt-3 w-full"
              >
                📷 Scanner l&apos;aile
              </button>
              <button
                type="button"
                onClick={() => skipReturnScan('carrier_to_client')}
                className="mt-2 w-full text-center text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
              >
                Passer le scan (test)
              </button>
            </>
          )
        }
        return (
          <ShippingLabelButton
            ticketId={ticketId}
            leg="workshop_to_return"
            initialTracking={workshopReturnTracking}
            initialLabelUrl={workshopReturnLabelUrl}
            defaultReturnDestination="client"
            triggerLabel="Générer le bon de transport retour client"
            hint="GLS viendra chercher le colis à l'école."
          />
        )
      case 'to_workshop': {
        // Plume couvre le transport école → atelier uniquement pour
        // standard / plume_override, ou extended ET toggle activé. Sinon
        // l'école doit gérer l'envoi hors plateforme.
        const schoolWorkshopCovered =
          warrantyTier === 'standard' ||
          warrantyTier === 'plume_override' ||
          (warrantyTier === 'extended' && extendedCoversSchoolWorkshopShipping)
        if (!schoolWorkshopCovered) {
          return (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              <p className="font-semibold">Transport non couvert par Plume</p>
              <p className="mt-1 text-amber-800/90">
                {warrantyTier === 'out_of_warranty'
                  ? "L'aile est hors garantie. Le transport vers l'atelier est à organiser et facturer au client."
                  : "La garantie étendue de cette aile ne couvre pas le transport école → atelier. Voir avec le client pour le règlement du transport."}
              </p>
            </div>
          )
        }
        if (!scannedReturnOptions.has('to_workshop')) {
          return (
            <>
              <p className="text-xs text-slate-600">
                Scannez le QR cousu sur l&apos;aile avant de générer le bon de transport.
              </p>
              <button
                type="button"
                onClick={() => requestReturnScan('to_workshop')}
                className="btn-primary mt-3 w-full"
              >
                📷 Scanner l&apos;aile
              </button>
              <button
                type="button"
                onClick={() => skipReturnScan('to_workshop')}
                className="mt-2 w-full text-center text-[11px] text-slate-400 underline-offset-2 hover:text-slate-600 hover:underline"
              >
                Passer le scan (test)
              </button>
            </>
          )
        }
        return (
          <ShippingLabelButton
            ticketId={ticketId}
            leg="school_to_workshop"
            initialTracking={schoolWorkshopTracking}
            initialLabelUrl={schoolWorkshopLabelUrl}
            triggerLabel="Générer le bon école → atelier"
          />
        )
      }
    }
  }

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="return-modal-title"
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl sm:rounded-3xl">
          <div className="flex items-start justify-between gap-3 border-b border-brand-stone px-5 py-4">
            <div>
              <h2 id="return-modal-title" className="text-base font-semibold text-brand-ink">
                ✈️ Renvoyer l&apos;aile
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Comment l&apos;aile quitte l&apos;école ?
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-brand-cream hover:text-brand-ink"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto px-5 py-4 space-y-3">
            {/* Option recommandée d'abord, avec badge "Recommandé" et
                auto-sélection. Les 3 autres sont cachées derrière le toggle
                "Autre option" — pour ne pas noyer le moniteur. */}
            {returnOptions
              .filter((o) => o.key === recommendedOption)
              .map((o) => (
                <ReturnOptionCard
                  key={o.key}
                  emoji={o.emoji}
                  title={o.title}
                  description={o.description}
                  isSelected={returnOption === o.key}
                  onClick={() => selectReturnOption(o.key)}
                  isRecommended
                  scanRequired={o.requiresScan && !scannedReturnOptions.has(o.key)}
                >
                  {renderReturnContent(o.key)}
                </ReturnOptionCard>
              ))}

            {!showOtherReturnOptions ? (
              <button
                type="button"
                onClick={() => setShowOtherReturnOptions(true)}
                className="w-full rounded-xl border border-dashed border-brand-stone bg-brand-cream/30 py-3 text-sm font-medium text-brand-navy/70 hover:border-brand-gold/50 hover:bg-brand-cream"
              >
                Autre option ↓
              </button>
            ) : (
              <>
                <p className="pt-1 text-[11px] font-semibold uppercase tracking-wider text-brand-navy/50">
                  Autres possibilités
                </p>
                {returnOptions
                  .filter((o) => o.key !== recommendedOption)
                  .map((o) => (
                    <ReturnOptionCard
                      key={o.key}
                      emoji={o.emoji}
                      title={o.title}
                      description={o.description}
                      isSelected={returnOption === o.key}
                      onClick={() => selectReturnOption(o.key)}
                      scanRequired={o.requiresScan && !scannedReturnOptions.has(o.key)}
                    >
                      {renderReturnContent(o.key)}
                    </ReturnOptionCard>
                  ))}
              </>
            )}

            {returnError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {returnError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Scan gate empilé APRÈS la modal parente — les 2 sont z-50, l'ordre
          DOM décide. Bug historique : rendu avant, le scanner était invisible
          sur mobile car caché derrière la modal parente. */}
      <ScanGateModal
        open={returnScanGateFor !== null}
        onClose={() => setReturnScanGateFor(null)}
        onScanSuccess={handleReturnScanSuccess}
        expectedSerial={wingSerial}
        title="Avant le bon de transport"
        subtitle={
          returnScanGateFor === 'to_workshop'
            ? "Scannez l'aile avant de générer l'étiquette école → atelier."
            : "Scannez l'aile avant de générer l'étiquette de renvoi au client."
        }
      />
    </>
  )
}

function ReturnOptionCard({
  emoji, title, description, isSelected, onClick,
  scanRequired = false, isRecommended = false, children,
}: {
  emoji:         string
  title:         string
  description:   string
  isSelected:    boolean
  onClick:       () => void
  scanRequired?: boolean
  isRecommended?: boolean
  children:      ReactNode
}) {
  return (
    <div
      className={`rounded-2xl border-2 transition-all ${
        isSelected
          ? 'border-brand-gold bg-brand-gold/5 shadow-soft'
          : 'border-brand-stone bg-white hover:border-brand-gold/40'
      }`}
    >
      {/* `touch-manipulation` désactive les délais de tap iOS. */}
      <button
        type="button"
        onClick={onClick}
        className="flex w-full touch-manipulation items-start gap-3 p-4 text-left"
      >
        <span aria-hidden className="text-2xl">{emoji}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-brand-ink">
            {title}
            {isRecommended && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                ✨ Recommandé
              </span>
            )}
            {scanRequired && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-gold/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
                📷 Scan requis
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">{description}</p>
        </div>
        <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
          isSelected
            ? 'border-brand-gold bg-brand-gold text-white'
            : 'border-brand-stone bg-white text-transparent'
        }`} aria-hidden>✓</span>
      </button>
      {isSelected && (
        <div className="border-t border-brand-stone/60 p-4">{children}</div>
      )}
    </div>
  )
}
