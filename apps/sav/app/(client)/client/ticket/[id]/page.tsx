import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTicketDetail, getPartnerSchoolById } from '@/features/tickets/queries'
import { markTicketReadByClientAction } from '@/features/tickets/messages-actions'
import { markTicketReadByPlumeAction } from '@/features/tickets/messages-actions-plume'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { ClientJourneyTimeline } from '@/features/tickets/components/ClientJourneyTimeline'
import { ShippingLabelButton } from '@/features/tickets/components/ShippingLabelButton'
import { formatDate, formatDateTime } from '@/features/tickets/utils'
import type { ClientShippingAddress } from '@/features/tickets/types'
import { MessageForm } from './MessageForm'

function readClientShippingAddress(raw: unknown): ClientShippingAddress | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.street !== 'string' || typeof r.postalCode !== 'string') return null
  if (typeof r.city !== 'string' || typeof r.country !== 'string') return null
  return {
    street:     r.street,
    postalCode: r.postalCode,
    city:       r.city,
    country:    r.country,
  }
}

interface PageProps {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({ params }: PageProps) {
  const ticket = await getTicketDetail(params.id)
  if (!ticket) notFound()

  // Best-effort: mark this ticket as read for the current client. The RPC
  // enforces ownership, so calling on a ticket the user doesn't own is a no-op.
  // We don't await its result for the page render — failure just leaves the
  // badge in place until next visit.
  // Plume admins can also land here in support mode — markPlume is no-op for
  // non-admins, so we call both unconditionally.
  await Promise.all([
    markTicketReadByClientAction(ticket.id),
    markTicketReadByPlumeAction(ticket.id),
  ])

  const school = ticket.referent_school_id
    ? await getPartnerSchoolById(ticket.referent_school_id)
    : null

  const sortedPhotos  = [...ticket.ticket_photos].sort((a, b) => a.sort_order - b.sort_order)
  const publicMessages = ticket.ticket_messages
    .filter((m) => m.visibility_level === 'all')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
  const isRejected = ticket.status === 'rejected' || ticket.status === 'cancelled'

  const cityRegion = [school?.city, school?.region].filter(Boolean).join(' · ')

  // L'aile est-elle déjà entre les mains de l'école/atelier ? Auquel cas pas
  // besoin d'afficher le bon de transport client → école.
  const wingHandedOver =
    ticket.status !== 'pending' &&
    ticket.status !== 'school_acknowledged'

  const shouldOfferClientShipping =
    ticket.delivery_method === 'postal' && !isRejected && (
      // soit on a déjà une étiquette → on l'affiche pour télécharger
      !!ticket.client_school_label_url ||
      // soit l'aile n'est pas encore arrivée → on permet de générer
      !wingHandedOver
    )

  const initialClientAddress = readClientShippingAddress(ticket.client_shipping_address)

  return (
    <div className="min-h-screen">
      {/* Contextual sub-header — sits on the cream background, no double bar */}
      <header className="bg-brand-cream">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-4 pb-2">
          <Link
            href="/client"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink hover:bg-white"
            aria-label="Retour"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs text-slate-500">{ticketRef}</p>
            <p className="truncate text-sm font-semibold text-brand-ink">
              {ticket.product_brand} {ticket.product_model}
            </p>
          </div>
          <StatusBadge status={ticket.status} size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 p-4 pb-12">
        {/* Bon de transport (envoi postal uniquement) */}
        {shouldOfferClientShipping && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Envoi postal vers l&apos;école</h2>
            <p className="mb-4 text-sm text-slate-600">
              {ticket.client_school_label_url
                ? "Votre bon de transport GLS est prêt — téléchargez-le et collez-le sur votre colis."
                : "Cliquez ici pour générer votre bon de transport GLS prépayé. Le coût est pris en charge par Plume."}
            </p>
            <ShippingLabelButton
              ticketId={ticket.id}
              leg="client_to_school"
              initialTracking={ticket.client_school_tracking}
              initialLabelUrl={ticket.client_school_label_url}
              initialAddress={initialClientAddress}
              autoApproved={ticket.auto_approved_shipping !== false}
            />
          </section>
        )}

