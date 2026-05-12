import Link from 'next/link'
import Image from 'next/image'
import { StatusBadge } from './StatusBadge'
import { formatDate, getSupabasePublicUrl } from '../utils'
import type { TicketWithPhotos } from '../types'
import type { TicketContacts } from '../contacts'

interface TicketCardProps {
  ticket: TicketWithPhotos & { contacts?: TicketContacts }
  basePath?: string
  showUrgency?: boolean
  /** Visible "N nouveaux" badge if > 0. Optional — old call-sites stay valid. */
  unreadCount?: number
}

export function TicketCard({ ticket, basePath = '/client', showUrgency = false, unreadCount = 0 }: TicketCardProps) {
  const firstPhoto = [...ticket.ticket_photos].sort((a, b) => a.sort_order - b.sort_order)[0]
  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
  const productLine = [ticket.product_brand, ticket.product_model].filter(Boolean).join(' ') || 'Aile'
  const contacts = ticket.contacts

  return (
    <Link
      href={`${basePath}/ticket/${ticket.id}`}
      className="card group relative flex flex-col gap-3 p-4 transition-all hover:-translate-y-0.5 active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-brand-cream ring-1 ring-brand-stone">
          {firstPhoto ? (
            <Image
              src={getSupabasePublicUrl(firstPhoto.storage_path)}
              alt={`Photo ${ticketRef}`}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-2xl" aria-hidden>🪂</div>
          )}
          {unreadCount > 0 && (
            <span
              aria-label={`${unreadCount} nouveau${unreadCount > 1 ? 'x' : ''} message${unreadCount > 1 ? 's' : ''}`}
              className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate text-sm font-semibold text-brand-ink">{productLine}</p>
            <StatusBadge status={ticket.status} size="sm" />
          </div>
          <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
            {ticketRef}
            {showUrgency && ticket.urgency_level === 2 && (
              <span className="ml-2 rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-red-700">
                Urgent
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">{formatDate(ticket.created_at)}</p>
        </div>

        <span className="shrink-0 text-lg text-slate-300 group-hover:text-brand-gold transition-colors" aria-hidden>›</span>
      </div>

      {contacts && <ContactsBlock contacts={contacts} />}
    </Link>
  )
}

function ContactsBlock({ contacts }: { contacts: TicketContacts }) {
  const { client, school, workshop } = contacts
  const hasClient   = client.name || client.email || client.phone
  const hasSchool   = !!school
  const hasWorkshop = !!workshop
  if (!hasClient && !hasSchool && !hasWorkshop) return null

  return (
    <div className="grid grid-cols-1 gap-2 border-t border-brand-stone/60 pt-3 sm:grid-cols-2 lg:grid-cols-3">
      {hasClient && (
        <ContactRow
          icon="👤"
          label="Client"
          name={client.name ?? '—'}
          email={client.email}
          phone={client.phone}
        />
      )}
      {school && (
        <ContactRow
          icon="🏫"
          label="École"
          name={school.name}
          email={school.email}
          phone={school.phone}
        />
      )}
      {workshop && (
        <ContactRow
          icon="🔧"
          label="Atelier"
          name={workshop.label}
          email={workshop.email}
          phone={workshop.phone}
        />
      )}
    </div>
  )
}

function ContactRow({
  icon, label, name, email, phone,
}: {
  icon: string
  label: string
  name: string
  email: string | null
  phone: string | null
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        <span aria-hidden className="mr-1">{icon}</span>
        {label}
      </p>
      <p className="mt-0.5 truncate text-xs font-medium text-brand-ink">{name}</p>
      {(phone || email) && (
        <div className="mt-0.5 flex flex-wrap gap-x-2 gap-y-0.5">
          {phone && (
            <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-slate-500">
              <span aria-hidden>📞</span>
              <span className="truncate">{phone}</span>
            </span>
          )}
          {email && (
            <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-slate-500">
              <span aria-hidden>✉️</span>
              <span className="truncate">{email}</span>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
