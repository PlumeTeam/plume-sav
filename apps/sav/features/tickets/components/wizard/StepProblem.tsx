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
      problemCategory:    problem.problemCategory as ProblemInput['problemCategory'] | undefined,
      problemDescription: problem.problemDescription,
      urgency:            problem.urgency,
    },
  })

  const selectedCategory = watch('problemCategory')
  const urgency          = watch('urgency')

  function toggleBehavior(behaviorId: string) {
    setSelectedBehaviors((prev) =>
      prev.includes(behaviorId)
        ? prev.filter((id) => id !== behaviorId)
        : [...prev, behaviorId]
    )
  }

  function handleComportementSelect() {
    const next = !isComportement
    setIsComportement(next)
    setSelectedBehaviors([])
    if (next) setValue('problemCategory', 'other', { shouldValidate: true })
    else setValue('problemCategory', '' as ProblemInput['problemCategory'], { shouldValidate: false })
  }

  function onSubmit(data: ProblemInput) {
    // Persist wingBehaviors so downstream steps (photos, review) can detect
    // a behavior-only ticket and relax the photo requirement.
    const wingBehaviors = isComportement ? selectedBehaviors : []

    if (isComportement && selectedBehaviors.length > 0) {
      const labels = selectedBehaviors
        .map((id) => WING_BEHAVIOR_TYPES.find((b) => b.id === id)?.label)
        .filter(Boolean)
      if (labels.length > 0) {
        const prefix = `Comportements de l'aile :\n${labels.map((l) => `• ${l}`).join('\n')}\n\n`
        data.problemDescription = prefix + (data.problemDescription || '')
      }
    }
    setProblem({ ...data, wingBehaviors })
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 px-4 pb-36">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-ink">Le problème</h2>
        <p className="mt-1 text-sm text-slate-500">
          Décrivez le problème rencontré avec votre voile.
        </p>
      </div>

      {/* Problem category */}
      <div>
        <p className="mb-3 text-sm font-medium text-brand-ink">Type de problème</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            key="comportement"
            type="button"
            onClick={handleComportementSelect}
            className={`flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.97] ${
              isComportement
                ? 'border-brand-coral bg-brand-coral/10 text-brand-ink shadow-plume'
                : 'border-brand-stone bg-white text-brand-ink hover:border-brand-coral/40'
            }`}
          >
            <span className="mb-1 text-2xl" aria-hidden>🪂</span>
            <span className="text-sm font-semibold leading-tight">Comportement</span>
            <span className="mt-1 text-xs leading-tight text-slate-500">
              Comportement anormal de l&apos;aile
            </span>
          </button>

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
                className={`flex flex-col items-start rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.97] ${
                  isSelected
                    ? 'border-brand-coral bg-brand-coral/10 text-brand-ink shadow-plume'
                    : 'border-brand-stone bg-white text-brand-ink hover:border-brand-coral/40'
                }`}
              >
                <span className="mb-1 text-2xl" aria-hidden>{cat.emoji}</span>
                <span className="text-sm font-semibold leading-tight">{cat.label}</span>
                <span className="mt-1 text-xs leading-tight text-slate-500">{cat.description}</span>
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
        <div className="animate-slide-up">
          <p className="mb-3 text-sm font-medium text-brand-ink">
            Types de comportement <span className="font-normal text-xs text-slate-400">(plusieurs choix possibles)</span>
          </p>
          <div className="space-y-2">
            {WING_BEHAVIOR_TYPES.map((behavior) => {
              const checked = selectedBehaviors.includes(behavior.id)
              return (
                <label
                  key={behavior.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${
                    checked
                      ? 'border-brand-coral bg-brand-coral/5'
                      : 'border-brand-stone bg-white hover:bg-brand-cream'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBehavior(behavior.id)}
                    className="mt-0.5 h-4 w-4 rounded border-brand-stone text-brand-coral focus:ring-brand-coral"
                  />
                  <span className="text-sm text-brand-ink">{behavior.label}</span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {/* Description */}
      <div>
        <label htmlFor="problem-description" className="mb-1.5 block text-sm font-medium text-brand-ink">
          Description détaillée
        </label>
        <textarea
          id="problem-description"
          {...register('problemDescription')}
          rows={4}
          placeholder="Décrivez précisément le problème : où, quand, comment cela s'est produit…"
          className="field-input resize-none"
        />
        {errors.problemDescription && (
          <p className="mt-1 text-xs text-red-600">{errors.problemDescription.message}</p>
        )}
      </div>

      {/* Urgency toggle */}
      <div>
        <p className="mb-2 text-sm font-medium text-brand-ink">Urgence</p>
        <div className="flex rounded-2xl border border-brand-stone bg-white p-1">
          {(['normal', 'urgent'] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => setValue('urgency', u)}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                urgency === u
                  ? u === 'urgent'
                    ? 'bg-red-600 text-white'
                    : 'bg-brand-navy text-white'
                  : 'text-slate-500'
              }`}
            >
              {u === 'normal' ? '⏳ Normal' : '🚨 Urgent'}
            </button>
          ))}
        </div>
        <input type="hidden" {...register('urgency')} />
        {urgency === 'urgent' && (
          <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Votre école sera notifiée et traitera votre demande en priorité.
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-4 pt-3 pb-safe-bottom">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button type="button" onClick={onBack} className="btn-secondary flex-1">
            ← Retour
          </button>
          <button type="submit" className="btn-primary flex-[2]">
            Suivant
          </button>
        </div>
      </div>
    </form>
  )
}
