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

export function StepWingInfo({ wings, onNext }: StepWingInfoProps) {
  const { wingInfo, setWingInfo } = useWizardStore()
  const [selectedWingId, setSelectedWingId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<WingInfoInput>({
    resolver: zodResolver(wingInfoSchema),
    defaultValues: wingInfo,
  })

  function selectWing(wing: ClientWing) {
    setSelectedWingId(wing.id)
    setValue('wingBrand',  'Plume',              { shouldValidate: true })
    setValue('wingModel',  wing.product_label,   { shouldValidate: true })
    setValue('wingSize',   wing.size   ?? '',    { shouldValidate: true })
    setValue('wingColor',  wing.color_name ?? '', { shouldValidate: true })
    setValue('wingSerial', wing.serial_number,   { shouldValidate: true })
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
        <h2 className="text-xl font-bold text-slate-900">Votre aile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Sélectionnez votre aile ou remplissez les informations manuellement.
        </p>
      </div>

      {/* ── Registered wings selector ─────────────────────────── */}
      {wings.length > 0 && (
        <section className="space-y-2">
          <p className="text-sm font-medium text-slate-700">Ailes enregistrées</p>

          <div className="space-y-2">
            {wings.map((wing) => {
              const isSelected = selectedWingId === wing.id
              const subtitle = [wing.size && `Taille ${wing.size}`, wing.color_name]
                .filter(Boolean)
                .join(' · ')
              return (
                <button
                  key={wing.id}
                  type="button"
                  onClick={() => isSelected ? clearSelection() : selectWing(wing)}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition-colors active:scale-[0.98] ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-900 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{wing.product_label}</p>
                      {subtitle && (
                        <p className={`mt-0.5 text-xs ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {subtitle}
                        </p>
                      )}
                      <p className={`mt-1 font-mono text-xs ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                        {wing.serial_number}
                      </p>
                    </div>
                    <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                      isSelected
                        ? 'border-white bg-white text-slate-900'
                        : 'border-slate-300'
                    }`} aria-hidden>
                      {isSelected ? '✓' : ''}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Separator */}
          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs text-slate-400">ou remplir manuellement</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
        </section>
      )}

      {/* ── Manual fields ────────────────────────────────────── */}
      {/* Brand */}
      <Field label="Marque" error={errors.wingBrand?.message}>
        <select {...register('wingBrand')} className="field-input">
          <option value="">Sélectionner une marque</option>
          {WING_BRANDS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </Field>

      {/* Model */}
      <Field label="Modèle" error={errors.wingModel?.message}>
        <input
          {...register('wingModel')}
          type="text"
          placeholder="ex: Pluma 3, Rush 6, Sigma 12…"
          className="field-input"
          autoComplete="off"
        />
      </Field>

      {/* Size + Color */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="Taille" error={errors.wingSize?.message}>
          <input
            {...register('wingSize')}
            type="text"
            placeholder="ex: S, M, 26"
            className="field-input"
          />
        </Field>
        <Field label="Couleur" error={errors.wingColor?.message}>
          <input
            {...register('wingColor')}
            type="text"
            placeholder="ex: Rouge/Noir"
            className="field-input"
          />
        </Field>
      </div>

      {/* Serial */}
      <Field label="Numéro de série" error={errors.wingSerial?.message}>
        <input
          {...register('wingSerial')}
          type="text"
          placeholder="Indiqué sur l'étiquette intérieure"
          className="field-input"
          autoCapitalize="characters"
        />
        <p className="mt-1 text-xs text-slate-400">
          Vous pouvez le photographier à l&apos;étape suivante.
        </p>
      </Field>

      {/* Purchase date */}
      <Field label="Date d'achat" error={errors.purchaseDate?.message}>
        <input
          {...register('purchaseDate')}
          type="date"
          className="field-input"
          max={new Date().toISOString().split('T')[0]}
        />
      </Field>

      {/* Flight hours */}
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

      {/* ── Fixed Suivant button ──────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-100 bg-white px-4 pb-safe-bottom pt-3">
        <button type="submit" className="btn-primary w-full">
          Suivant
        </button>
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
      <label className="mb-1.5 flex items-center gap-1 text-sm font-medium text-slate-700">
        {label}
        {optional && <span className="text-xs font-normal text-slate-400">(optionnel)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
