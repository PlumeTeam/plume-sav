'use client'

import { useRef } from 'react'
import type { PhotoType } from '../types'

interface PhotoCaptureProps {
  onPhoto: (file: File, dataUrl: string, photoType: PhotoType) => void
  photoType?: PhotoType
  label?: string
  disabled?: boolean
  onBusyChange?: (busy: boolean) => void
}

export function PhotoCapture({
  onPhoto,
  photoType = 'other',
  disabled = false,
  onBusyChange,
}: PhotoCaptureProps) {
  const cameraRef  = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    onBusyChange?.(true)
    try {
      const imageCompression = (await import('browser-image-compression')).default
      const compressed = await imageCompression(file, {
        maxSizeMB:         1.5,
        maxWidthOrHeight:  1920,
        useWebWorker:      true,
        initialQuality:    0.82,
      })
      const compressedBlob = compressed as Blob & { name?: string }
      const finalFile = compressedBlob instanceof File
        ? compressedBlob
        : new File([compressedBlob], file.name, { type: compressedBlob.type || 'image/jpeg' })

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload  = () => resolve(reader.result as string)
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(finalFile)
      })
      onPhoto(finalFile, dataUrl, photoType)
    } catch (err) {
      console.error('Photo compression failed:', err)
      // Fall back to the original file so the user isn't blocked.
      try {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload  = () => resolve(reader.result as string)
          reader.onerror = () => reject(reader.error)
          reader.readAsDataURL(file)
        })
        onPhoto(file, dataUrl, photoType)
      } catch {
        // swallow — UI shows missing photo state
      }
    } finally {
      onBusyChange?.(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    files.forEach((f) => { void handleFile(f) })
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={disabled}
        onClick={() => cameraRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-coral/40 bg-brand-coral/5 px-4 py-5 text-sm font-semibold text-brand-ink hover:bg-brand-coral/10 transition-colors disabled:opacity-50"
      >
        <span className="text-xl" aria-hidden>📷</span>
        Prendre une photo
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => galleryRef.current?.click()}
        className="flex items-center justify-center gap-2 rounded-2xl border border-brand-stone bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-brand-cream transition-colors disabled:opacity-50"
      >
        <span className="text-xl" aria-hidden>🖼️</span>
        Choisir dans la galerie
      </button>

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
