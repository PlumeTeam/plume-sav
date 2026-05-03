'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import { PhotoCapture } from '../PhotoCapture'
import type { PhotoType, WizardPhoto } from '../../types'
import { StepLayout, StepNav } from './StepLayout'

const REQUIRED_PHOTO_TYPES: Array<{ type: PhotoType; label: string; hint: string; emoji: string }> = [
  { type: 'overview',       label: 'Vue globale',     hint: 'Voile entièrement déployée',       emoji: '🪂' },
  { type: 'damage_closeup', label: 'Dommage',         hint: 'Gros plan sur la zone endommagée',  emoji: '🔍' },
  { type: 'serial_tag',     label: 'Numéro de série', hint: 'Étiquette intérieure lisible',      emoji: '🏷️' },
]

interface StepPhotosProps {
  onNext: () => void
  onBack: () => void
}

export function StepPhotos({ onNext, onBack }: StepPhotosProps) {
  const { photos, addPhoto, removePhoto, problem } = useWizardStore()
  const [activeSlot, setActiveSlot] = useState<PhotoType | 'other'>('overview')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy]   = useState(false)

  const isBehaviorOnly = (problem.wingBehaviors?.length ?? 0) > 0

  async function handlePhoto(file: File, dataUrl: string, photoType: PhotoType) {
    addPhoto({ dataUrl, photoType, caption: '', fileName: file.name }, file)
    setError(null)
    setBusy(false)
  }

  function handleNext() {
    if (!isBehaviorOnly && photos.length === 0) {
      setError('Ajoutez au moins une photo pour continuer.')
      return
    }
    onNext()
  }

  const hasType = (type: PhotoType) => photos.some((p) => p.photoType === type)
  const requiredDone = REQUIRED_PHOTO_TYPES.every(({ type }) => hasType(type))
  const nextLabel =
    isBehaviorOnly && photos.length === 0
      ? 'Passer cette étape'
      : photos.length === 0
        ? 'Ajoutez une photo'
        : 'Continuer'

  return (
    <StepLayout
      title={isBehaviorOnly ? 'Une photo à partager ?' : 'Ajoutez des photos'}
      subtitle={
        isBehaviorOnly
          ? 'Optionnel pour un problème de comportement. Si vous avez une vidéo ou une photo, ajoutez-la.'
          : 'Plus vos photos sont nettes, plus le diagnostic sera rapide.'
      }
      footer={
        <StepNav
          onBack={onBack}
          onNext={handleNext}
          nextLabel={nextLabel}
          nextDisabled={busy || (!isBehaviorOnly && photos.length === 0)}
        />
      }
    >
      <div className="space-y-6">
        {/* Required types checklist (visual problems only) */}
        {!isBehaviorOnly && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-brand-ink">Photos recommandées</p>
              {requiredDone && (
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  ✓ Complet
                </span>
              )}
            </div>
            {REQUIRED_PHOTO_TYPES.map(({ type, label, hint, emoji }) => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveSlot(type)}
                className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${
                  hasType(type)
                    ? 'border-emerald-200 bg-emerald-50'
                    : activeSlot === type
                      ? 'border-brand-coral bg-brand-coral/5'
                      : 'border-brand-stone bg-white'
                }`}
              >
                <span className="text-xl" aria-hidden>{emoji}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-brand-ink">{label}</p>
                  <p className="text-xs text-slate-500">{hint}</p>
                </div>
                {hasType(type)
                  ? <span className="text-emerald-600 text-lg" aria-label="Ajoutée">✓</span>
                  : <span className="text-slate-300 text-lg" aria-label="Manquante">○</span>}
              </button>
            ))}
          </div>
        )}

        {/* Slot selector + capture */}
        <div>
          <p className="mb-2 text-sm font-medium text-brand-ink">
            {isBehaviorOnly ? 'Ajouter une photo (optionnel)' : 'Ajouter une photo'}
          </p>
          <div className="mb-3 flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[...REQUIRED_PHOTO_TYPES, { type: 'other' as PhotoType, label: 'Autre', hint: '', emoji: '📎' }].map((slot) => (
              <button
                key={slot.type}
                type="button"
                onClick={() => setActiveSlot(slot.type)}
                className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeSlot === slot.type
                    ? 'bg-brand-navy text-white'
                    : 'bg-white text-slate-600 ring-1 ring-brand-stone'
                }`}
              >
                {slot.emoji} {slot.label}
              </button>
            ))}
          </div>
          <PhotoCapture
            onPhoto={(file, dataUrl) => handlePhoto(file, dataUrl, activeSlot as PhotoType)}
            photoType={activeSlot as PhotoType}
            onBusyChange={setBusy}
          />
          {busy && <p className="mt-2 text-xs text-slate-500">Compression de la photo…</p>}
        </div>

        {/* Photos grid */}
        {photos.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium text-brand-ink">
              Photos ajoutées ({photos.length})
            </p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <div key={idx} className="relative aspect-square animate-fade-in">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.dataUrl}
                    alt={`Photo ${idx + 1}`}
                    className="h-full w-full rounded-2xl object-cover ring-1 ring-brand-stone"
                  />
                  <span className="absolute bottom-1 left-1 rounded-md bg-brand-ink/70 px-1.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                    {photo.photoType === 'overview' ? 'Global' :
                     photo.photoType === 'damage_closeup' ? 'Dommage' :
                     photo.photoType === 'serial_tag' ? 'Série' : 'Autre'}
                  </span>
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-ink/70 text-white backdrop-blur-sm hover:bg-red-600 transition-colors"
                    aria-label="Supprimer la photo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
        )}
      </div>
    </StepLayout>
  )
}
