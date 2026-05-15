'use client'

import { InspectionPhotoField, type LocalInspectionPhoto } from '../InspectionPhotoField'
import {
  type LinesCondition,
  type Phase1,
  type RisersCondition,
  type YesNoIdk,
  LINES_CONDITION_LABELS,
  RISERS_CONDITION_LABELS,
  YESNOIDK_LABELS,
} from '../steps'
import {
  Field,
  NavButtons,
  OptionalEvidenceHint,
  PhotoOrTextHint,
  ScreenLayout,
  SegmentedChoice,
  YesNoSelector,
} from './_shared'

interface SeamsStructureScreenProps {
  phase1:    Phase1
  setPhase1: (next: Phase1) => void
  photos: {
    openSeams: LocalInspectionPhoto[]
    lines:     LocalInspectionPhoto[]
    maillons:  LocalInspectionPhoto[]
    risers:    LocalInspectionPhoto[]
  }
  onAddOpenSeamsPhoto:    (p: LocalInspectionPhoto) => void
  onRemoveOpenSeamsPhoto: (id: string) => void
  onAddLinesPhoto:        (p: LocalInspectionPhoto) => void
  onRemoveLinesPhoto:     (id: string) => void
  onAddMaillonsPhoto:     (p: LocalInspectionPhoto) => void
  onRemoveMaillonsPhoto:  (id: string) => void
  onAddRisersPhoto:       (p: LocalInspectionPhoto) => void
  onRemoveRisersPhoto:    (id: string) => void
  isValid: boolean
  onBack:  () => void
  onNext:  () => void
}

