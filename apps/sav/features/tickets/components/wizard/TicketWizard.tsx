'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore } from '../../store'
import { WizardProgress } from './WizardProgress'
import { StepWingInfo } from './StepWingInfo'
import { StepProblem } from './StepProblem'
import { StepPhotos } from './StepPhotos'
import { StepReview } from './StepReview'
import { PlumeLogo } from '@/app/_components/PlumeLogo'
import type { ClientWing } from '../../queries'

const STEPS = ['Votre aile', 'Le problème', 'Photos', 'Vérification']
const TOTAL_STEPS = STEPS.length

interface TicketWizardProps {
  wings?: ClientWing[]
}

export function TicketWizard({ wings = [] }: TicketWizardProps) {
  const router = useRouter()
  const { currentStep, setStep } = useWizardStore()

  // Wizard mounts at step 1 by default; clamp persisted state to a valid step.
  useEffect(() => {
    if (currentStep < 1 || currentStep > TOTAL_STEPS) setStep(1)
  }, [currentStep, setStep])

  function next() {
    if (currentStep < TOTAL_STEPS) setStep(currentStep + 1)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function back() {
    if (currentStep > 1) setStep(currentStep - 1)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancel() {
    if (typeof window !== 'undefined' && window.confirm('Abandonner le ticket en cours ? Vos saisies seront perdues.')) {
      useWizardStore.getState().reset()
      router.push('/client')
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <header className="sticky top-0 z-20 border-b border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {currentStep > 1 ? (
            <button
              onClick={back}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink active:bg-brand-cream"
              aria-label="Étape précédente"
            >
              ←
            </button>
          ) : (
            <button
              onClick={cancel}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink active:bg-brand-cream"
              aria-label="Annuler"
            >
              ×
            </button>
          )}
          <h1 className="flex-1 text-center text-sm font-semibold text-brand-ink">
            Nouveau ticket SAV
          </h1>
          <span aria-hidden className="flex h-10 w-10 items-center justify-center">
            <PlumeLogo size="sm" />
          </span>
        </div>
        <WizardProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} labels={STEPS} />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 py-4">
        {currentStep === 1 && <StepWingInfo wings={wings} onNext={next} />}
        {currentStep === 2 && <StepProblem onNext={next} onBack={back} />}
        {currentStep === 3 && <StepPhotos onNext={next} onBack={back} />}
        {currentStep === 4 && <StepReview onBack={back} />}
      </main>
    </div>
  )
}
