'use client'

import { useState, useMemo } from 'react'
import { useWizardStore } from '../../store'
import type { DeliveryMethod } from '../../types'
import type { PartnerSchool } from '../../queries'
import { StepLayout, StepNav } from './StepLayout'

interface StepDeliveryProps {
  schools: PartnerSchool[]
  onNext:  () => void
  onBack:  () => void
}

const OPTIONS: Array<{ value: DeliveryMethod; emoji: string; label: string; description: string }> = [
  {
    value: 'in_person',
    emoji: '🤝',
    label: 'J\'emmène mon aile à l\'école',
    description: 'Remise en main propre. Vous prendrez rendez-vous directement avec votre école.',
  },
  {
    value: 'postal',
    emoji: '📦',
    label: 'J\'envoie mon aile par la poste',
    description: 'Envoi postal. L\'école recevra un colis et vous tiendra informé à la réception.',
  },
]

export function StepDelivery({ schools, onNext, onBack }: StepDeliveryProps) {
  const { problem, setProblem } = useWizardStore()
  const [selected, setSelected] = useState<DeliveryMethod | null>(problem.deliveryMethod ?? null)

  const targetSchool = useMemo(
    () => schools.find((s) => s.id === problem.partnerSchoolId) ?? null,
    [schools, problem.partnerSchoolId]
  )

  function handleNext() {
    if (!selected) return
    setProblem({ deliveryMethod: selected })
    onNext()
  }

  return (
    <StepLayout
      title="Comment transmettez-vous votre aile ?"
      subtitle={targetSchool
        ? `Votre aile doit arriver à ${targetSchool.name} pour le diagnostic.`
        : 'Choisissez la méthode qui vous arrange.'}
      footer={
        <StepNav
          onBack={onBack}
          onNext={handleNext}
          nextDisabled={!selected}
          nextLabel="Continuer"
        />
      }
    >
      <div className="space-y-3">
        {OPTIONS.map((opt) => {
          const isSelected = selected === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelected(opt.value)}
              className={`flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all active:scale-[0.99] ${
                isSelected
                  ? 'border-brand-gold bg-brand-gold/10 shadow-plume'
                  : 'border-brand-stone bg-white hover:border-brand-gold/40'
              }`}
            >
              <span className="text-4xl" aria-hidden>{opt.emoji}</span>
              <div className="flex-1">
                <p className="text-base font-semibold text-brand-ink">{opt.label}</p>
                <p className="mt-1 text-xs text-slate-600">{opt.description}</p>
              </div>
              <span className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                isSelected
                  ? 'border-brand-gold bg-brand-gold text-white'
                  : 'border-brand-stone bg-white text-transparent'
              }`} aria-hidden>✓</span>
            </button>
          )
        })}
      </div>

      {/* Contextual hint based on selection */}
      {selected === 'in_person' && (
        <div className="mt-4 animate-slide-up rounded-2xl bg-brand-cream p-4 text-sm text-brand-ink">
          <p className="font-semibold">📞 Prochaine étape</p>
          <p className="mt-1 text-xs text-slate-600">
            Une fois votre demande envoyée, contactez{' '}
            <strong>{targetSchool?.name ?? 'l\'école'}</strong> pour prendre rendez-vous.
            L\'école dispose de toutes les informations de votre demande dans son tableau de bord.
          </p>
        </div>
      )}

      {selected === 'postal' && (
        <div className="mt-4 animate-slide-up rounded-2xl bg-brand-cream p-4 text-sm text-brand-ink">
          <p className="font-semibold">📦 Conseils pour l&apos;envoi</p>
          <ul className="mt-2 space-y-1 text-xs text-slate-600">
            <li>• Emballez l&apos;aile dans son sac d&apos;origine ou un sac rembourré</li>

          </ul>
          {targetSchool && (
            <p className="mt-3 border-t border-brand-stone/60 pt-3 text-xs text-slate-600">
              Adresse d&apos;envoi : contactez <strong className="text-brand-ink">{targetSchool.name}</strong>{' '}
              {targetSchool.city && <>({targetSchool.city})</>} après l&apos;envoi de votre demande
              pour récupérer leur adresse postale exacte.
            </p>
          )}
        </div>
      )}
    </StepLayout>
  )
}
