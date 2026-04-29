'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWizardStore } from '../../store'
import { problemSchema, type ProblemInput } from '../../schemas'
import { PROBLEM_CATEGORIES } from '../../types'

interface StepProblemProps {
  onNext: () => void
  onBack: () => void
}

export function StepProblem({ onNext, onBack }: StepProblemProps) {
  const { problem, setProblem } = useWizardStore()

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

  function onSubmit(data: ProblemInput) {
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
          {PROBLEM_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setValue('problemCategory', cat.value, { shouldValidate: true })}
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
        {/* Hidden register for RHF */}
        <input type="hidden" {...register('problemCategory')} />
      </div>

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
