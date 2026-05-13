import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSchoolTicketDetail, getPlumeSettings } from '@/features/tickets/queries'
import { markTicketReadBySchoolAction } from '@/features/tickets/messages-actions-school'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { WarrantyTierBadge } from '@/features/tickets/components/WarrantyTierBadge'
import { TicketTimeline } from '@/features/tickets/components/TicketTimeline'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { TicketChannelSwitch, type TicketChannel } from '@/features/tickets/components/TicketChannelSwitch'
import { filterMessagesForRole } from '@/features/tickets/channels'
import { readSchoolCheckInspector } from '@/features/tickets/inspection/steps'
import { formatDate, formatDateTime } from '@/features/tickets/utils'
import { CloseTicketButton } from '@/features/tickets/components/CloseTicketButton'
import { TicketClosureCard } from '@/features/tickets/components/TicketClosureCard'
import { SchoolStepPanel } from './SchoolStepPanel'
import { SchoolTicketTabs } from './SchoolTicketTabs'
import { SchoolWorkshopChannel } from './SchoolWorkshopChannel'
import type { CloserRole, ClosureOutcome, TicketMessage, WarrantyTier } from '@/features/tickets/types'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

type ChecklistJson = { checkedIds?: string[]; notes?: string | null } | null

export default async function SchoolTicketDetailPage({ params }: PageProps) {
  const [ticket, policy] = await Promise.all([
    getSchoolTicketDetail(params.id),
    getPlumeSettings(),
  ])
  if (!ticket) notFound()

  const ticketWarrantyTier = (ticket.warranty_tier as WarrantyTier | null) ?? null

  // Best-effort: mark this ticket as read for the current school user. The RPC
  // checks ownership via current_user_partner_school_ids() server-side.
  await markTicketReadBySchoolAction(ticket.id)

  // L'école voit ses 3 canaux du système 5-canaux : school_client,
  // workshop_school, group. Le canal workshop_plume (privé atelier↔Plume)
  // et client_workshop (privé client↔atelier) sont strictement masqués.
  // filterMessagesForRole conserve aussi les messages legacy (channel NULL)
  // selon les anciennes règles de visibility_level.
  const visibleMessages = filterMessagesForRole(ticket.ticket_messages, 'school')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // The first public client message = the personalised note the client wrote
  // in the wizard (createTicketAction stores it as the opening reply, channel
  // 'school_client' depuis la migration 5-canaux). Hoisted out of the thread
  // to render as the spotlight card at the top of the Messages tab — it's
  // the single most important thing the school wants to read on arrival.
  const firstClientMessage: TicketMessage | null =
    visibleMessages.find(
      (m) => m.sender_role === 'client' && !m.is_internal
    ) ?? null

  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`

  // The checklist is "validated" once it's saved at least once (any structure).
  const stored: ChecklistJson = (ticket.school_checklist ?? null) as ChecklistJson
  const isCheckValidated = !!stored && (
    (Array.isArray(stored.checkedIds) && stored.checkedIds.length > 0) ||
    (typeof stored.notes === 'string' && stored.notes.trim().length > 0)
  )
  // Nom du moniteur qui a effectué le check, extrait du payload V2.
  const checkInspector = readSchoolCheckInspector(ticket.school_checklist)

  const isClosed = !!ticket.closed_at
  const closerRole: CloserRole = 'school'

  // ── Tab 1: État ─────────────────────────────────────────────────────────
  const stateTab = (
    <>
      {/* Bannière clôture (T7) — si le ticket a été clôturé, afficher
          le statut final, l'acteur et la date en haut de l'onglet. */}
      <TicketClosureCard
        closedAt={ticket.closed_at}
        closedByRole={ticket.closed_by_role as CloserRole | null}
        closureOutcome={ticket.closure_outcome as ClosureOutcome | null}
        closureNote={ticket.closure_note}
      />

      {/* Delivery method banner */}
      {ticket.delivery_method && (
        <section className={`card flex items-start gap-3 p-4 border-2 ${
          ticket.delivery_method === 'postal'
            ? 'border-amber-200 bg-amber-50'
            : 'border-emerald-200 bg-emerald-50'
        }`}>
          <span aria-hidden className="text-2xl">
            {ticket.delivery_method === 'postal' ? '📦' : '🤝'}
          </span>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${
              ticket.delivery_method === 'postal' ? 'text-amber-900' : 'text-emerald-900'
            }`}>
              {ticket.delivery_method === 'postal'
                ? 'Le client envoie son aile par la poste'
                : 'Le client va déposer son aile en main propre'}
            </p>
            <p className={`mt-0.5 text-xs ${
              ticket.delivery_method === 'postal' ? 'text-amber-800/80' : 'text-emerald-800/80'
            }`}>
              {ticket.delivery_method === 'postal'
                ? 'Vous devriez recevoir un colis prochainement. Le numéro de suivi vous sera communiqué via la messagerie.'
                : 'Le client vous contactera pour prendre rendez-vous.'}
            </p>
            {ticket.delivery_method === 'postal' && ticket.client_school_tracking && (
              <p className="mt-2 break-all rounded-xl bg-white/60 px-3 py-1.5 font-mono text-[11px] text-amber-900">
                Tracking&nbsp;: {ticket.client_school_tracking}
              </p>
            )}
          </div>
        </section>
      )}

      {/* Étapes séquentielles */}
      <section className="card p-5">
        <h2 className="section-title mb-4">Étapes</h2>
        <SchoolStepPanel
          ticketId={ticket.id}
          status={ticket.status}
          schoolAcknowledgedAt={ticket.school_acknowledged_at}
          wingReceivedSchoolAt={ticket.wing_received_school_at}
          isCheckValidated={isCheckValidated}
          checkInspector={checkInspector}
          wingSerial={ticket.serial_number ?? null}
          schoolResolution={ticket.school_resolution ?? null}
          assignedWorkshopLabel={ticket.assigned_workshop_label}
          isPlumeUrgent={ticket.is_plume_urgent ?? false}
          schoolWorkshopTracking={ticket.school_workshop_tracking ?? null}
          schoolWorkshopLabelUrl={ticket.school_workshop_label_url ?? null}
          workshopReturnTracking={ticket.workshop_return_tracking ?? null}
          workshopReturnLabelUrl={ticket.workshop_return_label_url ?? null}
          deliveryMethod={ticket.delivery_method}
          shippingApproved={ticket.shipping_approved ?? null}
          shippingRefusalReason={ticket.shipping_refusal_reason ?? null}
          warrantyTier={ticketWarrantyTier}
          extendedCoversSchoolWorkshopShipping={policy.extendedCoversSchoolWorkshopShipping}
        />
      </section>

      {/* Suivi visuel */}
      <section className="card p-5">
        <h2 className="section-title mb-4">Suivi</h2>
        <TicketTimeline status={ticket.status} />
      </section>

      {/* Bouton de clôture explicite (T7) — visible tant que le ticket n'est
          pas déjà clôturé. L'école peut clôturer à tout moment du parcours
          (résolution sur place, annulation client, demande non valide…). */}
      {!isClosed && (
        <section className="card p-5">
          <h2 className="section-title mb-2">Clôturer ce ticket</h2>
          <p className="mb-4 text-sm text-slate-600">
            Quand le SAV est terminé, choisissez le statut final pour fermer
            définitivement le ticket. Il restera consultable dans votre historique.
          </p>
          <CloseTicketButton
            ticketId={ticket.id}
            ticketRef={ticketRef}
            closerRole={closerRole}
            variant="ghost"
          />
        </section>
      )}
    </>
  )

  // ── Tab 2: Déclaration ──────────────────────────────────────────────────
  const declarationTab = (
    <>
      {/* Flag urgent — banner en tête, visible immédiatement */}
      {ticket.urgency_level === 2 && (
        <section className="flex items-center gap-3 rounded-card border-2 border-red-300 bg-red-50 px-4 py-3 shadow-sm">
          <span aria-hidden className="text-2xl">🚨</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700">Signalé comme urgent</p>
            <p className="text-xs text-red-700/80">Le client a marqué cette demande comme prioritaire.</p>
          </div>
        </section>
      )}

      {/* Client */}
      <section className="card p-5">
        <h2 className="section-title mb-3">Client</h2>
        <div className="space-y-2">
          <InfoRow label="Nom" value={[ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || '—'} />
          <InfoRow label="Email" value={ticket.email ?? '—'} />
          {ticket.phone && <InfoRow label="Téléphone" value={ticket.phone} />}
        </div>
      </section>

      {/* Produit */}
      <section className="card p-5">
        <h2 className="section-title mb-3">Produit</h2>
        <div className="space-y-2">
          <InfoRow label="Marque / Modèle" value={`${ticket.product_brand ?? '—'} ${ticket.product_model ?? '—'}`} />
          <InfoRow label="N° de série" value={ticket.serial_number ?? '—'} mono />
          {ticket.purchase_date && <InfoRow label="Date d'achat" value={formatDate(ticket.purchase_date)} />}
        </div>
      </section>

      {/* Demande SAV */}
      <section className="card p-5">
        <h2 className="section-title mb-3">Demande de SAV</h2>
        {ticket.description ? (
          <p className="whitespace-pre-line text-sm leading-relaxed text-brand-ink">{ticket.description}</p>
        ) : (
          <p className="text-sm italic text-slate-500">Aucune description fournie.</p>
        )}
      </section>
    </>
  )

  // ── Tab 3: Messages — 2 canaux : Client / Atelier ───────────────────────
  // Spotlight (message du client à la création) + photos restent dans le
  // canal "Client" — c'est le contexte d'arrivée pour ce canal-là.
  const clientSpotlight = (
    <>
      {firstClientMessage ? (
        <section className="rounded-card border-2 border-brand-gold bg-brand-gold/5 p-5 shadow-plume">
          <div className="flex items-baseline justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-gold">
              Message du client
            </p>
            <p className="font-mono text-[11px] text-slate-500">
              {formatDateTime(firstClientMessage.created_at)}
            </p>
          </div>
          <p className="mt-3 whitespace-pre-line text-base leading-relaxed text-brand-ink">
            {firstClientMessage.content}
          </p>
        </section>
      ) : (
        <section className="card border-dashed p-4 text-center">
          <p className="text-sm text-slate-500">
            Le client n&apos;a pas laissé de message à la création.
          </p>
        </section>
      )}
      {ticket.ticket_photos.length > 0 && (
        <section className="card p-5">
          <h2 className="section-title mb-3">
            Photos du client ({ticket.ticket_photos.length})
          </h2>
          <PhotoLightbox photos={ticket.ticket_photos} />
        </section>
      )}
    </>
  )

  const schoolChannels: TicketChannel[] = [
    {
      id:        'client',
      label:     'Avec le client',
      emoji:     '👤',
      channel:   'school_client',
      excludeInternal:    true,
      excludeMessageIds:  firstClientMessage ? [firstClientMessage.id] : undefined,
      composer: {
        senderRole:      'school',
        visibilityLevel: 'all',
        channel:         'school_client',
        placeholder:     'Question, mise à jour, demande de précision…',
        submitLabel:     'Envoyer au client',
        helperText:      "Privé école ↔ client — l'atelier ne voit pas",
      },
      spotlight: clientSpotlight,
      emptyText: firstClientMessage
        ? 'Pas encore de réponse — utilisez le composer ci-dessous pour répondre au client.'
        : 'Aucun message — démarrez la conversation avec le client ci-dessous.',
    },
    {
      id:        'group',
      label:     'Discussion de groupe',
      emoji:     '👥',
      channel:   'group',
      composer: {
        senderRole:      'school',
        visibilityLevel: 'all',
        channel:         'group',
        placeholder:     'Message pour le groupe (école + client + atelier)…',
        submitLabel:     'Envoyer au groupe',
        helperText:      "Visible par le client, l'atelier & Plume HQ",
      },
      emptyText: 'Aucun message dans le canal de groupe.',
    },
    {
      id:         'workshop',
      label:      "Avec l'atelier",
      emoji:      '🛠️',
      channel:    'workshop_school',
      // Composer null + body custom : SchoolWorkshopChannel gère picker +
      // thread + composer en interne pour permettre le choix / changement
      // d'atelier directement dans le flux du chat.
      composer: null,
      body: (
        <SchoolWorkshopChannel
          ticketId={ticket.id}
          messages={visibleMessages.filter((m) => {
            const ch = (m as TicketMessage & { channel?: string | null }).channel ?? null
            return ch === 'workshop_school' ||
              (ch === null && m.visibility_level === 'workshop_plume')
          })}
          assignedWorkshopId={ticket.assigned_workshop_id}
          assignedWorkshopLabel={ticket.assigned_workshop_label}
        />
      ),
    },
  ]

  const messagesTab = (
    <TicketChannelSwitch
      ticketId={ticket.id}
      messages={visibleMessages}
      channels={schoolChannels}
      ownRoles={['school']}
      showInternalBadge
    />
  )

  return (
    <div className="min-h-screen">
      <header className="bg-brand-cream">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 pt-4 pb-2">
          <Link
            href="/school"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink hover:bg-white"
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
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
            {ticketWarrantyTier && (
              <WarrantyTierBadge tier={ticketWarrantyTier} size="sm" compact />
            )}
            <StatusBadge status={ticket.status} size="sm" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-3 p-4 pb-12">
        <SchoolTicketTabs
          state={stateTab}
          declaration={declarationTab}
          messages={messagesTab}
          messagesCount={visibleMessages.length}
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
