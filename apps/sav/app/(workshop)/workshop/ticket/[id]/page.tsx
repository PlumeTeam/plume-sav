import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWorkshopTicketDetail } from '@/features/tickets/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { TicketTimeline } from '@/features/tickets/components/TicketTimeline'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import { PhotoGallery } from '@/features/tickets/components/PhotoGallery'
import { formatDate, formatDateTime } from '@/features/tickets/utils'
import { PROBLEM_CATEGORIES, STATUS_CONFIG } from '@/features/tickets/types'
import { WorkshopActionBar } from './WorkshopActionBar'

interface PageProps {
  params: { id: string }
}

export default async function WorkshopTicketDetailPage({ params }: PageProps) {
  const ticket = await getWorkshopTicketDetail(params.id)
  if (!ticket) notFound()

  const problemLabel = PROBLEM_CATEGORIES.find((c) => c.value === ticket.problem_category)
  const allMessages = [...ticket.ticket_messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const sortedHistory = [...ticket.ticket_status_history].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
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
              {ticket.ticket_number ?? 'Ticket SAV'}
            </p>
            <p className="text-xs text-slate-500">
              {ticket.wing_brand} {ticket.wing_model} {ticket.wing_size}
            </p>
          </div>
          <StatusBadge status={ticket.sav_status} size="sm" />
        </div>
      </header>

      <main className="divide-y divide-slate-100 pb-8">
        {/* Timeline */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Suivi</h2>
          <TicketTimeline status={ticket.sav_status} />
        </section>

        {/* Workshop actions */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">Actions atelier</h2>
          <WorkshopActionBar
            ticketId={ticket.id}
            currentStatus={ticket.sav_status}
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

        {/* Wing info */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Aile</h2>
          <div className="space-y-2">
            <InfoRow label="Marque / Modèle" value={`${ticket.wing_brand ?? '—'} ${ticket.wing_model ?? ''} ${ticket.wing_size ?? ''}`} />
            <InfoRow label="Couleur" value={ticket.wing_color ?? '—'} />
            <InfoRow label="N° de série" value={ticket.wing_serial_number ?? '—'} />
            {ticket.purchase_date && <InfoRow label="Date d'achat" value={formatDate(ticket.purchase_date)} />}
            {ticket.flight_hours_estimate != null && (
              <InfoRow label="Heures de vol" value={`${ticket.flight_hours_estimate} h`} />
            )}
          </div>
        </section>

        {/* Problem */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Problème</h2>
          {problemLabel && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
              <span aria-hidden>{problemLabel.emoji}</span>
              {problemLabel.label}
            </div>
          )}
          {ticket.problem_description && (
            <p className="text-sm leading-relaxed text-slate-700">{ticket.problem_description}</p>
          )}
          {ticket.urgency === 'urgent' && (
            <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              Urgent
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

        {/* History */}
        {sortedHistory.length > 0 && (
          <section className="bg-white px-4 py-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Historique</h2>
            <ol className="space-y-3">
              {sortedHistory.map((event) => {
                const config = STATUS_CONFIG[event.new_status] ?? { label: 'Inconnu', color: 'text-slate-500', bg: 'bg-slate-100' }
                return (
                  <li key={event.id} className="flex items-start gap-3">
                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <div>
                      <p className="text-xs text-slate-400">{formatDateTime(event.changed_at)}</p>
                      {event.note && <p className="mt-0.5 text-sm text-slate-600">{event.note}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
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
