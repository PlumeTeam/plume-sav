'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { getSupabasePublicUrl } from '../utils'
import type { TicketPhoto } from '../types'

interface PhotoLightboxProps {
  photos: TicketPhoto[]
}

export function PhotoLightbox({ photos }: PhotoLightboxProps) {
  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order)
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const next  = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : Math.min(i + 1, sorted.length - 1)))
  }, [sorted.length])
  const prev  = useCallback(() => {
    setOpenIndex((i) => (i === null ? null : Math.max(i - 1, 0)))
  }, [])

  useEffect(() => {
    if (openIndex === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')     close()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft')  prev()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [openIndex, close, next, prev])

  if (sorted.length === 0) return null
  const active = openIndex !== null ? sorted[openIndex] : null

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {sorted.map((photo, i) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="relative aspect-square overflow-hidden rounded-2xl bg-brand-cream ring-1 ring-brand-stone transition-transform hover:scale-[1.02] active:scale-[0.98]"
            aria-label={`Voir photo ${i + 1}`}
          >
            <Image
              src={getSupabasePublicUrl(photo.storage_path)}
              alt={photo.caption ?? `Photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 200px"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {active && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Aperçu photo"
          className="fixed inset-0 z-50 flex flex-col bg-brand-ink/95 animate-fade-in"
          onClick={close}
        >
          <header className="flex items-center justify-between px-4 py-3 text-white">
            <span className="text-sm">{openIndex + 1} / {sorted.length}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); close() }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-2xl hover:bg-white/20"
              aria-label="Fermer"
            >
              ×
            </button>
          </header>

          <div
            className="relative flex flex-1 items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            {openIndex > 0 && (
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
                aria-label="Photo précédente"
              >
                ‹
              </button>
            )}
            {openIndex < sorted.length - 1 && (
              <button
                type="button"
                onClick={next}
                className="absolute right-2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white hover:bg-white/20"
                aria-label="Photo suivante"
              >
                ›
              </button>
            )}
            <div className="relative h-full w-full">
              <Image
                src={getSupabasePublicUrl(active.storage_path)}
                alt={active.caption ?? `Photo ${openIndex + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
          </div>

          {active.caption && (
            <p className="px-4 pb-4 pt-2 text-center text-sm text-white/80">{active.caption}</p>
          )}
        </div>
      )}
    </>
  )
}
