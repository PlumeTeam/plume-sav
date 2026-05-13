import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWorkshopTicketDetail } from '@/features/tickets/queries'
import { markTicketReadByWorkshopAction } from '@/features/tickets/messages-actions-workshop'
import { markTicketReadByPlumeAction } from '@/features/tickets/messages-actions-plume'
import { getCurrentUserRoles } from '@/features/auth/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { TicketTimeline } from '@/features/tickets/components/TicketTimeline'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { PlumeNoteComposer } from '@/features/tickets/components/PlumeNoteComposer'
import { TicketChannelSwitch, type TicketChannel } from '@/features/tickets/components/TicketChannelSwitch'
import { readSchoolCheckInspector } from '@/features/tickets/inspection/steps'
import { DiagnosisChecklist } from '@/features/tickets/components/DiagnosisChecklist'
import { WORKSHOP_TECHNICAL_CHECKLIST } from '@/features/tickets/constants'
import { saveWorkshopChecklistAction } from '@/features/tickets/actions'
import { formatDate, formatDateTime } from '@/features/tickets/utils'
import { ShippingLabelButton } from '@/features/tickets/components/ShippingLabelButton'
import { WorkshopActionBar } from './WorkshopActionBar'
import { WorkshopStepPanel } from './WorkshopStepPanel'
import { WorkshopTicketTabs } from './WorkshopTicketTabs'
import type { TicketMessage, WorkshopReturnDestination } from '@/features/tickets/types'

// Lien public de suivi GLS — accepte tout numéro de tracking en query param.
function buildGlsTrackingUrl(tracking: string): string {
  return `https://gls-group.com/track/${encodeURIComponent(tracking)}`
}

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

type ChecklistJson = { checkedIds?: string[]; notes?: string | null } | null

