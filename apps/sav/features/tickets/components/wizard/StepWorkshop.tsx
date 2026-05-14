'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { useWizardStore } from '../../store'
import { PARTNER_WORKSHOPS, type PartnerWorkshop } from '../../constants'
import { StepLayout, StepNav } from './StepLayout'

const WorkshopMapPicker = dynamic(
  () => import('../WorkshopMapPicker'),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[320px] items-center justify-center rounded-2xl bg-brand-cream text-sm text-slate-400">
        Chargement de la carte…
      </div>
    ),
  }
)

interface StepWorkshopProps {
  onNext: () => void
  onBack: () => void
}

export function StepWorkshop({ onNext, onBack }: StepWorkshopProps) {
  const { problem, setProblem } = useWizardStore()

  const workshops = useMemo<PartnerWorkshop[]>(() => {
    // On affiche d'abord les ateliers du réseau Plume, puis le reste pour
    // contexte. L'utilisateur peut quand même choisir un atelier non affilié.
    return [...PARTNER_WORKSHOPS].sort((a, b) => {
      if (a.affiliated && !b.affiliated) return -1
      if (!a.affiliated && b.affiliated) return 1
      return a.label.localeCompare(b.label)
    })
  }, [])

  const [pickedId, setPickedId] = useState<string | null>(
    problem.partnerWorkshopId ?? null
  )

  const pickedWorkshop = useMemo(
    () => workshops.find((w) => w.id === pickedId) ?? null,
    [workshops, pickedId]
  )

  function confirm() {
    if (!pickedWorkshop) return
    setProblem({ partnerWorkshopId: pickedWorkshop.id })
    onNext()
  }

  return (
    <StepLayout
      title="Choisissez un atelier"
      subtitle="Sélectionnez l'atelier qui prendra en charge votre aile. Les ateliers Plume sont affichés en premier."
      footer={
        <StepNav
          onBack={onBack}
          onNext={confirm}
          nextDisabled={!pickedWorkshop}
          nextLabel={pickedWorkshop ? `Envoyer à ${pickedWorkshop.label}` : 'Sélectionnez un atelier'}
        />
      }
    >
      <div className="space-y-4">
        <WorkshopMapPicker
          workshops={workshops}
          selectedId={pickedId}
          onSelect={setPickedId}
        />

        <div>
          <p className="mb-2 text-sm font-medium text-brand-ink">
            Tous les ateliers ({workshops.length})
          </p>
          <div className="space-y-2">
            {workshops.map((w) => {
              const isSelected = pickedId === w.id
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => setPickedId(w.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border-2 p-3 text-left transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'border-brand-gold bg-brand-gold/10 shadow-plume'
                      : 'border-brand-stone bg-white hover:border-brand-gold/40'
                  }`}
                >
                  <span aria-hidden className="text-xl">🔧</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-brand-ink">
                      {w.label}
                      {w.affiliated && (
                        <span className="ml-2 rounded-full bg-brand-gold/20 px-2 py-0.5 text-[10px] font-medium text-brand-ink">
                          Réseau Plume
                        </span>
                      )}
                    </p>
                    {(w.city || w.region) && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[w.city, w.region].filter(Boolean).join(' · ')}
                      </p>
                    )}
                    {w.address && (
                      <p className="mt-0.5 truncate text-[11px] italic text-slate-400">
                        {w.address}
                      </p>
                    )}
                  </div>
                  {isSelected && <span className="text-brand-gold text-lg" aria-hidden>✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </StepLayout>
  )
}
