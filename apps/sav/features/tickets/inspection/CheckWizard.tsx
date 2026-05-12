'use client'

import { useMemo, useState, useTransition, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { saveSchoolChecklistAction } from '@/features/tickets/actions'
import { createClient } from '@/lib/supabase/client'
import { getSupabasePublicUrl } from '../utils'
import { InspectionPhotoField, type LocalInspectionPhoto } from './InspectionPhotoField'
import {
  type SchoolCheckPayload,
  type Phase1,
  type Phase2,
  type Phase3,
  type FabricCondition,
  type LinesCondition,
  type RisersCondition,
  type YesNo,
  type YesNoIdk,
  type InflationSymmetry,
  type TearSize,
  type SeamDistance,
  FABRIC_CONDITION_LABELS,
  LINES_CONDITION_LABELS,
  RISERS_CONDITION_LABELS,
  TEAR_SIZE_LABELS,
  SEAM_DISTANCE_LABELS,
  YESNO_LABELS,
  YESNOIDK_LABELS,
  INFLATION_SYMMETRY_LABELS,
  showRipstopHint,
} from './steps'

// Keys identifying the four "Oui" questions in phase 1 that accept photos.
type PhotoSlot = 'damage' | 'tears' | 'openSeams' | 'maillons'

function rehydratePhotos(paths: string[] | undefined): LocalInspectionPhoto[] {
  if (!paths || paths.length === 0) return []
  return paths.map((p, i) => ({
    id:           `existing-${i}-${p}`,
    existingPath: p,
    dataUrl:      getSupabasePublicUrl(p),
  }))
}

interface CheckWizardProps {
  ticketId:          string
  ticketHref:        string
  reportedCategory:  string | null
  initial:           SchoolCheckPayload | null
}

// 7 screens total — names kept short for the URL-less navigation.
type Screen =
  | 'inspector'
  | 'visual_general'
  | 'fabric'
  | 'seams_structure'
  | 'inflation'
  | 'flight'
  | 'review'

const ORDER: Screen[] = [
  'inspector',
  'visual_general',
  'fabric',
  'seams_structure',
  'inflation',
  'flight',
  'review',
]

// ─────────────────────────────────────────────────────────────────────────────
// Root wizard component
// ─────────────────────────────────────────────────────────────────────────────

export function CheckWizard({ ticketId, ticketHref, reportedCategory, initial }: CheckWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [inspectorName, setInspectorName] = useState<string>(initial?.inspectorName ?? '')
  const [phase1, setPhase1] = useState<Phase1>(initial?.phase1 ?? {})
  const [phase2, setPhase2] = useState<Phase2>(initial?.phase2 ?? { skipped: false })
  const [phase3, setPhase3] = useState<Phase3>(initial?.phase3 ?? { skipped: false })
  const [globalNote, setGlobalNote] = useState<string>(initial?.globalNote ?? '')

  // Photos joined to each "Oui" question in phase 1. Pre-uploaded paths from
  // a previous save are rehydrated as read-only thumbnails the school can
  // still remove (the removal is materialised at submit time by simply not
  // including the path in the new payload — the orphan stays in the bucket).
  const [photos, setPhotos] = useState<Record<PhotoSlot, LocalInspectionPhoto[]>>({
    damage:    rehydratePhotos(initial?.phase1?.damagePhotoPaths),
    tears:     rehydratePhotos(initial?.phase1?.tearsPhotoPaths),
    openSeams: rehydratePhotos(initial?.phase1?.openSeamsPhotoPaths),
    maillons:  rehydratePhotos(initial?.phase1?.maillonsPhotoPaths),
  })
  const [uploadProgress, setUploadProgress] = useState<{ done: number; total: number } | null>(null)

  function addPhoto(slot: PhotoSlot, photo: LocalInspectionPhoto) {
    setPhotos((s) => ({ ...s, [slot]: [...s[slot], photo] }))
  }
  function removePhoto(slot: PhotoSlot, id: string) {
    setPhotos((s) => ({ ...s, [slot]: s[slot].filter((p) => p.id !== id) }))
  }

  // Skip the inspector screen if the school already filled it on a previous visit.
  const [screen, setScreen] = useState<Screen>(() =>
    initial?.inspectorName?.trim() ? 'visual_general' : 'inspector'
  )
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)

  const screenIdx = ORDER.indexOf(screen)
  const totalScreens = ORDER.length
  const pct = ((screenIdx + 1) / totalScreens) * 100

  function go(direction: 'next' | 'back') {
    const target = ORDER[screenIdx + (direction === 'next' ? 1 : -1)]
    if (!target) return
    setScreen(target)
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function abort() { router.push(ticketHref) }

  function skipPhase2() {
    setPhase2({ skipped: true })
    go('next')
  }
  function skipPhase3() {
    setPhase3({ skipped: true })
    go('next')
  }

  // Validation per screen (used to gate the "Continuer" button).
  // Rule for every "Oui" answer: the school must provide at least a photo or
  // a free-text description — never nothing.
  const visualGeneralValid = useMemo(() => {
    if (phase1.visibleDamage === 'no') return true
    if (phase1.visibleDamage === 'yes') {
      const hasText  = !!phase1.damageDescription?.trim()
      const hasPhoto = photos.damage.length > 0
      return hasText || hasPhoto
    }
    return false
  }, [phase1.visibleDamage, phase1.damageDescription, photos.damage])

  const fabricValid = useMemo(() => {
    if (!phase1.fabricCondition || !phase1.visibleTears) return false
    if (phase1.visibleTears === 'no') return true
    if (!phase1.tearSize || !phase1.seamDistance) return false
    const hasText  = !!phase1.tearsNote?.trim()
    const hasPhoto = photos.tears.length > 0
    return hasText || hasPhoto
  }, [phase1.fabricCondition, phase1.visibleTears, phase1.tearSize, phase1.seamDistance, phase1.tearsNote, photos.tears])

  const seamsValid = useMemo(() => {
    if (!phase1.openSeams || !phase1.linesCondition || !phase1.maillonsInverted || !phase1.risersCondition) {
      return false
    }
    if (phase1.openSeams === 'yes') {
      const hasText  = !!phase1.openSeamsNote?.trim()
      const hasPhoto = photos.openSeams.length > 0
      if (!hasText && !hasPhoto) return false
    }
    if (phase1.maillonsInverted === 'yes') {
      const hasText  = !!phase1.maillonsNote?.trim()
      const hasPhoto = photos.maillons.length > 0
      if (!hasText && !hasPhoto) return false
    }
    return true
  }, [phase1.openSeams, phase1.linesCondition, phase1.maillonsInverted, phase1.risersCondition,
      phase1.openSeamsNote, phase1.maillonsNote, photos.openSeams, photos.maillons])

  const inflationValid = useMemo(() => {
    if (phase2.skipped) return true
    return !!phase2.inflationSymmetry && !!phase2.inflationNormalBehavior
  }, [phase2])

  const flightValid = useMemo(() => {
    if (phase3.skipped) return true
    return !!phase3.flightStraight && !!phase3.flightTurnNormal && !!phase3.flightBrakesSymmetric
  }, [phase3])

  const inspectorValid = inspectorName.trim().length >= 2

  // Uploads new photos (those with a File) to the 'tickets' bucket and merges
  // the resulting paths with the already-existing ones the school kept. Returns
  // a record of storage paths per slot, ready to be persisted in Phase1.
  async function uploadPendingPhotos(userId: string): Promise<{
    paths: Record<PhotoSlot, string[]>
    error: string | null
  }> {
    const supabase = createClient()
    const slots: PhotoSlot[] = ['damage', 'tears', 'openSeams', 'maillons']

    const totalToUpload = slots.reduce(
      (acc, s) => acc + photos[s].filter((p) => p.file).length, 0
    )
    if (totalToUpload === 0) {
      return {
        paths: {
          damage:    photos.damage.map((p) => p.existingPath!).filter(Boolean),
          tears:     photos.tears.map((p) => p.existingPath!).filter(Boolean),
          openSeams: photos.openSeams.map((p) => p.existingPath!).filter(Boolean),
          maillons:  photos.maillons.map((p) => p.existingPath!).filter(Boolean),
        },
        error: null,
      }
    }

    setUploadProgress({ done: 0, total: totalToUpload })
    let done = 0
    let lastError: string | null = null
    const result: Record<PhotoSlot, string[]> = { damage: [], tears: [], openSeams: [], maillons: [] }

    for (const slot of slots) {
      let i = 0
      for (const photo of photos[slot]) {
        if (photo.existingPath) {
          result[slot].push(photo.existingPath)
          continue
        }
        if (!photo.file) continue

        const rawExt = photo.file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
        const ext = /^[a-z0-9]+$/.test(rawExt) ? rawExt : 'jpg'
        const storagePath = `${userId}/inspection/${ticketId}/${slot}-${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('tickets')
          .upload(storagePath, photo.file, {
            upsert:       false,
            contentType:  photo.file.type || `image/${ext}`,
            cacheControl: '3600',
          })

        if (uploadError) {
          console.error('[CheckWizard upload] error:', uploadError.message)
          lastError = uploadError.message
        } else {
          result[slot].push(storagePath)
        }
        i++
        done++
        setUploadProgress({ done, total: totalToUpload })
      }
    }

    return { paths: result, error: lastError }
  }

  function handleSubmit() {
    startTransition(async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setFeedback({ type: 'error', msg: 'Session expirée. Reconnectez-vous.' })
        return
      }

      const { paths, error: uploadErr } = await uploadPendingPhotos(user.id)

      // If the school added photos and *all* of them failed, surface the error
      // instead of silently saving an incomplete payload. If only some failed,
      // we keep going (the successfully uploaded ones are saved).
      const newPhotosCount = (['damage','tears','openSeams','maillons'] as PhotoSlot[])
        .reduce((acc, s) => acc + photos[s].filter((p) => p.file).length, 0)
      const uploadedCount = paths.damage.length + paths.tears.length
                          + paths.openSeams.length + paths.maillons.length
                          - (['damage','tears','openSeams','maillons'] as PhotoSlot[])
                              .reduce((acc, s) => acc + photos[s].filter((p) => p.existingPath).length, 0)
      if (newPhotosCount > 0 && uploadedCount === 0 && uploadErr) {
        setFeedback({ type: 'error', msg: `Échec de l'upload des photos (${uploadErr}).` })
        setUploadProgress(null)
        return
      }

      const phase1WithPaths: Phase1 = {
        ...phase1,
        ...(paths.damage.length    ? { damagePhotoPaths:    paths.damage    } : { damagePhotoPaths:    undefined }),
        ...(paths.tears.length     ? { tearsPhotoPaths:     paths.tears     } : { tearsPhotoPaths:     undefined }),
        ...(paths.openSeams.length ? { openSeamsPhotoPaths: paths.openSeams } : { openSeamsPhotoPaths: undefined }),
        ...(paths.maillons.length  ? { maillonsPhotoPaths:  paths.maillons  } : { maillonsPhotoPaths:  undefined }),
      }

      const checkedIds: string[] = []
      if (phase1.visibleDamage === 'yes')           checkedIds.push('visible_damage')
      if (phase1.fabricCondition === 'damaged')     checkedIds.push('fabric_damaged')
      if (phase1.visibleTears === 'yes')            checkedIds.push('tears')
      if (phase1.openSeams === 'yes')               checkedIds.push('open_seams')
      if (phase1.linesCondition === 'broken')       checkedIds.push('lines_broken')
      if (phase1.maillonsInverted === 'yes')        checkedIds.push('maillons_inverted')
      if (phase1.risersCondition === 'damaged')     checkedIds.push('risers_damaged')
      if (!phase2.skipped && phase2.inflationNormalBehavior === 'no') checkedIds.push('inflation_abnormal')
      if (!phase3.skipped && phase3.flightStraight === 'no')          checkedIds.push('flight_not_straight')
      // Always include a sentinel so isCheckValidated stays truthy even if
      // every answer happens to be "all good".
      checkedIds.push('check_completed')

      const payload: SchoolCheckPayload = {
        __wizard__:    true,
        version:       2,
        inspectorName: inspectorName.trim(),
        completedAt:   new Date().toISOString(),
        ...(reportedCategory ? { reportedCategory } : {}),
        phase1:        phase1WithPaths,
        phase2,
        phase3,
        ...(globalNote.trim() ? { globalNote: globalNote.trim() } : {}),
        checkedIds,
      }

      const fd = new FormData()
      fd.set('ticketId', ticketId)
      checkedIds.forEach((id) => fd.append('checkedIds', id))
      fd.set('notes', JSON.stringify(payload))

      const r = await saveSchoolChecklistAction(fd)
      setUploadProgress(null)
      if (r?.error) {
        const err = r.error as Record<string, string[] | undefined>
        const msg = err._form?.[0] ?? 'Erreur lors de la sauvegarde.'
        setFeedback({ type: 'error', msg })
      } else {
        setFeedback({ type: 'ok', msg: '✓ Check enregistré.' })
        setTimeout(() => router.push(ticketHref), 700)
      }
    })
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/60">
            Étape {screenIdx + 1} / {totalScreens}
          </p>
          {reportedCategory && (
            <p className="rounded-full bg-brand-cream px-2.5 py-0.5 text-[11px] font-medium text-brand-navy ring-1 ring-brand-stone">
              Client a signalé : {reportedCategory}
            </p>
          )}
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-stone">
          <div
            className="h-full rounded-full bg-brand-gold transition-all duration-500 ease-out"
            style={{ width: `${pct}%` }}
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={totalScreens}
            aria-valuenow={screenIdx + 1}
          />
        </div>
      </div>

      {screen === 'inspector' && (
        <ScreenLayout
          title="Qui effectue le contrôle ?"
          subtitle="Cette information est conservée avec le diagnostic pour la traçabilité."
          footer={
            <NavButtons
              backLabel="← Annuler"
              onBack={abort}
              onNext={() => go('next')}
              nextDisabled={!inspectorValid}
              nextLabel="Commencer le check"
            />
          }
        >
          <label htmlFor="inspector-name" className="mb-1.5 block text-sm font-medium text-brand-ink">
            Nom et prénom
          </label>
          <input
            id="inspector-name"
            type="text"
            value={inspectorName}
            onChange={(e) => setInspectorName(e.target.value)}
            placeholder="Ex : Pierre Durand"
            className="field-input"
            autoFocus
            autoComplete="name"
            maxLength={120}
          />
        </ScreenLayout>
      )}

      {screen === 'visual_general' && (
        <ScreenLayout
          phase="Phase 1 — Inspection visuelle"
          title="Inspection visuelle générale"
          subtitle="Sortez l'aile et examinez-la sur toute sa surface, des suspentes au tissu."
          footer={
            <NavButtons
              onBack={() => go('back')}
              onNext={() => go('next')}
              nextDisabled={!visualGeneralValid}
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
                  photos={photos.damage}
                  onAdd={(p)   => addPhoto('damage', p)}
                  onRemove={(id) => removePhoto('damage', id)}
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
      )}

      {screen === 'fabric' && (
        <ScreenLayout
          phase="Phase 1 — Inspection visuelle"
          title="Tissu"
          subtitle="Inspectez la voile sur l'extrados et l'intrados."
          footer={
            <NavButtons
              onBack={() => go('back')}
              onNext={() => go('next')}
              nextDisabled={!fabricValid}
            />
          }
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
              onChange={(v) => setPhase1({ ...phase1, visibleTears: v, ...(v === 'no' ? { tearSize: undefined, seamDistance: undefined } : {}) })}
            />
          </Field>

          {phase1.visibleTears === 'yes' && (
            <>
              <Field label="Taille estimée de la déchirure">
                <SegmentedChoice<TearSize>
                  options={[
                    { value: 'lt5',     label: TEAR_SIZE_LABELS.lt5     },
                    { value: '5to10',   label: TEAR_SIZE_LABELS['5to10'] },
                    { value: '10to15',  label: TEAR_SIZE_LABELS['10to15']},
                    { value: 'gt15',    label: TEAR_SIZE_LABELS.gt15,   tone: 'red' },
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
                  photos={photos.tears}
                  onAdd={(p)   => addPhoto('tears', p)}
                  onRemove={(id) => removePhoto('tears', id)}
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
      )}

      {screen === 'seams_structure' && (
        <ScreenLayout
          phase="Phase 1 — Inspection visuelle"
          title="Coutures et structure"
          subtitle="Vérifiez les points porteurs : coutures, suspentes, maillons, élévateurs."
          footer={
            <NavButtons
              onBack={() => go('back')}
              onNext={() => go('next')}
              nextDisabled={!seamsValid}
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
                  onAdd={(p)   => addPhoto('openSeams', p)}
                  onRemove={(id) => removePhoto('openSeams', id)}
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
                  onAdd={(p)   => addPhoto('maillons', p)}
                  onRemove={(id) => removePhoto('maillons', id)}
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
        </ScreenLayout>
      )}

      {screen === 'inflation' && (
        <ScreenLayout
          phase="Phase 2 — Check gonflage (optionnel)"
          title="Avez-vous pu gonfler l'aile ?"
          subtitle="Test au sol (gonflage/marche) — optionnel mais utile pour repérer une asymétrie."
          footer={
            <NavButtons
              onBack={() => go('back')}
              onNext={() => go('next')}
              nextDisabled={!inflationValid}
              tertiaryLabel="Passer cette phase →"
              onTertiary={skipPhase2}
            />
          }
        >
          <Field label="Test au sol effectué ?">
            <SegmentedChoice<'yes' | 'no'>
              options={[
                { value: 'yes', label: "Oui, j'ai fait un check au sol" },
                { value: 'no',  label: 'Non, pas possible'              },
              ]}
              value={phase2.skipped ? 'no' : (phase2.inflationSymmetry || phase2.inflationNormalBehavior ? 'yes' : undefined)}
              onChange={(v) => {
                if (v === 'no') setPhase2({ skipped: true })
                else            setPhase2({ skipped: false })
              }}
            />
          </Field>

          {!phase2.skipped && (
            <>
              <Field label="Gonflage symétrique ?">
                <SegmentedChoice<InflationSymmetry>
                  options={[
                    { value: 'yes',    label: INFLATION_SYMMETRY_LABELS.yes,    tone: 'emerald' },
                    { value: 'no',     label: INFLATION_SYMMETRY_LABELS.no,     tone: 'red'     },
                    { value: 'unsure', label: INFLATION_SYMMETRY_LABELS.unsure, tone: 'slate'   },
                  ]}
                  value={phase2.inflationSymmetry}
                  onChange={(v) => setPhase2({ ...phase2, inflationSymmetry: v })}
                />
              </Field>

              <Field label="L'aile se comporte normalement au gonflage ?">
                <YesNoSelector
                  value={phase2.inflationNormalBehavior}
                  onChange={(v) => setPhase2({ ...phase2, inflationNormalBehavior: v })}
                />
              </Field>

              <Field label="Remarques au gonflage (optionnel)">
                <textarea
                  value={phase2.inflationNotes ?? ''}
                  onChange={(e) => setPhase2({ ...phase2, inflationNotes: e.target.value })}
                  rows={3}
                  maxLength={2000}
                  placeholder="Comportement noté, ressenti…"
                  className="field-input resize-y"
                />
              </Field>
            </>
          )}
        </ScreenLayout>
      )}

      {screen === 'flight' && (
        <ScreenLayout
          phase="Phase 3 — Check en vol (optionnel)"
          title="Avez-vous pu faire un test en vol ?"
          subtitle="Test en vol — utile pour valider un comportement ressenti par le client."
          footer={
            <NavButtons
              onBack={() => go('back')}
              onNext={() => go('next')}
              nextDisabled={!flightValid}
              tertiaryLabel="Passer cette phase →"
              onTertiary={skipPhase3}
            />
          }
        >
          <Field label="Test en vol effectué ?">
            <SegmentedChoice<'yes' | 'no'>
              options={[
                { value: 'yes', label: 'Oui'  },
                { value: 'no',  label: 'Non'  },
              ]}
              value={phase3.skipped ? 'no' : (phase3.flightStraight || phase3.flightTurnNormal || phase3.flightBrakesSymmetric ? 'yes' : undefined)}
              onChange={(v) => {
                if (v === 'no') setPhase3({ skipped: true })
                else            setPhase3({ skipped: false })
              }}
            />
          </Field>

          {!phase3.skipped && (
            <>
              <Field label="Vol droit ?">
                <YesNoSelector
                  value={phase3.flightStraight}
                  onChange={(v) => setPhase3({ ...phase3, flightStraight: v })}
                />
              </Field>

              <Field label="Comportement normal en virage ?">
                <YesNoSelector
                  value={phase3.flightTurnNormal}
                  onChange={(v) => setPhase3({ ...phase3, flightTurnNormal: v })}
                />
              </Field>

              <Field label="Freins symétriques ?">
                <YesNoSelector
                  value={phase3.flightBrakesSymmetric}
                  onChange={(v) => setPhase3({ ...phase3, flightBrakesSymmetric: v })}
                />
              </Field>

              <Field label="Remarques en vol (optionnel)">
                <textarea
                  value={phase3.flightNotes ?? ''}
                  onChange={(e) => setPhase3({ ...phase3, flightNotes: e.target.value })}
                  rows={3}
                  maxLength={2000}
                  placeholder="Sensations, comportements observés…"
                  className="field-input resize-y"
                />
              </Field>
            </>
          )}
        </ScreenLayout>
      )}

      {screen === 'review' && (
        <ReviewScreen
          inspectorName={inspectorName}
          phase1={phase1}
          phase2={phase2}
          phase3={phase3}
          globalNote={globalNote}
          onGlobalNoteChange={setGlobalNote}
          onBack={() => go('back')}
          onSubmit={handleSubmit}
          isPending={isPending}
          feedback={feedback}
          uploadProgress={uploadProgress}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout primitives
// ─────────────────────────────────────────────────────────────────────────────

function ScreenLayout({
  phase, title, subtitle, children, footer,
}: {
  phase?:    string
  title:     string
  subtitle?: string
  children:  ReactNode
  footer:    ReactNode
}) {
  return (
    <div className="card animate-slide-up p-5">
      {phase && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold">
          {phase}
        </p>
      )}
      <h2 className="mt-1 font-display text-xl font-bold text-brand-ink">{title}</h2>
      {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}

      <div className="mt-5 space-y-5">
        {children}
      </div>

      <div className="mt-6">{footer}</div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-brand-ink">{label}</p>
      {children}
    </div>
  )
}

// Surfaced under every "Oui" branch in phase 1 — reminds the school that the
// "Continuer" button stays disabled until they provide at least one of the
// two pieces of evidence.
function PhotoOrTextHint() {
  return (
    <p className="rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
      ⚠️ Ajoutez au moins <strong>une photo</strong> ou <strong>une description</strong> pour continuer.
    </p>
  )
}

function NavButtons({
  onBack, onNext, nextDisabled, backLabel = '← Précédent', nextLabel = 'Continuer',
  tertiaryLabel, onTertiary,
}: {
  onBack:       () => void
  onNext:       () => void
  nextDisabled?: boolean
  backLabel?:   string
  nextLabel?:   string
  tertiaryLabel?: string
  onTertiary?:    () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          {backLabel}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={nextDisabled}
          className="btn-primary flex-[2]"
        >
          {nextLabel}
        </button>
      </div>
      {tertiaryLabel && onTertiary && (
        <button
          type="button"
          onClick={onTertiary}
          className="block w-full text-center text-xs font-medium text-slate-500 underline underline-offset-4 hover:text-brand-gold"
        >
          {tertiaryLabel}
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Yes / No selector — used for binary visual checks
// ─────────────────────────────────────────────────────────────────────────────

function YesNoSelector({ value, onChange }: { value: YesNo | undefined; onChange: (v: YesNo) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange('yes')}
        className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-4 text-sm font-semibold transition-all active:scale-[0.97] ${
          value === 'yes'
            ? 'border-emerald-500 bg-emerald-50 text-emerald-900'
            : 'border-brand-stone bg-white text-brand-ink hover:border-brand-gold/40'
        }`}
      >
        <span className="text-2xl" aria-hidden>✓</span>
        Oui
      </button>
      <button
        type="button"
        onClick={() => onChange('no')}
        className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-4 text-sm font-semibold transition-all active:scale-[0.97] ${
          value === 'no'
            ? 'border-red-500 bg-red-50 text-red-900'
            : 'border-brand-stone bg-white text-brand-ink hover:border-brand-gold/40'
        }`}
      >
        <span className="text-2xl" aria-hidden>✕</span>
        Non
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Segmented choice — generic n-way picker with optional tone
// ─────────────────────────────────────────────────────────────────────────────

type Tone = 'emerald' | 'amber' | 'red' | 'slate' | 'gold'

function toneClasses(tone: Tone | undefined, selected: boolean): string {
  if (!selected) return 'border-brand-stone bg-white text-brand-ink hover:border-brand-gold/40'
  switch (tone) {
    case 'emerald': return 'border-emerald-500 bg-emerald-50 text-emerald-900'
    case 'amber':   return 'border-amber-500 bg-amber-50 text-amber-900'
    case 'red':     return 'border-red-500 bg-red-50 text-red-900'
    case 'slate':   return 'border-slate-500 bg-slate-50 text-slate-900'
    case 'gold':
    default:        return 'border-brand-gold bg-brand-gold/10 text-brand-ink shadow-plume'
  }
}

interface SegmentedChoiceProps<T extends string> {
  options:  Array<{ value: T; label: string; tone?: Tone }>
  value:    T | undefined
  onChange: (v: T) => void
}

function SegmentedChoice<T extends string>({ options, value, onChange }: SegmentedChoiceProps<T>) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-2xl border-2 px-3 py-3 text-left text-sm font-semibold transition-all active:scale-[0.99] ${toneClasses(opt.tone, selected)}`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Review screen — synthesis of every answer + global note + submit
// ─────────────────────────────────────────────────────────────────────────────

interface ReviewScreenProps {
  inspectorName:      string
  phase1:             Phase1
  phase2:             Phase2
  phase3:             Phase3
  globalNote:         string
  onGlobalNoteChange: (s: string) => void
  onBack:             () => void
  onSubmit:           () => void
  isPending:          boolean
  feedback:           { type: 'ok' | 'error'; msg: string } | null
  uploadProgress:     { done: number; total: number } | null
}

function ReviewScreen({
  inspectorName, phase1, phase2, phase3, globalNote, onGlobalNoteChange,
  onBack, onSubmit, isPending, feedback, uploadProgress,
}: ReviewScreenProps) {
  return (
    <div className="card animate-slide-up p-5">
      <h2 className="font-display text-xl font-bold text-brand-ink">Synthèse</h2>
      <p className="mt-1 text-sm text-slate-500">
        Relisez vos observations puis validez. Vous pouvez revenir en arrière pour corriger.
      </p>

      {inspectorName.trim() && (
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-cream px-3 py-2 text-sm text-brand-ink">
          <span aria-hidden>👤</span>
          <span>Effectué par <strong>{inspectorName.trim()}</strong></span>
        </div>
      )}

      {/* Phase 1 */}
      <ReviewSection title="Inspection visuelle générale">
        <ReviewRow label="Dommages visibles" value={phase1.visibleDamage ? YESNO_LABELS[phase1.visibleDamage] : '—'} />
        {phase1.damageDescription && (
          <ReviewRow label="Description" value={phase1.damageDescription} multiline />
        )}
      </ReviewSection>

      <ReviewSection title="Tissu">
        <ReviewRow label="État" value={phase1.fabricCondition ? FABRIC_CONDITION_LABELS[phase1.fabricCondition] : '—'} />
        <ReviewRow label="Déchirures visibles" value={phase1.visibleTears ? YESNO_LABELS[phase1.visibleTears] : '—'} />
        {phase1.visibleTears === 'yes' && (
          <>
            <ReviewRow label="Taille" value={phase1.tearSize ? TEAR_SIZE_LABELS[phase1.tearSize] : '—'} />
            <ReviewRow label="Couture" value={phase1.seamDistance ? SEAM_DISTANCE_LABELS[phase1.seamDistance] : '—'} />
          </>
        )}
      </ReviewSection>

      <ReviewSection title="Coutures et structure">
        <ReviewRow label="Coutures ouvertes" value={phase1.openSeams ? YESNO_LABELS[phase1.openSeams] : '—'} />
        <ReviewRow label="Suspentes" value={phase1.linesCondition ? LINES_CONDITION_LABELS[phase1.linesCondition] : '—'} />
        <ReviewRow label="Maillons inversés" value={phase1.maillonsInverted ? YESNOIDK_LABELS[phase1.maillonsInverted] : '—'} />
        <ReviewRow label="Élévateurs" value={phase1.risersCondition ? RISERS_CONDITION_LABELS[phase1.risersCondition] : '—'} />
      </ReviewSection>

      <ReviewSection title="Check gonflage" skipped={phase2.skipped}>
        {!phase2.skipped && (
          <>
            <ReviewRow label="Symétrie" value={phase2.inflationSymmetry ? INFLATION_SYMMETRY_LABELS[phase2.inflationSymmetry] : '—'} />
            <ReviewRow label="Comportement normal" value={phase2.inflationNormalBehavior ? YESNO_LABELS[phase2.inflationNormalBehavior] : '—'} />
            {phase2.inflationNotes && <ReviewRow label="Remarques" value={phase2.inflationNotes} multiline />}
          </>
        )}
      </ReviewSection>

      <ReviewSection title="Check en vol" skipped={phase3.skipped}>
        {!phase3.skipped && (
          <>
            <ReviewRow label="Vol droit" value={phase3.flightStraight ? YESNO_LABELS[phase3.flightStraight] : '—'} />
            <ReviewRow label="Virage normal" value={phase3.flightTurnNormal ? YESNO_LABELS[phase3.flightTurnNormal] : '—'} />
            <ReviewRow label="Freins symétriques" value={phase3.flightBrakesSymmetric ? YESNO_LABELS[phase3.flightBrakesSymmetric] : '—'} />
            {phase3.flightNotes && <ReviewRow label="Remarques" value={phase3.flightNotes} multiline />}
          </>
        )}
      </ReviewSection>

      <div className="mt-5">
        <label className="mb-1.5 block text-sm font-medium text-brand-ink">
          Votre avis global (optionnel)
        </label>
        <textarea
          value={globalNote}
          onChange={(e) => onGlobalNoteChange(e.target.value)}
          rows={4}
          maxLength={2000}
          placeholder="Synthèse pour l'atelier ou pour vos archives…"
          className="field-input resize-y"
        />
      </div>

      <p className="mt-4 rounded-xl bg-brand-cream px-3 py-2 text-xs leading-relaxed text-slate-600">
        💡 Vous constatez ce que vous voyez — vous ne certifiez rien. La décision finale
        (réparation école, escalade atelier…) se fait dans le panneau Décision.
      </p>

      {uploadProgress && uploadProgress.total > 0 && (
        <div className="mt-4 rounded-xl bg-brand-cream p-3">
          <p className="text-xs text-slate-500">Upload des photos…</p>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white">
            <div
              className="h-full rounded-full bg-brand-gold transition-all duration-300"
              style={{ width: `${(uploadProgress.done / uploadProgress.total) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">{uploadProgress.done}/{uploadProgress.total}</p>
        </div>
      )}

      {feedback && (
        <p className={`mt-4 rounded-xl px-3 py-2 text-sm ${
          feedback.type === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
        }`}>
          {feedback.msg}
        </p>
      )}

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1" disabled={isPending}>
          ← Modifier
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="btn-primary flex-[2]"
        >
          {isPending ? 'Sauvegarde…' : 'Valider le check'}
        </button>
      </div>
    </div>
  )
}

function ReviewSection({ title, children, skipped }: { title: string; children?: ReactNode; skipped?: boolean }) {
  return (
    <section className="mt-5 rounded-2xl border border-brand-stone bg-brand-cream/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/70">{title}</p>
        {skipped && (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
            phase passée
          </span>
        )}
      </div>
      {!skipped && <div className="mt-3 space-y-1.5">{children}</div>}
    </section>
  )
}

function ReviewRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className={`flex ${multiline ? 'flex-col gap-1' : 'items-baseline justify-between gap-3'}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`text-sm text-brand-ink ${multiline ? 'whitespace-pre-line' : 'text-right font-semibold'}`}>
        {value}
      </p>
    </div>
  )
}
