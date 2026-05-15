import type { TicketDetail } from '@/features/tickets/types'
import { formatDate, formatDateTime } from '@/features/tickets/utils'

// Section "Détails complets" repliable au pied de ClientDeclarationPanel.
// Affiche TOUT ce qu'on a sur le ticket et qui ne tient pas dans la fiche
// principale (routage, livraison, message client, étiquetage photos), avec un
// bloc supplémentaire « technique » (UUID, description brute, timestamps)
// réservé aux dashboards staff (école / atelier / admin).

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

interface DeclarationFullDetailsProps {
  ticket:               TicketDetail
  /** 'business' = champs métier lisibles uniquement (utile côté client).
   *  'technical' = + UUID, description brute, timestamps ISO (staff). */
  level:                'business' | 'technical'
  /** Nom de l'école destinataire (résolu côté server depuis partner_schools).
   *  Null si non résolu ou si le ticket est routé directement vers un atelier. */
  schoolName?:          string | null
  /** Nom de l'école référente (école d'achat de l'aile). Affichée uniquement
   *  si différente de l'école destinataire. */
  referentSchoolName?:  string | null
}

export function DeclarationFullDetails({
  ticket,
  level,
  schoolName         = null,
  referentSchoolName = null,
}: DeclarationFullDetailsProps) {
  // Premier message émis par le client — c'est le `clientMessage` saisi à
  // l'étape "Message à l'école" du wizard, posté à la création du ticket.
  const firstClientMessage = [...ticket.ticket_messages]
    .filter((m) => m.sender_role === 'client')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())[0]
    ?? null

  const ticketRefShort = `#${ticket.id.slice(0, 8).toUpperCase()}`
  const sortedPhotos = [...ticket.ticket_photos].sort((a, b) => a.sort_order - b.sort_order)

  // École destinataire ≠ école référente d'achat → changement de référent
  // au moment de la déclaration. La section "raison" n'a de sens que dans
  // ce cas.
  const schoolChanged =
    !!ticket.referent_school_id &&
    !!ticket.school_id &&
    ticket.referent_school_id !== ticket.school_id

  // Libellé du destinataire effectif. assigned_workshop_label est stocké
  // figé en colonne (cf. creation.ts) — pas besoin de join.
  const destinationLabel = ticket.assigned_workshop_label
    ? `Atelier — ${ticket.assigned_workshop_label}`
    : schoolName
      ? `École — ${schoolName}`
      : ticket.school_id
        ? 'École destinataire (nom non résolu)'
        : 'Non assigné'

  return (
    <details className="rounded-2xl border border-brand-stone bg-white">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-brand-navy hover:bg-brand-cream">
        Voir tous les détails de la déclaration
      </summary>

      <div className="space-y-4 border-t border-brand-stone px-4 pb-4 pt-4">
        {/* ── 1. Suivi SAV ──────────────────────────────────────────────── */}
        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Suivi SAV
          </h4>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <Field label="Référence ticket" value={ticketRefShort} mono />
            <Field
              label="Numéro de réclamation"
              value={ticket.sav_claim_number != null ? `#${ticket.sav_claim_number}` : null}
            />
            <Field
              label="Date de création"
              value={ticket.created_at ? formatDateTime(ticket.created_at) : null}
            />
            <Field
              label="Expiration de la garantie"
              value={ticket.warranty_expires_at ? formatDate(ticket.warranty_expires_at) : null}
            />
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
        </section>

        {/* ── 2. Changement d'école — uniquement si pertinent ───────────── */}
        {schoolChanged && (
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Changement d&apos;école par rapport à l&apos;achat
            </h4>
            <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
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
          </section>
        )}

        {/* ── 3. Message du client à la création ─────────────────────────── */}
        {firstClientMessage && firstClientMessage.content && (
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Message laissé par le client à la création
            </h4>
            <blockquote className="whitespace-pre-line rounded-xl border-l-4 border-brand-gold bg-brand-cream/40 px-3 py-2 text-sm italic text-brand-ink">
              {firstClientMessage.content}
            </blockquote>
          </section>
        )}

        {/* ── 4. Étiquetage des photos ──────────────────────────────────── */}
        {sortedPhotos.length > 0 && (
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Étiquetage des photos ({sortedPhotos.length})
            </h4>
            <ul className="space-y-1 text-sm text-brand-ink">
              {sortedPhotos.map((p, i) => (
                <li key={p.id} className="flex flex-wrap items-baseline gap-2">
                  <span className="font-mono text-xs text-slate-500">#{i + 1}</span>
                  <span className="font-medium">
                    {PHOTO_TYPE_LABELS[p.photo_type] ?? p.photo_type}
                  </span>
                  {p.caption && <span className="italic text-slate-500">— {p.caption}</span>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── 5. Bloc technique réservé aux dashboards staff ────────────── */}
        {level === 'technical' && (
          <>
            <section>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Identifiants techniques
              </h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2">
                <Field label="UUID du ticket" value={ticket.id} mono />
                <Field label="UUID client" value={ticket.client_id ?? ticket.user_id ?? null} mono />
                <Field label="UUID école destinataire" value={ticket.school_id ?? null} mono />
                <Field label="UUID école référente" value={ticket.referent_school_id ?? null} mono />
                <Field label="UUID atelier" value={ticket.assigned_workshop_id ?? null} mono />
                <Field label="service_type (DB)" value={ticket.service_type ?? null} mono />
                <Field label="request_type (DB)" value={ticket.request_type ?? null} mono />
                <Field label="status (DB)" value={ticket.status ?? null} mono />
              </dl>
            </section>

            <section>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Description brute (avant parsing wizard)
              </h4>
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-mono text-slate-700">
                {ticket.description || '(vide)'}
              </pre>
            </section>

            <section>
              <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Horodatages (ISO)
              </h4>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <Field label="created_at"             value={ticket.created_at ?? null} mono />
                <Field label="updated_at"             value={ticket.updated_at ?? null} mono />
                <Field label="school_acknowledged_at" value={ticket.school_acknowledged_at ?? null} mono />
                <Field label="workshop_assigned_at"   value={ticket.workshop_assigned_at ?? null} mono />
              </dl>
            </section>
          </>
        )}
      </div>
    </details>
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
