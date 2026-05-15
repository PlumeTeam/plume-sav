'use client'

import { InspectionPhotoField, type LocalInspectionPhoto } from '../InspectionPhotoField'
import {
  FABRIC_CONDITION_LABELS,
  TEAR_SIZE_LABELS,
  SEAM_DISTANCE_LABELS,
  showRipstopHint,
  type FabricCondition,
  type Phase1,
  type SeamDistance,
  type TearSize,
} from '../steps'
import {
  Field,
  NavButtons,
  PhotoOrTextHint,
  ScreenLayout,
  SegmentedChoice,
  YesNoSelector,
} from '../_shell'

export interface FabricScreenProps {
  phase1:      Phase1
  setPhase1:   (p: Phase1) => void
  photos:      LocalInspectionPhoto[]
  addPhoto:    (p: LocalInspectionPhoto) => void
  removePhoto: (id: string) => void
  valid:       boolean
  onBack:      () => void
  onNext:      () => void
}

export function FabricScreen({
  phase1, setPhase1, photos, addPhoto, removePhoto, valid, onBack, onNext,
}: FabricScreenProps) {
  return (
    <ScreenLayout
      phase="Phase 1 — Inspection visuelle"
      title="Tissu"
      subtitle="Inspectez la voile sur l'extrados et l'intrados."
      footer={<NavButtons onBack={onBack} onNext={onNext} nextDisabled={!valid} />}
    >
      <Field label="État du tissu">
        <SegmentedChoice<FabricCondition>
          options={[
            { value: 'good',    label: FABRIC_CONDITION_LABELS.good,    tone: 'emerald' },
            { value: 'worn',    label: FABRIC_CONDITION_LABELS.worn,    tone: 'amber'   },
            { value: 'damaged', label: FABRIC_CONDITION_LABELS.damaged, tone: 'red'     },
          ]}
          value={phase1.fabricCondition}
          onChange={(v) => setPhase1({ ...phase1, fabricCondition: v })}
        />
      </Field>

      <Field label="Déchirures visibles ?">
        <YesNoSelector
          value={phase1.visibleTears}
          onChange={(v) =>
            setPhase1({
              ...phase1,
              visibleTears: v,
              ...(v === 'no' ? { tearSize: undefined, seamDistance: undefined } : {}),
            })
          }
        />
      </Field>

      {phase1.visibleTears === 'yes' && (
        <>
          <Field label="Taille estimée de la déchirure">
            <SegmentedChoice<TearSize>
              options={[
                { value: 'lt5',    label: TEAR_SIZE_LABELS.lt5     },
                { value: '5to10',  label: TEAR_SIZE_LABELS['5to10'] },
                { value: '10to15', label: TEAR_SIZE_LABELS['10to15']},
                { value: 'gt15',   label: TEAR_SIZE_LABELS.gt15,   tone: 'red' },
              ]}
              value={phase1.tearSize}
              onChange={(v) => setPhase1({ ...phase1, tearSize: v })}
            />
          </Field>

          <Field label="Distance de la couture la plus proche">
            <SegmentedChoice<SeamDistance>
              options={[
                { value: 'close', label: SEAM_DISTANCE_LABELS.close, tone: 'red' },
                { value: 'far',   label: SEAM_DISTANCE_LABELS.far               },
              ]}
              value={phase1.seamDistance}
              onChange={(v) => setPhase1({ ...phase1, seamDistance: v })}
            />
          </Field>

          {showRipstopHint(phase1) && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-900">
              💡 <strong>Réparable avec du ripstop</strong> (Porcher Sport).{' '}
              Pour les tissus Dominico, demandez conseil à l&apos;atelier avant intervention.
            </div>
          )}
          {phase1.tearSize === 'gt15' && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs leading-relaxed text-red-900">
              ⚠️ Déchirure {'>'} 15 cm — escalade atelier recommandée. Notez-le dans la décision finale.
            </div>
          )}
          {phase1.seamDistance === 'close' && phase1.tearSize && phase1.tearSize !== 'gt15' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              ⚠️ Déchirure proche d&apos;une couture — l&apos;atelier doit valider la réparabilité.
            </div>
          )}

          <Field label="Photos de la déchirure">
            <InspectionPhotoField
              photos={photos}
              onAdd={addPhoto}
              onRemove={removePhoto}
            />
          </Field>

          <Field label="Description (optionnel si photos)">
            <textarea
              value={phase1.tearsNote ?? ''}
              onChange={(e) => setPhase1({ ...phase1, tearsNote: e.target.value })}
              rows={3}
              maxLength={2000}
              placeholder="Localisation précise, contexte, observations complémentaires…"
              className="field-input resize-y"
            />
          </Field>

          <PhotoOrTextHint />
        </>
      )}
    </ScreenLayout>
  )
}
