'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import { PROBLEM_CATEGORIES } from '../../types'
import type { ProblemCategory } from '../../types'
import { StepLayout, StepNav } from './StepLayout'

interface StepProblemCategoryProps {
  onNext: () => void
  onBack: () => void
}

type Choice = ProblemCategory | 'wing_behavior'

export function StepProblemCategory({ onNext, onBack }: StepProblemCategoryProps) {
  const { problem, setProblem } = useWizardStore()

  const initial: Choice | '' =
    problem.problemCategory === 'other' && (problem.wingBehaviors?.length ?? 0) > 0
      ? 'wing_behavior'
      : (problem.problemCategory as Choice | '') || ''

  const [selected, setSelected] = useState<Choice | ''>(initial)

  function handleNext() {
    if (!selected) return
    if (selected === 'wing_behavior') {
      // Comportement = problemCategory 'other' + wingBehaviors filled in next step
      setProblem({ problemCategory: 'other' })
    } else {
      // Sortie du flow comportement → on vide les behaviors si présent
      setProblem({ problemCategory: selected as ProblemCategory, wingBehaviors: [] })
    }
    onNext()
  }

  return (
    <StepLayout
      title="Quel type de problème ?"
      subtitle="Choisissez la catégorie qui correspond le mieux à ce que vous observez."
      footer={
        <StepNav
          onBack={onBack}
          onNext={handleNext}
          nextDisabled={!selected}
          nextLabel="Continuer"
        />
      }
    >
      <div className="grid grid-cols-2 gap-3">
        {/* Carte spéciale comportement en premier */}
        <button
          key="wing_behavior"
          type="button"
          onClick={() => setSelected('wing_behavior')}
          className={`flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.97] ${
            selected === 'wing_behavior'
              ? 'border-brand-coral bg-brand-coral/10 shadow-plume'
              : 'border-brand-stone bg-white hover:border-brand-coral/40'
          }`}
        >
          <span className="mb-1 text-2xl" aria-hidden>🪂</span>
          <span className="text-sm font-semibold leading-tight text-brand-ink">Comportement</span>
          <span className="mt-1 text-xs leading-tight text-slate-500">
            Comportement anormal de l&apos;aile
          </span>
        </button>

        {PROBLEM_CATEGORIES.map((cat) => {
          const isSelected = selected === cat.value
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => setSelected(cat.value)}
              className={`flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.97] ${
                isSelected
                  ? 'border-brand-coral bg-brand-coral/10 shadow-plume'
                  : 'border-brand-stone bg-white hover:border-brand-coral/40'
              }`}
            >
              <span className="mb-1 text-2xl" aria-hidden>{cat.emoji}</span>
              <span className="text-sm font-semibold leading-tight text-brand-ink">{cat.label}</span>
              <span className="mt-1 text-xs leading-tight text-slate-500">{cat.description}</span>
            </button>
          )
        })}
      </div>
    </StepLayout>
  )
}
