'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { saveSchoolChecklistAction } from '@/features/tickets/actions'
import { createClient } from '@/lib/supabase/client'
import { getSupabasePublicUrl } from '../utils'
import type { LocalInspectionPhoto } from './InspectionPhotoField'
import type { Phase1, Phase2, SchoolCheckPayload } from './steps'
import { FabricScreen } from './screens/FabricScreen'
import { InflationScreen } from './screens/InflationScreen'
import { ReviewScreen } from './screens/ReviewScreen'
import { SeamsStructureScreen } from './screens/SeamsStructureScreen'
import { VisualGeneralScreen } from './screens/VisualGeneralScreen'
import { NavButtons, ScreenLayout, type PhotoSlot } from './screens/_shared'

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

// 6 screens total — names kept short for the URL-less navigation.
// Pas de test en vol : faire voler une aile signalée en SAV exposerait
// l'école à un risque de responsabilité.
type Screen =
  | 'inspector'
  | 'visual_general'
  | 'fabric'
  | 'seams_structure'
  | 'inflation'
  | 'review'

const ORDER: Screen[] = [
  'inspector',
  'visual_general',
  'fabric',
  'seams_structure',
  'inflation',
  'review',
]

export function CheckWizard({ ticketId, ticketHref, reportedCategory, initial }: CheckWizardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [inspectorName, setInspectorName] = useState<string>(initial?.inspectorName ?? '')
  const [phase1, setPhase1] = useState<Phase1>(initial?.phase1 ?? {})
  const [phase2, setPhase2] = useState<Phase2>(initial?.phase2 ?? { skipped: false })
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
    lines:     rehydratePhotos(initial?.phase1?.linesPhotoPaths),
    risers:    rehydratePhotos(initial?.phase1?.risersPhotoPaths),
    inflation: rehydratePhotos(initial?.phase2 && !initial.phase2.skipped ? initial.phase2.inflationPhotoPaths : undefined),
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
    if (phase1.linesCondition === 'broken') {
      const hasText  = !!phase1.linesNote?.trim()
      const hasPhoto = photos.lines.length > 0
      if (!hasText && !hasPhoto) return false
    }
    if (phase1.risersCondition === 'damaged') {
      const hasText  = !!phase1.risersNote?.trim()
      const hasPhoto = photos.risers.length > 0
      if (!hasText && !hasPhoto) return false
    }
    return true
  }, [phase1.openSeams, phase1.linesCondition, phase1.maillonsInverted, phase1.risersCondition,
      phase1.openSeamsNote, phase1.maillonsNote, phase1.linesNote, phase1.risersNote,
      photos.openSeams, photos.maillons, photos.lines, photos.risers])

  const inflationValid = useMemo(() => {
    if (phase2.skipped) return true
    return !!phase2.inflationSurfaceConsistency && !!phase2.inflationTendency
  }, [phase2])

  const inspectorValid = inspectorName.trim().length >= 2

  // Uploads new photos (those with a File) to the 'tickets' bucket and merges
  // the resulting paths with the already-existing ones the school kept. Returns
  // a record of storage paths per slot, ready to be persisted in Phase1.
  async function uploadPendingPhotos(userId: string): Promise<{
    paths: Record<PhotoSlot, string[]>
    error: string | null
  }> {
    const supabase = createClient()
    const slots: PhotoSlot[] = ['damage', 'tears', 'openSeams', 'maillons', 'lines', 'risers', 'inflation']

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
          lines:     photos.lines.map((p) => p.existingPath!).filter(Boolean),
          risers:    photos.risers.map((p) => p.existingPath!).filter(Boolean),
          inflation: photos.inflation.map((p) => p.existingPath!).filter(Boolean),
        },
        error: null,
      }
    }

    setUploadProgress({ done: 0, total: totalToUpload })
    let done = 0
    let lastError: string | null = null
    const result: Record<PhotoSlot, string[]> = {
      damage: [], tears: [], openSeams: [], maillons: [], lines: [], risers: [], inflation: [],
    }

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
      const ALL_SLOTS: PhotoSlot[] = ['damage','tears','openSeams','maillons','lines','risers','inflation']
      const newPhotosCount = ALL_SLOTS
        .reduce((acc, s) => acc + photos[s].filter((p) => p.file).length, 0)
      const totalPathsKept = ALL_SLOTS.reduce((acc, s) => acc + paths[s].length, 0)
      const existingKept = ALL_SLOTS
        .reduce((acc, s) => acc + photos[s].filter((p) => p.existingPath).length, 0)
      const uploadedCount = totalPathsKept - existingKept
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
        ...(paths.lines.length     ? { linesPhotoPaths:     paths.lines     } : { linesPhotoPaths:     undefined }),
        ...(paths.risers.length    ? { risersPhotoPaths:    paths.risers    } : { risersPhotoPaths:    undefined }),
      }

      // Phase 2 — on n'écrit inflationPhotoPaths que si la phase n'est pas
      // « skipped », sinon TS rejette l'élargissement du discriminant.
      const phase2WithPaths: Phase2 = phase2.skipped
        ? phase2
        : { ...phase2, ...(paths.inflation.length ? { inflationPhotoPaths: paths.inflation } : { inflationPhotoPaths: undefined }) }

      const checkedIds: string[] = []
      if (phase1.visibleDamage === 'yes')           checkedIds.push('visible_damage')
      if (phase1.fabricCondition === 'damaged')     checkedIds.push('fabric_damaged')
      if (phase1.visibleTears === 'yes')            checkedIds.push('tears')
      if (phase1.openSeams === 'yes')               checkedIds.push('open_seams')
      if (phase1.linesCondition === 'broken')       checkedIds.push('lines_broken')
      if (phase1.maillonsInverted === 'yes')        checkedIds.push('maillons_inverted')
      if (phase1.risersCondition === 'damaged')     checkedIds.push('risers_damaged')
      if (!phase2.skipped && (phase2.inflationTendency === 'closes_easily' || phase2.inflationTendency === 'lazy')) {
        checkedIds.push('inflation_abnormal')
      }
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
        phase2:        phase2WithPaths,
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
        <VisualGeneralScreen
          phase1={phase1}
          setPhase1={setPhase1}
          damagePhotos={photos.damage}
          onAddPhoto={(p)   => addPhoto('damage', p)}
          onRemovePhoto={(id) => removePhoto('damage', id)}
          isValid={visualGeneralValid}
          onBack={() => go('back')}
          onNext={() => go('next')}
        />
      )}

      {screen === 'fabric' && (
        <FabricScreen
          phase1={phase1}
          setPhase1={setPhase1}
          tearsPhotos={photos.tears}
          onAddPhoto={(p)   => addPhoto('tears', p)}
          onRemovePhoto={(id) => removePhoto('tears', id)}
          isValid={fabricValid}
          onBack={() => go('back')}
          onNext={() => go('next')}
        />
      )}

      {screen === 'seams_structure' && (
        <SeamsStructureScreen
          phase1={phase1}
          setPhase1={setPhase1}
          photos={{
            openSeams: photos.openSeams,
            lines:     photos.lines,
            maillons:  photos.maillons,
            risers:    photos.risers,
          }}
          onAddOpenSeamsPhoto={(p)    => addPhoto('openSeams', p)}
          onRemoveOpenSeamsPhoto={(id) => removePhoto('openSeams', id)}
          onAddLinesPhoto={(p)         => addPhoto('lines', p)}
          onRemoveLinesPhoto={(id)     => removePhoto('lines', id)}
          onAddMaillonsPhoto={(p)      => addPhoto('maillons', p)}
          onRemoveMaillonsPhoto={(id)  => removePhoto('maillons', id)}
          onAddRisersPhoto={(p)        => addPhoto('risers', p)}
          onRemoveRisersPhoto={(id)    => removePhoto('risers', id)}
          isValid={seamsValid}
          onBack={() => go('back')}
          onNext={() => go('next')}
        />
      )}

      {screen === 'inflation' && (
        <InflationScreen
          phase2={phase2}
          setPhase2={setPhase2}
          inflationPhotos={photos.inflation}
          onAddPhoto={(p)   => addPhoto('inflation', p)}
          onRemovePhoto={(id) => removePhoto('inflation', id)}
          isValid={inflationValid}
          onBack={() => go('back')}
          onNext={() => go('next')}
          onSkip={skipPhase2}
        />
      )}

      {screen === 'review' && (
        <ReviewScreen
          inspectorName={inspectorName}
          phase1={phase1}
          phase2={phase2}
          photos={photos}
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
