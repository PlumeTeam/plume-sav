'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  acknowledgeTicketAction,
  markWingReceivedSchoolAction,
  startSchoolCheckAction,
} from '@/features/tickets/actions'
import { formatDateTime } from '@/features/tickets/utils'
import type { RequestStatus } from '@/features/tickets/types'

interface SchoolStepPanelProps {
  ticketId:                string
  status:                  RequestStatus
  schoolAcknowledgedAt:    string | null
  wingReceivedSchoolAt:    string | null
  isCheckValidated:        boolean
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
  },
  {
    key:        'wing',
    label:      'Aile reçue',
    helpText:   "À cliquer quand l'aile est physiquement chez vous (en main propre ou via la poste).",
    emoji:      '📥',
    activeWhen: ['school_acknowledged'],
    doneWhen:   (s) =>
      s !== 'pending' && s !== 'school_acknowledged',
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
  },
]

export function SchoolStepPanel({
  ticketId,
  status,
  schoolAcknowledgedAt,
  wingReceivedSchoolAt,
  isCheckValidated,
}: SchoolStepPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleStep(key: StepKey) {
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

  const timestampByKey: Record<StepKey, string | null> = {
    ack:   schoolAcknowledgedAt,
    wing:  wingReceivedSchoolAt,
    check: null, // matérialisé par le remplissage de school_checklist
  }

  return (
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
    </div>
  )
}
