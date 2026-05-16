import Link from 'next/link'
import { formatDate } from '@/features/tickets/utils'
import type { TicketWithContacts } from '@/features/tickets/contacts'
import { WorkshopAcceptancePanel } from './WorkshopAcceptancePanel'

interface WorkshopPendingAcceptanceProps {
  /** Tickets escaladés en attente de validation atelier (déjà filtrés). */
  tickets: TicketWithContacts[]
}

/**
 * Section "Demandes à valider" en tête du dashboard atelier.
 *
 * Liste les tickets escaladés par les écoles que l'atelier n'a pas encore
 * acceptés/refusés, avec les boutons Accepter / Refuser en ligne. Ne rend
 * rien si la file est vide.
 */
export function WorkshopPendingAcceptance({ tickets }: WorkshopPendingAcceptanceProps) {
  if (tickets.length === 0) return null

  return (
    <section className="space-y-3 rounded-3xl border-2 border-amber-300 bg-amber-50/60 p-4">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900">
          🛠️ Demandes à valider
        </h2>
        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-xs font-bold text-amber-900">
          {tickets.length}
        </span>
      </div>
      <p className="text-xs text-amber-900/80">
        Une école souhaite vous confier une aile. Acceptez ou refusez chaque
        demande — l&apos;école ne peut pas expédier tant que vous n&apos;avez
        pas répondu.
      </p>

      <ul className="space-y-3">
        {tickets.map((ticket) => {
          const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
          const productLine =
            [ticket.product_brand, ticket.product_model].filter(Boolean).join(' ') || 'Aile'
          return (
            <li key={ticket.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-amber-200">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-brand-ink">{productLine}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {ticket.serial_number && (
                      <span className="font-mono">{ticket.serial_number}</span>
                    )}
                    <span className="mx-1.5 text-slate-300">•</span>
                    Escaladée le {formatDate(ticket.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="font-mono text-[10px] text-slate-400">{ticketRef}</span>
                  <Link
                    href={`/workshop/ticket/${ticket.id}`}
                    className="text-xs font-semibold text-brand-gold hover:underline"
                  >
                    Voir le ticket →
                  </Link>
                </div>
              </div>

              <div className="mt-3">
                <WorkshopAcceptancePanel
                  ticketId={ticket.id}
                  workshopAccepted={ticket.workshop_accepted ?? null}
                  workshopRefusalReason={ticket.workshop_refusal_reason ?? null}
                />
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
