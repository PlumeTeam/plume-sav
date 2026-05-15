'use client'

import { useEffect, useMemo, type ReactNode } from 'react'
import type { LocalInspectionPhoto } from '../InspectionPhotoField'
import {
  type FabricCondition,
  type InflationSurfaceConsistency,
  type InflationTendency,
  type LinesCondition,
  type Phase1,
  type Phase2,
  type RisersCondition,
  type SeamDistance,
  type TearSize,
  type YesNo,
  type YesNoIdk,
  FABRIC_CONDITION_LABELS,
  INFLATION_SURFACE_LABELS,
  INFLATION_SYMMETRY_LABELS,
  INFLATION_TENDENCY_LABELS,
  LINES_CONDITION_LABELS,
  RISERS_CONDITION_LABELS,
  SEAM_DISTANCE_LABELS,
  TEAR_SIZE_LABELS,
  YESNO_LABELS,
  YESNOIDK_LABELS,
} from '../steps'
import type { PhotoSlot } from './_shared'

// Code couleur des lignes du résumé : ok = tout va bien, warn = point d'attention
// (état intermédiaire ou "je ne sais pas"), alert = problème identifié.
type RowStatus = 'ok' | 'warn' | 'alert'

function yesNoStatus(v: YesNo | undefined, yesIs: 'alert' | 'ok'): RowStatus | undefined {
  if (!v) return undefined
  if (yesIs === 'alert') return v === 'yes' ? 'alert' : 'ok'
  return v === 'yes' ? 'ok' : 'alert'
}

function fabricStatus(v: FabricCondition | undefined): RowStatus | undefined {
  if (!v) return undefined
  if (v === 'good')    return 'ok'
  if (v === 'worn')    return 'warn'
  return 'alert'
}

function linesStatus(v: LinesCondition | undefined): RowStatus | undefined {
  if (!v) return undefined
  if (v === 'good') return 'ok'
  if (v === 'worn') return 'warn'
  return 'alert'
}

function risersStatus(v: RisersCondition | undefined): RowStatus | undefined {
  if (!v) return undefined
  if (v === 'good')    return 'ok'
  if (v === 'worn')    return 'warn'
  return 'alert'
}

function maillonsStatus(v: YesNoIdk | undefined): RowStatus | undefined {
  if (!v) return undefined
  if (v === 'yes') return 'alert'
  if (v === 'no')  return 'ok'
  return 'warn'
}

function tearSizeStatus(v: TearSize | undefined): RowStatus | undefined {
  if (!v) return undefined
  return v === 'gt15' ? 'alert' : 'warn'
}

function seamDistanceStatus(v: SeamDistance | undefined): RowStatus | undefined {
  if (!v) return undefined
  return v === 'close' ? 'alert' : 'warn'
}

// InflationSymmetry & InflationSurfaceConsistency partagent les mêmes clés
// ('yes' | 'no' | 'unsure') donc même mapping de statut.
function inflationSurfaceStatus(
  v: InflationSurfaceConsistency | undefined,
): RowStatus | undefined {
  if (!v) return undefined
  if (v === 'yes')    return 'ok'
  if (v === 'no')     return 'alert'
  return 'warn'
}

function inflationTendencyStatus(v: InflationTendency | undefined): RowStatus | undefined {
  if (!v) return undefined
  if (v === 'none')   return 'ok'
  if (v === 'unsure') return 'warn'
  return 'alert'
}

interface ReviewScreenProps {
  inspectorName:      string
  phase1:             Phase1
  phase2:             Phase2
  photos:             Record<PhotoSlot, LocalInspectionPhoto[]>
  globalNote:         string
  onGlobalNoteChange: (s: string) => void
  onBack:             () => void
  onSubmit:           () => void
  isPending:          boolean
  feedback:           { type: 'ok' | 'error'; msg: string } | null
  uploadProgress:     { done: number; total: number } | null
}

