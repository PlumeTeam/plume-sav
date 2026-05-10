import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSchoolTicketDetail } from '@/features/tickets/queries'
import { markTicketReadBySchoolAction } from '@/features/tickets/messages-actions-school'
import { getCurrentUserRoles } from '@/features/auth/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { TicketTimeline } from '@/features/tickets/components/TicketTimeline'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { PlumeNoteComposer } from '@/features/tickets/components/PlumeNoteComposer'
import { formatDate, formatDateTime } from '@/features/tickets/utils'
import { ShippingLabelButton } from '@/features/tickets/components/ShippingLabelButton'
import { SchoolActions } from './SchoolActions'
import { SchoolStepPanel } from './SchoolStepPanel'
import { SchoolResolutionPanel } from './SchoolResolutionPanel'
import { SchoolTicketTabs } from './SchoolTicketTabs'
import { SchoolMessageComposer } from './SchoolMessageComposer'
import type { SchoolResolution, RequestStatus, TicketMessage } from '@/features/tickets/types'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

type ChecklistJson = { checkedIds?: string[]; notes?: string | null } | null

export default async function SchoolTicketDetailPage({ params }: PageProps) {
  const [ticket, currentRoles] = await Promise.all([
    getSchoolTicketDetail(params.id),
    getCurrentUserRoles(),
  ])
  if (!ticket) notFound()

  // Best-effort: mark this ticket as read for the current school user. The RPC
  // checks ownership via current_user_partner_school_ids() server-side.
  await markTicketReadBySchoolAction(ticket.id)

  const isPlumeAdmin = currentRoles.includes('plume_admin')

  // School sees public messages + own internal notes + workshop-plume channel.
  // Plume admins (en vue support) voient en plus les notes 'plume_only'.
  const visibleMessages = ticket.ticket_messages
    .filter((m) =>
      m.visibility_level === 'all' ||
      m.visibility_level === 'school_plume' ||
      m.visibility_level === 'workshop_plume' ||
      (isPlumeAdmin && m.visibility_level === 'plume_only') ||
      m.sender_role === 'school'
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // The first public client message = the personalised note the client wrote
  // in the wizard (createTicketAction stores it as the opening reply with
  // visibility=all). Hoisted out of the thread to render as the spotlight card
  // at the top of the Messages tab — it's the single most important thing
  // the school wants to read on arrival.
  const firstClientMessage: TicketMessage | null =
    visibleMessages.find(
      (m) => m.sender_role === 'client' && m.visibility_level === 'all' && !m.is_internal
    ) ?? null
  const threadMessages = firstClientMessage
    ? visibleMessages.filter((m) => m.id !== firstClientMessage.id)
    : visibleMessages

  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`

  // Le bon de transport école → atelier n'a de sens qu'une fois l'escalade
  // décidée et tant que l'aile n'a pas été réceptionnée par l'atelier. On
  // le laisse aussi visible (lien de téléchargement) après réception, pour
  // qu'on puisse re-télécharger l'étiquette si besoin.
  const escalatedToWorkshopStatuses: RequestStatus[] = [
    'escalated_to_workshop',
    'wing_received_workshop',
    'workshop_diagnosing',
    'workshop_repairing',
    'workshop_done',
    'wing_returned',
    'completed',
  ]
  const shouldOfferSchoolShipping =
    ticket.school_resolution === 'escalated_to_workshop' &&
    !!ticket.assigned_workshop_id &&
    escalatedToWorkshopStatuses.includes(ticket.status)

  // The checklist is "validated" once it's saved at least once (any structure).
  const stored: ChecklistJson = (ticket.school_checklist ?? null) as ChecklistJson
  const isCheckValidated = !!stored && (
    (Array.isArray(stored.checkedIds) && stored.checkedIds.length > 0) ||
    (typeof stored.notes === 'string' && stored.notes.trim().length > 0)
  )

  // ── Tab 1: État ─────────────────────────────────────────────────────────
  const stateTab = (
    <>
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
        />
      </section>

      {/* Suivi visuel */}
      <section className="card p-5">
        <h2 className="section-title mb-4">Suivi</h2>
        <TicketTimeline status={ticket.status} />
      </section>

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

      {/* Demande — description rich text + flag urgent */}
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
    </>
  )

  // ── Tab 2: Messages ─────────────────────────────────────────────────────
  const messagesTab = (
    <>
      {/* Spotlight: message du client à la création */}
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

      {/* Photos jointes par le client */}
      {ticket.ticket_photos.length > 0 && (
        <section className="card p-5">
          <h2 className="section-title mb-3">
            Photos ({ticket.ticket_photos.length})
          </h2>
          <PhotoLightbox photos={ticket.ticket_photos} />
        </section>
      )}

      {/* Conversation complète */}
      <section className="card p-5">
        <h2 className="section-title mb-4">Conversation</h2>
        <CommentThread
          messages={threadMessages}
          ownRoles={['school']}
          showInternalBadge
          emptyText={
            firstClientMessage
              ? 'Pas encore de réponse — utilisez le composer ci-dessous pour répondre au client.'
              : 'Aucun message — démarrez la conversation avec le client ci-dessous.'
          }
        />
      </section>

      {/* Composer toujours visible */}
      <SchoolMessageComposer ticketId={ticket.id} />

      {/* Composer Plume HQ — réservé aux plume_admin (vue support). */}
      {isPlumeAdmin && <PlumeNoteComposer ticketId={ticket.id} />}
    </>
  )

  // ── Tab 3: Check aile ───────────────────────────────────────────────────
  const checkTab = (
    <>
      {/* Cartes : Communiquer avec l'atelier + Checker l'aile */}
      <SchoolActions
        ticketId={ticket.id}
        isCheckValidated={isCheckValidated}
        assignedWorkshopId={ticket.assigned_workshop_id}
        assignedWorkshopLabel={ticket.assigned_workshop_label}
        cards={['workshop', 'check']}
      />

      {/* Bon de transport école → atelier (si escalade) */}
      {shouldOfferSchoolShipping && (
        <section className="card p-5">
          <h2 className="section-title mb-3">Bon de transport école → atelier</h2>
          <p className="mb-4 text-sm text-slate-600">
            {ticket.school_workshop_label_url
              ? "Étiquette GLS prête — collez-la sur le colis avant expédition."
              : `Générez l'étiquette GLS pour expédier l'aile à ${ticket.assigned_workshop_label ?? 'l\'atelier'}.`}
          </p>
          <ShippingLabelButton
            ticketId={ticket.id}
            leg="school_to_workshop"
            initialTracking={ticket.school_workshop_tracking}
            initialLabelUrl={ticket.school_workshop_label_url}
          />
        </section>
      )}

      {/* Décision (mineur / important / grave) */}
      <section className="card p-5">
        <h2 className="section-title mb-4">Décision</h2>
        {!isCheckValidated && !ticket.school_resolution && (
          <div className="mb-4 rounded-xl bg-brand-cream p-3 text-xs text-slate-600">
            💡 Lancez d&apos;abord le check de l&apos;aile pour une décision éclairée.
          </div>
        )}
        <SchoolResolutionPanel
          ticketId={ticket.id}
          currentResolution={ticket.school_resolution as SchoolResolution | null}
          assignedWorkshopLabel={ticket.assigned_workshop_label}
          isPlumeUrgent={ticket.is_plume_urgent ?? false}
        />
      </section>
    </>
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
          <StatusBadge status={ticket.status} size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-3 p-4 pb-12">
        <SchoolTicketTabs
          state={stateTab}
          messages={messagesTab}
          check={checkTab}
          messagesCount={visibleMessages.length}
          checkValidated={isCheckValidated}
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
