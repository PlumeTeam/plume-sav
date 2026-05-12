'use client'

import { useState } from 'react'
import { PhotoCapture } from '../components/PhotoCapture'

export interface LocalInspectionPhoto {
  id:            string
  dataUrl:       string
  /** File picked locally — present for photos added in this session. */
  file?:         File
  /** Storage path — present for photos already uploaded on a previous visit. */
  existingPath?: string
}

interface InspectionPhotoFieldProps {
  photos:   LocalInspectionPhoto[]
  onAdd:    (photo: LocalInspectionPhoto) => void
  onRemove: (id: string) => void
}

// Photo capture + thumbnail grid used by the school inspection wizard.
// Kept stateless: the parent owns the photo list so it can validate
// "text or photos" and upload them at submit time.
export function InspectionPhotoField({ photos, onAdd, onRemove }: InspectionPhotoFieldProps) {
  const [busy, setBusy] = useState(false)

  function handlePhoto(file: File, dataUrl: string) {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    onAdd({ id, file, dataUrl })
  }

  return (
    <div className="space-y-3">
      <PhotoCapture
        onPhoto={(file, dataUrl) => handlePhoto(file, dataUrl)}
        photoType="other"
        onBusyChange={setBusy}
      />
      {busy && <p className="text-xs text-slate-500">Compression de la photo…</p>}

      {photos.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-slate-500">
            {photos.length} photo{photos.length > 1 ? 's' : ''} jointe{photos.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="relative aspect-square animate-fade-in">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.dataUrl}
                  alt=""
                  className="h-full w-full rounded-2xl object-cover ring-1 ring-brand-stone"
                />
                <button
                  type="button"
                  onClick={() => onRemove(photo.id)}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand-ink/70 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
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
  )
}
