'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useWizardStore } from '../../store'
import { wingInfoSchema, type WingInfoInput, WING_BRANDS } from '../../schemas'

interface StepWingInfoProps {
  onNext: () => void
}

export function StepWingInfo({ onNext }: StepWingInfoProps) {
  const { wingInfo, setWingInfo } = useWizardStore()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<WingInfoInput>({
    resolver: zodResolver(wingInfoSchema),
    defaultValues: wingInfo,
  })

  function onSubmit(data: WingInfoInput) {
    setWingInfo(data)
    onNext()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 px-4 pb-32">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Votre aile</h2>
        <p className="mt-1 text-sm text-slate-500">
          Renseignez les informations de la voile concernée.
        </p>
      </div>

      {/* Brand */}
      <Field label="Marque" error={errors.wingBrand?.message}>
        <select
          {...register('wingBrand')}
          className="field-input"
        >
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
          Vous pouvez le photographier à l'étape suivante.
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

      {/* Submit — sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-100 bg-white px-4 pb-safe-bottom pt-3">
        <button
          type="submit"
          className="btn-primary w-full"
        >
          Suivant — Décrire le problème
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
