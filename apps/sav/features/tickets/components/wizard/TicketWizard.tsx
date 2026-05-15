'use client'

import { useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useWizardStore, buildWizardFlow, type StepId } from '../../store'
import { REQUEST_TYPE_CONFIG } from '../../types'
import type { RequestType } from '../../types'
import { WizardProgress } from './WizardProgress'
import { StepWingInfo } from './StepWingInfo'
import { StepWingHistory } from './StepWingHistory'
import { StepProblemCategory } from './StepProblemCategory'
import { StepBehaviors } from './StepBehaviors'
import { StepDescription } from './StepDescription'
import { StepUrgency } from './StepUrgency'
import { StepPhotos } from './StepPhotos'
import { StepSchool } from './StepSchool'
import { StepWorkshop } from './StepWorkshop'
import { StepDelivery } from './StepDelivery'
import { StepMessage } from './StepMessage'
import { StepReview } from './StepReview'
import { PlumeLogo } from '@/app/_components/PlumeLogo'
import type { ClientWing, PartnerSchool, PlumeSettings } from '../../queries'
import type { PartnerWorkshop } from '../../constants'

const VALID_REQUEST_TYPES: RequestType[] = ['repair', 'inspection', 'manufacturing_defect']

interface TicketWizardProps {
  wings?:     ClientWing[]
  schools?:   PartnerSchool[]
  workshops?: PartnerWorkshop[]
  /** Politique garantie courante — passée aux steps post-sélection wing
   *  pour afficher le tier preview (banner + branchements conditionnels). */
  policy:     PlumeSettings
}

export function TicketWizard({
  wings = [],
  schools = [],
  workshops = [],
  policy,
}: TicketWizardProps) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const urlType      = searchParams.get('type')

  const {
    requestType, setRequestType,
    currentStepId, setStepId,
    problem, wingInfo,
  } = useWizardStore()

  // Synchronise le type de demande avec l'URL. Quand le client arrive depuis
  // la WingCard (?type=repair par ex), on rebascule sur ce type. Si l'URL ne
  // précise rien, on garde la valeur déjà en store (utile pour les retours
  // arrière du navigateur).
  useEffect(() => {
    if (urlType && VALID_REQUEST_TYPES.includes(urlType as RequestType)) {
      if (urlType !== requestType) {
        setRequestType(urlType as RequestType)
        // Repartir au début quand le type change — les étapes diffèrent.
        setStepId('wing')
      }
    }
  }, [urlType, requestType, setRequestType, setStepId])

  // Compute the dynamic flow based on the current request type, the answers,
  // and the wing's purchase date for warranty routing.
  const flow = useMemo<StepId[]>(
    () => buildWizardFlow({
      requestType,
      problemCategory: problem.problemCategory || undefined,
      purchaseDate:    wingInfo.purchaseDate || null,
    }),
    [requestType, problem.problemCategory, wingInfo.purchaseDate]
  )

  useEffect(() => {
    if (!flow.includes(currentStepId)) {
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
  const typeCfg     = REQUEST_TYPE_CONFIG[requestType]

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="sticky top-0 z-20 bg-brand-navy/95 backdrop-blur supports-[backdrop-filter]:bg-brand-navy/85">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {!isFirstStep ? (
            <button
              onClick={back}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Étape précédente"
            >
              ←
            </button>
          ) : (
            <button
              onClick={cancel}
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Annuler"
            >
              ×
            </button>
          )}
          <div className="flex-1 text-center">
            <h1 className="text-xs font-medium uppercase tracking-[0.12em] text-white/80">
              Nouvelle demande SAV
            </h1>
            <p className="mt-0.5 text-xs font-semibold text-white">
              <span aria-hidden className="mr-1">{typeCfg.emoji}</span>
              {typeCfg.label}
            </p>
          </div>
          <span aria-hidden className="flex h-10 w-10 items-center justify-center">
            <PlumeLogo size="sm" variant="light" />
          </span>
        </div>
        <WizardProgress flow={flow} currentId={currentStepId} />
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 py-4">
        <div key={currentStepId}>
          {currentStepId === 'wing'             && <StepWingInfo wings={wings} onNext={next} />}
          {currentStepId === 'wing-history'     && <StepWingHistory onNext={next} onBack={back} />}
          {currentStepId === 'problem-category' && <StepProblemCategory onNext={next} onBack={back} />}
          {currentStepId === 'behaviors'        && <StepBehaviors onNext={next} onBack={back} />}
          {currentStepId === 'description'      && <StepDescription onNext={next} onBack={back} />}
          {currentStepId === 'urgency'          && <StepUrgency onNext={next} onBack={back} />}
          {currentStepId === 'photos'           && <StepPhotos onNext={next} onBack={back} />}
          {currentStepId === 'school'           && <StepSchool schools={schools} policy={policy} onNext={next} onBack={back} />}
          {currentStepId === 'workshop'         && <StepWorkshop workshops={workshops} onNext={next} onBack={back} />}
          {currentStepId === 'delivery'         && <StepDelivery schools={schools} workshops={workshops} onNext={next} onBack={back} />}
          {currentStepId === 'message'          && <StepMessage onNext={next} onBack={back} />}
          {currentStepId === 'review'           && <StepReview schools={schools} workshops={workshops} onBack={back} />}
        </div>
      </main>
    </div>
  )
}
