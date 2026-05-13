import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPartnerSchoolById, getPlumeSettings, getWorkshopTicketDetail } from '@/features/tickets/queries'
import { markTicketReadByWorkshopAction } from '@/features/tickets/messages-actions-workshop'
import { markTicketReadByPlumeAction } from '@/features/tickets/messages-actions-plume'
import { getCurrentUser, getCurrentUserRoles } from '@/features/auth/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { ClientJourneyTimeline } from '@/features/tickets/components/ClientJourneyTimeline'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { PlumeNoteComposer } from '@/features/tickets/components/PlumeNoteComposer'
import { WorkshopChannelTabs } from '@/features/tickets/components/WorkshopChannelTabs'
import { readSchoolCheckInspector, readSchoolCheckPayload } from '@/features/tickets/inspection/steps'
import { SchoolCheckSummary } from '@/features/tickets/inspection/SchoolCheckSummary'
import { DiagnosisChecklist } from '@/features/tickets/components/DiagnosisChecklist'
import { WORKSHOP_TECHNICAL_CHECKLIST } from '@/features/tickets/constants'
import { saveWorkshopChecklistAction } from '@/features/tickets/actions'
import { formatDate, formatDateTime } from '@/features/tickets/utils'
import { ShippingLabelButton } from '@/features/tickets/components/ShippingLabelButton'
import { CloseTicketButton } from '@/features/tickets/components/CloseTicketButton'
import { TicketClosureCard } from '@/features/tickets/components/TicketClosureCard'
import { WorkshopActionBar } from './WorkshopActionBar'
import { WorkshopStepPanel } from './WorkshopStepPanel'
import { WorkshopTicketTabs } from './WorkshopTicketTabs'
import { DiagnosticViewSwitcher } from './DiagnosticViewSwitcher'
import { PROBLEM_CATEGORIES } from '@/features/tickets/types'
import type { CloserRole, ClosureOutcome, TicketMessage, WarrantyStatus, WorkshopDecision, WorkshopReturnDestination } from '@/features/tickets/types'

// Garantie : 2 ans à compter de la date d'achat (politique Plume Paragliders).
// Retourne null si on n'a pas la date — l'UI doit alors masquer le badge.
const WARRANTY_YEARS = 2

function computeWarranty(purchaseDate: string | null): {
  status: 'active' | 'expired'
  endDate: Date
  daysRemaining: number
} | null {
  if (!purchaseDate) return null
  const start = new Date(purchaseDate)
  if (Number.isNaN(start.getTime())) return null
  const end = new Date(start)
  end.setFullYear(end.getFullYear() + WARRANTY_YEARS)
  const now = new Date()
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return {
    status:        daysRemaining > 0 ? 'active' : 'expired',
    endDate:       end,
    daysRemaining,
  }
}

// Lien public de suivi GLS — accepte tout numéro de tracking en query param.
function buildGlsTrackingUrl(tracking: string): string {
  return `https://gls-group.com/track/${encodeURIComponent(tracking)}`
}

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

type ChecklistJson = { checkedIds?: string[]; notes?: string | null } | null

