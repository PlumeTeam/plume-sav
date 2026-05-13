'use client'

import { useState, useTransition } from 'react'
import { updateWarrantyPolicyAction } from '@/features/settings/actions'

interface WarrantyPolicy {
  warrantyStandardYears:         number
  warrantyExtendedYears:         number
  maxSavClaimsStandard:          number
  maxSavClaimsExtended:          number
  repairThresholdStandardEur:    number
  repairThresholdExtendedEur:    number
  extendedCoversPreCheck:                boolean
  extendedCoversSchoolWorkshopShipping:  boolean
  extendedCoversRepair:                  boolean
  extendedCoversReplacement:             boolean
}

interface Props {
  initial: WarrantyPolicy
}

export function WarrantyPolicyForm({ initial }: Props) {
  const [isPending, startTransition] = useTransition()
  const [state, setState] = useState<WarrantyPolicy>(initial)
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  function num<K extends keyof WarrantyPolicy>(key: K, value: string) {
    const n = Number(value)
    setState((s) => ({ ...s, [key]: Number.isFinite(n) ? n : 0 }))
  }

  function bool<K extends keyof WarrantyPolicy>(key: K, value: boolean) {
    setState((s) => ({ ...s, [key]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const fd = new FormData()
      fd.set('warrantyStandardYears',       String(state.warrantyStandardYears))
      fd.set('warrantyExtendedYears',       String(state.warrantyExtendedYears))
      fd.set('maxSavClaimsStandard',        String(state.maxSavClaimsStandard))
      fd.set('maxSavClaimsExtended',        String(state.maxSavClaimsExtended))
      fd.set('repairThresholdStandardEur',  String(state.repairThresholdStandardEur))
      fd.set('repairThresholdExtendedEur',  String(state.repairThresholdExtendedEur))
      if (state.extendedCoversPreCheck)                fd.set('extendedCoversPreCheck',                'on')
      if (state.extendedCoversSchoolWorkshopShipping)  fd.set('extendedCoversSchoolWorkshopShipping',  'on')
      if (state.extendedCoversRepair)                  fd.set('extendedCoversRepair',                  'on')
      if (state.extendedCoversReplacement)             fd.set('extendedCoversReplacement',             'on')

      const r = await updateWarrantyPolicyAction(fd)
      if (r && 'error' in r && r.error) {
        const flat = r.error as Record<string, string[] | undefined>
        const msg =
          flat._form?.[0] ??
          flat.warrantyStandardYears?.[0] ??
          flat.warrantyExtendedYears?.[0] ??
          flat.maxSavClaimsStandard?.[0] ??
          flat.maxSavClaimsExtended?.[0] ??
          flat.repairThresholdStandardEur?.[0] ??
          flat.repairThresholdExtendedEur?.[0] ??
          'Erreur de sauvegarde.'
        setFeedback({ type: 'error', msg })
      } else {
        setFeedback({ type: 'ok', msg: 'Politique de garantie mise à jour.' })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Durées garantie */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Durées
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label="Garantie standard (années)"
            value={state.warrantyStandardYears}
            onChange={(v) => num('warrantyStandardYears', v)}
            min={0} max={50} step={1}
            help="Durée pendant laquelle Plume couvre intégralement."
          />
          <NumberField
            label="Garantie étendue (années)"
            value={state.warrantyExtendedYears}
            onChange={(v) => num('warrantyExtendedYears', v)}
            min={0} max={50} step={1}
            help="Au-delà de la standard, couverture partielle (cf. toggles)."
          />
        </div>
      </fieldset>

      {/* Quotas SAV */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Quota SAV par aile (0 = illimité)
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label="Max SAV garantie standard"
            value={state.maxSavClaimsStandard}
            onChange={(v) => num('maxSavClaimsStandard', v)}
            min={0} max={100} step={1}
            help="0 = pas de limite tant qu'on est dans la période standard."
          />
          <NumberField
            label="Max SAV garantie étendue"
            value={state.maxSavClaimsExtended}
            onChange={(v) => num('maxSavClaimsExtended', v)}
            min={0} max={100} step={1}
            help="Au-delà, l'aile passe en hors garantie."
          />
        </div>
      </fieldset>

      {/* Plafonds réparation */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Plafonds réparation (€ HT)
        </legend>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <NumberField
            label="Plafond garantie standard"
            value={state.repairThresholdStandardEur}
            onChange={(v) => num('repairThresholdStandardEur', v)}
            min={0} max={100000} step={1}
            help="Au-delà, l'atelier propose remplacement plutôt que réparation."
            suffix="€ HT"
          />
          <NumberField
            label="Plafond garantie étendue"
            value={state.repairThresholdExtendedEur}
            onChange={(v) => num('repairThresholdExtendedEur', v)}
            min={0} max={100000} step={1}
            help="Plafond plus bas, propre à la période étendue."
            suffix="€ HT"
          />
        </div>
      </fieldset>

      {/* Toggles couverture étendue */}
      <fieldset className="space-y-3">
        <legend className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Garantie étendue — éléments couverts
        </legend>
        <div className="space-y-2">
          <ToggleRow
            label="Pré-check atelier"
            help="Plume facture le pré-check à l'atelier même sur ticket étendu."
            checked={state.extendedCoversPreCheck}
            onChange={(v) => bool('extendedCoversPreCheck', v)}
          />
          <ToggleRow
            label="Transport école → atelier"
            help="Plume génère et paie l'étiquette GLS école → atelier."
            checked={state.extendedCoversSchoolWorkshopShipping}
            onChange={(v) => bool('extendedCoversSchoolWorkshopShipping', v)}
          />
          <ToggleRow
            label="Réparation (≤ plafond étendue)"
            help="Plume prend en charge la facture atelier dans la limite du plafond."
            checked={state.extendedCoversRepair}
            onChange={(v) => bool('extendedCoversRepair', v)}
          />
          <ToggleRow
            label="Remplacement de l'aile"
            help="Plume offre une aile neuve sur l'étendue (rare — par défaut off)."
            checked={state.extendedCoversReplacement}
            onChange={(v) => bool('extendedCoversReplacement', v)}
          />
        </div>
      </fieldset>

      {feedback && (
        <p
          className={`rounded-xl px-3 py-2 text-sm ${
            feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {feedback.msg}
        </p>
      )}

      <button type="submit" disabled={isPending} className="btn-primary">
        {isPending ? 'Sauvegarde…' : 'Enregistrer la politique de garantie'}
      </button>
    </form>
  )
}

function NumberField({
  label, help, value, onChange, min, max, step, suffix,
}: {
  label:    string
  help?:    string
  value:    number
  onChange: (v: string) => void
  min?:     number
  max?:     number
  step?:    number
  suffix?:  string
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          onChange={(e) => onChange(e.target.value)}
          className="field-input max-w-[180px]"
          required
        />
        {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
      </div>
      {help && <p className="mt-1 text-[11px] text-slate-500">{help}</p>}
    </div>
  )
}

function ToggleRow({
  label, help, checked, onChange,
}: {
  label:    string
  help:     string
  checked:  boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-brand-stone bg-white p-3 hover:bg-brand-cream/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 accent-brand-gold"
      />
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-brand-ink">{label}</span>
        <span className="block text-[11px] text-slate-500">{help}</span>
      </span>
    </label>
  )
}
