import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWorkshopTicketDetail } from '@/features/tickets/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { TicketTimeline } from '@/features/tickets/components/TicketTimeline'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import { PhotoGallery } from '@/features/tickets/components/PhotoGallery'
import { formatDate } from '@/features/tickets/utils'
import { WorkshopActionBar } from './WorkshopActionBar'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

export default async function WorkshopTicketDetailPage({ params }: PageProps) {
  const ticket = await getWorkshopTicketDetail(params.id)
  if (!ticket) notFound()

  const allMessages = [...ticket.ticket_messages].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )
  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`

  return (
    <div className="min-h-screen">
      <header className="border-b border-brand-stone/60 bg-white">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Link
            href="/workshop"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink active:bg-brand-cream"
            aria-label="Retour"
          >
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-slate-500">{ticketRef}</p>
            <p className="truncate text-sm font-semibold text-brand-ink">
              {ticket.product_brand} {ticket.product_model}
            </p>
          </div>
          <StatusBadge status={ticket.status} size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-3 p-4 pb-12">
        <section className="card p-5">
          <h2 className="section-title mb-4">Suivi</h2>
          <TicketTimeline status={ticket.status} />
        </section>

        <section className="card p-5">
          <h2 className="section-title mb-4">Actions atelier</h2>
          <WorkshopActionBar
            ticketId={ticket.id}
            currentStatus={ticket.status}
            diagnosisNotes={ticket.diagnosis_notes}
            estimatedCost={ticket.estimated_cost}
            estimatedHours={ticket.estimated_hours}
            partsNeeded={ticket.parts_needed}
          />
        </section>

        {(ticket.diagnosis_notes || ticket.estimated_cost != null) && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Diagnostic</h2>
            <div className="space-y-3">
              {ticket.diagnosis_notes && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-brand-ink">{ticket.diagnosis_notes}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {ticket.estimated_hours != null && (
                  <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-stone">
                    ⏱ {ticket.estimated_hours} h estimées
                  </span>
                )}
                {ticket.estimated_cost != null && (
                  <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-stone">
                    💰 {ticket.estimated_cost} € estimés
                  </span>
                )}
              </div>
              {ticket.parts_needed && (
                <p className="text-xs text-slate-500">Pièces : {ticket.parts_needed}</p>
              )}
            </div>
          </section>
        )}

        <section className="card p-5">
          <h2 className="section-title mb-3">Produit</h2>
          <div className="space-y-2">
            <InfoRow label="Marque / Modèle" value={`${ticket.product_brand ?? '—'} ${ticket.product_model ?? '—'}`} />
            <InfoRow label="N° de série" value={ticket.serial_number ?? '—'} mono />
            {ticket.purchase_date && <InfoRow label="Date d'achat" value={formatDate(ticket.purchase_date)} />}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="section-title mb-3">Demande</h2>
          {ticket.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-brand-ink">{ticket.description}</p>
          )}
          {ticket.urgency_level === 2 && (
            <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              🚨 Signalé comme urgent
            </p>
          )}
        </section>

        {ticket.ticket_photos.length > 0 && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Photos ({ticket.ticket_photos.length})</h2>
            <PhotoGallery photos={ticket.ticket_photos} />
          </section>
        )}

        <section className="card p-5">
          <h2 className="section-title mb-4">Messages</h2>
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

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="flex-shrink-0 text-xs text-slate-500">{label}</p>
      <p className={`text-right text-sm text-brand-ink ${mono ? 'font-mono' : ''}`}>{value.trim() || '—'}</p>
    </div>
  )
}
