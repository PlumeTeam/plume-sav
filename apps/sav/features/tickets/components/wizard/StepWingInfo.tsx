'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWizardStore } from '../../store'
import { wingInfoSchema, type WingInfoInput, WING_BRANDS } from '../../schemas'
import type { ClientWing } from '../../queries'
import { StepLayout } from './StepLayout'

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
  // When the user has registered wings, default to picker mode; manual mode is opt-in
  const [manualMode, setManualMode] = useState<boolean>(wings.length === 0)

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
    const purchaseDate = wing.registered_at
      ? new Date(wing.registered_at).toISOString().split('T')[0]!
      : ''
    setValue('wingBrand',  'Plume',                { shouldValidate: true })
    setValue('wingModel',  modelName,              { shouldValidate: true })
    setValue('wingSize',   wing.size ?? '',        { shouldValidate: true })
    setValue('wingColor',  wing.color_name ?? '',  { shouldValidate: true })
    setValue('wingSerial', wing.serial_number,     { shouldValidate: true })
    setValue('purchaseDate', purchaseDate,         { shouldValidate: true })
  }

  function onSubmit(data: WingInfoInput) {
    setWingInfo(data)
    onNext()
  }

  return (
    <StepLayout
      title="Quelle aile ?"
      subtitle={wings.length > 0
        ? 'Sélectionnez une aile enregistrée, ou saisissez les informations manuellement.'
        : 'Renseignez les informations de votre aile.'}
      footer={
        <button
          type="submit"
          form="wing-info-form"
          disabled={isSubmitting}
          className="btn-primary flex-1"
        >
          Continuer
        </button>
      }
    >
      <form id="wing-info-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        {/* Registered wings */}
        {wings.length > 0 && !manualMode && (
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
                    onClick={() => isSelected ? setSelectedWingId(null) : selectWing(wing)}
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
                      }`} aria-hidden>✓</span>
                    </div>
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => setManualMode(true)}
              className="mt-3 w-full rounded-xl border border-dashed border-brand-stone bg-brand-cream py-2.5 text-sm font-medium text-slate-600 hover:bg-white"
            >
              + Mon aile n&apos;est pas dans la liste
            </button>
          </section>
        )}

        {/* Manual fields */}
        {manualMode && (
          <section className="space-y-5">
            {wings.length > 0 && (
              <button
                type="button"
                onClick={() => { setManualMode(false); setSelectedWingId(null) }}
                className="text-xs text-slate-500 underline underline-offset-2"
              >
                ← Revenir à mes ailes enregistrées
              </button>
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
                placeholder="Étiquette intérieure"
                className="field-input font-mono"
                autoCapitalize="characters"
              />
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
          </section>
        )}
      </form>
    </StepLayout>
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
