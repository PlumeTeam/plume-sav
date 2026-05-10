import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getWorkshopTicketDetail } from '@/features/tickets/queries'
import { markTicketReadByWorkshopAction } from '@/features/tickets/messages-actions-workshop'
import { getCurrentUserRoles } from '@/features/auth/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { TicketTimeline } from '@/features/tickets/components/TicketTimeline'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { PlumeNoteComposer } from '@/features/tickets/components/PlumeNoteComposer'
import { DiagnosisChecklist } from '@/features/tickets/components/DiagnosisChecklist'
import { WORKSHOP_TECHNICAL_CHECKLIST } from '@/features/tickets/constants'
import { saveWorkshopChecklistAction } from '@/features/tickets/actions'
import { formatDate } from '@/features/tickets/utils'
import { ShippingLabelButton } from '@/features/tickets/components/ShippingLabelButton'
import { WorkshopActionBar } from './WorkshopActionBar'
import { WorkshopStepPanel } from './WorkshopStepPanel'
import type { WorkshopReturnDestination } from '@/features/tickets/types'

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
  await markTicketReadByWorkshopAction(ticket.id)

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
  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`

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

        <section className="card p-5">
          <h2 className="section-title mb-4">Suivi global</h2>
          <TicketTimeline status={ticket.status} />
        </section>

        {/* Contexte de l'escalation école */}
        {ticket.school_resolution === 'escalated_to_workshop' && ticket.school_resolution_note && (
          <section className="card p-5 bg-brand-gold/5 border-brand-gold/30">
            <h2 className="section-title mb-2">Note de l&apos;école qui a escaladé</h2>
            <p className="whitespace-pre-line text-sm text-brand-ink">{ticket.school_resolution_note}</p>
          </section>
        )}

        {/* Expédition entrante école → atelier (P3) */}
        {(ticket.school_workshop_tracking || ticket.escalated_to_workshop_at) && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Expédition depuis l&apos;école</h2>
            <div className="space-y-2 text-sm">
              {ticket.escalated_to_workshop_at && (
                <p className="text-brand-ink">
                  <span className="text-xs text-slate-500">Escaladée le </span>
                  {formatDate(ticket.escalated_to_workshop_at)}
                </p>
              )}
              {ticket.school_workshop_tracking ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500">Tracking GLS :</span>
                  <span className="font-mono text-xs text-brand-ink">{ticket.school_workshop_tracking}</span>
                  <a
                    href={buildGlsTrackingUrl(ticket.school_workshop_tracking)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-brand-gold hover:underline"
                  >
                    Suivre →
                  </a>
                </div>
              ) : (
                <p className="text-xs text-slate-500">
                  L&apos;école n&apos;a pas encore généré de bon de transport pour ce ticket.
                </p>
              )}
              {ticket.wing_received_workshop_at && (
                <p className="text-xs text-emerald-700">
                  ✓ Aile réceptionnée le {formatDate(ticket.wing_received_workshop_at)}
                </p>
              )}
            </div>
          </section>
        )}

        {/* Checklist technique atelier — les notes vivent dans WorkshopActionBar (P2) */}
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

        {/* Bon de transport retour atelier → école/client */}
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

        <section className="card p-5">
          <h2 className="section-title mb-4">Actions atelier</h2>
          <WorkshopActionBar
            ticketId={ticket.id}
            diagnosisNotes={ticket.diagnosis_notes}
            estimatedCost={ticket.estimated_cost}
            estimatedHours={ticket.estimated_hours}
            partsNeeded={ticket.parts_needed}
          />
        </section>

        {(ticket.diagnosis_notes || ticket.estimated_cost != null) && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Diagnostic</h2>
            <div className="space-y-3">
              {ticket.diagnosis_notes && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-brand-ink">{ticket.diagnosis_notes}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {ticket.estimated_hours != null && (
                  <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-stone">
                    ⏱ {ticket.estimated_hours} h estimées
                  </span>
                )}
                {ticket.estimated_cost != null && (
                  <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-stone">
                    💰 {ticket.estimated_cost} € estimés
                  </span>
                )}
              </div>
              {ticket.parts_needed && (
                <p className="text-xs text-slate-500">Pièces : {ticket.parts_needed}</p>
              )}
            </div>
          </section>
        )}

        <section className="card p-5">
          <h2 className="section-title mb-3">Client</h2>
          <div className="space-y-2">
            <InfoRow label="Nom" value={[ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || '—'} />
            <InfoRow label="Email" value={ticket.email ?? '—'} />
            {ticket.phone && <InfoRow label="Téléphone" value={ticket.phone} />}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="section-title mb-3">Produit</h2>
          <div className="space-y-2">
            <InfoRow label="Marque / Modèle" value={`${ticket.product_brand ?? '—'} ${ticket.product_model ?? '—'}`} />
            <InfoRow label="N° de série" value={ticket.serial_number ?? '—'} mono />
            {ticket.purchase_date && <InfoRow label="Date d'achat" value={formatDate(ticket.purchase_date)} />}
          </div>
        </section>

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

        {ticket.ticket_photos.length > 0 && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Photos ({ticket.ticket_photos.length})</h2>
            <PhotoLightbox photos={ticket.ticket_photos} />
          </section>
        )}

        <section className="card p-5">
          <h2 className="section-title mb-4">Messages</h2>
          <CommentThread
            messages={visibleMessages}
            ownRoles={['workshop']}
            showInternalBadge
            emptyText="Aucun message."
          />
        </section>

        {/* Composer Plume HQ — réservé aux plume_admin (vue support). */}
        {isPlumeAdmin && (
          <section>
            <PlumeNoteComposer ticketId={ticket.id} />
          </section>
        )}
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
