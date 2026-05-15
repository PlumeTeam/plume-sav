'use client'

import { InspectionPhotoField, type LocalInspectionPhoto } from '../InspectionPhotoField'
import {
  INFLATION_SURFACE_LABELS,
  INFLATION_TENDENCY_LABELS,
  type InflationSurfaceConsistency,
  type InflationTendency,
  type Phase2,
} from '../steps'
import {
  Field,
  NavButtons,
  ScreenLayout,
  SegmentedChoice,
} from '../_shell'

export interface InflationScreenProps {
  phase2:      Phase2
  setPhase2:   (p: Phase2) => void
  photos:      LocalInspectionPhoto[]
  addPhoto:    (p: LocalInspectionPhoto) => void
  removePhoto: (id: string) => void
  valid:       boolean
  onBack:      () => void
  onNext:      () => void
  onSkip:      () => void
}

export function InflationScreen({
  phase2, setPhase2, photos, addPhoto, removePhoto, valid, onBack, onNext, onSkip,
}: InflationScreenProps) {
  // Helper : déduit l'option Yes/No actuelle à partir du payload phase2
  const yesNoValue: 'yes' | 'no' | undefined =
    phase2.skipped
      ? 'no'
      : (phase2.inflationSurfaceConsistency ||
         phase2.inflationTendency ||
         photos.length > 0)
        ? 'yes'
        : undefined

  return (
    <ScreenLayout
      phase="Phase 2 — Check gonflage (optionnel)"
      title="Avez-vous pu gonfler l'aile ?"
      subtitle="Test au sol (gonflage/marche) — optionnel. On cherche des déformations suspicieuses, un gonflage paresseux (la voile monte difficilement) ou au contraire une voile trop sensible qui veut fermer sans raison."
      footer={
        <NavButtons
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!valid}
          tertiaryLabel="Passer cette phase →"
          onTertiary={onSkip}
        />
      }
    >
      <Field label="Test au sol effectué ?">
        <SegmentedChoice<'yes' | 'no'>
          options={[
            { value: 'yes', label: "Oui, j'ai fait un check au sol" },
            { value: 'no',  label: 'Non, pas possible'              },
          ]}
          value={yesNoValue}
          onChange={(v) => {
            if (v === 'no') setPhase2({ skipped: true })
            else            setPhase2({ skipped: false })
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
              photos={photos}
              onAdd={addPhoto}
              onRemove={removePhoto}
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
