import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTicketDetail, getPartnerSchoolById } from '@/features/tickets/queries'
import { markTicketReadByClientAction } from '@/features/tickets/messages-actions'
import { markTicketReadByPlumeAction } from '@/features/tickets/messages-actions-plume'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { ClientJourneyTimeline } from '@/features/tickets/components/ClientJourneyTimeline'
import { ShippingLabelButton } from '@/features/tickets/components/ShippingLabelButton'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import { ClientDeclarationView } from '@/features/tickets/components/ClientDeclarationView'
import { WingLocationCard } from '@/features/tickets/components/WingLocationCard'
import { TicketClosureCard } from '@/features/tickets/components/TicketClosureCard'
import { WarrantyTierBadge } from '@/features/tickets/components/WarrantyTierBadge'
import { formatAge, formatDate, resolveWarrantyTierForDisplay } from '@/features/tickets/utils'
import { filterMessagesForRole } from '@/features/tickets/channels'
import type { ClientShippingAddress, CloserRole, ClosureOutcome } from '@/features/tickets/types'
import { MessageForm } from './MessageForm'
import { ClientTicketTabs } from './ClientTicketTabs'

function readClientShippingAddress(raw: unknown): ClientShippingAddress | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.street !== 'string' || typeof r.postalCode !== 'string') return null
  if (typeof r.city !== 'string' || typeof r.country !== 'string') return null
  return { street: r.street, postalCode: r.postalCode, city: r.city, country: r.country }
}

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({ params }: PageProps) {
  const ticket = await getTicketDetail(params.id)
  if (!ticket) notFound()

  // Best-effort mark-as-read for both client and (if applicable) plume admin.
  await Promise.all([
    markTicketReadByClientAction(ticket.id),
    markTicketReadByPlumeAction(ticket.id),
  ])

  const school = ticket.referent_school_id
    ? await getPartnerSchoolById(ticket.referent_school_id)
    : null

  const sortedPhotos   = [...ticket.ticket_photos].sort((a, b) => a.sort_order - b.sort_order)
  // Le client voit ses 3 canaux (school_client, client_workshop, group) + les
  // messages legacy avec visibility_level='all'. filterMessagesForRole couvre
  // les deux régimes.
  const publicMessages = filterMessagesForRole(ticket.ticket_messages, 'client')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const ticketRef  = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
  const isRejected = ticket.status === 'rejected' || ticket.status === 'cancelled'
  const cityRegion = [school?.city, school?.region].filter(Boolean).join(' · ')

  // L'aile est-elle déjà entre les mains de l'école/atelier ?
  const wingHandedOver = ticket.status !== 'pending' && ticket.status !== 'school_acknowledged'
  const shouldOfferClientShipping =
    ticket.delivery_method === 'postal' && !isRejected && (
      !!ticket.client_school_label_url || !wingHandedOver
    )
  const initialClientAddress = readClientShippingAddress(ticket.client_shipping_address)

  // ── Tab content ────────────────────────────────────────────────────────────

  // Inline shipping label generator, attached to the "Envoi de l'aile" step
  // when it's the current one. Only built if the ticket actually needs it.
  //
  // Gating "validation école" (migration 20260512000000) :
  //  - shipping_approved=NULL  → message "en attente de validation"
  //  - shipping_approved=FALSE → message "envoi refusé" + raison
  //  - shipping_approved=TRUE  → bouton actif
  //  Si un label a déjà été généré, on le ré-expose quel que soit l'état
  //  (idempotence : on ne révoque pas un bon de transport déjà émis).
  const hasExistingShippingLabel = !!ticket.client_school_label_url
  const shippingApproval         = ticket.shipping_approved ?? null

  const shippingAction = !shouldOfferClientShipping
    ? null
    : !hasExistingShippingLabel && shippingApproval === null
    ? (
        <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <p className="font-semibold text-amber-900">
            ⏳ En attente de validation par l&apos;école
          </p>
          <p className="mt-0.5 text-xs text-amber-900/80">
            {school?.name ?? 'Votre école'} doit confirmer la réception de votre demande
            avant que vous puissiez générer le bon de transport. Vous serez notifié dès qu&apos;une décision est prise.
          </p>
        </div>
      )
    : !hasExistingShippingLabel && shippingApproval === false
    ? (
        <div className="rounded-2xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm">
          <p className="font-semibold text-red-900">
            ✕ Envoi refusé par {school?.name ?? 'votre école'}
          </p>
          {ticket.shipping_refusal_reason ? (
            <p className="mt-1 whitespace-pre-line text-xs text-red-900/90">
              {ticket.shipping_refusal_reason}
            </p>
          ) : (
            <p className="mt-1 text-xs text-red-900/90">
              Contactez votre école via l&apos;onglet « Messages » pour en savoir plus.
            </p>
          )}
        </div>
      )
    : (
        <ShippingLabelButton
          ticketId={ticket.id}
          leg="client_to_school"
          initialTracking={ticket.client_school_tracking}
          initialLabelUrl={ticket.client_school_label_url}
          initialAddress={initialClientAddress}
          autoApproved={ticket.auto_approved_shipping !== false}
          requireScan
          wingSerial={ticket.serial_number ?? null}
        />
      )

  const stateNode = (
    <>
      <TicketClosureCard
        closedAt={ticket.closed_at}
        closedByRole={ticket.closed_by_role as CloserRole | null}
        closureOutcome={ticket.closure_outcome as ClosureOutcome | null}
        closureNote={ticket.closure_note}
      />
      <section className="card p-5">
        <h2 className="section-title mb-4">Suivi de votre demande</h2>
        {isRejected ? (
          <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {ticket.status === 'rejected' ? 'Demande rejetée' : 'Demande annulée'}
          </div>
        ) : (
          <ClientJourneyTimeline
            ticket={ticket}
            actions={shippingAction ? { to_school: shippingAction } : undefined}
          />
        )}
      </section>
      <WingLocationCard ticket={ticket} schoolName={school?.name ?? null} />
    </>
  )

  const messagesNode = (
    <section className="card p-5">
      <h2 className="section-title mb-4">
        Échanges{school?.name ? ` avec ${school.name}` : " avec votre école"}
      </h2>
      <div className="mb-4">
        <CommentThread
          messages={publicMessages}
          ownRoles={['client']}
          emptyText={`Aucun message pour l'instant. Écrivez ci-dessous pour démarrer la conversation — ${school?.name ?? 'votre école'} vous répondra ici.`}
        />
      </div>
      <MessageForm ticketId={ticket.id} />
    </section>
  )

  const contactNode = school ? (
    <section className="card p-5">
      <h2 className="section-title mb-3">Votre école</h2>
      <div className="flex items-start gap-3">
        <span aria-hidden className="text-3xl">🏫</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-brand-ink">{school.name}</p>
          {cityRegion && <p className="mt-0.5 text-xs text-slate-500">{cityRegion}</p>}
          {(school.phone || school.email || school.address) && (
            <div className="mt-3 space-y-1.5 text-sm">
              {school.phone && (
                <a href={`tel:${school.phone.replace(/\s+/g, '')}`} className="flex items-center gap-2 text-brand-ink hover:text-brand-gold">
                  <span aria-hidden>📞</span><span>{school.phone}</span>
                </a>
              )}
              {school.email && (
                <a href={`mailto:${school.email}?subject=SAV%20${encodeURIComponent(ticketRef)}`} className="flex items-center gap-2 text-brand-ink hover:text-brand-gold">
                  <span aria-hidden>✉️</span><span className="break-all">{school.email}</span>
                </a>
              )}
              {school.address && (
                <p className="flex items-start gap-2 text-slate-700">
                  <span aria-hidden>📍</span><span className="whitespace-pre-line">{school.address}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  ) : (
    <section className="card p-5 text-center text-sm text-slate-500">
      Aucune école associée à cette demande.
    </section>
  )

  const warrantyTier = resolveWarrantyTierForDisplay(ticket.warranty_tier, ticket.purchase_date)
  const wingAge      = formatAge(ticket.purchase_date)

  const infosNode = (
    <>
      <section className="card p-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="section-title">Produit</h2>
          <WarrantyTierBadge tier={warrantyTier} size="sm" compact />
        </div>
        <div className="space-y-2">
          <InfoRow label="Marque / Modèle" value={`${ticket.product_brand ?? '—'} ${ticket.product_model ?? '—'}`} />
          <InfoRow label="N° de série" value={ticket.serial_number ?? '—'} mono />
          {ticket.purchase_date && (
            <InfoRow
              label="Date d'achat"
              value={`${formatDate(ticket.purchase_date)}${wingAge ? ` — ${wingAge}` : ''}`}
            />
          )}
        </div>
      </section>
      <section className="card p-5">
        <h2 className="section-title mb-4">Demande</h2>
        <ClientDeclarationView description={ticket.description} urgencyLevel={ticket.urgency_level} />
      </section>
      {sortedPhotos.length > 0 && (
        <section className="card p-5">
          <h2 className="section-title mb-3">Photos ({sortedPhotos.length})</h2>
          <PhotoLightbox photos={sortedPhotos} />
        </section>
      )}
    </>
  )

  return (
    <div className="min-h-screen">
      <header className="bg-brand-cream">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-4 pb-3">
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

      <main className="mx-auto max-w-2xl space-y-4 p-4 pb-12">
        <ClientTicketTabs
          state={stateNode}
          messages={messagesNode}
          contact={contactNode}
          infos={infosNode}
          messagesCount={publicMessages.length}
        />
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
