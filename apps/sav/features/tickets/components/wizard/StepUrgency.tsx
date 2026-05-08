'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import type { UrgencyLevel } from '../../types'
import { StepLayout, StepNav } from './StepLayout'

interface StepUrgencyProps {
  onNext: () => void
  onBack: () => void
}

const OPTIONS: Array<{ value: UrgencyLevel; emoji: string; label: string; description: string }> = [
  {
    value: 'normal',
    emoji: '⏳',
    label: 'Normal',
    description: "Pas pressé. Délai habituel d'inspection sous 4-7 jours.",
  },
  {
    value: 'urgent',
    emoji: '🚨',
    label: 'Urgent',
    description: 'Stage prévu, vol important, problème de sécurité. Votre école sera notifiée en priorité.',
  },
]

export function StepUrgency({ onNext, onBack }: StepUrgencyProps) {
  const { problem, setProblem } = useWizardStore()
  const [selected, setSelected] = useState<UrgencyLevel>(problem.urgency || 'normal')

  function handleNext() {
    setProblem({ urgency: selected })
    onNext()
  }

  return (
    <StepLayout
      title="C'est urgent ?"
      subtitle="Réservez 'urgent' aux situations qui le justifient — l'école traite ces demandes en priorité."
      footer={<StepNav onBack={onBack} onNext={handleNext} nextLabel="Continuer" />}
    >
      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.value
          const isUrgent   = opt.value === 'urgent'
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99] ${
                isSelected
                  ? isUrgent
                    ? 'border-red-500 bg-red-50 shadow-soft'
                    : 'border-brand-gold bg-brand-gold/10 shadow-plume'
                  : 'border-brand-stone bg-white hover:border-brand-gold/40'
              }`}
            >
              <span className="text-3xl" aria-hidden>{opt.emoji}</span>
              <div className="flex-1">
                <p className={`text-base font-semibold ${isSelected && isUrgent ? 'text-red-800' : 'text-brand-ink'}`}>
                  {opt.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-600">{opt.description}</p>
              </div>
              <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                isSelected
                  ? isUrgent ? 'border-red-500 bg-red-500 text-white' : 'border-brand-gold bg-brand-gold text-white'
                  : 'border-brand-stone bg-white text-transparent'
              }`} aria-hidden>✓</span>
            </button>
          )
        })}
      </div>
    </StepLayout>
  )
}
