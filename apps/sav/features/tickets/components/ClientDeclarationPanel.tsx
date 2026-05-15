import { PROBLEM_CATEGORIES, REQUEST_TYPE_CONFIG } from '@/features/tickets/types'
import { formatAge, formatDate, resolveWarrantyTierForDisplay } from '@/features/tickets/utils'
import { parseClientDescription } from '@/features/tickets/client-description'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { ClientHistorySummary, analyseClientHistory } from '@/features/tickets/components/ClientHistorySummary'
import { WarrantyTierBadge } from '@/features/tickets/components/WarrantyTierBadge'
import { RequestTypeBadge } from '@/features/tickets/components/RequestTypeBadge'
import {
  SEVERITY_BADGE,
  SEVERITY_DOT,
  VerdictBanner,
  type Severity,
} from '@/features/tickets/inspection/SeverityBlocks'
import type { TicketDetail, WarrantyTier } from '@/features/tickets/types'

// Fiche déclaration client exhaustive — vue unique partagée entre les 4
// dashboards (client / école / atelier vue Client / admin). On y rejoue
// TOUT ce que le pilote a saisi dans le wizard : type, problème, historique,
// aile, photos, coordonnées.
//
// Sections :
//   1. Bandeau verdict global (agrège historique + comportements + urgence)
//   2. Type de demande + garantie
//   3. Problème signalé (repair / manufacturing_defect) — catégorie, urgence,
//      description libre, comportements color-codés
//   4. Historique de l'aile (rows severity)
//   5. Aile concernée (opt-in)
//   6. Photos client (opt-in, défaut on)
//   7. Coordonnées client (opt-in)

interface ClientDeclarationPanelProps {
  ticket:              TicketDetail
  /** Affiche la carte "Aile concernée" (marque/taille/couleur/série/date)
   *  + badge garantie. Défaut : false (dashboards qui ont déjà une carte
   *  Produit à côté n'en veulent pas en double). */
  showWing?:           boolean
  /** Affiche les photos uploadées par le client. Défaut : true. */
  showPhotos?:         boolean
  /** Affiche les coordonnées client (nom + email + téléphone, liens directs).
   *  Défaut : false — pertinent côté école / atelier / admin. */
  showClientContact?:  boolean
}

// Sévérité par comportement signalé. La liste est le set fermé de
// BEHAVIOR_LABELS_BY_ID (cf. actions/_helpers.ts) — on map sur le libellé tel
// qu'écrit dans la description. Un libellé inconnu retombe en 'neutral' (gris)
// plutôt qu'en faux OK.
const BEHAVIOR_SEVERITY: Record<string, Severity> = {
  'Aile qui ne vole pas droit':         'red',
  'Aile trop fragile':                  'red',
  'Aile qui ferme facilement':          'red',
  'Aile instable en turbulence':        'red',
  'Aile trop paresseuse au gonflage':   'amber',
  'Problème de freins':                 'amber',
  'Vitesse anormale':                   'amber',
  'Autre comportement inhabituel':      'amber',
}

function severityForBehavior(label: string): Severity {
  return BEHAVIOR_SEVERITY[label.trim()] ?? 'neutral'
}

// Verdict global : pire signal rencontré, tous axes confondus (historique,
// comportements, urgence). 'neutral' signifie "rien à se mettre sous la dent",
// pas "OK".
const SEVERITY_RANK: Record<Severity, number> = {
  neutral: 0,
  green:   1,
  amber:   2,
  red:     3,
}

function maxSeverity(...s: Severity[]): Severity {
  return s.reduce((acc, cur) => (SEVERITY_RANK[cur] > SEVERITY_RANK[acc] ? cur : acc), 'neutral')
}

const VERDICT_LABEL: Record<Severity, string> = {
  red:     'Signaux critiques détectés',
  amber:   'Points de vigilance',
  green:   'Aucun signal préoccupant',
  neutral: 'Déclaration incomplète',
}

