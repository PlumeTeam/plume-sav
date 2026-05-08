import { buildJourneySteps } from '../utils'
import { formatDateTime } from '../utils'
import type { Ticket } from '../types'

interface ClientJourneyTimelineProps {
  ticket: Pick<
    Ticket,
    | 'created_at'
    | 'status'
    | 'school_resolution'
    | 'school_acknowledged_at'
    | 'wing_received_school_at'
    | 'school_resolved_at'
    | 'escalated_to_workshop_at'
    | 'wing_received_workshop_at'
    | 'workshop_diagnosis_at'
    | 'workshop_repair_done_at'
    | 'wing_returned_at'
  >
}

/**
 * Timeline verticale du parcours SAV vu par le client. Read-only :
 * elle reflète l'avancement réel d'après les colonnes timestamp de
 * service_requests.
 *
 * Étapes done = vertes, current = surlignée gold + dot animé, upcoming = grises.
 * La branche atelier n'apparaît que si le ticket a été escaladé.
 */
export function ClientJourneyTimeline({ ticket }: ClientJourneyTimelineProps) {
  const steps = buildJourneySteps(ticket)

  return (
    <ol className="relative space-y-1">
      {/* Ligne verticale en arrière-plan, alignée sur le centre des bullets */}
      <span
        aria-hidden
        className="absolute left-[19px] top-3 bottom-3 w-px bg-brand-stone"
      />

      {steps.map((step) => {
        const dotClass =
          step.state === 'done'
            ? 'bg-emerald-500 text-white'
            : step.state === 'current'
              ? 'bg-brand-gold text-white ring-4 ring-brand-gold/20'
              : 'bg-white text-slate-400 ring-2 ring-brand-stone'

        const labelClass =
          step.state === 'done'
            ? 'text-slate-500'
            : step.state === 'current'
              ? 'font-semibold text-brand-ink'
              : 'text-slate-400'

        return (
          <li key={step.id} className="relative flex items-start gap-4 py-2">
            <div
              className={`relative z-[1] flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${dotClass}`}
              aria-hidden
            >
              {step.state === 'done' ? '✓' : <span className="text-base">{step.emoji}</span>}
            </div>

            <div className="min-w-0 flex-1 pt-1">
              <p className={`text-sm ${labelClass}`}>{step.label}</p>
              {step.at && step.state !== 'upcoming' && (
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {formatDateTime(step.at)}
                </p>
              )}
              {step.state === 'current' && (
                <p className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-gold">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-gold animate-pulse-dot" aria-hidden />
                  En cours
                </p>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
