'use client'

import { InspectionPhotoField, type LocalInspectionPhoto } from '../InspectionPhotoField'
import {
  type InflationSurfaceConsistency,
  type InflationTendency,
  type Phase2,
  INFLATION_SURFACE_LABELS,
  INFLATION_TENDENCY_LABELS,
} from '../steps'
import { Field, NavButtons, ScreenLayout, SegmentedChoice } from './_shared'

interface InflationScreenProps {
  phase2:          Phase2
  setPhase2:       (next: Phase2) => void
  inflationPhotos: LocalInspectionPhoto[]
  onAddPhoto:      (photo: LocalInspectionPhoto) => void
  onRemovePhoto:   (id: string) => void
  isValid:         boolean
  onBack:          () => void
  onNext:          () => void
  onSkip:          () => void
}

export function InflationScreen({
  phase2, setPhase2, inflationPhotos, onAddPhoto, onRemovePhoto,
  isValid, onBack, onNext, onSkip,
}: InflationScreenProps) {
  return (
    <ScreenLayout
      phase="Phase 2 — Check gonflage (optionnel)"
      title="Avez-vous pu gonfler l'aile ?"
      subtitle="Test au sol (gonflage/marche) — optionnel. On cherche des déformations suspicieuses, un gonflage paresseux (la voile monte difficilement) ou au contraire une voile trop sensible qui veut fermer sans raison."
      footer={
        <NavButtons
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!isValid}
          tertiaryLabel="Passer cette phase →"
          onTertiary={onSkip}
        />
      }
    >
      <Field label="Test au sol effectué ?">
        <SegmentedChoice<'yes' | 'no' | 'not_necessary'>
          options={[
            { value: 'yes',           label: "Oui, j'ai fait un check au sol" },
            { value: 'no',            label: 'Non, pas possible'              },
            { value: 'not_necessary', label: 'Pas nécessaire'                 },
          ]}
          value={phase2.skipped ? (
            phase2.skipReason === 'not_necessary' ? 'not_necessary' : 'no'
          ) : (
            phase2.inflationSurfaceConsistency ||
            phase2.inflationTendency ||
            inflationPhotos.length > 0
              ? 'yes' : undefined
          )}
          onChange={(v) => {
            if (v === 'no')                 setPhase2({ skipped: true, skipReason: 'not_possible' })
            else if (v === 'not_necessary') setPhase2({ skipped: true, skipReason: 'not_necessary' })
            else                            setPhase2({ skipped: false })
          }}
        />
      </Field>

      {!phase2.skipped && (
        <>
          <Field label="État de surface cohérent et propre ?">
            <SegmentedChoice<InflationSurfaceConsistency>
              options={[
                { value: 'yes',    label: INFLATION_SURFACE_LABELS.yes,    tone: 'emerald' },
                { value: 'no',     label: INFLATION_SURFACE_LABELS.no,     tone: 'red'     },
                { value: 'unsure', label: INFLATION_SURFACE_LABELS.unsure, tone: 'slate'   },
              ]}
              value={phase2.inflationSurfaceConsistency}
              onChange={(v) => setPhase2({ ...phase2, inflationSurfaceConsistency: v })}
            />
          </Field>

          <Field label="Comportement observé au gonflage ?">
            <SegmentedChoice<InflationTendency>
              options={[
                { value: 'closes_easily', label: INFLATION_TENDENCY_LABELS.closes_easily, tone: 'red'     },
                { value: 'lazy',          label: INFLATION_TENDENCY_LABELS.lazy,          tone: 'red'     },
                { value: 'none',          label: INFLATION_TENDENCY_LABELS.none,          tone: 'emerald' },
                { value: 'unsure',        label: INFLATION_TENDENCY_LABELS.unsure,        tone: 'slate'   },
              ]}
              value={phase2.inflationTendency}
              onChange={(v) => setPhase2({ ...phase2, inflationTendency: v })}
            />
          </Field>

          <Field label="Photos du gonflage (optionnel)">
            <InspectionPhotoField
              photos={inflationPhotos}
              onAdd={onAddPhoto}
              onRemove={onRemovePhoto}
            />
          </Field>

          <Field label="Remarques au gonflage (optionnel)">
            <textarea
              value={phase2.inflationNotes ?? ''}
              onChange={(e) => setPhase2({ ...phase2, inflationNotes: e.target.value })}
              rows={3}
              maxLength={2000}
              placeholder="Déformations observées, gonflage paresseux ou voile trop sensible, état de surface, ressenti…"
              className="field-input resize-y"
            />
          </Field>
        </>
      )}
    </ScreenLayout>
  )
}