export function ClientDeclarationPanel({
  ticket,
  showWing          = false,
  showPhotos        = true,
  showClientContact = false,
}: ClientDeclarationPanelProps) {
  const parsed = parseClientDescription(ticket.description)
  const category = ticket.problem_category
    ? PROBLEM_CATEGORIES.find((c) => c.value === ticket.problem_category)
    : null
  const wingAge = formatAge(ticket.purchase_date)
  const sortedPhotos = [...ticket.ticket_photos].sort((a, b) => a.sort_order - b.sort_order)

  const ticketWarrantyTier = (ticket.warranty_tier as WarrantyTier | null) ?? null
  const displayWarrantyTier = resolveWarrantyTierForDisplay(ticketWarrantyTier, ticket.purchase_date)

  const clientName = [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || null

  const behaviorRows = parsed.behaviorList.map((label) => ({
    label,
    severity: severityForBehavior(label),
  }))

  const history = analyseClientHistory(parsed.history)
  const isUrgent = ticket.urgency_level === 2

  // Verdict global = max(historique, comportements, urgence).
  const behaviorVerdict: Severity = behaviorRows.length === 0
    ? 'neutral'
    : behaviorRows.some((b) => b.severity === 'red')   ? 'red'
    : behaviorRows.some((b) => b.severity === 'amber') ? 'amber'
    : behaviorRows.some((b) => b.severity === 'green') ? 'green'
    : 'neutral'

  const urgencyVerdict: Severity = isUrgent ? 'red' : 'neutral'

  const globalVerdict = maxSeverity(history.verdict, behaviorVerdict, urgencyVerdict)

  // Counts agrégés pour le bandeau — historique + comportements (l'urgence,
  // si rouge, est déjà reflétée par le verdict global mais on ne la compte pas
  // pour ne pas brouiller l'affichage des barres).
  const verdictCounts = {
    red:   history.counts.red   + behaviorRows.filter((b) => b.severity === 'red').length   + (isUrgent ? 1 : 0),
    amber: history.counts.amber + behaviorRows.filter((b) => b.severity === 'amber').length,
    green: history.counts.green + behaviorRows.filter((b) => b.severity === 'green').length,
  }

  const showProblemSection =
    ticket.request_type === 'repair' || ticket.request_type === 'manufacturing_defect'

  const requestTypeCfg = ticket.request_type ? REQUEST_TYPE_CONFIG[ticket.request_type] : null

  return (
    <div className="space-y-4">
      {/* 1. Bandeau verdict global. */}
      <VerdictBanner verdict={globalVerdict} label={VERDICT_LABEL[globalVerdict]} counts={verdictCounts} />

      {/* 2. Type de demande + garantie. */}
      <section className="rounded-2xl border border-brand-stone bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/70">
          Type de demande
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {ticket.request_type ? (
            <RequestTypeBadge type={ticket.request_type} />
          ) : (
            <span className="text-sm italic text-slate-500">Type non renseigné</span>
          )}
          <WarrantyTierBadge tier={displayWarrantyTier} size="sm" />
          {requestTypeCfg && (
            <span className="text-xs text-slate-500">{requestTypeCfg.description}</span>
          )}
        </div>
      </section>

      {/* 3. Problème signalé — uniquement pour réparation / défaut fab. Le
              contrôle (inspection) n'a pas de problème déclaré, on saute. */}
      {showProblemSection && (
        <section className="rounded-2xl border border-brand-stone bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/70">
            Problème signalé
          </p>

          {/* Badges catégorie + urgence. */}
          <div className="mt-3 flex flex-wrap gap-2">
            {category ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-stone">
                <span aria-hidden>{category.emoji}</span>
                {category.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                Catégorie non précisée
              </span>
            )}
            {isUrgent && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
                <span aria-hidden>🚨</span> Urgent
              </span>
            )}
          </div>

          {/* Description libre. */}
          <div className="mt-3">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Description du pilote
            </p>
            {parsed.freeText ? (
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-brand-ink">
                {parsed.freeText}
              </p>
            ) : (
              <p className="mt-1 text-sm italic text-slate-500">
                Le pilote n&apos;a pas rédigé de description libre.
              </p>
            )}
          </div>

          {/* Comportements signalés — chaque item avec son badge sévérité. */}
          {behaviorRows.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Comportements signalés ({behaviorRows.length})
              </p>
              <ul className="mt-2 space-y-1.5">
                {behaviorRows.map((b, i) => (
                  <li
                    key={`${b.label}-${i}`}
                    className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm ${SEVERITY_BADGE[b.severity]}`}
                  >
                    <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${SEVERITY_DOT[b.severity]}`} aria-hidden />
                    <span>{b.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* 4. Historique de l'aile — affiché pour les 3 types. Fallback si vide. */}
      {parsed.history.length > 0 ? (
        <ClientHistorySummary history={parsed.history} />
      ) : (
        <div className="rounded-2xl border border-dashed border-brand-stone bg-white p-4 text-center">
          <p className="text-sm text-slate-500">
            Le pilote n&apos;a pas renseigné d&apos;historique pour cette aile.
          </p>
        </div>
      )}

      {/* 5. Aile concernée — opt-in. Inclut badge garantie. */}
      {showWing && (
        <section className="rounded-2xl border border-brand-stone bg-white p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/70">
              Aile concernée
            </p>
            <WarrantyTierBadge tier={displayWarrantyTier} size="sm" compact />
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <Field
              label="Marque / Modèle"
              value={[ticket.product_brand, ticket.product_model].filter(Boolean).join(' ') || null}
            />
            <Field label="Taille" value={ticket.wing_size} />
            <Field label="Couleur" value={ticket.wing_color} />
            <Field label="N° de série" value={ticket.serial_number} mono />
            <Field
              label="Date d'achat"
              value={ticket.purchase_date
                ? `${formatDate(ticket.purchase_date)}${wingAge ? ` — ${wingAge}` : ''}`
                : null}
            />
            <Field
              label="Heures de vol (estim.)"
              value={ticket.flight_hours_estimate != null ? `${ticket.flight_hours_estimate} h` : null}
            />
          </dl>
        </section>
      )}

      {/* 6. Photos client. */}
      {showPhotos && (
        sortedPhotos.length > 0 ? (
          <section className="rounded-2xl border border-brand-stone bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-navy/70">
              Photos du client ({sortedPhotos.length})
            </p>
            <PhotoLightbox photos={sortedPhotos} />
          </section>
        ) : (
          <div className="rounded-2xl border border-dashed border-brand-stone bg-white p-4 text-center">
            <p className="text-sm text-slate-500">
              Le client n&apos;a pas joint de photo à sa demande.
            </p>
          </div>
        )
      )}

      {/* 7. Coordonnées client — liens directs tel/mailto. */}
      {showClientContact && (
        <section className="rounded-2xl border border-brand-stone bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-navy/70">
            Coordonnées du client
          </p>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
            <Field label="Nom" value={clientName} />
            <LinkField label="Email" href={ticket.email ? `mailto:${ticket.email}` : null} value={ticket.email} />
            <LinkField
              label="Téléphone"
              href={ticket.phone ? `tel:${ticket.phone.replace(/\s+/g, '')}` : null}
              value={ticket.phone}
            />
          </dl>
        </section>
      )}
    </div>
  )
}

// `null` collapse l'item entier — on n'affiche pas un dash pour les champs
// non renseignés (le pilote peut légitimement ignorer la taille ou la couleur).
function Field({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`text-sm text-brand-ink ${mono ? 'font-mono break-all' : ''}`}>{value}</dd>
    </div>
  )
}

function LinkField({ label, value, href }: { label: string; value: string | null; href: string | null }) {
  if (!value || !href) return null
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd>
        <a href={href} className="text-sm text-brand-gold hover:underline break-all">{value}</a>
      </dd>
    </div>
  )
}
