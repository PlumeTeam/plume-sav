'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import type { ClientWing } from '../../queries'
import { StepLayout, StepNav } from './StepLayout'

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

  // Re-derive the previously selected wing on remount so back-navigation keeps the choice.
  const initialId = wings.find((w) => w.serial_number === wingInfo.wingSerial)?.id ?? null
  const [selectedId, setSelectedId] = useState<string | null>(initialId)

  function selectWing(wing: ClientWing) {
    setSelectedId(wing.id)
    const modelName    = formatModelName(wing.product_model || '')
    const purchaseDate = wing.registered_at
      ? new Date(wing.registered_at).toISOString().split('T')[0]!
      : ''
    setWingInfo({
      wingBrand:    'Plume',
      wingModel:    modelName,
      wingSize:     wing.size ?? '',
      wingColor:    wing.color_name ?? '',
      wingSerial:   wing.serial_number,
      purchaseDate,
      flightHours:  wingInfo.flightHours, // user can fill this later if relevant
    })
  }

  function handleNext() {
    if (!selectedId) return
    onNext()
  }

  // ── Empty state: no registered wings ────────────────────────────────────
  if (wings.length === 0) {
    return (
      <StepLayout
        title="Aucune aile enregistrée"
        subtitle="Le SAV Plume couvre uniquement les ailes achetées chez nous, donc forcément enregistrées sur votre compte."
      >
        <div className="card flex flex-col items-center gap-4 p-6 text-center">
          <span aria-hidden className="text-4xl">🪂</span>
          <p className="text-sm text-brand-ink">
            Aucune aile n&apos;est enregistrée sur votre compte pour l&apos;instant.
          </p>
          <p className="text-xs text-slate-500">
            Si vous avez acheté une aile Plume, contactez-nous pour qu&apos;elle soit
            associée à votre compte avant d&apos;ouvrir un ticket SAV.
          </p>
          <a
            href="mailto:sav@plumeparagliders.com?subject=A%C3%AFle%20non%20enregistr%C3%A9e%20sur%20mon%20compte"
            className="btn-primary mt-2"
          >
            Contacter Plume
          </a>
        </div>
      </StepLayout>
    )
  }

  return (
    <StepLayout
      title="Quelle aile ?"
      subtitle="Sélectionnez l'aile concernée par votre demande SAV."
      footer={
        <StepNav
          onNext={handleNext}
          nextDisabled={!selectedId}
          nextLabel="Continuer"
          hideBack
        />
      }
    >
      <div className="space-y-2">
        {wings.map((wing) => {
          const isSelected = selectedId === wing.id
          const subtitle = [wing.size && `Taille ${wing.size}`, wing.color_name].filter(Boolean).join(' · ')
          return (
            <button
              key={wing.id}
              type="button"
              onClick={() => selectWing(wing)}
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

      <p className="mt-6 rounded-2xl bg-brand-cream p-3 text-xs text-slate-500">
        Une aile manque dans cette liste ?{' '}
        <a href="mailto:sav@plumeparagliders.com" className="font-medium text-brand-coral hover:underline">
          Contactez Plume
        </a>{' '}
        pour qu&apos;elle soit associée à votre compte.
      </p>
    </StepLayout>
  )
}
