import { REQUEST_TYPE_CONFIG } from '../types'
import type { RequestType } from '../types'

interface RequestTypeBadgeProps {
  type:  RequestType | null | undefined
  size?: 'xs' | 'sm'
  /** Compact mode: emoji-only (saves room in dense tables). */
  compact?: boolean
}

export function RequestTypeBadge({ type, size = 'sm', compact = false }: RequestTypeBadgeProps) {
  if (!type) return null
  const cfg = REQUEST_TYPE_CONFIG[type]
  const padding = size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-0.5 text-[11px]'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ring-1 ${cfg.bg} ${cfg.color} ${cfg.ring} ${padding}`}
      title={cfg.label}
      aria-label={cfg.label}
    >
      <span aria-hidden>{cfg.emoji}</span>
      {!compact && <span>{cfg.shortLabel}</span>}
    </span>
  )
}
