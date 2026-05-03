'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import type { PartnerSchool } from '../../queries'
import { StepLayout, StepNav } from './StepLayout'

interface StepSchoolProps {
  schools:  PartnerSchool[]
  onNext:   () => void
  onBack:   () => void
}

export function StepSchool({ schools, onNext, onBack }: StepSchoolProps) {
  const { problem, setProblem } = useWizardStore()
  const [schoolId, setSchoolId] = useState<string>(
    problem.partnerSchoolId ?? schools[0]?.id ?? ''
  )

  function handleNext() {
    if (!schoolId) return
    setProblem({ partnerSchoolId: schoolId })
    onNext()
  }

  const selected = schools.find((s) => s.id === schoolId)

  return (
    <StepLayout
      title="Envoi à votre école"
      subtitle="Votre demande sera traitée par cette école pour un premier diagnostic. Elle pourra la résoudre, vous expliquer si tout est normal, ou la transmettre à un atelier du réseau Plume."
      footer={
        <StepNav
          onBack={onBack}
          onNext={handleNext}
          nextDisabled={!schoolId}
          nextLabel="Continuer"
        />
      }
    >
      {schools.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Aucune école partenaire n&apos;est enregistrée. Contactez Plume.
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {schools.map((s) => {
              const isSelected = s.id === schoolId
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSchoolId(s.id)}
                  className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all active:scale-[0.99] ${
                    isSelected
                      ? 'border-brand-coral bg-brand-coral/10 shadow-plume'
                      : 'border-brand-stone bg-white hover:border-brand-coral/40'
                  }`}
                >
                  <span aria-hidden className="text-2xl">🏫</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-brand-ink">{s.name}</p>
                    {(s.city || s.region) && (
                      <p className="mt-0.5 text-xs text-slate-500">
                        {[s.city, s.region].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                    isSelected
                      ? 'border-brand-coral bg-brand-coral text-white'
                      : 'border-brand-stone bg-white text-transparent'
                  }`} aria-hidden>✓</span>
                </button>
              )
            })}
          </div>

          {selected && (
            <p className="mt-4 rounded-2xl bg-brand-cream p-3 text-xs text-slate-600">
              Sélectionné : <strong className="text-brand-ink">{selected.name}</strong>
            </p>
          )}
        </>
      )}
    </StepLayout>
  )
}
