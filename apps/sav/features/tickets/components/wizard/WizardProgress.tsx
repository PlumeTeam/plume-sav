import type { StepId } from '../../store'
import { STEP_LABELS } from '../../store'

interface WizardProgressProps {
  flow:        StepId[]
  currentId:   StepId
}

export function WizardProgress({ flow, currentId }: WizardProgressProps) {
  const total       = flow.length
  const currentIdx  = Math.max(0, flow.indexOf(currentId))
  const currentNum  = currentIdx + 1
  const pct         = (currentNum / total) * 100

  return (
    <div className="px-4 pb-3 pt-2">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-white/60">
          Étape {currentNum}/{total}
        </p>
        <p className="text-sm font-medium text-white">
          {STEP_LABELS[currentId]}
        </p>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/15"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={currentNum}
        aria-label={STEP_LABELS[currentId]}
      >
        <div
          className="h-full rounded-full bg-brand-gold transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
