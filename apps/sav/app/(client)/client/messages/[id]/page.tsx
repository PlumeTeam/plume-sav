import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTicketDetail, getPartnerSchoolById, getPartnerWorkshopById } from '@/features/tickets/queries'
import { markTicketReadByClientAction } from '@/features/tickets/messages-actions'
import { markTicketReadByPlumeAction } from '@/features/tickets/messages-actions-plume'
import { markTicketNotificationsReadAction } from '@/features/notifications/actions'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { TicketChannelSwitch } from '@/features/tickets/components/TicketChannelSwitch'
import { buildClientChannels } from '@/features/tickets/client-channels'
import { filterMessagesForRole } from '@/features/tickets/channels'
import { MarkTicketRead } from '../../../_components/MarkTicketRead'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

export default async function ClientConversationPage({ params }: PageProps) {
  const ticket = await getTicketDetail(params.id)
  if (!ticket) notFound()

  // Mark-as-read : on couvre les 3 sources de "non lu" pour ce ticket :
  //   - client_last_read_at (legacy : compteur messages depuis ce timestamp)
  //   - plume_last_read_at (idem pour admin)
  //   - notifications.read (système unifié — vide le badge nav)
  // Best-effort : un échec sur l'un n'empêche pas les autres ni le rendu.
  await Promise.all([
    markTicketReadByClientAction(ticket.id),
    markTicketReadByPlumeAction(ticket.id),
    markTicketNotificationsReadAction(ticket.id),
  ])

  const school = ticket.referent_school_id
    ? await getPartnerSchoolById(ticket.referent_school_id)
    : null

  // Atelier assigné — résolu pour nommer le canal « Atelier ». Tolérant :
  // si partner_workshops est inaccessible, on retombe sur assigned_workshop_label.
  const assignedWorkshop = ticket.assigned_workshop_id
    ? await getPartnerWorkshopById(ticket.assigned_workshop_id).catch(() => null)
    : null

  // Channel-aware visibility — le client voit ses 3 canaux + legacy 'all'.
  const messages = filterMessagesForRole(ticket.ticket_messages, 'client')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const ticketRef = `#${ticket.id.slice(0, 8).toUpperCase()}`
  const productLine = [ticket.product_brand, ticket.product_model].filter(Boolean).join(' ') || 'Aile'

  return (
    <div className="min-h-screen">
      <header className="bg-brand-cream">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-4 pb-3">
          <Link
            href="/client/messages"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink hover:bg-white"
            aria-label="Retour à la messagerie"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-brand-ink">
              {school?.name ?? 'Conversation'}
            </p>
            <p className="truncate text-xs text-slate-500">
              {productLine} · <span className="font-mono">{ticketRef}</span>
            </p>
          </div>
          <StatusBadge status={ticket.status} size="sm" />
        </div>
        <div className="mx-auto max-w-2xl px-4 pb-3">
          <Link
            href={`/client/ticket/${ticket.id}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-brand-stone bg-white px-3 py-2 text-xs font-medium text-brand-ink hover:border-brand-gold/40"
          >
            Voir l&apos;ensemble de la demande SAV →
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-4 p-4 pb-12">
        <MarkTicketRead ticketId={ticket.id} />
        <TicketChannelSwitch
          ticketId={ticket.id}
          messages={messages}
          channels={buildClientChannels(
            ticket,
            school?.name ?? null,
            assignedWorkshop?.label ?? null,
          )}
          ownRoles={['client']}
        />
      </main>
    </div>
  )
}
