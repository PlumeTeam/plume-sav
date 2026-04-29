'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import { PhotoCapture } from '../PhotoCapture'
import type { PhotoType, WizardPhoto } from '../../types'

const REQUIRED_PHOTO_TYPES: Array<{ type: PhotoType; label: string; hint: string; emoji: string }> = [
  { type: 'overview',       label: 'Vue globale',     hint: 'Voile entièrement déployée',                  emoji: '🪂' },
  { type: 'damage_closeup', label: 'Dommage',         hint: 'Gros plan sur la zone endommagée',            emoji: '🔍' },
  { type: 'serial_tag',     label: 'Numéro de série', hint: 'Étiquette intérieure lisible',                emoji: '🏷️' },
]

interface StepPhotosProps {
  onNext: () => void
  onBack: () => void
}

export function StepPhotos({ onNext, onBack }: StepPhotosProps) {
  const { photos, addPhoto, removePhoto, _photoFiles } = useWizardStore()
  const [activeSlot, setActiveSlot] = useState<PhotoType | 'other'>('overview')
  const [error, setError] = useState<string | null>(null)

  function handlePhoto(file: File, dataUrl: string, photoType: PhotoType) {
    const photo: WizardPhoto = {
      dataUrl,
      photoType,
      caption: '',
      fileName: file.name,
    }
    addPhoto(photo, file)
    setError(null)
  }

  function handleContinue() {
    if (photos.length === 0) {
      setError('Veuillez ajouter au moins une photo.')
      return
    }
    onNext()
  }

  const hasType = (type: PhotoType) => photos.some((p) => p.photoType === type)

  return (
    <div className="flex flex-col gap-6 px-4 pb-32">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Photos</h2>
        <p className="mt-1 text-sm text-slate-500">
          Ajoutez des photos pour aider le technicien à comprendre le problème.
        </p>
      </div>

      {/* Required photo types checklist */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Photos recommandées</p>
        {REQUIRED_PHOTO_TYPES.map(({ type, label, hint, emoji }) => (
          <div
            key={type}
            className={`flex items-center gap-3 rounded-xl border p-3 ${
              hasType(type)
                ? 'border-green-200 bg-green-50'
                : 'border-slate-200 bg-white'
            }`}
          >
            <span className="text-xl" aria-hidden>{emoji}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800">{label}</p>
              <p className="text-xs text-slate-500">{hint}</p>
            </div>
            {hasType(type) ? (
              <span className="text-green-600 text-lg" aria-label="Photo ajoutée">✓</span>
            ) : (
              <span className="text-slate-300 text-lg" aria-label="Manquante">○</span>
            )}
          </div>
        ))}
      </div>

      {/* Photo slot selector */}
      <div>
        <p className="mb-2 text-sm font-medium text-slate-700">Ajouter une photo</p>
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[...REQUIRED_PHOTO_TYPES, { type: 'other' as PhotoType, label: 'Autre', hint: '', emoji: '📎' }].map((slot) => (
            <button
              key={slot.type}
              type="button"
              onClick={() => setActiveSlot(slot.type)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                activeSlot === slot.type
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {slot.emoji} {slot.label}
            </button>
          ))}
        </div>
        <PhotoCapture
          onPhoto={(file, dataUrl) => handlePhoto(file, dataUrl, activeSlot as PhotoType)}
          photoType={activeSlot as PhotoType}
        />
      </div>

      {/* Photos grid */}
      {photos.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Photos ajoutées ({photos.length})
          </p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, idx) => (
              <div key={idx} className="relative aspect-square">
                <img
                  src={photo.dataUrl}
                  alt={`Photo ${idx + 1}`}
                  className="h-full w-full rounded-xl object-cover"
                />
                {/* Type badge */}
                <span className="absolute bottom-1 left-1 rounded-md bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                  {photo.photoType === 'overview' ? 'Global' :
                   photo.photoType === 'damage_closeup' ? 'Dommage' :
                   photo.photoType === 'serial_tag' ? 'Série' : 'Autre'}
                </span>
                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
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
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      {/* Navigation */}
      <div className="fixed bottom-0 left-0 right-0 flex gap-3 border-t border-slate-100 bg-white px-4 pb-safe-bottom pt-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1">
          ← Retour
        </button>
        <button type="button" onClick={handleContinue} className="btn-primary flex-[2]">
          Suivant — Vérification
        </button>
      </div>
    </div>
  )
}
