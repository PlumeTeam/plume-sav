interface WizardProgressProps {
  currentStep: number
  totalSteps: number
  labels: string[]
}

export function WizardProgress({ currentStep, totalSteps, labels }: WizardProgressProps) {
  return (
    <div className="px-4 pb-3 pt-2">
      <div className="mb-2 flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">
          Étape {currentStep}/{totalSteps}
        </p>
        <p className="text-sm font-semibold text-brand-ink">
          {labels[currentStep - 1] ?? ''}
        </p>
      </div>

      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-brand-stone"
        role="progressbar"
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={currentStep}
      >
        <div
          className="h-full rounded-full bg-brand-coral transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  )
}
