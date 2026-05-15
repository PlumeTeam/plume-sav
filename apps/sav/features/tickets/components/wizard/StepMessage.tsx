'use client'

import { useState } from 'react'
import { useWizardStore, computeWarranty } from '../../store'
import { DEFAULT_CLIENT_MESSAGE } from '../../constants'
import { StepLayout, StepNav } from './StepLayout'

interface StepMessageProps {
  onNext: () => void
  onBack: () => void
}

export function StepMessage({ onNext, onBack }: StepMessageProps) {
  const { requestType, wingInfo, problem, setProblem } = useWizardStore()

  // Aligne le libellé sur la route choisie par buildWizardFlow :
  //  - repair / inspection            → atelier
  //  - manufacturing_defect hors gar. → atelier
  //  - manufacturing_defect ss gar.   → école
  const goesToWorkshop =
    requestType === 'repair' ||
    requestType === 'inspection' ||
    (requestType === 'manufacturing_defect' && computeWarranty(wingInfo.purchaseDate).outOfWarranty)
  const recipientLabel = goesToWorkshop ? "l'atelier" : "l'école"

  // Pre-fill with the default template only on first visit. If the client
  // came back to this step (problem.clientMessage is already set, even to
  // an empty string after deletion), keep their last value.
  const initialValue =
    problem.clientMessage !== undefined ? problem.clientMessage : DEFAULT_CLIENT_MESSAGE
  const [text, setText] = useState<string>(initialValue)

  function handleNext() {
    setProblem({ clientMessage: text })
    onNext()
  }

  function resetToDefault() {
    setText(DEFAULT_CLIENT_MESSAGE)
  }

  return (
    <StepLayout
      title={`Message à ${recipientLabel}`}
      subtitle={`Ajoutez un message personnalisé pour ${recipientLabel}. Vous pouvez aussi laisser le message par défaut tel quel.`}
      footer={
        <StepNav
          onBack={onBack}
          onNext={handleNext}
          nextLabel="Continuer"
        />
      }
    >
      <div className="space-y-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={9}
          maxLength={2000}
          placeholder={DEFAULT_CLIENT_MESSAGE}
          className="field-input min-h-[220px] resize-y"
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400">{text.length}/2000</p>
          {text !== DEFAULT_CLIENT_MESSAGE && (
            <button
              type="button"
              onClick={resetToDefault}
              className="text-xs text-slate-500 underline underline-offset-2 hover:text-brand-gold"
            >
              Restaurer le message par défaut
            </button>
          )}
        </div>

        <p className="rounded-xl bg-brand-cream p-3 text-xs text-slate-600">
          💬 Ce message sera envoyé à {recipientLabel} avec votre demande et
          apparaîtra comme premier échange dans la conversation de la demande.
          Vous pourrez continuer à dialoguer avec {recipientLabel} depuis votre
          espace SAV.
        </p>
      </div>
    </StepLayout>
  )
}