        {/* Timeline verticale — toutes les étapes du parcours SAV */}
        <section className="card p-5">
          <h2 className="section-title mb-4">Suivi de votre demande</h2>
          {isRejected ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {ticket.status === 'rejected' ? 'Demande rejetée' : 'Demande annulée'}
            </div>
          ) : (
            <ClientJourneyTimeline ticket={ticket} />
          )}
        </section>

        {/* Votre école — contact + chat shortcut */}
        {school && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Votre école</h2>
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-3xl">🏫</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-ink">{school.name}</p>
                {cityRegion && (
                  <p className="mt-0.5 text-xs text-slate-500">{cityRegion}</p>
                )}

                {(school.phone || school.email || school.address) && (
                  <div className="mt-3 space-y-1.5 text-sm">
                    {school.phone && (
                      <a
                        href={`tel:${school.phone.replace(/\s+/g, '')}`}
                        className="flex items-center gap-2 text-brand-ink hover:text-brand-gold"
                      >
                        <span aria-hidden>📞</span>
                        <span>{school.phone}</span>
                      </a>
                    )}
                    {school.email && (
                      <a
                        href={`mailto:${school.email}?subject=SAV%20${encodeURIComponent(ticketRef)}`}
                        className="flex items-center gap-2 text-brand-ink hover:text-brand-gold"
                      >
                        <span aria-hidden>✉️</span>
                        <span className="break-all">{school.email}</span>
                      </a>
                    )}
                    {school.address && (
                      <p className="flex items-start gap-2 text-slate-700">
                        <span aria-hidden>📍</span>
                        <span className="whitespace-pre-line">{school.address}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <a
              href="#chat"
              className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2"
            >
              💬 Envoyer un message à l&apos;école
            </a>
          </section>
        )}

        {/* Product info */}
        <section className="card p-5">
          <h2 className="section-title mb-3">Produit</h2>
          <div className="space-y-2">
            <InfoRow label="Marque / Modèle" value={`${ticket.product_brand ?? '—'} ${ticket.product_model ?? '—'}`} />
            <InfoRow label="N° de série" value={ticket.serial_number ?? '—'} mono />
            {ticket.purchase_date && <InfoRow label="Date d'achat" value={formatDate(ticket.purchase_date)} />}
          </div>
        </section>

        {/* Description */}
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

        {/* Photos */}
        {sortedPhotos.length > 0 && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Photos ({sortedPhotos.length})</h2>
            <PhotoLightbox photos={sortedPhotos} />
          </section>
        )}

        {/* Messages — chat-style thread between client and school */}
        <section id="chat" className="card scroll-mt-20 p-5">
          <h2 className="section-title mb-4">
            Échanges{school?.name ? ` avec ${school.name}` : " avec votre école"}
          </h2>

          {publicMessages.length === 0 ? (
            <p className="rounded-xl bg-brand-cream/60 p-3 text-sm text-slate-500">
              Aucun message pour l&apos;instant. Écrivez ci-dessous pour démarrer la conversation —
              {school?.name ? ` ${school.name}` : ' votre école'} vous répondra ici.
            </p>
          ) : (
            <div className="mb-4 space-y-3">
              {publicMessages.map((msg) => {
                const isClient = msg.sender_role === 'client'
                return (
                  <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        isClient
                          ? 'bg-brand-gold text-white rounded-br-sm'
                          : 'bg-brand-cream text-brand-ink ring-1 ring-brand-stone rounded-bl-sm'
                      }`}
                    >
                      {!isClient && (
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider opacity-70">
                          {msg.sender_role === 'school' ? 'École' : msg.sender_role === 'workshop' ? 'Atelier' : msg.sender_role === 'plume_admin' ? 'Plume' : msg.sender_role}
                        </p>
                      )}
                      <p className="whitespace-pre-line text-sm leading-relaxed">{msg.content}</p>
                      <p className="mt-1 text-right text-[11px] opacity-60">{formatDateTime(msg.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <MessageForm ticketId={ticket.id} />
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

