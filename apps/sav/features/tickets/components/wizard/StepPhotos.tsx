'use client'

import { useState } from 'react'
import { useWizardStore } from '../../store'
import { PhotoCapture } from '../PhotoCapture'
import type { PhotoType, WizardPhoto } from '../../types'
import { StepLayout, StepNav } from './StepLayout'

interface StepPhotosProps {
  onNext: () => void
  onBack: () => void
}

export function StepPhotos({ onNext, onBack }: StepPhotosProps) {
  const { photos, addPhoto, removePhoto } = useWizardStore()
  const [busy, setBusy] = useState(false)

  async function handlePhoto(file: File, dataUrl: string, photoType: PhotoType) {
    addPhoto({ dataUrl, photoType, caption: '', fileName: file.name }, file)
    setBusy(false)
  }

  return (
    <StepLayout
      title="Ajoutez une photo"
      subtitle="Vous pouvez envoyer une photo de ce qui vous semble problématique."
      footer={
        <StepNav
          onBack={onBack}
          onNext={onNext}
          nextLabel={photos.length === 0 ? 'Passer cette étape' : 'Continuer'}
          nextDisabled={busy}
        />
      }
    >
      <div className="space-y-6">
        <PhotoCapture
          onPhoto={(file, dataUrl) => handlePhoto(file, dataUrl, 'other')}
          photoType="other"
          onBusyChange={setBusy}
        />
        {busy && <p className="text-xs text-slate-500">Compression de la photo…</p>}

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
      </div>
    </StepLayout>
  )
}
