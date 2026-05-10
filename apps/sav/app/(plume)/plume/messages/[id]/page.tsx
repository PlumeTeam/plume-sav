import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSchoolTicketDetail } from '@/features/tickets/queries'
import { markTicketReadByPlumeAction } from '@/features/tickets/messages-actions-plume'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { PlumeNoteComposer } from '@/features/tickets/components/PlumeNoteComposer'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

export default async function PlumeConversationPage({ params }: PageProps) {
  // Plume admins have is_admin() covering all of service_requests via
  // sec_admin_all — getSchoolTicketDetail is the easiest reuse here, it just
  // joins photos/messages/history without a school-specific filter.
  const ticket = await getSchoolTicketDetail(params.id)
  if (!ticket) notFound()

  await markTicketReadByPlumeAction(ticket.id)

  // Plume sees EVERY visibility level (admin notes, school↔plume,
  // workshop↔plume, plume_only).
  const messages = ticket.ticket_messages
    .slice()
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const ticketRef = `#${ticket.id.slice(0, 8).toUpperCase()}`
  const productLine = [ticket.product_brand, ticket.product_model].filter(Boolean).join(' ') || 'Aile'
  const clientName = [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || 'Client'

  return (
    <div className="min-h-screen">
      <header className="bg-brand-cream">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-4 pb-3">
          <Link
            href="/plume/messages"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink hover:bg-white"
            aria-label="Retour à la messagerie"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-brand-ink">{clientName}</p>
            <p className="truncate text-xs text-slate-500">
              {productLine} · <span className="font-mono">{ticketRef}</span>
            </p>
          </div>
          <StatusBadge status={ticket.status} size="sm" />
        </div>
        <div className="mx-auto max-w-6xl flex flex-wrap gap-2 px-4 pb-3">
          <Link
            href={`/school/ticket/${ticket.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-stone bg-white px-3 py-2 text-xs font-medium text-brand-ink hover:border-brand-gold/40"
          >
            Voir l&apos;ensemble de la demande SAV (vue école) →
          </Link>
          <Link
            href={`/workshop/ticket/${ticket.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-stone bg-white px-3 py-2 text-xs font-medium text-brand-ink hover:border-brand-gold/40"
          >
            Vue atelier →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-4 pb-12">
        <CommentThread
          messages={messages}
          ownRoles={['plume_admin']}
          showInternalBadge
          emptyText="Aucun message pour l'instant."
        />
        <div className="sticky bottom-2">
          <div className="card p-3 shadow-soft">
            <PlumeNoteComposer ticketId={ticket.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
