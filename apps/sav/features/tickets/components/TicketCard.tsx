import Link from 'next/link'
import Image from 'next/image'
import { StatusBadge } from './StatusBadge'
import { formatDate, getSupabasePublicUrl } from '../utils'
import type { TicketWithPhotos } from '../types'

interface TicketCardProps {
  ticket: TicketWithPhotos
  basePath?: string
  showUrgency?: boolean
}

export function TicketCard({ ticket, basePath = '/client', showUrgency = false }: TicketCardProps) {
  const firstPhoto = [...ticket.ticket_photos].sort((a, b) => a.sort_order - b.sort_order)[0]

  return (
    <Link
      href={`${basePath}/ticket/${ticket.id}`}
      className="flex items-center gap-4 rounded-2xl bg-white p-4 shadow-sm active:scale-[0.98] transition-transform"
    >
      {/* Thumbnail */}
      <div className="relative h-16 w-16 flex-shrink-0 rounded-xl bg-slate-100 overflow-hidden">
        {firstPhoto ? (
          <Image
            src={getSupabasePublicUrl(firstPhoto.storage_path)}
            alt={`Photo ${ticket.ticket_number ?? ''}`}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-2xl" aria-hidden>🪂</div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900 truncate">
            {ticket.wing_brand} {ticket.wing_model} {ticket.wing_size}
          </p>
          <StatusBadge status={ticket.sav_status} size="sm" />
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {ticket.ticket_number ?? 'N° en cours…'}
          {showUrgency && ticket.urgency === 'urgent' && (
            <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
              Urgent
            </span>
          )}
        </p>
        <p className="mt-1 text-xs text-slate-400">{formatDate(ticket.created_at)}</p>
      </div>

      <span className="text-slate-300 text-lg flex-shrink-0" aria-hidden>›</span>
    </Link>
  )
}
