import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSchoolTicketDetail } from '@/features/tickets/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { TicketTimeline } from '@/features/tickets/components/TicketTimeline'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import { PhotoGallery } from '@/features/tickets/components/PhotoGallery'
import { formatDate, formatDateTime } from '@/features/tickets/utils'
import { STATUS_CONFIG } from '@/features/tickets/types'
import { SchoolActionBar } from './SchoolActionBar'

interface PageProps {
  params: { id: string }
}

export default async function SchoolTicketDetailPage({ params }: PageProps) {
  const ticket = await getSchoolTicketDetail(params.id)
  if (!ticket) notFound()

  const visibleMessages = ticket.ticket_messages
    .filter((m) => m.visibility_level === 'all' || m.sender_role === 'school')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/school"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 active:bg-slate-100"
            aria-label="Retour"
          >
            ←
          </Link>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">
              {ticket.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-slate-500">
              {ticket.product_brand} {ticket.product_model}
            </p>
          </div>
          <StatusBadge status={ticket.status} size="sm" />
        </div>
      </header>

      <main className="divide-y divide-slate-100 pb-8">
        {/* Timeline */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Suivi
          </h2>
          <TicketTimeline status={ticket.status} />
        </section>

        {/* Actions école */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Actions
          </h2>
          <SchoolActionBar ticketId={ticket.id} currentStatus={ticket.status} />
        </section>

        {/* Service request info */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Produit</h2>
          <div className="space-y-2">
            <InfoRow label="Marque / Modèle" value={`${ticket.product_brand ?? '—'} ${ticket.product_model ?? '—'}`} />
            <InfoRow label="N° de série" value={ticket.serial_number ?? '—'} />
            {ticket.purchase_date && <InfoRow label="Date d'achat" value={formatDate(ticket.purchase_date)} />}
          </div>
        </section>

        {/* Description */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Demande</h2>
          {ticket.description && (
            <p className="text-sm leading-relaxed text-slate-700">{ticket.description}</p>
          )}
          {ticket.urgency_level === 2 && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              Signalé comme urgent
            </p>
          )}
        </section>

        {/* Photos */}
        {ticket.ticket_photos.length > 0 && (
          <section className="bg-white px-4 py-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
              Photos ({ticket.ticket_photos.length})
            </h2>
            <PhotoGallery photos={ticket.ticket_photos} />
          </section>
        )}

        {/* Messages */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Messages</h2>
          <CommentThread
            messages={visibleMessages}
            ownRoles={['school']}
            showInternalBadge
            emptyText="Aucun message."
          />
        </section>
      </main>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="flex-shrink-0 text-xs text-slate-500">{label}</p>
      <p className="text-right text-sm text-slate-800">{value.trim() || '—'}</p>
    </div>
  )
}
