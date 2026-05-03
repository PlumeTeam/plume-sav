'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import { PhotoCapture } from '../PhotoCapture'
import type { PhotoType, WizardPhoto } from '../../types'

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
  const { photos, addPhoto, removePhoto } = useWizardStore()
  const [activeSlot, setActiveSlot] = useState<PhotoType | 'other'>('overview')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handlePhoto(file: File, dataUrl: string, photoType: PhotoType) {
    const photo: WizardPhoto = {
      dataUrl,
      photoType,
      caption: '',
      fileName: file.name,
    }
    addPhoto(photo, file)
    setError(null)
    setBusy(false)
  }

  function handleContinue() {
    if (photos.length === 0) {
      setError('Ajoutez au moins une photo pour continuer.')
      return
    }
    onNext()
  }

  const hasType = (type: PhotoType) => photos.some((p) => p.photoType === type)
  const requiredDone = REQUIRED_PHOTO_TYPES.every(({ type }) => hasType(type))

  return (
    <div className="flex flex-col gap-6 px-4 pb-32">
      <div>
        <h2 className="font-display text-xl font-bold text-brand-ink">Photos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Plus vous fournissez de photos nettes, plus le diagnostic sera rapide.
        </p>
      </div>

      {/* Required photo types checklist */}
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
            {hasType(type) ? (
              <span className="text-emerald-600 text-lg" aria-label="Ajoutée">✓</span>
            ) : (
              <span className="text-slate-300 text-lg" aria-label="Manquante">○</span>
            )}
          </button>
        ))}
      </div>

      {/* Photo slot selector + capture */}
      <div>
        <p className="mb-2 text-sm font-medium text-brand-ink">Ajouter une photo</p>
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
        {busy && (
          <p className="mt-2 text-xs text-slate-500">Compression de la photo…</p>
        )}
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

      {/* Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-4 pt-3 pb-safe-bottom">
        <div className="mx-auto flex max-w-2xl gap-3">
          <button type="button" onClick={onBack} className="btn-secondary flex-1">
            ← Retour
          </button>
          <button type="button" onClick={handleContinue} disabled={busy} className="btn-primary flex-[2]">
            Suivant
          </button>
        </div>
      </div>
    </div>
  )
}