export function ReviewScreen({
  inspectorName, phase1, phase2, photos, globalNote, onGlobalNoteChange,
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
        <ReviewRow
          label="Dommages visibles"
          value={phase1.visibleDamage ? YESNO_LABELS[phase1.visibleDamage] : '—'}
          status={yesNoStatus(phase1.visibleDamage, 'alert')}
        />
        {phase1.damageDescription && (
          <ReviewRow
            label="Description"
            value={phase1.damageDescription}
            multiline
            status="alert"
          />
        )}
        <ReviewPhotos label="Dommages" photos={photos.damage} />
      </ReviewSection>

      <ReviewSection title="Tissu">
        <ReviewRow
          label="État"
          value={phase1.fabricCondition ? FABRIC_CONDITION_LABELS[phase1.fabricCondition] : '—'}
          status={fabricStatus(phase1.fabricCondition)}
        />
        <ReviewRow
          label="Déchirures visibles"
          value={phase1.visibleTears ? YESNO_LABELS[phase1.visibleTears] : '—'}
          status={yesNoStatus(phase1.visibleTears, 'alert')}
        />
        {phase1.visibleTears === 'yes' && (
          <>
            <ReviewRow
              label="Taille"
              value={phase1.tearSize ? TEAR_SIZE_LABELS[phase1.tearSize] : '—'}
              status={tearSizeStatus(phase1.tearSize)}
            />
            <ReviewRow
              label="Couture"
              value={phase1.seamDistance ? SEAM_DISTANCE_LABELS[phase1.seamDistance] : '—'}
              status={seamDistanceStatus(phase1.seamDistance)}
            />
          </>
        )}
        <ReviewPhotos label="Déchirures" photos={photos.tears} />
      </ReviewSection>

      <ReviewSection title="Coutures et structure">
        <ReviewRow
          label="Coutures ouvertes"
          value={phase1.openSeams ? YESNO_LABELS[phase1.openSeams] : '—'}
          status={yesNoStatus(phase1.openSeams, 'alert')}
        />
        <ReviewPhotos label="Coutures" photos={photos.openSeams} />
        <ReviewRow
          label="Suspentes"
          value={phase1.linesCondition ? LINES_CONDITION_LABELS[phase1.linesCondition] : '—'}
          status={linesStatus(phase1.linesCondition)}
        />
        <ReviewPhotos label="Suspentes" photos={photos.lines} />
        <ReviewRow
          label="Maillons inversés"
          value={phase1.maillonsInverted ? YESNOIDK_LABELS[phase1.maillonsInverted] : '—'}
          status={maillonsStatus(phase1.maillonsInverted)}
        />
        <ReviewPhotos label="Maillons" photos={photos.maillons} />
        <ReviewRow
          label="Élévateurs"
          value={phase1.risersCondition ? RISERS_CONDITION_LABELS[phase1.risersCondition] : '—'}
          status={risersStatus(phase1.risersCondition)}
        />
        <ReviewPhotos label="Élévateurs" photos={photos.risers} />
      </ReviewSection>

      <ReviewSection title="Check gonflage" skipped={phase2.skipped}>
        {!phase2.skipped && (
          <>
            {phase2.inflationSurfaceConsistency ? (
              <ReviewRow
                label="État de surface"
                value={INFLATION_SURFACE_LABELS[phase2.inflationSurfaceConsistency]}
                status={inflationSurfaceStatus(phase2.inflationSurfaceConsistency)}
              />
            ) : phase2.inflationSymmetry ? (
              // Legacy V2 payload : la question s'appelait "Gonflage symétrique ?"
              <ReviewRow
                label="Symétrie (ancien)"
                value={INFLATION_SYMMETRY_LABELS[phase2.inflationSymmetry]}
                status={inflationSurfaceStatus(phase2.inflationSymmetry)}
              />
            ) : (
              <ReviewRow label="État de surface" value="—" />
            )}
            <ReviewRow
              label="Comportement au gonflage"
              value={phase2.inflationTendency
                ? INFLATION_TENDENCY_LABELS[phase2.inflationTendency]
                : phase2.inflationNormalBehavior === 'no'
                  // Legacy V2 — l'ancien yes/no n'avait pas de nuance.
                  ? 'Non (suspicieux) (ancien)'
                  : phase2.inflationNormalBehavior
                    ? `${YESNO_LABELS[phase2.inflationNormalBehavior]} (ancien)`
                    : '—'}
              status={
                phase2.inflationTendency
                  ? inflationTendencyStatus(phase2.inflationTendency)
                  : phase2.inflationNormalBehavior === 'no'
                    ? 'alert'
                    : phase2.inflationNormalBehavior === 'yes'
                      ? 'ok'
                      : undefined
              }
            />
            <ReviewPhotos label="Gonflage" photos={photos.inflation} />
            {phase2.inflationNotes && <ReviewRow label="Remarques" value={phase2.inflationNotes} multiline />}
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

function ReviewRow({
  label, value, multiline, status,
}: {
  label:     string
  value:     string
  multiline?: boolean
  status?:    RowStatus
}) {
  // Bordure gauche colorée + fond léger pour repérer d'un coup d'œil quels
  // points vont bien (vert), méritent attention (jaune) ou posent problème
  // (rouge). Une ligne sans statut (—, "Photos jointes") garde le style neutre
  // mais conserve le même padding pour aligner verticalement.
  const wrap =
    status === 'ok'    ? 'border-emerald-400 bg-emerald-50/70'
  : status === 'warn'  ? 'border-amber-400  bg-amber-50/70'
  : status === 'alert' ? 'border-red-400    bg-red-50/70'
  : 'border-transparent'
  const dot =
    status === 'ok'    ? 'bg-emerald-500'
  : status === 'warn'  ? 'bg-amber-500'
  : status === 'alert' ? 'bg-red-500'
  : ''

  return (
    <div className={`rounded-r-md border-l-2 px-2 py-1 ${wrap} ${
      multiline ? 'flex flex-col gap-1' : 'flex items-baseline justify-between gap-3'
    }`}>
      <p className="flex items-center gap-1.5 text-xs text-slate-500">
        {status && (
          <span
            className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${dot}`}
            aria-hidden
          />
        )}
        {label}
      </p>
      <p className={`text-sm text-brand-ink ${multiline ? 'whitespace-pre-line' : 'text-right font-semibold'}`}>
        {value}
      </p>
    </div>
  )
}

// Thumbnails strip under the relevant row(s) of the review screen.
// Pour les photos déjà uploadées : `dataUrl` est l'URL publique Supabase,
// directement navigable en `target="_blank"`. Pour les photos ajoutées dans
// la session courante : `dataUrl` est un base64 (utilisable en <img src>)
// mais Chrome bloque la navigation top-level vers `data:` — on matérialise
// donc un blob URL via `URL.createObjectURL(file)` pour le lien.
function ReviewPhotos({ label, photos }: { label: string; photos: LocalInspectionPhoto[] }) {
  const openUrls = useMemo(
    () => photos.map((p) => (p.file ? URL.createObjectURL(p.file) : p.dataUrl)),
    [photos],
  )

  useEffect(() => {
    return () => {
      openUrls.forEach((url) => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url)
      })
    }
  }, [openUrls])

  if (photos.length === 0) return null

  return (
    <div className="px-2 py-1.5">
      <p className="mb-1.5 text-xs text-slate-500">
        {label} — {photos.length} photo{photos.length > 1 ? 's' : ''}
      </p>
      <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6">
        {photos.map((p, i) => (
          <a
            key={p.id}
            href={openUrls[i]}
            target="_blank"
            rel="noopener noreferrer"
            className="block aspect-square overflow-hidden rounded-lg ring-1 ring-brand-stone transition hover:ring-2 hover:ring-brand-gold"
            aria-label={`Ouvrir la photo ${i + 1} en grand`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.dataUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          </a>
        ))}
      </div>
    </div>
  )
}
