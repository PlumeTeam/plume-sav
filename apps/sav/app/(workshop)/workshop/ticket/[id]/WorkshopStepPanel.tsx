'use client'

import { useState, useTransition } from 'react'
import {
  markWingReceivedWorkshopAction,
  startWorkshopDiagnosisAction,
  startWorkshopRepairAction,
  markWorkshopDoneAction,
  markWingReturnedAction,
} from '@/features/tickets/actions'
import { formatDateTime, statusGte } from '@/features/tickets/utils'
import type { RequestStatus } from '@/features/tickets/types'

interface WorkshopStepPanelProps {
  ticketId:                string
  status:                  RequestStatus
  wingReceivedWorkshopAt:  string | null
  workshopDiagnosisAt:     string | null
  workshopRepairDoneAt:    string | null
  wingReturnedAt:          string | null
}

type StepKey = 'received' | 'diagnose' | 'repair' | 'done' | 'returned'

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
    'wingReceivedWorkshopAt' | 'workshopDiagnosisAt' | 'workshopRepairDoneAt' | 'wingReturnedAt'
  > | null
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
  },
  {
    key:        'diagnose',
    label:      'Diagnostic en cours',
    helpText:   "Lance le diagnostic technique. Vous pouvez remplir la checklist en parallèle.",
    emoji:      '🔬',
    activeWhen: ['wing_received_workshop'],
    doneFrom:   'workshop_diagnosing',
    tsKey:      'workshopDiagnosisAt',
  },
  {
    key:        'repair',
    label:      'Réparation en cours',
    helpText:   "Confirme le passage en réparation effective.",
    emoji:      '🔧',
    activeWhen: ['workshop_diagnosing'],
    doneFrom:   'workshop_repairing',
    tsKey:      null, // pas de colonne dédiée — démarrage matérialisé par le statut
  },
  {
    key:        'done',
    label:      'Réparation terminée',
    helpText:   "L'intervention est finie, l'aile est prête à repartir.",
    emoji:      '✓',
    activeWhen: ['workshop_repairing'],
    doneFrom:   'workshop_done',
    tsKey:      'workshopRepairDoneAt',
  },
  {
    key:        'returned',
    label:      'Aile renvoyée',
    helpText:   "Une fois expédiée à l'école ou directement au client, marquez l'aile comme renvoyée.",
    emoji:      '✈️',
    activeWhen: ['workshop_done'],
    doneFrom:   'wing_returned',
    tsKey:      'wingReturnedAt',
  },
]

export function WorkshopStepPanel(props: WorkshopStepPanelProps) {
  const { ticketId, status } = props
  const [isPending, startTransition] = useTransition()
  const [recipient, setRecipient]   = useState<'school' | 'client'>('school')
  const [errorMsg, setErrorMsg]     = useState<string | null>(null)

  function handleStep(key: StepKey) {
    setErrorMsg(null)
    startTransition(async () => {
      const fd = new FormData()
      fd.set('ticketId', ticketId)
      if (key === 'returned') fd.set('recipient', recipient)

      const r =
        key === 'received' ? await markWingReceivedWorkshopAction(fd) :
        key === 'diagnose' ? await startWorkshopDiagnosisAction(fd)   :
        key === 'repair'   ? await startWorkshopRepairAction(fd)      :
        key === 'done'     ? await markWorkshopDoneAction(fd)         :
        key === 'returned' ? await markWingReturnedAction(fd)         :
        null

      if (!r) return
      if ('error' in r && r.error) {
        const msg = (r.error._form as string[] | undefined)?.[0] ?? 'Erreur'
        setErrorMsg(msg)
      }
      // Succès : pas de toast — le timestamp « ✓ Validé le … » apparaît
      // directement sur l'étape après revalidation côté serveur. Plus visible
      // et traçable qu'un toast qui disparaît au bout de 1.8 s.
    })
  }

  // Ticket pas encore escaladé → on affiche un placeholder explicatif.
  if (!statusGte(status, 'escalated_to_workshop')) {
    return (
      <div className="rounded-card border border-brand-stone bg-brand-cream p-4 text-sm text-slate-600">
        L&apos;école n&apos;a pas encore escaladé ce ticket vers l&apos;atelier.
        Les étapes apparaîtront ici dès qu&apos;elle aura confié l&apos;aile.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {errorMsg && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {errorMsg}
        </p>
      )}

      {STEPS.map((step, idx) => {
        const isDone   = statusGte(status, step.doneFrom)
        const isActive = step.activeWhen.includes(status) && !isDone
        const isLocked = !isActive && !isDone
        const at       = step.tsKey ? props[step.tsKey] : null

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
                </p>
                {/* helpText caché sur mobile (gain de place) ; line-clamp-2 sur desktop. */}
                <p className="mt-0.5 hidden text-xs text-slate-500 sm:line-clamp-2 sm:block">{step.helpText}</p>

                {/* Recipient picker — only on the "returned" active step */}
                {step.key === 'returned' && isActive && (
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <span className="text-slate-500">Destination&nbsp;:</span>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="recipient"
                        value="school"
                        checked={recipient === 'school'}
                        onChange={() => setRecipient('school')}
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
                        onChange={() => setRecipient('client')}
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
  )
}