export default async function WorkshopTicketDetailPage({ params }: PageProps) {
  const [ticket, currentRoles, currentUser, plumeSettings] = await Promise.all([
    getWorkshopTicketDetail(params.id),
    getCurrentUserRoles(),
    getCurrentUser(),
    getPlumeSettings(),
  ])
  if (!ticket) notFound()

  // Best-effort: mark this ticket as read for the current workshop user.
  // The RPC checks role + assignment server-side.
  // Plume admins use this view too — markPlume is no-op for non-admins.
  await Promise.all([
    markTicketReadByWorkshopAction(ticket.id),
    markTicketReadByPlumeAction(ticket.id),
  ])

  // École qui traite le ticket = client direct de l'atelier. Best-effort —
  // si l'id est absent ou la table partner_schools indisponible, on masque
  // simplement la section dans la vue.
  const school = ticket.school_id ? await getPartnerSchoolById(ticket.school_id) : null

  const isPlumeAdmin = currentRoles.includes('plume_admin')

  // T3 — Côté atelier on n'utilise plus visibility_level mais le canal
  // explicite (school_client, client_workshop, workshop_school, group,
  // workshop_plume). school_client est inclus en lecture seule
  // (transparence — l'atelier consulte sans intervenir). La RLS de la
  // migration 20260512010000 garantit que l'atelier ne voit que ce qu'il
  // doit voir ; on filtre juste sur "channel posé" pour exclure les
  // anciens messages legacy.
  const channelMessages = ticket.ticket_messages.filter((m) => m.channel)

  // Premier message du client (posté à la création du ticket, canal
  // 'school_client'). Hissé hors du thread pour apparaître en spotlight
  // doré en tête de l'onglet Messages — c'est la voix du pilote, le
  // contexte le plus important quand l'atelier ouvre le ticket.
  const firstClientMessage: TicketMessage | null =
    channelMessages
      .filter((m) => m.sender_role === 'client' && !m.is_internal)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0] ?? null

  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`

  // Nom du moniteur qui a effectué le check côté école — exposé à l'atelier
  // pour la traçabilité de l'escalade.
  const schoolCheckInspector = readSchoolCheckInspector(ticket.school_checklist)
  // Payload V2 du check école — on n'affiche le résumé color-codé que si on a
  // un payload structuré. Les anciens checks (notes en clair) tombent en null.
  const schoolCheckPayload = readSchoolCheckPayload(ticket.school_checklist)

  // Garantie aile = 2 ans à compter de purchase_date. Null si la date n'a pas
  // été remplie au moment de la demande.
  const warranty = computeWarranty(ticket.purchase_date)

  // Nom client formaté (prénom + nom) ou fallback.
  const clientName = [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || '—'

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

  const isClosed     = !!ticket.closed_at
  // L'atelier peut clôturer dès qu'il a quelque chose à conclure : check
  // diagnostic posé, ou réparation en cours. Avant ça, c'est prématuré.
  const canCloseFromWorkshop =
    !isClosed && [
      'wing_received_workshop',
      'workshop_diagnosing',
      'workshop_repairing',
      'workshop_done',
      'wing_returned',
    ].includes(ticket.status)
  const closerRole: CloserRole = isPlumeAdmin ? 'plume_admin' : 'workshop'

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
        {/* Banner urgence — sorti de la section Demande pour rester visible
            quel que soit l'onglet actif. */}
        {ticket.urgency_level === 2 && (
          <p className="rounded-2xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            🚨 Signalé comme urgent
          </p>
        )}

        <WorkshopTicketTabs
          messagesCount={channelMessages.length}
          state={
            <>
              <TicketClosureCard
                closedAt={ticket.closed_at}
                closedByRole={ticket.closed_by_role as CloserRole | null}
                closureOutcome={ticket.closure_outcome as ClosureOutcome | null}
                closureNote={ticket.closure_note}
              />

              {/* Banner livraison école → atelier (amber). Apparaît dès qu'un
                  ticket est escaladé : si l'école a généré un bon de transport,
                  on signale l'envoi par transporteur + tracking ; sinon on
                  suppose une remise en main propre. */}
              {ticket.escalated_to_workshop_at && (
                <section className="card flex items-start gap-3 p-4 border-2 border-amber-200 bg-amber-50">
                  <span aria-hidden className="text-2xl">
                    {ticket.school_workshop_tracking ? '📦' : '🤝'}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">
                      {ticket.school_workshop_tracking
                        ? "L'école envoie l'aile par transporteur"
                        : "L'école dépose l'aile en main propre"}
                    </p>
                    {ticket.school_workshop_tracking ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2 break-all rounded-xl bg-white/60 px-3 py-1.5 text-[11px] text-amber-900">
                        <span>Tracking GLS&nbsp;:</span>
                        <span className="font-mono">{ticket.school_workshop_tracking}</span>
                        <a
                          href={buildGlsTrackingUrl(ticket.school_workshop_tracking)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-amber-900 underline hover:no-underline"
                        >
                          Suivre →
                        </a>
                      </div>
                    ) : (
                      <p className="mt-0.5 text-xs text-amber-800/80">
                        L&apos;école vous contactera pour convenir d&apos;un rendez-vous.
                      </p>
                    )}
                  </div>
                </section>
              )}

              {/* Briefing école — remonté en tête : check structuré + note libre
                  d'escalade, c'est ce que l'atelier doit lire d'abord. */}
              {schoolCheckPayload && (
                <section className="card p-5">
                  <h2 className="section-title mb-3">Check de l&apos;école</h2>
                  <SchoolCheckSummary raw={ticket.school_checklist} />
                </section>
              )}

              {ticket.school_resolution === 'escalated_to_workshop' && ticket.school_resolution_note && (
                <section className="card p-5 bg-brand-gold/5 border-brand-gold/30">
                  <h2 className="section-title mb-3">Note d&apos;escalade de l&apos;école</h2>
                  {schoolCheckInspector && !schoolCheckPayload && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm text-brand-ink">
                      <span aria-hidden>👤</span>
                      <span>Check effectué par <strong>{schoolCheckInspector}</strong></span>
                    </div>
                  )}
                  <p className="whitespace-pre-line text-sm text-brand-ink">{ticket.school_resolution_note}</p>
                </section>
              )}

              <section className="card p-5">
                <h2 className="section-title mb-4">Étapes atelier</h2>
                <WorkshopStepPanel
                  ticketId={ticket.id}
                  status={ticket.status}
                  wingSerial={ticket.serial_number ?? null}
                  wingReceivedWorkshopAt={ticket.wing_received_workshop_at}
                  preCheckStartedAt={ticket.pre_check_started_at}
                  preCheckCompletedAt={ticket.pre_check_completed_at}
                  preCheckFeeEurConfig={plumeSettings.preCheckFeeEur}
                  workshopDiagnosisAt={ticket.workshop_diagnosis_at}
                  workshopRepairDoneAt={ticket.workshop_repair_done_at}
                  wingReturnedAt={ticket.wing_returned_at}
                  workshopDecision={ticket.workshop_decision as WorkshopDecision | null}
                  workshopDecisionAt={ticket.workshop_decision_at}
                  workshopEstimatedRepairCost={
                    ticket.workshop_estimated_repair_cost != null
                      ? Number(ticket.workshop_estimated_repair_cost)
                      : null
                  }
                  workshopDecisionWarrantyStatus={ticket.workshop_decision_warranty_status as WarrantyStatus | null}
                  workshopDecisionNote={ticket.workshop_decision_note}
                  repairReplacementThresholdEur={plumeSettings.repairReplacementThresholdEur}
                />
              </section>

              <section className="card p-5">
                <h2 className="section-title mb-4">Suivi global</h2>
                <ClientJourneyTimeline ticket={ticket} />
              </section>

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

              {/* École partenaire — client direct de l'atelier. Affichée d'abord car
                  c'est l'interlocuteur quotidien du technicien. */}
              <section className="card p-5">
                <h2 className="section-title mb-3">École partenaire</h2>
                {school ? (
                  <div className="space-y-2">
                    <InfoRow label="Nom" value={school.name || '—'} />
                    {(school.city || school.region) && (
                      <InfoRow
                        label="Localisation"
                        value={[school.city, school.region].filter(Boolean).join(' · ') || '—'}
                      />
                    )}
                    {school.email && (
                      <InfoRowLink label="Email" value={school.email} href={`mailto:${school.email}`} />
                    )}
                    {school.phone && (
                      <InfoRowLink label="Téléphone" value={school.phone} href={`tel:${school.phone.replace(/\s+/g, '')}`} />
                    )}
                    {school.address && (
                      <div className="pt-1">
                        <p className="mb-1 text-xs text-slate-500">Adresse</p>
                        <p className="whitespace-pre-line text-right text-sm text-brand-ink">{school.address}</p>
                      </div>
                    )}
                  </div>
                ) : ticket.assigned_workshop_label ? (
                  <p className="text-sm text-slate-500">
                    École rattachée non disponible — atelier assigné&nbsp;: {ticket.assigned_workshop_label}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">École non renseignée sur ce ticket.</p>
                )}
              </section>

              <section className="card p-5">
                <h2 className="section-title mb-3">Client final (pilote)</h2>
                <div className="space-y-2">
                  <InfoRow label="Nom" value={clientName} />
                  {ticket.email && (
                    <InfoRowLink label="Email" value={ticket.email} href={`mailto:${ticket.email}`} />
                  )}
                  {ticket.phone && (
                    <InfoRowLink label="Téléphone" value={ticket.phone} href={`tel:${ticket.phone.replace(/\s+/g, '')}`} />
                  )}
                </div>
              </section>

              <section className="card p-5">
                <h2 className="section-title mb-3">Aile</h2>
                <div className="space-y-2">
                  <InfoRow label="Marque / Modèle" value={`${ticket.product_brand ?? '—'} ${ticket.product_model ?? '—'}`} />
                  {ticket.wing_size && <InfoRow label="Taille" value={ticket.wing_size} />}
                  <InfoRow label="N° de série" value={ticket.serial_number ?? '—'} mono />
                  {ticket.purchase_date && <InfoRow label="Date d'achat" value={formatDate(ticket.purchase_date)} />}
                  {warranty && (
                    <div className="flex items-start justify-between gap-4 pt-1">
                      <p className="flex-shrink-0 text-xs text-slate-500">Garantie</p>
                      <WarrantyBadge warranty={warranty} />
                    </div>
                  )}
                </div>
              </section>

              <section className="card p-5">
                <h2 className="section-title mb-3">Demande</h2>
                {ticket.description && (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-brand-ink">{ticket.description}</p>
                )}
              </section>

              {ticket.ticket_photos.length > 0 && (
                <section className="card p-5">
                  <h2 className="section-title mb-3">Photos ({ticket.ticket_photos.length})</h2>
                  <PhotoLightbox photos={ticket.ticket_photos} />
                </section>
              )}
            </>
          }
          diagnostic={
            <DiagnosticViewSwitcher
              workshop={
                <>
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

                  {/* Diagnostic technicien — saisie + récap fusionnés. Le composer
                      messages a été retiré : la messagerie passe par l'onglet
                      Messages uniquement. */}
                  <section className="card p-5">
                    <h2 className="section-title mb-4">Diagnostic technicien</h2>
                    <WorkshopActionBar
                      ticketId={ticket.id}
                      diagnosisNotes={ticket.diagnosis_notes}
                      estimatedCost={ticket.estimated_cost}
                      estimatedHours={ticket.estimated_hours}
                      partsNeeded={ticket.parts_needed}
                    />
                    {(canCloseFromWorkshop || isPlumeAdmin) && (
                      <div className="mt-4 border-t border-brand-stone/40 pt-4">
                        <p className="mb-2 text-xs text-slate-500">
                          Quand le SAV est terminé : déclarez le statut final pour clôturer le ticket.
                        </p>
                        <CloseTicketButton
                          ticketId={ticket.id}
                          ticketRef={ticketRef}
                          closerRole={closerRole}
                          variant="ghost"
                        />
                      </div>
                    )}
                  </section>

                  {/* Pré-check : trace des observations + tarif figé (facturé à Plume) */}
                  {ticket.pre_check_observations && (
                    <section className="card p-5">
                      <h2 className="section-title mb-3">Pré-check</h2>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-brand-ink">
                        {ticket.pre_check_observations}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {ticket.pre_check_fee_eur != null && (
                          <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-stone">
                            💰 {ticket.pre_check_fee_eur} € facturés à Plume
                          </span>
                        )}
                        {ticket.pre_check_started_at && ticket.pre_check_completed_at && (
                          <span className="rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-stone">
                            ⏱ {formatDate(ticket.pre_check_started_at)}
                            {' → '}
                            {formatDate(ticket.pre_check_completed_at)}
                          </span>
                        )}
                      </div>
                    </section>
                  )}
                </>
              }
              school={
                <>
                  {/* Check structuré école (V2) — code couleur vert/jaune/rouge
                      + photos par item embarquées dans SchoolCheckSummary. */}
                  {schoolCheckPayload ? (
                    <section className="card p-5">
                      <h2 className="section-title mb-3">Check de l&apos;école</h2>
                      {schoolCheckInspector && (
                        <div className="mb-3 flex items-center gap-2 rounded-xl bg-brand-cream/60 px-3 py-2 text-sm text-brand-ink">
                          <span aria-hidden>👤</span>
                          <span>Check effectué par <strong>{schoolCheckInspector}</strong></span>
                        </div>
                      )}
                      <SchoolCheckSummary raw={ticket.school_checklist} />
                    </section>
                  ) : (
                    <section className="card border-dashed p-4 text-center">
                      <p className="text-sm text-slate-500">
                        L&apos;école n&apos;a pas encore renseigné de check structuré pour ce ticket.
                      </p>
                    </section>
                  )}

                  {/* Note libre d'escalade — complète le check, surtout utile
                      sur les anciens tickets sans payload V2. */}
                  {ticket.school_resolution === 'escalated_to_workshop' && ticket.school_resolution_note && (
                    <section className="card p-5 bg-brand-gold/5 border-brand-gold/30">
                      <h2 className="section-title mb-3">Note d&apos;escalade de l&apos;école</h2>
                      <p className="whitespace-pre-line text-sm text-brand-ink">{ticket.school_resolution_note}</p>
                    </section>
                  )}
                </>
              }
              client={
                <>
                  {/* Déclaration initiale — texte fourni par le pilote au wizard.
                      Inclut souvent l'historique de l'aile (water, sand, hours…)
                      replié dans la description par createTicketAction. */}
                  <section className="card p-5">
                    <h2 className="section-title mb-3">Déclaration du client</h2>
                    <div className="mb-3 flex flex-wrap gap-2">
                      {ticket.problem_category && (() => {
                        const cat = PROBLEM_CATEGORIES.find((c) => c.value === ticket.problem_category)
                        return (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-stone">
                            <span aria-hidden>{cat?.emoji ?? '🛠️'}</span>
                            {cat?.label ?? ticket.problem_category}
                          </span>
                        )
                      })()}
                      {ticket.urgency_level === 2 && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
                          🚨 Urgent
                        </span>
                      )}
                    </div>
                    {ticket.description ? (
                      <p className="whitespace-pre-line text-sm leading-relaxed text-brand-ink">
                        {ticket.description}
                      </p>
                    ) : (
                      <p className="text-sm italic text-slate-500">Aucune description fournie.</p>
                    )}
                  </section>

                  {/* Photos uploadées par le client à la création du ticket. */}
                  {ticket.ticket_photos.length > 0 ? (
                    <section className="card p-5">
                      <h2 className="section-title mb-3">
                        Photos du client ({ticket.ticket_photos.length})
                      </h2>
                      <PhotoLightbox photos={ticket.ticket_photos} />
                    </section>
                  ) : (
                    <section className="card border-dashed p-4 text-center">
                      <p className="text-sm text-slate-500">
                        Le client n&apos;a pas joint de photo à sa demande.
                      </p>
                    </section>
                  )}
                </>
              }
            />
          }
          messages={
            <>
              {/* Spotlight doré : voix du pilote (message à la création) — calque
                  la convention école. Précède toujours les canaux. */}
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

              {/* Photos du client juste après le spotlight — contexte visuel
                  pour le diagnostic atelier. */}
              {ticket.ticket_photos.length > 0 && (
                <section className="card p-5">
                  <h2 className="section-title mb-3">
                    Photos du client ({ticket.ticket_photos.length})
                  </h2>
                  <PhotoLightbox photos={ticket.ticket_photos} />
                </section>
              )}

              <section>
                {currentUser && (
                  <WorkshopChannelTabs
                    ticketId={ticket.id}
                    messages={channelMessages}
                    currentUserId={currentUser.id}
                  />
                )}
              </section>

              {/* Composer Plume HQ legacy — réservé aux plume_admin (vue support).
                  Conservé pour les notes hors-canal (visibility_level). */}
              {isPlumeAdmin && (
                <section>
                  <PlumeNoteComposer ticketId={ticket.id} />
                </section>
              )}
            </>
          }
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

function InfoRowLink({ label, value, href }: { label: string; value: string; href: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="flex-shrink-0 text-xs text-slate-500">{label}</p>
      <a
        href={href}
        className="break-all text-right text-sm font-medium text-brand-gold hover:underline"
      >
        {value}
      </a>
    </div>
  )
}

function WarrantyBadge({ warranty }: { warranty: { status: 'active' | 'expired'; endDate: Date; daysRemaining: number } }) {
  const isActive = warranty.status === 'active'
  const isExpiringSoon = isActive && warranty.daysRemaining <= 60

  const classes = isExpiringSoon
    ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-200'
    : isActive
      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
      : 'bg-red-50 text-red-700 ring-1 ring-red-200'

  const dotClass = isExpiringSoon ? 'bg-amber-500' : isActive ? 'bg-emerald-500' : 'bg-red-500'
  const endDateLabel = warranty.endDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })

  const label = isActive
    ? isExpiringSoon
      ? `Sous garantie — expire dans ${warranty.daysRemaining} j`
      : `Sous garantie — jusqu'au ${endDateLabel}`
    : `Hors garantie — expirée le ${endDateLabel}`

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden />
      {label}
    </span>
  )
}
