'use client'

import { useRef } from 'react'
import type { PhotoType } from '../types'

interface PhotoCaptureProps {
  onPhoto: (file: File, dataUrl: string, photoType: PhotoType) => void
  photoType?: PhotoType
  label?: string
  disabled?: boolean
}

export function PhotoCapture({
  onPhoto,
  photoType = 'other',
  label = 'Photo',
  disabled = false,
}: PhotoCaptureProps) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    // Dynamic import — browser-image-compression is client-only
    const imageCompression = (await import('browser-image-compression')).default
    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: 0.8,
    })

    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string
      onPhoto(compressed as File, dataUrl, photoType)
    }
    reader.readAsDataURL(compressed)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach((f) => handleFile(f))
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Camera (opens device camera on mobile) */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => cameraRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-600 active:bg-slate-100 disabled:opacity-50"
      >
        <span className="text-xl" aria-hidden>📷</span>
        Prendre une photo
      </button>

      {/* Gallery */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => galleryRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 active:bg-slate-50 disabled:opacity-50"
      >
        <span className="text-xl" aria-hidden>🖼️</span>
        Choisir dans la galerie
      </button>

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={handleInputChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleInputChange}
      />
    </div>
  )
}
