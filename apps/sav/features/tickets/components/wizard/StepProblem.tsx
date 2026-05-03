'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWizardStore } from '../../store'
import { problemSchema, type ProblemInput } from '../../schemas'
import { PROBLEM_CATEGORIES, WING_BEHAVIOR_TYPES } from '../../types'

interface StepProblemProps {
  onNext: () => void
  onBack: () => void
}

export function StepProblem({ onNext, onBack }: StepProblemProps) {
  const { problem, setProblem } = useWizardStore()
  const [isComportement, setIsComportement] = useState(false)
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([])

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProblemInput>({
    resolver: zodResolver(problemSchema),
    defaultValues: {
      problemCategory: problem.problemCategory as ProblemInput['problemCategory'] | undefined,
      problemDescription: problem.problemDescription,
      urgency: problem.urgency,
    },
  })

  const selectedCategory = watch('problemCategory')
  const urgency = watch('urgency')

  function toggleBehavior(behaviorId: string) {
    setSelectedBehaviors((prev) =>
      prev.includes(behaviorId)
        ? prev.filter((id) => id !== behaviorId)
        : [...prev, behaviorId]
    )
  }

  function handleComportementSelect() {
    setIsComportement(!isComportement)
    setSelectedBehaviors([])
    setValue('problemCategory', 'other', { shouldValidate: true })
  }

  function onSubmit(data: ProblemInput) {
    // If comportement is selected, prepend behaviors to description
    if (isComportement && selectedBehaviors.length > 0) {
      const behaviorLabels = selectedBehaviors
        .map((id) => WING_BEHAVIOR_TYPES.find((b) => b.id === id)?.label)
        .filter(Boolean)
      if (behaviorLabels.length > 0) {
        const prefix = `Comportements de l'aile:\n${behaviorLabels.map((label) => `• ${label}`).join('\n')}\n\n`
        data.problemDescription = prefix + (data.problemDescription || '')
      }
    }
    setProblem(data)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 px-4 pb-32">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Le problème</h2>
        <p className="mt-1 text-sm text-slate-500">
          Décrivez le problème rencontré avec votre voile.
        </p>
      </div>

      {/* Problem category — big touchable cards */}
      <div>
        <p className="mb-3 text-sm font-medium text-slate-700">
          Type de problème
        </p>
        <div className="grid grid-cols-2 gap-3">
          {/* Special card for wing behavior */}
          <button
            key="comportement"
            type="button"
            onClick={handleComportementSelect}
            className={`flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-colors active:scale-[0.97] ${
              isComportement
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700'
            }`}
          >
            <span className="mb-1 text-2xl" aria-hidden>🪂</span>
            <span className="text-sm font-semibold leading-tight">Comportement</span>
            <span className={`mt-1 text-xs leading-tight ${isComportement ? 'text-slate-300' : 'text-slate-400'}`}>
              Comportement anormal de l'aile
            </span>
          </button>

          {/* Standard problem categories */}
          {PROBLEM_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value && !isComportement
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => {
                  setIsComportement(false)
                  setSelectedBehaviors([])
                  setValue('problemCategory', cat.value, { shouldValidate: true })
                }}
                className={`flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-colors active:scale-[0.97] ${
                  isSelected
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <span className="mb-1 text-2xl" aria-hidden>{cat.emoji}</span>
                <span className="text-sm font-semibold leading-tight">{cat.label}</span>
                <span className={`mt-1 text-xs leading-tight ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {cat.description}
                </span>
              </button>
            )
          })}
        </div>
        {errors.problemCategory && (
          <p className="mt-2 text-xs text-red-600">{errors.problemCategory.message}</p>
        )}
        <input type="hidden" {...register('problemCategory')} />
      </div>

      {/* Wing behavior sub-categories */}
      {isComportement && (
        <div>
          <p className="mb-3 text-sm font-medium text-slate-700">
            Types de comportement (sélectionnez un ou plusieurs)
          </p>
          <div className="space-y-2">
            {WING_BEHAVIOR_TYPES.map((behavior) => (
              <label key={behavior.id} className="flex items-start gap-3 rounded-lg border border-slate-200 p-3 cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={selectedBehaviors.includes(behavior.id)}
                  onChange={() => toggleBehavior(behavior.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900"
                />
                <span className="text-sm text-slate-700">{behavior.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Description détaillée
        </label>
        <textarea
          {...register('problemDescription')}
          rows={4}
          placeholder="Décrivez précisément le problème : où, quand, comment cela s'est produit..."
          className="field-input resize-none"
        />
        {errors.problemDescription && (
          <p className="mt-1 text-xs text-red-600">{errors.problemDescription.message}</p>
        )}
      </div>

      {/* Urgency toggle */}
      <div>
        <p className="mb-3 text-sm font-medium text-slate-700">Urgence</p>
        <div className="flex rounded-xl border border-slate-200 p-1">
          {(['normal', 'urgent'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setValue('urgency', u)}
              className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
                urgency === u
                  ? u === 'urgent'
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-900 text-white'
                  : 'text-slate-500'
              }`}
            >
              {u === 'normal' ? '⏳ Normal' : '🚨 Urgent'}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('urgency')} />
        {urgency === 'urgent' && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
            Votre école sera notifiée de l'urgence et traitera votre demande en priorité.
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex gap-3 border-t border-slate-100 bg-white px-4 pb-safe-bottom pt-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          ← Retour
        </button>
        <button type="submit" className="btn-primary flex-[2]">
          Suivant
        </button>
      </div>
    </form>
  )
}
