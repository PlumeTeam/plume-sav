'use client'

import { useWizardStore } from '../../store'
import { WizardProgress } from './WizardProgress'
import { StepWingInfo } from './StepWingInfo'
import { StepProblem } from './StepProblem'
import { StepPhotos } from './StepPhotos'
import { StepReview } from './StepReview'

const STEPS = ['Votre aile', 'Le problème', 'Photos', 'Vérification']
const TOTAL_STEPS = STEPS.length

export function TicketWizard() {
  const { currentStep, setStep } = useWizardStore()

  function next() {
    if (currentStep < TOTAL_STEPS) setStep(currentStep + 1)
  }

  function back() {
    if (currentStep > 1) setStep(currentStep - 1)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          {currentStep > 1 ? (
            <button
              onClick={back}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
              aria-label="Étape précédente"
            >
              ←
            </button>
          ) : (
            <a
              href="/client"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 active:bg-slate-100"
              aria-label="Annuler"
            >
              ×
            </a>
          )}
          <h1 className="flex-1 text-center text-base font-semibold text-slate-900">
            Nouveau ticket SAV
          </h1>
          <div className="h-10 w-10" aria-hidden /> {/* Spacer for centering */}
        </div>
        <WizardProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} labels={STEPS} />
      </header>

      {/* Step content */}
      <main className="py-4">
        {currentStep === 1 && <StepWingInfo onNext={next} />}
        {currentStep === 2 && <StepProblem onNext={next} onBack={back} />}
        {currentStep === 3 && <StepPhotos onNext={next} onBack={back} />}
        {currentStep === 4 && <StepReview onBack={back} />}
      </main>
    </div>
  )
}
