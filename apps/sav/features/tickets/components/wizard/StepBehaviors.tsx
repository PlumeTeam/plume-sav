'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import { WING_BEHAVIOR_TYPES } from '../../types'
import { StepLayout, StepNav } from './StepLayout'

interface StepBehaviorsProps {
  onNext: () => void
  onBack: () => void
}

export function StepBehaviors({ onNext, onBack }: StepBehaviorsProps) {
  const { problem, setProblem } = useWizardStore()
  const [selected, setSelected] = useState<string[]>(problem.wingBehaviors ?? [])

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])
  }

  function handleNext() {
    if (selected.length === 0) return
    setProblem({ wingBehaviors: selected })
    onNext()
  }

  return (
    <StepLayout
      title="Quels comportements ?"
      subtitle="Sélectionnez tout ce que vous observez. Vous pourrez détailler à l'étape suivante."
      footer={
        <StepNav
          onBack={onBack}
          onNext={handleNext}
          nextDisabled={selected.length === 0}
          nextLabel={selected.length === 0
            ? 'Sélectionnez au moins un'
            : `Continuer · ${selected.length} sélectionné${selected.length > 1 ? 's' : ''}`}
        />
      }
    >
      <div className="space-y-2">
        {WING_BEHAVIOR_TYPES.map((behavior) => {
          const checked = selected.includes(behavior.id)
          return (
            <label
              key={behavior.id}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all active:scale-[0.99] ${
                checked
                  ? 'border-brand-coral bg-brand-coral/5'
                  : 'border-brand-stone bg-white hover:border-brand-coral/40'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(behavior.id)}
                className="mt-0.5 h-5 w-5 rounded border-brand-stone text-brand-coral focus:ring-brand-coral"
              />
              <span className="text-sm text-brand-ink">{behavior.label}</span>
            </label>
          )
        })}
      </div>
    </StepLayout>
  )
}
