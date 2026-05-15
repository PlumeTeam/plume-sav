import {
  PROBLEM_CATEGORIES,
  REQUEST_TYPE_CONFIG,
  type TicketDetail,
  type WarrantyTier,
} from '@/features/tickets/types'
import {
  formatAge,
  formatDate,
  formatDateTime,
  resolveWarrantyTierForDisplay,
} from '@/features/tickets/utils'
import { parseClientDescription } from '@/features/tickets/client-description'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'

// Section repliable « Voir le rapport complet de la déclaration » : rejoue
// EXHAUSTIVEMENT tout ce que le pilote a saisi dans le wizard, dans un seul
// rapport plat. On accepte la duplication avec les cartes color-codées de
// ClientDeclarationPanel — c'est volontaire : la fiche principale donne un
// aperçu visuel, ce rapport sert à scanner toutes les infos en une seule vue
// (utile quand l'utilisateur cherche une donnée précise et ne sait plus
// dans quelle carte regarder).

const DELIVERY_METHOD_LABELS: Record<'in_person' | 'postal', string> = {
  in_person: 'En main propre',
  postal:    'Envoi postal',
}

const SCHOOL_CHANGE_REASON_LABELS: Record<string, string> = {
  school_closed: "L'école d'achat a fermé",
  moved_region:  'Le client a changé de région',
  relationship:  'Le client préfère une autre école',
  other:         'Autre raison (précisée par le client)',
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  overview:       "Vue d'ensemble",
  damage_closeup: 'Gros plan du dommage',
  serial_tag:     'Étiquette n° de série',
  other:          'Autre',
}

const WARRANTY_TIER_LABELS: Record<string, string> = {
  standard: 'Garantie standard',
  extended: 'Garantie étendue',
  expired:  'Hors garantie',
}

interface DeclarationFullDetailsProps {
  ticket:               TicketDetail
  level:                'business' | 'technical'
  schoolName?:          string | null
  referentSchoolName?:  string | null
}

