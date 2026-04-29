interface WizardProgressProps {
  currentStep: number
  totalSteps: number
  labels: string[]
}

export function WizardProgress({ currentStep, totalSteps, labels }: WizardProgressProps) {
  return (
    <div className="px-4 pt-4 pb-2">
      {/* Step counter */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          {labels[currentStep - 1] ?? `Étape ${currentStep}`}
        </p>
        <p className="text-xs text-slate-400">{currentStep}/{totalSteps}</p>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-900 transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      <div className="mt-2 flex justify-between">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-colors ${
              i + 1 <= currentStep ? 'bg-slate-900' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
