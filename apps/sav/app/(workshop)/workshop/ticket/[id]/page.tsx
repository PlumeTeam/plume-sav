import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWorkshopTicketDetail } from '@/features/tickets/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { TicketTimeline } from '@/features/tickets/components/TicketTimeline'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import { PhotoGallery } from '@/features/tickets/components/PhotoGallery'
import { formatDate, formatDateTime } from '@/features/tickets/utils'
import { STATUS_CONFIG } from '@/features/tickets/types'
import { WorkshopActionBar } from './WorkshopActionBar'

interface PageProps {
  params: { id: string }
}

export default async function WorkshopTicketDetailPage({ params }: PageProps) {
  const ticket = await getWorkshopTicketDetail(params.id)
  if (!ticket) notFound()

  const allMessages = [...ticket.ticket_messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/workshop"
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
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Suivi</h2>
          <TicketTimeline status={ticket.status} />
        </section>

        {/* Workshop actions */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Actions atelier</h2>
          <WorkshopActionBar
            ticketId={ticket.id}
            currentStatus={ticket.status}
            diagnosisNotes={ticket.diagnosis_notes}
            estimatedCost={ticket.estimated_cost}
            estimatedHours={ticket.estimated_hours}
            partsNeeded={ticket.parts_needed}
          />
        </section>

        {/* Diagnosis summary */}
        {(ticket.diagnosis_notes || ticket.estimated_cost != null) && (
          <section className="bg-white px-4 py-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Diagnostic</h2>
            <div className="space-y-2">
              {ticket.diagnosis_notes && (
                <p className="text-sm leading-relaxed text-slate-700">{ticket.diagnosis_notes}</p>
              )}
              <div className="flex flex-wrap gap-4">
                {ticket.estimated_hours != null && (
                  <span className="text-sm text-slate-600">
                    <span className="font-medium">{ticket.estimated_hours} h</span> estimées
                  </span>
                )}
                {ticket.estimated_cost != null && (
                  <span className="text-sm text-slate-600">
                    <span className="font-medium">{ticket.estimated_cost} €</span> estimés
                  </span>
                )}
              </div>
              {ticket.parts_needed && (
                <p className="text-xs text-slate-500">Pièces : {ticket.parts_needed}</p>
              )}
            </div>
          </section>
        )}

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
              🚨 Signalé comme urgent
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
            messages={allMessages}
            ownRoles={['workshop']}
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