export function DeclarationFullDetails({
  ticket,
  level,
  schoolName         = null,
  referentSchoolName = null,
}: DeclarationFullDetailsProps) {
  // Parsing de la description riche pliée par buildRichDescription au moment
  // de la création. On en sort le texte libre du pilote, les comportements
  // signalés, et l'historique aile (heures de vol, eau, neige, état, etc.).
  const parsed = parseClientDescription(ticket.description)

  // Premier message client = le `clientMessage` saisi au wizard à l'étape
  // « Message à l'école », posté à la création du ticket.
  const firstClientMessage = [...ticket.ticket_messages]
    .filter((m) => m.sender_role === 'client')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
    ?? null

  const clientName       = [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || null
  const ticketRefShort   = `#${ticket.id.slice(0, 8).toUpperCase()}`
  const sortedPhotos     = [...ticket.ticket_photos].sort((a, b) => a.sort_order - b.sort_order)
  const category         = ticket.problem_category
    ? PROBLEM_CATEGORIES.find((c) => c.value === ticket.problem_category)
    : null
  const requestTypeCfg   = ticket.request_type ? REQUEST_TYPE_CONFIG[ticket.request_type] : null
  const isUrgent         = ticket.urgency_level === 2
  const wingAge          = formatAge(ticket.purchase_date)
  const ticketTier       = (ticket.warranty_tier as WarrantyTier | null) ?? null
  const displayTier      = resolveWarrantyTierForDisplay(ticketTier, ticket.purchase_date)
  const showProblem      = ticket.request_type === 'repair' || ticket.request_type === 'manufacturing_defect'
  const schoolChanged    =
    !!ticket.referent_school_id &&
    !!ticket.school_id &&
    ticket.referent_school_id !== ticket.school_id

  const destinationLabel = ticket.assigned_workshop_label
    ? `Atelier — ${ticket.assigned_workshop_label}`
    : schoolName
      ? `École — ${schoolName}`
      : ticket.school_id
        ? 'École destinataire (nom non résolu)'
        : 'Non assigné'

  return (
    <details className="rounded-2xl border-2 border-brand-gold/40 bg-white open:border-brand-gold">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-cream">
        📋 Voir le rapport complet de la déclaration
      </summary>

      <div className="space-y-5 border-t border-brand-stone px-4 pb-5 pt-4">
        {/* ── 1. Pilote ──────────────────────────────────────────────────── */}
        <Section title="Pilote (auteur de la déclaration)">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <Field label="Nom"       value={clientName} />
            <Field label="Email"     value={ticket.email} />
            <Field label="Téléphone" value={ticket.phone} />
          </dl>
        </Section>

        {/* ── 2. Suivi SAV ──────────────────────────────────────────────── */}
        <Section title="Suivi SAV">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <Field label="Référence ticket" value={ticketRefShort} mono />
            <Field
              label="Numéro de réclamation"
              value={ticket.sav_claim_number != null ? `#${ticket.sav_claim_number}` : null}
            />
            <Field label="Date de création"     value={ticket.created_at ? formatDateTime(ticket.created_at) : null} />
            <Field label="Statut actuel"        value={ticket.status ?? null} mono />
            <Field
              label="Garantie au moment de la déclaration"
              value={displayTier ? WARRANTY_TIER_LABELS[displayTier] ?? displayTier : null}
            />
            <Field
              label="Expiration de la garantie"
              value={ticket.warranty_expires_at ? formatDate(ticket.warranty_expires_at) : null}
            />
          </dl>
        </Section>

        {/* ── 3. Type de demande ────────────────────────────────────────── */}
        <Section title="Type de demande">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <Field
              label="Type"
              value={requestTypeCfg ? `${requestTypeCfg.emoji} ${requestTypeCfg.label}` : null}
            />
            <Field
              label="Niveau d'urgence"
              value={isUrgent ? '🚨 Urgent' : 'Normal'}
            />
            {requestTypeCfg && (
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">Description du type</dt>
                <dd className="text-sm text-brand-ink">{requestTypeCfg.description}</dd>
              </div>
            )}
          </dl>
        </Section>

        {/* ── 4. Aile concernée ─────────────────────────────────────────── */}
        <Section title="Aile concernée">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <Field label="Marque"          value={ticket.product_brand} />
            <Field label="Modèle"          value={ticket.product_model} />
            <Field label="Taille"          value={ticket.wing_size} />
            <Field label="Couleur"         value={ticket.wing_color} />
            <Field label="N° de série"     value={ticket.serial_number} mono />
            <Field
              label="Date d'achat"
              value={ticket.purchase_date
                ? `${formatDate(ticket.purchase_date)}${wingAge ? ` — ${wingAge}` : ''}`
                : null}
            />
            <Field
              label="Heures de vol estimées"
              value={ticket.flight_hours_estimate != null ? `${ticket.flight_hours_estimate} h` : null}
            />
          </dl>
        </Section>

        {/* ── 5. Problème signalé (repair / defect uniquement) ──────────── */}
        {showProblem && (
          <Section title="Problème signalé par le pilote">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              <Field
                label="Catégorie du problème"
                value={category ? `${category.emoji} ${category.label}` : null}
              />
              <Field
                label="Niveau d'urgence"
                value={isUrgent ? '🚨 Urgent' : 'Normal'}
              />
            </dl>

            <div className="mt-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Description rédigée par le pilote
              </p>
              {parsed.freeText ? (
                <p className="mt-1 whitespace-pre-line rounded-xl bg-brand-cream/40 p-3 text-sm leading-relaxed text-brand-ink">
                  {parsed.freeText}
                </p>
              ) : (
                <p className="mt-1 text-sm italic text-slate-500">
                  Le pilote n&apos;a pas rédigé de description libre.
                </p>
              )}
            </div>

            {parsed.behaviorList.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Comportements signalés ({parsed.behaviorList.length})
                </p>
                <ul className="mt-1 list-disc pl-5 text-sm text-brand-ink">
                  {parsed.behaviorList.map((label, i) => (
                    <li key={`${label}-${i}`}>{label}</li>
                  ))}
                </ul>
              </div>
            )}
          </Section>
        )}

        {/* ── 6. Historique de l'aile (saisi au wizard) ─────────────────── */}
        <Section title="Historique de l'aile">
          {parsed.history.length > 0 ? (
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
              {parsed.history.map(({ label, value }, i) => (
                <Field key={`${label}-${i}`} label={label} value={value} />
              ))}
            </dl>
          ) : (
            <p className="text-sm italic text-slate-500">
              Le pilote n&apos;a pas renseigné d&apos;historique pour cette aile
              (heures de vol, contact eau / sable / neige, état général…).
            </p>
          )}
        </Section>

        {/* ── 7. Photos du pilote — visuel + étiquetage ─────────────────── */}
        <Section title={`Photos jointes${sortedPhotos.length > 0 ? ` (${sortedPhotos.length})` : ''}`}>
          {sortedPhotos.length > 0 ? (
            <>
              <PhotoLightbox photos={sortedPhotos} />
              <ul className="mt-3 space-y-1 text-sm text-brand-ink">
                {sortedPhotos.map((p, i) => (
                  <li key={p.id} className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-xs text-slate-500">#{i + 1}</span>
                    <span className="font-medium">
                      {PHOTO_TYPE_LABELS[p.photo_type] ?? p.photo_type}
                    </span>
                    {p.caption && (
                      <span className="italic text-slate-500">— {p.caption}</span>
                    )}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm italic text-slate-500">
              Le pilote n&apos;a pas joint de photo à sa demande.
            </p>
          )}
        </Section>

        {/* ── 8. Routage de la demande ──────────────────────────────────── */}
        <Section title="Routage de la demande">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <Field label="Destinataire" value={destinationLabel} />
            <Field
              label="Méthode de livraison"
              value={
                ticket.delivery_method
                  ? DELIVERY_METHOD_LABELS[ticket.delivery_method] ?? ticket.delivery_method
                  : null
              }
            />
            {ticket.assigned_workshop_label && ticket.workshop_assigned_at && (
              <Field
                label="Atelier assigné le"
                value={formatDateTime(ticket.workshop_assigned_at)}
              />
            )}
          </dl>

          {schoolChanged && (
            <div className="mt-3 rounded-xl bg-amber-50 p-3 ring-1 ring-amber-200">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-900">
                ⚠️ Changement d&apos;école par rapport à l&apos;achat
              </p>
              <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <Field
                  label="École d'achat (référente)"
                  value={referentSchoolName ?? '(nom non résolu)'}
                />
                <Field
                  label="Raison du changement"
                  value={
                    ticket.school_change_reason_code
                      ? SCHOOL_CHANGE_REASON_LABELS[ticket.school_change_reason_code]
                        ?? ticket.school_change_reason_code
                      : null
                  }
                />
                {ticket.school_change_reason_note && (
                  <div className="sm:col-span-2">
                    <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Précision laissée par le client
                    </dt>
                    <dd className="text-sm italic text-brand-ink">
                      « {ticket.school_change_reason_note} »
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          )}
        </Section>

        {/* ── 9. Message du client à la création ────────────────────────── */}
        <Section title="Message du pilote à la création">
          {firstClientMessage && firstClientMessage.content ? (
            <blockquote className="whitespace-pre-line rounded-xl border-l-4 border-brand-gold bg-brand-cream/40 px-3 py-2 text-sm italic text-brand-ink">
              {firstClientMessage.content}
            </blockquote>
          ) : (
            <p className="text-sm italic text-slate-500">
              Le pilote n&apos;a pas laissé de message à la création du ticket.
            </p>
          )}
        </Section>

        {/* ── 10. Bloc technique — staff uniquement ─────────────────────── */}
        {level === 'technical' && (
          <>
            <Section title="Identifiants techniques (support)">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2">
                <Field label="UUID du ticket"          value={ticket.id}                                       mono />
                <Field label="UUID client"             value={ticket.client_id ?? ticket.user_id ?? null}      mono />
                <Field label="UUID école destinataire" value={ticket.school_id ?? null}                        mono />
                <Field label="UUID école référente"    value={ticket.referent_school_id ?? null}               mono />
                <Field label="UUID atelier"            value={ticket.assigned_workshop_id ?? null}             mono />
                <Field label="service_type (DB)"       value={ticket.service_type ?? null}                     mono />
                <Field label="request_type (DB)"       value={ticket.request_type ?? null}                     mono />
                <Field label="status (DB)"             value={ticket.status ?? null}                           mono />
              </dl>
            </Section>

            <Section title="Description brute (avant parsing wizard)">
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-700">
                {ticket.description || '(vide)'}
              </pre>
            </Section>

            <Section title="Horodatages (ISO)">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <Field label="created_at"             value={ticket.created_at ?? null}             mono />
                <Field label="updated_at"             value={ticket.updated_at ?? null}             mono />
                <Field label="school_acknowledged_at" value={ticket.school_acknowledged_at ?? null} mono />
                <Field label="workshop_assigned_at"   value={ticket.workshop_assigned_at ?? null}   mono />
              </dl>
            </Section>
          </>
        )}
      </div>
    </details>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 border-b border-brand-stone pb-1 text-[11px] font-semibold uppercase tracking-wider text-brand-navy/70">
        {title}
      </h4>
      {children}
    </section>
  )
}

// `null` collapse l'item entier — cohérent avec ClientDeclarationPanel.
function Field({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`text-sm text-brand-ink ${mono ? 'font-mono break-all' : ''}`}>{value}</dd>
    </div>
  )
}
