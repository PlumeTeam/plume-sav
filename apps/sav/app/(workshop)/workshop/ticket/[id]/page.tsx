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
import { WorkshopDiagnosticChecklist } from '@/features/tickets/components/WorkshopDiagnosticChecklist'
import { readWorkshopChecklist } from '@/features/tickets/workshop-checklist'
import { formatAge, formatDate, formatDateTime, resolveWarrantyTierForDisplay } from '@/features/tickets/utils'
import { WarrantyTierBadge } from '@/features/tickets/components/WarrantyTierBadge'
import { ShippingLabelButton } from '@/features/tickets/components/ShippingLabelButton'
import { CloseTicketButton } from '@/features/tickets/components/CloseTicketButton'
import { TicketClosureCard } from '@/features/tickets/components/TicketClosureCard'
import { RevisionReportUploader } from '@/features/tickets/components/RevisionReportUploader'
import { WorkshopActionBar } from './WorkshopActionBar'
import { WorkshopStepPanel } from './WorkshopStepPanel'
import { WorkshopTicketTabs } from './WorkshopTicketTabs'
import { DiagnosticViewSwitcher } from './DiagnosticViewSwitcher'
import { ClientDeclarationPanel } from '@/features/tickets/components/ClientDeclarationPanel'
import type { CloserRole, ClosureOutcome, TicketMessage, WarrantyStatus, WarrantyTier, WorkshopDecision, WorkshopReturnDestination } from '@/features/tickets/types'

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
  // Tier 4-niveaux (cohérent avec le reste du SAV). Respecte warranty_tier
  // figé sur le ticket, sinon retombe sur le calcul purchase_date.
  const ticketWarrantyTier = resolveWarrantyTierForDisplay(ticket.warranty_tier, ticket.purchase_date)
  const wingAge = formatAge(ticket.purchase_date)

  // Nom client formaté (prénom + nom) ou fallback.
  const clientName = [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || '—'

  // Checklist diagnostic atelier — payload v2 (6 sections) lu depuis
  // workshop_checklist. Si l'ancien payload v1 est encore stocké, on
  // retourne un état vide v2 (l'atelier ressaisit). Le user connecté
  // pré-alimente le champ inspecteur (email à défaut d'un nom).
  const workshopChecklistPayload = readWorkshopChecklist(ticket.workshop_checklist)
  const inspectorDefaultName     = currentUser?.email ?? ''

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
          <div className="flex flex-col items-end gap-1 sm:flex-row sm:items-center sm:gap-2">
            <WarrantyTierBadge tier={ticketWarrantyTier} size="sm" compact />
            <StatusBadge status={ticket.status} size="sm" />
          </div>
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

        {/* Bandeau d'info compact — regroupe les 4 contextes que le technicien
            consulte le plus souvent (expédition, école, client, aile). Reste
            au-dessus des onglets pour rester accessible quelle que soit la vue. */}
        <section className="card grid grid-cols-1 gap-x-5 gap-y-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* ─── Expédition ─────────────────────────────────────────────── */}
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Expédition
            </p>
            {ticket.school_workshop_tracking ? (
              <div className="space-y-0.5 text-sm text-brand-ink">
                <p className="flex items-center gap-1.5">
                  <span aria-hidden>📦</span>
                  <span>Transporteur GLS</span>
                </p>
                <p className="break-all font-mono text-[11px] text-slate-500">
                  {ticket.school_workshop_tracking}
                </p>
                <a
                  href={buildGlsTrackingUrl(ticket.school_workshop_tracking)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs font-medium text-brand-gold hover:underline"
                >
                  Suivre →
                </a>
                {ticket.wing_received_workshop_at && (
                  <p className="text-[11px] text-emerald-700">
                    ✓ Reçue le {formatDate(ticket.wing_received_workshop_at)}
                  </p>
                )}
              </div>
            ) : ticket.escalated_to_workshop_at ? (
              <div className="space-y-0.5 text-sm text-brand-ink">
                <p className="flex items-center gap-1.5">
                  <span aria-hidden>🤝</span>
                  <span>Remise en main propre</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  Escaladée le {formatDate(ticket.escalated_to_workshop_at)}
                </p>
                {ticket.wing_received_workshop_at && (
                  <p className="text-[11px] text-emerald-700">
                    ✓ Reçue le {formatDate(ticket.wing_received_workshop_at)}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm italic text-slate-500">Pas encore escaladée</p>
            )}
          </div>

          {/* ─── École partenaire ───────────────────────────────────────── */}
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              École
            </p>
            {school ? (
              <div className="space-y-0.5 text-sm text-brand-ink">
                <p className="truncate font-medium">{school.name}</p>
                {(school.city || school.region) && (
                  <p className="truncate text-[11px] text-slate-500">
                    {[school.city, school.region].filter(Boolean).join(' · ')}
                  </p>
                )}
                {school.email && (
                  <a
                    href={`mailto:${school.email}`}
                    className="block truncate text-[11px] text-brand-gold hover:underline"
                  >
                    {school.email}
                  </a>
                )}
                {school.phone && (
                  <a
                    href={`tel:${school.phone.replace(/\s+/g, '')}`}
                    className="block truncate text-[11px] text-brand-gold hover:underline"
                  >
                    {school.phone}
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm italic text-slate-500">Non renseignée</p>
            )}
          </div>

          {/* ─── Client final ──────────────────────────────────────────── */}
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Client
            </p>
            <div className="space-y-0.5 text-sm text-brand-ink">
              <p className="truncate font-medium">{clientName}</p>
              {ticket.email && (
                <a
                  href={`mailto:${ticket.email}`}
                  className="block truncate text-[11px] text-brand-gold hover:underline"
                >
                  {ticket.email}
                </a>
              )}
              {ticket.phone && (
                <a
                  href={`tel:${ticket.phone.replace(/\s+/g, '')}`}
                  className="block truncate text-[11px] text-brand-gold hover:underline"
                >
                  {ticket.phone}
                </a>
              )}
            </div>
          </div>

          {/* ─── Aile ──────────────────────────────────────────────────── */}
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Aile
            </p>
            <div className="space-y-0.5 text-sm text-brand-ink">
              <p className="truncate font-medium">
                {[ticket.product_brand, ticket.product_model].filter(Boolean).join(' ') || '—'}
              </p>
              <p className="truncate text-[11px] text-slate-500">
                {[
                  ticket.wing_size && `Taille ${ticket.wing_size}`,
                  ticket.wing_color,
                ].filter(Boolean).join(' · ') || '—'}
              </p>
              {ticket.serial_number && (
                <p className="break-all font-mono text-[11px] text-slate-500">
                  S/N {ticket.serial_number}
                </p>
              )}
              {ticket.purchase_date && (
                <p className="text-[11px] text-slate-500">
                  Achetée le {formatDate(ticket.purchase_date)}
                  {wingAge && <span className="text-slate-400"> — {wingAge}</span>}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <WarrantyTierBadge tier={ticketWarrantyTier} size="sm" compact />
                {warranty && <WarrantyBadge warranty={warranty} />}
              </div>
            </div>
          </div>
        </section>

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

              {/* Note libre d'escalade école — info contenu, complémentaire
                  du Check structuré qui vit dans l'onglet Diagnostic > École. */}
              {ticket.school_resolution === 'escalated_to_workshop' && ticket.school_resolution_note && (
                <section className="card p-5 bg-brand-gold/5 border-brand-gold/30">
                  <h2 className="section-title mb-3">Note d&apos;escalade de l&apos;école</h2>
                  {schoolCheckInspector && !schoolCheckPayload && (
                    <div className="mb-3 flex items-center gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm text-brand-ink">
                      <span aria-hidden>👤</span>
                      <span>
                        Check effectué par <strong>{schoolCheckInspector}</strong>
                        {school?.name && (
                          <> de l&apos;école <strong>{school.name}</strong></>
                        )}
                      </span>
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
                  repairThresholdExtendedEur={plumeSettings.repairThresholdExtendedEur}
                  extendedCoversReplacement={plumeSettings.extendedCoversReplacement}
                  warrantyTier={(ticket.warranty_tier as WarrantyTier | null) ?? null}
                />
              </section>

              <section className="card p-5">
                <h2 className="section-title mb-4">Suivi global</h2>
                <ClientJourneyTimeline ticket={ticket} />
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
                  {/* Checklist diagnostic technique v2 — 6 sections inspirées
                      de la procédure AIRDESIGN, adaptées Plume. Accordéons,
                      code couleur, badge progression par section. */}
                  <section className="card p-5">
                    <h2 className="section-title mb-3">Checklist diagnostic technique</h2>
                    <WorkshopDiagnosticChecklist
                      ticketId={ticket.id}
                      initial={workshopChecklistPayload}
                      defaultInspectorName={inspectorDefaultName}
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

                  {/* Rapport de révision — uniquement pour les tickets dont le
                      client a demandé un contrôle/révision (request_type='inspection').
                      Le fichier est attaché au carnet d'entretien de l'aile via le ticket. */}
                  {ticket.request_type === 'inspection' && (
                    <section className="card p-5">
                      <h2 className="section-title mb-3">Rapport de révision</h2>
                      <p className="mb-4 text-sm text-slate-600">
                        Uploadez ici le rapport de contrôle/révision (PDF, image ou document).
                        Il sera attaché au carnet d&apos;entretien de l&apos;aile et visible
                        du client comme de Plume HQ.
                      </p>
                      <RevisionReportUploader
                        ticketId={ticket.id}
                        initialPath={ticket.revision_report_path}
                        initialFilename={ticket.revision_report_filename}
                        initialUploadedAt={ticket.revision_report_uploaded_at}
                      />
                    </section>
                  )}

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
                      {/* SchoolCheckSummary rend déjà la méta inspecteur+école+date
                          en interne — pas de bandeau header redondant ici. */}
                      <SchoolCheckSummary
                        raw={ticket.school_checklist}
                        schoolName={school?.name ?? null}
                      />
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
                <ClientDeclarationPanel ticket={ticket} showWing showPhotos />
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
