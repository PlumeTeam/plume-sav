import type { RequestStatus } from '../types'
import { STATUS_CONFIG } from '../types'

interface StatusBadgeProps {
  status: RequestStatus
  size?: 'xs' | 'sm' | 'md'
}

const FALLBACK = { label: 'Inconnu', color: 'text-slate-500', bg: 'bg-slate-100' }

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? FALLBACK
  const sizeClass =
    size === 'xs' ? 'px-1.5 py-0.5 text-[10px]' :
    size === 'sm' ? 'px-2 py-0.5 text-xs' :
    'px-3 py-1 text-sm'

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${sizeClass} ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  )
}
