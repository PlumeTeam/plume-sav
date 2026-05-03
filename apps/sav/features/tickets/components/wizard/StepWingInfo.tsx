'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWizardStore } from '../../store'
import { wingInfoSchema, type WingInfoInput, WING_BRANDS } from '../../schemas'
import type { ClientWing } from '../../queries'

interface StepWingInfoProps {
  wings: ClientWing[]
  onNext: () => void
}

function formatModelName(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function StepWingInfo({ wings, onNext }: StepWingInfoProps) {
  const { wingInfo, setWingInfo } = useWizardStore()
  const [selectedWingId, setSelectedWingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<WingInfoInput>({
    resolver: zodResolver(wingInfoSchema),
    defaultValues: wingInfo,
  })

  function selectWing(wing: ClientWing) {
    setSelectedWingId(wing.id)
    const modelName = formatModelName(wing.product_model || '')
    setValue('wingBrand',  'Plume',                { shouldValidate: true })
    setValue('wingModel',  modelName,              { shouldValidate: true })
    setValue('wingSize',   wing.size ?? '',        { shouldValidate: true })
    setValue('wingColor',  wing.color_name ?? '',  { shouldValidate: true })
    setValue('wingSerial', wing.serial_number,     { shouldValidate: true })
  }

  function clearSelection() {
    setSelectedWingId(null)
    setValue('wingBrand',  '')
    setValue('wingModel',  '')
    setValue('wingSize',   '')
    setValue('wingColor',  '')
    setValue('wingSerial', '')
  }

  function onSubmit(data: WingInfoInput) {
    setWingInfo(data)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-4 pb-36">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-ink">Votre aile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sélectionnez une aile enregistrée ou remplissez les informations manuellement.
        </p>
      </div>

      {/* Registered wings selector */}
      {wings.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-medium text-brand-ink">Ailes enregistrées</p>
          <div className="space-y-2">
            {wings.map((wing) => {
              const isSelected = selectedWingId === wing.id
              const subtitle = [wing.size && `Taille ${wing.size}`, wing.color_name].filter(Boolean).join(' · ')
              return (
                <button
                  key={wing.id}
                  type="button"
                  onClick={() => isSelected ? clearSelection() : selectWing(wing)}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'border-brand-coral bg-brand-coral/10 text-brand-ink shadow-plume'
                      : 'border-brand-stone bg-white text-brand-ink hover:border-brand-coral/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{wing.product_label}</p>
                      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
                      <p className="mt-1 font-mono text-xs text-slate-400">{wing.serial_number}</p>
                    </div>
                    <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      isSelected
                        ? 'border-brand-coral bg-brand-coral text-white'
                        : 'border-brand-stone bg-white text-transparent'
                    }`} aria-hidden>
                      ✓
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-3 py-2">
            <div className="h-px flex-1 bg-brand-stone" />
            <span className="text-xs uppercase tracking-wider text-slate-400">ou remplir manuellement</span>
            <div className="h-px flex-1 bg-brand-stone" />
          </div>
        </section>
      )}

      <Field label="Marque" error={errors.wingBrand?.message}>
        <select {...register('wingBrand')} className="field-input">
          <option value="">Sélectionner une marque</option>
          {WING_BRANDS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </Field>

      <Field label="Modèle" error={errors.wingModel?.message}>
        <input
          {...register('wingModel')}
          type="text"
          placeholder="ex: Pluma 3, Rush 6, Sigma 12…"
          className="field-input"
          autoComplete="off"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Taille" error={errors.wingSize?.message}>
          <input {...register('wingSize')} type="text" placeholder="ex: S, M, 26" className="field-input" />
        </Field>
        <Field label="Couleur" error={errors.wingColor?.message}>
          <input {...register('wingColor')} type="text" placeholder="ex: Rouge / Noir" className="field-input" />
        </Field>
      </div>

      <Field label="Numéro de série" error={errors.wingSerial?.message}>
        <input
          {...register('wingSerial')}
          type="text"
          placeholder="Indiqué sur l'étiquette intérieure"
          className="field-input font-mono"
          autoCapitalize="characters"
        />
        <p className="mt-1 text-xs text-slate-500">
          Vous pourrez le photographier à l&apos;étape suivante.
        </p>
      </Field>

      <Field label="Date d'achat" error={errors.purchaseDate?.message}>
        <input
          {...register('purchaseDate')}
          type="date"
          className="field-input"
          max={new Date().toISOString().split('T')[0]}
        />
      </Field>

      <Field label="Heures de vol estimées" error={errors.flightHours?.message} optional>
        <input
          {...register('flightHours')}
          type="number"
          inputMode="numeric"
          placeholder="ex: 150"
          min="0"
          className="field-input"
        />
      </Field>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-4 pt-3 pb-safe-bottom">
        <div className="mx-auto max-w-2xl">
          <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
            Suivant
          </button>
        </div>
      </div>
    </form>
  )
}

function Field({
  label,
  children,
  error,
  optional,
}: {
  label: string
  children: React.ReactNode
  error?: string
  optional?: boolean
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-brand-ink">
        {label}
        {optional && <span className="text-xs font-normal text-slate-400">(optionnel)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
