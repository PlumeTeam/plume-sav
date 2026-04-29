import { TIMELINE_STEPS, getStatusStep } from '../utils'
import type { TicketStatus } from '../types'

interface TicketTimelineProps {
  status: TicketStatus
}

export function TicketTimeline({ status }: TicketTimelineProps) {
  const currentStep = getStatusStep(status)

  if (status === 'rejected') {
    return (
      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        Ticket rejeté
      </div>
    )
  }

  return (
    <ol className="space-y-3">
      {TIMELINE_STEPS.map((step, idx) => {
        const stepIdx = idx + 1
        const isDone = currentStep >= stepIdx + 1
        const isCurrent = currentStep === stepIdx
        return (
          <li key={step.status} className="flex items-center gap-3">
            <div
              className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                isDone
                  ? 'bg-green-500 text-white'
                  : isCurrent
                  ? 'bg-slate-900 text-white ring-4 ring-slate-200'
                  : 'bg-slate-100 text-slate-400'
              }`}
              aria-hidden
            >
              {isDone ? '✓' : stepIdx}
            </div>
            <span
              className={`text-sm ${
                isDone
                  ? 'text-slate-400 line-through'
                  : isCurrent
                  ? 'font-semibold text-slate-900'
                  : 'text-slate-400'
              }`}
            >
              {step.label}
            </span>
            {isCurrent && (
              <span className="ml-auto flex h-2 w-2 rounded-full bg-slate-900 animate-pulse" aria-hidden />
            )}
          </li>
        )
      })}
    </ol>
  )
}