export default async function WorkshopTicketDetailPage({ params }: PageProps) {
  const [ticket, currentRoles] = await Promise.all([
    getWorkshopTicketDetail(params.id),
    getCurrentUserRoles(),
  ])
  if (!ticket) notFound()

  // Best-effort: mark this ticket as read for the current workshop user.
  // The RPC checks role + assignment server-side.
  // Plume admins use this view too — markPlume is no-op for non-admins.
  await Promise.all([
    markTicketReadByWorkshopAction(ticket.id),
    markTicketReadByPlumeAction(ticket.id),
  ])

  const isPlumeAdmin = currentRoles.includes('plume_admin')

  // Workshop sees:
  //  - public messages (visibility 'all')
  //  - the school↔workshop↔plume channel (visibility 'workshop_plume')
  //  - their own messages
  // Hides 'school_plume' (private school↔plume) and 'plume_only' (admin notes).
  // Plume admins (en vue support) voient les notes 'plume_only' en plus.
  const visibleMessages = ticket.ticket_messages
    .filter((m) =>
      m.visibility_level === 'all' ||
      m.visibility_level === 'workshop_plume' ||
      (isPlumeAdmin && (m.visibility_level === 'plume_only' || m.visibility_level === 'school_plume')) ||
      m.sender_role === 'workshop'
    )
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // Premier message client (rédigé à la création du ticket via createTicketAction
  // avec visibility=all). Hoisté en spotlight en tête du canal "Client" — c'est
  // le contexte d'arrivée le plus important pour l'atelier.
  const firstClientMessage: TicketMessage | null =
    visibleMessages.find(
      (m) => m.sender_role === 'client' && m.visibility_level === 'all' && !m.is_internal
    ) ?? null

  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`

  // Nom du moniteur qui a effectué le check côté école — exposé à l'atelier
  // pour la traçabilité de l'escalade.
  const schoolCheckInspector = readSchoolCheckInspector(ticket.school_checklist)

  const stored: ChecklistJson = (ticket.workshop_checklist ?? null) as ChecklistJson
  const initialChecked = Array.isArray(stored?.checkedIds) ? stored!.checkedIds! : []
  const initialNotes   = typeof stored?.notes === 'string' ? stored!.notes! : ''

  // Le bon de transport retour est utile à partir du moment où la réparation
  // est terminée (workshop_done) et tant que l'aile n'a pas encore été
  // marquée comme renvoyée. On le laisse aussi visible après "wing_returned"
  // pour pouvoir re-télécharger l'étiquette si besoin.
  const shouldOfferReturnShipping =
    ticket.status === 'workshop_done' ||
    ticket.status === 'wing_returned' ||
    ticket.status === 'completed'

  const returnDest = (ticket.workshop_return_destination ?? null) as WorkshopReturnDestination | null

  // États du parcours physique de l'aile — pilotent le banner d'expédition.
  const hasShippingContext = !!ticket.escalated_to_workshop_at || !!ticket.school_workshop_tracking
  const wingArrived        = !!ticket.wing_received_workshop_at
  const wingInTransit      = !wingArrived && !!ticket.school_workshop_tracking

  // ── Onglet 1 : État (parcours physique de l'aile) ────────────────────────
  const stateTab = (
    <>
      {/* Banner d'expédition école → atelier — couleurs selon l'état :
          - emerald = aile arrivée à l'atelier
          - amber   = en transit (tracking généré, pas encore reçue)
          - cream   = escaladée mais pas encore expédiée */}
      {hasShippingContext && (
        <section className={`card flex items-start gap-3 p-4 border-2 ${
          wingArrived
            ? 'border-emerald-200 bg-emerald-50'
            : wingInTransit
              ? 'border-amber-200 bg-amber-50'
              : 'border-brand-stone bg-brand-cream'
        }`}>
          <span aria-hidden className="text-2xl">
            {wingArrived ? '✅' : wingInTransit ? '📦' : '⏳'}
          </span>
          <div className="flex-1">
            <p className={`text-sm font-semibold ${
              wingArrived
                ? 'text-emerald-900'
                : wingInTransit
                  ? 'text-amber-900'
                  : 'text-brand-ink'
            }`}>
              {wingArrived
                ? "Aile réceptionnée à l'atelier"
                : wingInTransit
                  ? "Aile en transit depuis l'école"
                  : "Ticket escaladé — en attente d'expédition"}
            </p>
            <p className={`mt-0.5 text-xs ${
              wingArrived
                ? 'text-emerald-800/80'
                : wingInTransit
                  ? 'text-amber-800/80'
                  : 'text-slate-600'
            }`}>
              {ticket.escalated_to_workshop_at && (
                <>Escaladée le {formatDate(ticket.escalated_to_workshop_at)}</>
              )}
              {ticket.wing_received_workshop_at && (
                <> · Reçue le {formatDate(ticket.wing_received_workshop_at)}</>
              )}
              {!ticket.escalated_to_workshop_at && !ticket.wing_received_workshop_at && (
                <>L&apos;école n&apos;a pas encore généré de bon de transport.</>
              )}
            </p>
            {ticket.school_workshop_tracking && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="break-all rounded-xl bg-white/60 px-3 py-1.5 font-mono text-[11px] text-brand-ink">
                  Tracking GLS&nbsp;: {ticket.school_workshop_tracking}
                </span>
                <a
                  href={buildGlsTrackingUrl(ticket.school_workshop_tracking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-brand-gold hover:underline"
                >
                  Suivre →
                </a>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Briefing école — remonté en haut de l'onglet État, juste après le
          banner d'expédition, pour orienter le diagnostic dès l'arrivée. */}
      {(schoolCheckInspector || (ticket.school_resolution === 'escalated_to_workshop' && ticket.school_resolution_note)) && (
        <section className="card p-5 bg-brand-gold/5 border-brand-gold/30">
          <h2 className="section-title mb-3">Briefing de l&apos;école</h2>
          {schoolCheckInspector && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm text-brand-ink">
              <span aria-hidden>👤</span>
              <span>Check effectué par <strong>{schoolCheckInspector}</strong></span>
            </div>
          )}
          {ticket.school_resolution === 'escalated_to_workshop' && ticket.school_resolution_note && (
            <p className="whitespace-pre-line text-sm text-brand-ink">{ticket.school_resolution_note}</p>
          )}
        </section>
      )}

      {/* Étapes séquentielles atelier */}
      <section className="card p-5">
        <h2 className="section-title mb-4">Étapes atelier</h2>
        <WorkshopStepPanel
          ticketId={ticket.id}
          status={ticket.status}
          wingReceivedWorkshopAt={ticket.wing_received_workshop_at}
          workshopDiagnosisAt={ticket.workshop_diagnosis_at}
          workshopRepairDoneAt={ticket.workshop_repair_done_at}
          wingReturnedAt={ticket.wing_returned_at}
        />
      </section>

      {/* Suivi global (timeline visuelle) */}
      <section className="card p-5">
        <h2 className="section-title mb-4">Suivi global</h2>
        <TicketTimeline status={ticket.status} />
      </section>

      {/* Bon de transport retour atelier → école/client — apparaît dès que la
          réparation est terminée. */}
      {shouldOfferReturnShipping && (
        <section className="card p-5">
          <h2 className="section-title mb-3">Bon de transport retour</h2>
          <p className="mb-4 text-sm text-slate-600">
            {ticket.workshop_return_label_url
              ? "Étiquette GLS retour prête — collez-la sur le colis avant expédition."
              : "Générez l'étiquette pour renvoyer l'aile à l'école partenaire ou directement au client."}
          </p>
          <ShippingLabelButton
            ticketId={ticket.id}
            leg="workshop_to_return"
            initialTracking={ticket.workshop_return_tracking}
            initialLabelUrl={ticket.workshop_return_label_url}
            defaultReturnDestination={returnDest}
          />
        </section>
      )}
    </>
  )

  // ── Onglet 2 : Diagnostic (travail technique sur l'aile) ─────────────────
  // Fusionne les trois anciens emplacements en une seule vue cohérente :
  // contexte client + checklist technique + saisie diagnostic (source unique).
  const diagnosticTab = (
    <>
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

      {/* Description initiale du client */}
      {ticket.description && (
        <section className="card p-5">
          <h2 className="section-title mb-3">Demande</h2>
          <p className="whitespace-pre-line text-sm leading-relaxed text-brand-ink">{ticket.description}</p>
        </section>
      )}

      {/* Checklist technique atelier */}
      <section className="card p-5">
        <h2 className="section-title mb-3">Checklist diagnostic technique</h2>
        <DiagnosisChecklist
          ticketId={ticket.id}
          items={WORKSHOP_TECHNICAL_CHECKLIST}
          initialChecked={initialChecked}
          initialNotes={initialNotes}
          saveAction={saveWorkshopChecklistAction}
          variant="navy"
          hideNotes
        />
      </section>

      {/* Saisie diagnostic — notes / heures / coût / pièces. Toujours édit,
          pré-rempli avec les valeurs sauvegardées. Source unique de vérité :
          plus de carte récap séparée en double affichage. */}
      <section className="card p-5">
        <h2 className="section-title mb-3">Diagnostic technique</h2>
        <WorkshopActionBar
          ticketId={ticket.id}
          diagnosisNotes={ticket.diagnosis_notes}
          estimatedCost={ticket.estimated_cost}
          estimatedHours={ticket.estimated_hours}
          partsNeeded={ticket.parts_needed}
        />
      </section>
    </>
  )

  // ── Onglet 3 : Messages — canaux Client / École (+ note admin Plume) ─────
  // Spotlight doré du premier message client + photos client en tête du canal
  // "Avec le client" — calqué sur le pattern école.
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

  const workshopChannels: TicketChannel[] = [
    {
      id:         'client',
      label:      'Avec le client',
      emoji:      '👤',
      visibility: 'all',
      excludeInternal:    true,
      excludeMessageIds:  firstClientMessage ? [firstClientMessage.id] : undefined,
      composer: {
        senderRole:      'workshop',
        visibilityLevel: 'all',
        placeholder:     'Mise à jour, demande de précision au client…',
        submitLabel:     'Envoyer au client',
        helperText:      "Visible par le client, l'école & Plume HQ",
      },
      spotlight: clientSpotlight,
      emptyText: firstClientMessage
        ? 'Pas encore de réponse — utilisez le composer ci-dessous pour répondre au client.'
        : 'Aucun message public sur ce ticket pour le moment.',
    },
    {
      id:         'school',
      label:      "Avec l'école",
      emoji:      '🏫',
      visibility: 'workshop_plume',
      composer: {
        senderRole:      'workshop',
        visibilityLevel: 'workshop_plume',
        placeholder:     "Diagnostic, devis, demande d'info à l'école…",
        submitLabel:     "Envoyer à l'école",
        helperText:      "Visible par l'école & Plume HQ — le client ne voit pas",
      },
      emptyText: "Aucun échange avec l'école pour le moment.",
    },
  ]

  const messagesTab = (
    <>
      <TicketChannelSwitch
        ticketId={ticket.id}
        messages={visibleMessages}
        channels={workshopChannels}
        ownRoles={['workshop']}
        showInternalBadge
      />
      {/* Composer Plume HQ — réservé aux plume_admin (vue support).
          Reste dans l'onglet Messages : c'est aussi de la messagerie, juste
          un canal privé admin que les autres rôles ne voient pas. */}
      {isPlumeAdmin && (
        <section className="mt-3">
          <PlumeNoteComposer ticketId={ticket.id} />
        </section>
      )}
    </>
  )

  return (
    <div className="min-h-screen">
      <header className="bg-brand-cream">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 pt-4 pb-2">
          <Link
            href="/workshop"
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
        {/* Banner urgent — en tête de page, AU-DESSUS des onglets pour rester
            visible quel que soit l'onglet sélectionné. */}
        {ticket.urgency_level === 2 && (
          <section className="flex items-center gap-3 rounded-card border-2 border-red-300 bg-red-50 px-4 py-3 shadow-sm">
            <span aria-hidden className="text-2xl">🚨</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700">Signalé comme urgent</p>
              <p className="text-xs text-red-700/80">Le client a marqué cette demande comme prioritaire.</p>
            </div>
          </section>
        )}

        <WorkshopTicketTabs
          state={stateTab}
          diagnostic={diagnosticTab}
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
