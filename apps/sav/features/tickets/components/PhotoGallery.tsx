import Image from 'next/image'
import { getSupabasePublicUrl } from '../utils'
import type { TicketPhoto } from '../types'

interface PhotoGalleryProps {
  photos: TicketPhoto[]
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const sorted = [...photos].sort((a, b) => a.sort_order - b.sort_order)

  if (sorted.length === 0) return null

  return (
    <div className="grid grid-cols-3 gap-2">
      {sorted.map((photo) => (
        <a
          key={photo.id}
          href={getSupabasePublicUrl(photo.storage_path)}
          target="_blank"
          rel="noopener noreferrer"
          className="relative aspect-square overflow-hidden rounded-xl bg-slate-100"
          aria-label={photo.caption ?? 'Photo SAV'}
        >
          <Image
            src={getSupabasePublicUrl(photo.storage_path)}
            alt={photo.caption ?? 'Photo SAV'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 33vw, 200px"
            loading="lazy"
          />
          {photo.caption && (
            <span className="absolute inset-x-0 bottom-0 truncate bg-black/50 px-2 py-1 text-xs text-white">
              {photo.caption}
            </span>
          )}
        </a>
      ))}
    </div>
  )
}
