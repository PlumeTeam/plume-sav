import { TIMELINE_STEPS, getStatusStep } from '../utils'
import type { RequestStatus } from '../types'

interface TicketTimelineProps {
  status: RequestStatus
}

export function TicketTimeline({ status }: TicketTimelineProps) {
  const currentStep = getStatusStep(status)

  if (status === 'rejected' || status === 'cancelled') {
    return (
      <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {status === 'rejected' ? 'Ticket rejeté' : 'Ticket annulé'}
      </div>
    )
  }

  return (
    <ol className="space-y-3">
      {TIMELINE_STEPS.map((step, idx) => {
        const stepIdx = idx + 1
        const isDone    = currentStep >= stepIdx + 1
        const isCurrent = currentStep === stepIdx
        return (
          <li key={step.status} className="flex items-center gap-3">
            <div
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isDone
                  ? 'bg-emerald-500 text-white'
                  : isCurrent
                  ? 'bg-brand-gold text-white ring-4 ring-brand-gold/20'
                  : 'bg-brand-stone text-slate-400'
              }`}
              aria-hidden
            >
              {isDone ? '✓' : stepIdx}
            </div>
            <span
              className={`text-sm ${
                isDone    ? 'text-slate-500' :
                isCurrent ? 'font-semibold text-brand-ink' :
                'text-slate-400'
              }`}
            >
              {step.label}
            </span>
            {isCurrent && (
              <span className="ml-auto h-2 w-2 rounded-full bg-brand-gold animate-pulse-dot" aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}
