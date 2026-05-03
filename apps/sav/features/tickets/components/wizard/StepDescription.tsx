'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import { WING_BEHAVIOR_TYPES } from '../../types'
import { StepLayout, StepNav } from './StepLayout'

interface StepDescriptionProps {
  onNext: () => void
  onBack: () => void
}

const MIN_LENGTH = 10
const MAX_LENGTH = 2000

export function StepDescription({ onNext, onBack }: StepDescriptionProps) {
  const { problem, setProblem } = useWizardStore()
  const isBehaviorOnly = (problem.wingBehaviors?.length ?? 0) > 0

  // For behavior tickets, we prepend the behavior labels into the description
  // when storing, but the user only edits their own free-text portion here.
  const initial = stripBehaviorPrefix(problem.problemDescription)
  const [text, setText] = useState(initial)

  function handleNext() {
    if (text.trim().length < MIN_LENGTH) return

    let finalDesc = text.trim()
    if (isBehaviorOnly && (problem.wingBehaviors?.length ?? 0) > 0) {
      const labels = problem.wingBehaviors!
        .map((id) => WING_BEHAVIOR_TYPES.find((b) => b.id === id)?.label)
        .filter(Boolean) as string[]
      const prefix = `Comportements de l'aile :\n${labels.map((l) => `• ${l}`).join('\n')}\n\n`
      finalDesc = prefix + finalDesc
    }
    setProblem({ problemDescription: finalDesc })
    onNext()
  }

  const len = text.trim().length
  const valid = len >= MIN_LENGTH && len <= MAX_LENGTH

  return (
    <StepLayout
      title="Décrivez précisément le problème"
      subtitle={isBehaviorOnly
        ? 'Quand l\'avez-vous remarqué ? Dans quelles conditions ? Soyez précis — votre école s\'appuiera là-dessus.'
        : 'Où, quand, comment ? Plus vous êtes précis, plus le diagnostic sera rapide.'}
      footer={
        <StepNav
          onBack={onBack}
          onNext={handleNext}
          nextDisabled={!valid}
          nextLabel={
            len < MIN_LENGTH
              ? `Encore ${MIN_LENGTH - len} caractères`
              : 'Continuer'
          }
        />
      }
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        autoFocus
        maxLength={MAX_LENGTH}
        placeholder={isBehaviorOnly
          ? 'Ex : ferme à droite à chaque turbulence sur dorsale, surtout sous brise > 25 km/h. Apparu après la dernière révision.'
          : 'Ex : déchirure de 8 cm sur le bord de fuite, panneau central, repérée au pliage après vol au Mont-Saxonnex.'}
        className="field-input min-h-[200px] resize-y"
      />
      <p className="mt-2 text-right text-xs text-slate-400">
        {len}/{MAX_LENGTH}
      </p>
    </StepLayout>
  )
}

// Removes the auto-prepended "Comportements de l'aile : ..." block so the user
// edits only their own text portion when going back to this step.
function stripBehaviorPrefix(s: string): string {
  if (!s) return ''
  const marker = "Comportements de l'aile :"
  const idx = s.indexOf(marker)
  if (idx !== 0) return s
  // Find first blank line after the bullet list
  const afterBlank = s.indexOf('\n\n')
  if (afterBlank === -1) return ''
  return s.slice(afterBlank + 2)
}