export function SeamsStructureScreen({
  phase1, setPhase1, photos,
  onAddOpenSeamsPhoto, onRemoveOpenSeamsPhoto,
  onAddLinesPhoto, onRemoveLinesPhoto,
  onAddMaillonsPhoto, onRemoveMaillonsPhoto,
  onAddRisersPhoto, onRemoveRisersPhoto,
  isValid, onBack, onNext,
}: SeamsStructureScreenProps) {
  return (
    <ScreenLayout
      phase="Phase 1 — Inspection visuelle"
      title="Coutures et structure"
      subtitle="Vérifiez les points porteurs : coutures, suspentes, maillons, élévateurs."
      footer={
        <NavButtons
          onBack={onBack}
          onNext={onNext}
          nextDisabled={!isValid}
        />
      }
    >
      <Field label="Coutures ouvertes ?">
        <YesNoSelector
          value={phase1.openSeams}
          onChange={(v) => setPhase1({ ...phase1, openSeams: v })}
        />
      </Field>

      {phase1.openSeams === 'yes' && (
        <div className="-mt-2 space-y-4 rounded-2xl border border-brand-stone bg-brand-cream/40 p-4">
          <Field label="Photos des coutures concernées">
            <InspectionPhotoField
              photos={photos.openSeams}
              onAdd={onAddOpenSeamsPhoto}
              onRemove={onRemoveOpenSeamsPhoto}
            />
          </Field>
          <Field label="Description (optionnel si photos)">
            <textarea
              value={phase1.openSeamsNote ?? ''}
              onChange={(e) => setPhase1({ ...phase1, openSeamsNote: e.target.value })}
              rows={3}
              maxLength={2000}
              placeholder="Quelle couture, sur quelle longueur…"
              className="field-input resize-y"
            />
          </Field>
          <PhotoOrTextHint />
        </div>
      )}

      <Field label="Suspentes — état visible">
        <SegmentedChoice<LinesCondition>
          options={[
            { value: 'good',   label: LINES_CONDITION_LABELS.good,   tone: 'emerald' },
            { value: 'worn',   label: LINES_CONDITION_LABELS.worn,   tone: 'amber'   },
            { value: 'broken', label: LINES_CONDITION_LABELS.broken, tone: 'red'     },
          ]}
          value={phase1.linesCondition}
          onChange={(v) => setPhase1({ ...phase1, linesCondition: v })}
        />
      </Field>

      {(phase1.linesCondition === 'worn' || phase1.linesCondition === 'broken') && (
        <div className="-mt-2 space-y-4 rounded-2xl border border-brand-stone bg-brand-cream/40 p-4">
          <Field label="Photos des suspentes">
            <InspectionPhotoField
              photos={photos.lines}
              onAdd={onAddLinesPhoto}
              onRemove={onRemoveLinesPhoto}
            />
          </Field>
          <Field label="Description (optionnel si photos)">
            <textarea
              value={phase1.linesNote ?? ''}
              onChange={(e) => setPhase1({ ...phase1, linesNote: e.target.value })}
              rows={3}
              maxLength={2000}
              placeholder="Quelles suspentes, où, niveau d&apos;usure observé…"
              className="field-input resize-y"
            />
          </Field>
          {phase1.linesCondition === 'broken' ? <PhotoOrTextHint /> : <OptionalEvidenceHint />}
        </div>
      )}

      <Field label="Maillons — inversés ou mal positionnés ?">
        <SegmentedChoice<YesNoIdk>
          options={[
            { value: 'yes', label: YESNOIDK_LABELS.yes, tone: 'red'     },
            { value: 'no',  label: YESNOIDK_LABELS.no,  tone: 'emerald' },
            { value: 'idk', label: YESNOIDK_LABELS.idk, tone: 'slate'   },
          ]}
          value={phase1.maillonsInverted}
          onChange={(v) => setPhase1({ ...phase1, maillonsInverted: v })}
        />
      </Field>

      {phase1.maillonsInverted === 'yes' && (
        <div className="-mt-2 space-y-4 rounded-2xl border border-brand-stone bg-brand-cream/40 p-4">
          <Field label="Photos des maillons">
            <InspectionPhotoField
              photos={photos.maillons}
              onAdd={onAddMaillonsPhoto}
              onRemove={onRemoveMaillonsPhoto}
            />
          </Field>
          <Field label="Description (optionnel si photos)">
            <textarea
              value={phase1.maillonsNote ?? ''}
              onChange={(e) => setPhase1({ ...phase1, maillonsNote: e.target.value })}
              rows={3}
              maxLength={2000}
              placeholder="Quels maillons, comment ils sont positionnés…"
              className="field-input resize-y"
            />
          </Field>
          <PhotoOrTextHint />
        </div>
      )}

      <Field label="Élévateurs — état visible">
        <SegmentedChoice<RisersCondition>
          options={[
            { value: 'good',    label: RISERS_CONDITION_LABELS.good,    tone: 'emerald' },
            { value: 'worn',    label: RISERS_CONDITION_LABELS.worn,    tone: 'amber'   },
            { value: 'damaged', label: RISERS_CONDITION_LABELS.damaged, tone: 'red'     },
          ]}
          value={phase1.risersCondition}
          onChange={(v) => setPhase1({ ...phase1, risersCondition: v })}
        />
      </Field>

      {(phase1.risersCondition === 'worn' || phase1.risersCondition === 'damaged') && (
        <div className="-mt-2 space-y-4 rounded-2xl border border-brand-stone bg-brand-cream/40 p-4">
          <Field label="Photos des élévateurs">
            <InspectionPhotoField
              photos={photos.risers}
              onAdd={onAddRisersPhoto}
              onRemove={onRemoveRisersPhoto}
            />
          </Field>
          <Field label="Description (optionnel si photos)">
            <textarea
              value={phase1.risersNote ?? ''}
              onChange={(e) => setPhase1({ ...phase1, risersNote: e.target.value })}
              rows={3}
              maxLength={2000}
              placeholder="Quel élévateur, zone abîmée, niveau d&apos;usure…"
              className="field-input resize-y"
            />
          </Field>
          {phase1.risersCondition === 'damaged' ? <PhotoOrTextHint /> : <OptionalEvidenceHint />}
        </div>
      )}
    </ScreenLayout>
  )
}
