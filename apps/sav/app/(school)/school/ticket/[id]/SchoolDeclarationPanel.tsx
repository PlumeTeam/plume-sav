import { ClientHistorySummary } from '@/app/(workshop)/workshop/ticket/[id]/ClientHistorySummary'
import { parseClientDescription } from '@/app/(workshop)/workshop/ticket/[id]/parseClientDescription'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { WarrantyTierBadge } from '@/features/tickets/components/WarrantyTierBadge'
import { PROBLEM_CATEGORIES } from '@/features/tickets/types'
import { formatAge, formatDate, resolveWarrantyTierForDisplay } from '@/features/tickets/utils'
import type { TicketDetail, WarrantyTier } from '@/features/tickets/types'

// Réutilise les helpers de la vue "Client" du workshop pour garantir que
// l'école et l'atelier voient *exactement* la même déclaration (verdict +
// historique + problème signalé + aile + photos). Les deux pages partagent
// les atomes SeverityBlocks via ClientHistorySummary.

interface SchoolDeclarationPanelProps {
  ticket: TicketDetail
}

/**
 * Onglet "Déclaration" côté école — calque la mise en page de la vue Client
 * du DiagnosticViewSwitcher atelier :
 *   1. Bandeau verdict global (vert/jaune/rouge) si historique disponible
 *   2. Problème signalé : badges catégorie + urgence + texte libre + comportements
 *   3. Aile concernée : grille label/valeur (modèle, taille, série, garantie…)
 *   4. Photos client avec lightbox (ou empty state)
 *   5. Coordonnées client (email/téléphone)
 */
export function SchoolDeclarationPanel({ ticket }: SchoolDeclarationPanelProps) {
  const parsed = parseClientDescription(ticket.description)
  const category = ticket.problem_category
    ? PROBLEM_CATEGORIES.find((c) => c.value === ticket.problem_category)
    : null

  const ticketWarrantyTier = (ticket.warranty_tier as WarrantyTier | null) ?? null
  const displayWarrantyTier = resolveWarrantyTierForDisplay(ticketWarrantyTier, ticket.purchase_date)
  const wingAge = formatAge(ticket.purchase_date)

  const clientName = [ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || null

  return (
    <div className="space-y-4">
      {/* 1. Verdict global — vert/jaune/rouge sur l'historique aile.
          Empty state si le pilote n'a rien renseigné. */}
      {parsed.history.length > 0 ? (
        <ClientHistorySummary history={parsed.history} />
      ) : (
        <div className="rounded-2xl border border-dashed border-brand-stone bg-white p-4 text-center">
          <p className="text-sm text-slate-500">
            Le pilote n&apos;a pas renseigné d&apos;historique pour cette aile.
          </p>
        </div>
      )}

      {/* 2. Problème signalé — badges catégorie + urgence + description libre. */}
      <section className="rounded-2xl border border-brand-stone bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/70">
          Problème signalé
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {category && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-cream px-3 py-1 text-xs font-medium text-brand-navy ring-1 ring-brand-stone">
              <span aria-hidden>{category.emoji}</span>
              {category.label}
            </span>
          )}
          {ticket.urgency_level === 2 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-red-200">
              🚨 Urgent
            </span>
          )}
          {!category && ticket.urgency_level !== 2 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              Aucune catégorie renseignée
            </span>
          )}
        </div>
        <div className="mt-3">
          {parsed.freeText ? (
            <p className="whitespace-pre-line text-sm leading-relaxed text-brand-ink">
              {parsed.freeText}
            </p>
          ) : (
            <p className="text-sm italic text-slate-500">
              Le pilote n&apos;a pas rédigé de description libre.
            </p>
          )}
        </div>
        {parsed.behaviors && (
          <div className="mt-3 rounded-xl bg-brand-cream/60 px-3 py-2">
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
              Comportements signalés
            </p>
            <p className="mt-1 text-sm text-brand-ink">{parsed.behaviors}</p>
          </div>
        )}
      </section>

      {/* 3. Aile concernée — modèle / taille / série / garantie. */}
      <section className="rounded-2xl border border-brand-stone bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-navy/70">
            Aile concernée
          </p>
          <WarrantyTierBadge tier={displayWarrantyTier} size="sm" compact />
        </div>
        <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <DeclarationField
            label="Marque / Modèle"
            value={[ticket.product_brand, ticket.product_model].filter(Boolean).join(' ') || null}
          />
          <DeclarationField label="Taille" value={ticket.wing_size} />
          <DeclarationField label="Couleur" value={ticket.wing_color} />
          <DeclarationField label="N° de série" value={ticket.serial_number} mono />
          <DeclarationField
            label="Date d'achat"
            value={ticket.purchase_date
              ? `${formatDate(ticket.purchase_date)}${wingAge ? ` — ${wingAge}` : ''}`
              : null}
          />
          <DeclarationField
            label="Heures de vol (estim.)"
            value={ticket.flight_hours_estimate != null ? `${ticket.flight_hours_estimate} h` : null}
          />
        </dl>
      </section>

      {/* 4. Photos jointes par le client — lightbox ou empty state. */}
      {ticket.ticket_photos.length > 0 ? (
        <section className="rounded-2xl border border-brand-stone bg-white p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-navy/70">
            Photos du client ({ticket.ticket_photos.length})
          </p>
          <PhotoLightbox photos={ticket.ticket_photos} />
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-brand-stone bg-white p-4 text-center">
          <p className="text-sm text-slate-500">
            Le client n&apos;a pas joint de photo à sa demande.
          </p>
        </div>
      )}

      {/* 5. Coordonnées client — utiles pour rappeler / écrire en parallèle
          de la messagerie. Liens directs tel/mailto. */}
      <section className="rounded-2xl border border-brand-stone bg-white p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-navy/70">
          Coordonnées du client
        </p>
        <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
          <DeclarationField label="Nom" value={clientName} />
          <DeclarationLink label="Email" href={ticket.email ? `mailto:${ticket.email}` : null} value={ticket.email} />
          <DeclarationLink
            label="Téléphone"
            href={ticket.phone ? `tel:${ticket.phone.replace(/\s+/g, '')}` : null}
            value={ticket.phone}
          />
        </dl>
      </section>
    </div>
  )
}

// `null` collapse l'item entier — on n'affiche pas un dash pour les champs
// non renseignés (le pilote peut légitimement ignorer la taille ou la couleur).
function DeclarationField({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className={`text-sm text-brand-ink ${mono ? 'font-mono break-all' : ''}`}>{value}</dd>
    </div>
  )
}

function DeclarationLink({ label, value, href }: { label: string; value: string | null; href: string | null }) {
  if (!value || !href) return null
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd>
        <a href={href} className="text-sm text-brand-gold hover:underline">{value}</a>
      </dd>
    </div>
  )
}
