'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import { StepLayout, StepNav } from './StepLayout'

interface StepDescriptionProps {
  onNext: () => void
  onBack: () => void
}

const MIN_LENGTH = 10
const MAX_LENGTH = 2000

const TITLE_BY_TYPE: Record<string, { title: string; subtitle: string; placeholder: string }> = {
  repair: {
    title:       'Décrivez le dommage',
    subtitle:    'Où, quand, comment ? Plus vous êtes précis, plus le diagnostic sera rapide.',
    placeholder: 'Ex : déchirure de 8 cm sur le bord de fuite, panneau central, repérée au pliage après vol au Mont-Saxonnex.',
  },
  manufacturing_defect: {
    title:       'Décrivez le défaut suspecté',
    subtitle:    'Qu\'est-ce qui vous fait penser à un défaut de fabrication ? Soyez précis sur ce que vous observez.',
    placeholder: 'Ex : la couture du panneau central s\'est ouverte spontanément après 5 heures de vol. Aucun choc, conditions calmes.',
  },
}

export function StepDescription({ onNext, onBack }: StepDescriptionProps) {
  const { requestType, problem, setProblem } = useWizardStore()
  const [text, setText] = useState(problem.problemDescription)

  function handleNext() {
    if (text.trim().length < MIN_LENGTH) return
    setProblem({ problemDescription: text.trim() })
    onNext()
  }

  const cfg   = TITLE_BY_TYPE[requestType] ?? TITLE_BY_TYPE.repair!
  const len   = text.trim().length
  const valid = len >= MIN_LENGTH && len <= MAX_LENGTH

  return (
    <StepLayout
      title={cfg.title}
      subtitle={cfg.subtitle}
      footer={
        <StepNav
          onBack={onBack}
          onNext={handleNext}
          nextDisabled={!valid}
          nextLabel={
            len < MIN_LENGTH
              ? `Encore ${MIN_LENGTH - len} caractères`
              : 'Continuer'
          }
        />
      }
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        autoFocus
        maxLength={MAX_LENGTH}
        placeholder={cfg.placeholder}
        className="field-input min-h-[200px] resize-y"
      />
      <p className="mt-2 text-right text-xs text-slate-400">
        {len}/{MAX_LENGTH}
      </p>
    </StepLayout>
  )
}
