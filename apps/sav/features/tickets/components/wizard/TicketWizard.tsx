'use client'

import { useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardStore, buildWizardFlow, type StepId } from '../../store'
import { WizardProgress } from './WizardProgress'
import { StepWingInfo } from './StepWingInfo'
import { StepWingHistory } from './StepWingHistory'
import { StepProblemCategory } from './StepProblemCategory'
import { StepBehaviors } from './StepBehaviors'
import { StepDescription } from './StepDescription'
import { StepUrgency } from './StepUrgency'
import { StepPhotos } from './StepPhotos'
import { StepSchool } from './StepSchool'
import { StepDelivery } from './StepDelivery'
import { StepMessage } from './StepMessage'
import { StepReview } from './StepReview'
import { PlumeLogo } from '@/app/_components/PlumeLogo'
import type { ClientWing, PartnerSchool } from '../../queries'

interface TicketWizardProps {
  wings?:   ClientWing[]
  schools?: PartnerSchool[]
}

export function TicketWizard({ wings = [], schools = [] }: TicketWizardProps) {
  const router = useRouter()
  const { currentStepId, setStepId, problem } = useWizardStore()

  // Compute the dynamic flow based on current answers
  const flow = useMemo<StepId[]>(
    () => buildWizardFlow(problem.problemCategory),
    [problem.problemCategory]
  )

  // If the current step disappeared from the flow (e.g. user changed
  // problem-category from 'other' to something visual after picking
  // behaviors), rewind to the last valid step.
  useEffect(() => {
    if (!flow.includes(currentStepId)) {
      // Walk back up the flow to find a still-valid step.
      const fallback = flow[flow.length - 1] ?? 'wing'
      setStepId(fallback)
      return
    }
  }, [flow, currentStepId, setStepId])

  function go(direction: 'next' | 'back') {
    const idx = flow.indexOf(currentStepId)
    if (idx === -1) return
    const target = direction === 'next' ? flow[idx + 1] : flow[idx - 1]
    if (target) {
      setStepId(target)
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const next = () => go('next')
  const back = () => go('back')

  function cancel() {
    if (typeof window !== 'undefined' && window.confirm('Abandonner la demande en cours ? Vos saisies seront perdues.')) {
      useWizardStore.getState().reset()
      router.push('/client')
    }
  }

  const isFirstStep = flow.indexOf(currentStepId) === 0

  return (
    <div className="flex min-h-screen flex-col bg-brand-cream">
      <header className="sticky top-0 z-20 border-b border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {!isFirstStep ? (
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
            Nouvelle demande SAV
          </h1>
          <span aria-hidden className="flex h-10 w-10 items-center justify-center">
            <PlumeLogo size="sm" />
          </span>
        </div>
        <WizardProgress flow={flow} currentId={currentStepId} />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 py-4">
        {/* `key` re-mounts each step so the slide-up animation triggers on every nav */}
        <div key={currentStepId}>
          {currentStepId === 'wing'             && <StepWingInfo wings={wings} onNext={next} />}
          {currentStepId === 'wing-history'     && <StepWingHistory onNext={next} onBack={back} />}
          {currentStepId === 'problem-category' && <StepProblemCategory onNext={next} onBack={back} />}
          {currentStepId === 'behaviors'        && <StepBehaviors onNext={next} onBack={back} />}
          {currentStepId === 'description'      && <StepDescription onNext={next} onBack={back} />}
          {currentStepId === 'urgency'          && <StepUrgency onNext={next} onBack={back} />}
          {currentStepId === 'photos'           && <StepPhotos onNext={next} onBack={back} />}
          {currentStepId === 'school'           && <StepSchool schools={schools} onNext={next} onBack={back} />}
          {currentStepId === 'delivery'         && <StepDelivery schools={schools} onNext={next} onBack={back} />}
          {currentStepId === 'message'          && <StepMessage onNext={next} onBack={back} />}
          {currentStepId === 'review'           && <StepReview schools={schools} onBack={back} />}
        </div>
      </main>
    </div>
  )
}
