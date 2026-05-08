import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSchoolTicketDetail } from '@/features/tickets/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { TicketTimeline } from '@/features/tickets/components/TicketTimeline'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { formatDate } from '@/features/tickets/utils'
import { ShippingLabelButton } from '@/features/tickets/components/ShippingLabelButton'
import { SchoolActions } from './SchoolActions'
import { SchoolStepPanel } from './SchoolStepPanel'
import { SchoolResolutionPanel } from './SchoolResolutionPanel'
import type { SchoolResolution, RequestStatus } from '@/features/tickets/types'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

type ChecklistJson = { checkedIds?: string[]; notes?: string | null } | null

export default async function SchoolTicketDetailPage({ params }: PageProps) {
  const ticket = await getSchoolTicketDetail(params.id)
  if (!ticket) notFound()

  // School sees public messages + own internal notes + workshop-plume channel
  const visibleMessages = ticket.ticket_messages
    .filter((m) =>
      m.visibility_level === 'all' ||
      m.visibility_level === 'school_plume' ||
      m.visibility_level === 'workshop_plume' ||
      m.sender_role === 'school'
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

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
            </div>
          </section>
        )}

        {/* ── ÉTAPES SÉQUENTIELLES ───────────────────────────────── */}
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

        {/* ── ACTIONS PRINCIPALES (chat + check) ─────────────────── */}
        <SchoolActions
          ticketId={ticket.id}
          isCheckValidated={isCheckValidated}
          assignedWorkshopId={ticket.assigned_workshop_id}
          assignedWorkshopLabel={ticket.assigned_workshop_label}
        />

        {/* Bon de transport école → atelier */}
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

        {/* Suivi */}
        <section className="card p-5">
          <h2 className="section-title mb-4">Suivi</h2>
          <TicketTimeline status={ticket.status} />
        </section>

        {/* Décision */}
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

        {/* Demande */}
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
        {ticket.ticket_photos.length > 0 && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Photos ({ticket.ticket_photos.length})</h2>
            <PhotoLightbox photos={ticket.ticket_photos} />
          </section>
        )}

        {/* Historique conversations */}
        <section className="card p-5">
          <h2 className="section-title mb-4">Historique des messages</h2>
          <CommentThread
            messages={visibleMessages}
            ownRoles={['school']}
            showInternalBadge
            emptyText="Aucun message — utilisez les actions en haut pour démarrer une conversation."
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
