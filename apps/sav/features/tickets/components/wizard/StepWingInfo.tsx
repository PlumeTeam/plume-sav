'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import type { ClientWing } from '../../queries'
import { StepLayout, StepNav } from './StepLayout'
import { WingScanCard } from './WingScanCard'

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
  const { wingInfo, setWingInfo, setProblem } = useWizardStore()

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
    // Seed the referent school for the school step. Reset any prior pick so the
    // user starts fresh if they re-pick a wing mid-flow.
    setProblem({
      referentSchoolId: wing.partner_school_id ?? null,
      partnerSchoolId:  undefined,
      schoolChangeReasonCode: undefined,
      schoolChangeReasonNote: undefined,
    })
  }

  // Module Flashcode v1 — vue client : scan QR / mode démo / saisie manuelle
  // pré-sélectionnent l'aile correspondante automatiquement. La méthode est
  // tracée pour persistance future dans la table wing_scans (PR à venir).
  function handleScanResolved(wing: ClientWing, _method: 'camera' | 'demo' | 'manual') {
    selectWing(wing)
  }

  function handleNext() {
    if (!selectedId) return
    onNext()
  }

  // ── Empty state: no registered wings ────────────────────────────────────
  // Le scan flashcode est aussi visible ici — c'est le cas d'usage principal :
  // rattacher une aile fraîchement déballée à son compte client.
  if (wings.length === 0) {
    return (
      <StepLayout
        title="Rattacher votre aile"
        subtitle="Scannez le flashcode cousu sur votre aile pour la rattacher à votre compte Plume."
      >
        <WingScanCard
          wings={wings}
          selectedSerial={null}
          onScanResolved={handleScanResolved}
        />
        <p className="mt-4 rounded-2xl bg-brand-cream p-3 text-xs text-slate-500">
          Le SAV Plume couvre uniquement les ailes achetées chez nous, donc
          forcément enregistrées sur votre compte. Si vous n&apos;avez pas
          encore d&apos;aile rattachée, le scan QR ci-dessus vous permet de
          l&apos;ajouter en quelques secondes.
        </p>
      </StepLayout>
    )
  }

  return (
    <StepLayout
      title="Quelle aile ?"
      subtitle="Scannez le flashcode de votre aile pour l'identifier sans erreur, ou sélectionnez-la dans la liste."
      footer={
        <StepNav
          onNext={handleNext}
          nextDisabled={!selectedId}
          nextLabel="Continuer"
          hideBack
        />
      }
    >
      <WingScanCard
        wings={wings}
        selectedSerial={wingInfo.wingSerial || null}
        onScanResolved={handleScanResolved}
      />

      <div className="my-4 flex items-center gap-3 text-xs uppercase tracking-wide text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        <span>ou choisir dans la liste</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

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
                  ? 'border-brand-gold bg-brand-gold/10 text-brand-ink shadow-plume'
                  : 'border-brand-stone bg-white text-brand-ink hover:border-brand-gold/40'
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
                    ? 'border-brand-gold bg-brand-gold text-white'
                    : 'border-brand-stone bg-white text-transparent'
                }`} aria-hidden>✓</span>
              </div>
            </button>
          )
        })}
      </div>

      <p className="mt-6 rounded-2xl bg-brand-cream p-3 text-xs text-slate-500">
        Une aile manque dans cette liste&nbsp;? Rattachez-la à votre compte
        Plume en flashant le QR code situé à l&apos;intérieur du parapente.
      </p>
    </StepLayout>
  )
}
