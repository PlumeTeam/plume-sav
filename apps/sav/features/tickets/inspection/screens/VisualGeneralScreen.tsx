'use client'

import { InspectionPhotoField, type LocalInspectionPhoto } from '../InspectionPhotoField'
import type { Phase1 } from '../steps'
import { Field, NavButtons, PhotoOrTextHint, ScreenLayout, YesNoSelector } from './_shared'

interface VisualGeneralScreenProps {
  phase1:        Phase1
  setPhase1:     (next: Phase1) => void
  damagePhotos:  LocalInspectionPhoto[]
  onAddPhoto:    (photo: LocalInspectionPhoto) => void
  onRemovePhoto: (id: string) => void
  isValid:       boolean
  onBack:        () => void
  onNext:        () => void
}

export function VisualGeneralScreen({
  phase1, setPhase1, damagePhotos, onAddPhoto, onRemovePhoto, isValid, onBack, onNext,
}: VisualGeneralScreenProps) {
  return (
    <ScreenLayout
      phase="Phase 1 — Inspection visuelle"
      title="Inspection visuelle générale"
      subtitle="Sortez l'aile et examinez-la sur toute sa surface, des suspentes au tissu."
      footer={
        <NavButtons
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!isValid}
        />
      }
    >
      <Field label="L'aile présente-t-elle des dommages visibles ?">
        <YesNoSelector
          value={phase1.visibleDamage}
          onChange={(v) => setPhase1({ ...phase1, visibleDamage: v })}
        />
      </Field>

      {phase1.visibleDamage === 'yes' && (
        <>
          <Field label="Photos du dommage">
            <InspectionPhotoField
              photos={damagePhotos}
              onAdd={onAddPhoto}
              onRemove={onRemovePhoto}
            />
          </Field>

          <Field label="Décrivez ce que vous voyez (optionnel si photos)">
            <textarea
              value={phase1.damageDescription ?? ''}
              onChange={(e) => setPhase1({ ...phase1, damageDescription: e.target.value })}
              rows={4}
              maxLength={2000}
              placeholder="Localisation, taille approximative, type de dommage…"
              className="field-input resize-y"
            />
          </Field>

          <PhotoOrTextHint />
        </>
      )}
    </ScreenLayout>
  )
}
