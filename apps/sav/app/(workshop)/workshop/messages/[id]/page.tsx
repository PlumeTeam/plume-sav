import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWorkshopTicketDetail } from '@/features/tickets/queries'
import { getCurrentUserRoles } from '@/features/auth/queries'
import { markTicketReadByWorkshopAction } from '@/features/tickets/messages-actions-workshop'
import { markTicketReadByPlumeAction } from '@/features/tickets/messages-actions-plume'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { filterMessagesForRole } from '@/features/tickets/channels'
import { WorkshopMessageComposer } from './WorkshopMessageComposer'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

export default async function WorkshopConversationPage({ params }: PageProps) {
  const [ticket, currentRoles] = await Promise.all([
    getWorkshopTicketDetail(params.id),
    getCurrentUserRoles(),
  ])
  if (!ticket) notFound()

  await Promise.all([
    markTicketReadByWorkshopAction(ticket.id),
    markTicketReadByPlumeAction(ticket.id),
  ])

  const isPlumeAdmin = currentRoles.includes('plume_admin')

  // Channel-aware visibility: workshop's 4 channels + legacy. Plume admin
  // (vue support) voit tout en plus.
  const messages = filterMessagesForRole(
    ticket.ticket_messages,
    isPlumeAdmin ? 'plume' : 'workshop',
  ).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const ticketRef = `#${ticket.id.slice(0, 8).toUpperCase()}`
  const productLine = [ticket.product_brand, ticket.product_model].filter(Boolean).join(' ') || 'Aile'
  const clientName = [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || 'Client'

  return (
    <div className="min-h-screen">
      <header className="bg-brand-cream">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pt-4 pb-3">
          <Link
            href="/workshop/messages"
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
        <div className="mx-auto max-w-6xl px-4 pb-3">
          <Link
            href={`/workshop/ticket/${ticket.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-stone bg-white px-3 py-2 text-xs font-medium text-brand-ink hover:border-brand-gold/40"
          >
            Voir l&apos;ensemble de la demande SAV →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-4 pb-12">
        <CommentThread
          messages={messages}
          ownRoles={['workshop']}
          showInternalBadge
          emptyText="Aucun message pour l'instant."
        />
        <div className="sticky bottom-2">
          <div className="card p-3 shadow-soft">
            <WorkshopMessageComposer ticketId={ticket.id} />
          </div>
        </div>
      </main>
    </div>
  )
}
