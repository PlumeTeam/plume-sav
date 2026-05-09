import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTicketDetail, getPartnerSchoolById } from '@/features/tickets/queries'
import { ShippingLabelButton } from '@/features/tickets/components/ShippingLabelButton'
import type { ClientShippingAddress } from '@/features/tickets/types'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

// Mirrors the parser used on the ticket detail page — pulls the JSONB address
// out of the row so ShippingLabelButton can skip the address form when it's
// already been captured on a previous label generation for this ticket.
function readClientShippingAddress(raw: unknown): ClientShippingAddress | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.street !== 'string' || typeof r.postalCode !== 'string') return null
  if (typeof r.city !== 'string' || typeof r.country !== 'string') return null
  return {
    street:     r.street,
    postalCode: r.postalCode,
    city:       r.city,
    country:    r.country,
  }
}

export default async function TicketCreatedPage({ params }: PageProps) {
  const ticket = await getTicketDetail(params.id)
  if (!ticket) notFound()

  const school = ticket.referent_school_id
    ? await getPartnerSchoolById(ticket.referent_school_id)
    : null

  const isPostal   = ticket.delivery_method === 'postal'
  const ticketRef  = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
  const schoolName = school?.name ?? 'Votre école partenaire'
  const cityRegion = [school?.city, school?.region].filter(Boolean).join(' · ')

  const initialClientAddress = readClientShippingAddress(ticket.client_shipping_address)

  return (
    <main className="mx-auto max-w-2xl space-y-5 px-4 py-8">
      {/* ── Hero / Confirmation ─────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-brand-ink px-5 py-7 text-white shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
          ✓ Demande envoyée
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">
          Votre école a été prévenue
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-white/90">
          {isPostal ? (
            <>
              <strong>{schoolName}</strong> a reçu votre demande SAV. Avant
              d&apos;expédier votre aile, contactez-la (coordonnées ci-dessous)
              pour confirmer l&apos;adresse et lui annoncer l&apos;envoi.
            </>
          ) : (
            <>
              <strong>{schoolName}</strong> a reçu votre demande SAV.{' '}
              <strong className="text-white">Contactez-la pour convenir d&apos;un
              rendez-vous</strong> avant de vous déplacer — l&apos;équipe n&apos;est
              pas forcément sur place sans prévenir.
            </>
          )}
        </p>

        <p className="mt-4 font-mono text-[11px] text-white/60">
          Référence&nbsp;: {ticketRef}
        </p>
      </section>

      {/* ── Coordonnées école — gros et au-dessus ───────────────── */}
      {school && (school.phone || school.email) && (
        <section className="card p-5">
          <h2 className="section-title mb-3">Contacter votre école</h2>
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-3xl">🏫</span>
            <div className="min-w-0 flex-1">
              <p className="text-base font-semibold text-brand-ink">{school.name}</p>
              {cityRegion && (
                <p className="mt-0.5 text-xs text-slate-500">{cityRegion}</p>
              )}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {school.phone && (
              <a
                href={`tel:${school.phone.replace(/\s+/g, '')}`}
                className="btn-primary justify-start gap-3 normal-case tracking-normal"
              >
                <span aria-hidden className="text-base">📞</span>
                <span className="truncate text-sm font-semibold">{school.phone}</span>
              </a>
            )}
            {school.email && (
              <a
                href={`mailto:${school.email}?subject=SAV%20${encodeURIComponent(ticketRef)}`}
                className="btn-secondary justify-start gap-3 normal-case tracking-normal"
              >
                <span aria-hidden className="text-base">✉️</span>
                <span className="truncate text-sm font-semibold">{school.email}</span>
              </a>
            )}
          </div>
        </section>
      )}

      {school && !school.phone && !school.email && (
        <section className="card border-amber-300 bg-amber-50/60 p-4">
          <p className="text-sm text-amber-800">
            ⚠️ Les coordonnées de <strong>{school.name}</strong> ne sont pas encore
            renseignées. L&apos;école vous contactera dès qu&apos;elle aura traité
            votre demande.
          </p>
        </section>
      )}

      {/* ── Adresse postale (mode postal uniquement) ────────────── */}
      {isPostal && school?.address && (
        <section className="card p-5">
          <h2 className="section-title mb-3">Adresse d&apos;envoi</h2>
          <div className="flex items-start gap-3">
            <span aria-hidden className="text-2xl">📍</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-brand-ink">{school.name}</p>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                {school.address}
              </p>
            </div>
          </div>
        </section>
      )}
      {isPostal && school && !school.address && (
        <section className="card border-amber-300 bg-amber-50/60 p-4">
          <p className="text-sm text-amber-800">
            ⚠️ L&apos;adresse postale de l&apos;école n&apos;est pas encore
            enregistrée. Appelez-la ou écrivez-lui (coordonnées ci-dessus) pour la
            confirmer avant d&apos;envoyer le colis.
          </p>
        </section>
      )}

      {/* ── Bon de transport GLS (postal uniquement) ────────────── */}
      {isPostal && (
        <section className="card p-5">
          <h2 className="section-title mb-3">Bon de transport GLS</h2>
          <p className="mb-4 text-sm text-slate-600">
            {ticket.client_school_label_url
              ? "Votre bon de transport est prêt — téléchargez-le et collez-le sur votre colis."
              : "Générez votre bon de transport GLS prépayé. Le coût est pris en charge par Plume."}
          </p>
          <ShippingLabelButton
            ticketId={ticket.id}
            leg="client_to_school"
            initialTracking={ticket.client_school_tracking}
            initialLabelUrl={ticket.client_school_label_url}
            initialAddress={initialClientAddress}
            autoApproved={ticket.auto_approved_shipping !== false}
          />
        </section>
      )}

      {/* ── Postal mode: shipping checklist ─────────────────────── */}
      {isPostal && (
        <section className="card p-5">
          <h2 className="section-title mb-3">Avant d&apos;expédier</h2>
          <ul className="space-y-2 text-sm text-brand-ink">
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5">📦</span>
              <span>
                Emballez soigneusement votre aile dans son sac d&apos;origine ou un
                sac rembourré. Évitez de la compresser inutilement.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5">🔢</span>
              <span>
                Utilisez un transporteur avec suivi (Colissimo, Chronopost, Mondial Relay…)
                et conservez précieusement le numéro de suivi.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5">💬</span>
              <span>
                Communiquez le numéro de suivi à l&apos;école via la messagerie de
                la demande dès que le colis est expédié.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5">🛡️</span>
              <span>
                Pensez à assurer le colis selon la valeur de votre aile.
              </span>
            </li>
          </ul>
        </section>
      )}

      {/* ── Et ensuite ? (postal uniquement) — vue d'ensemble du process ── */}
      {isPostal && (
        <section className="rounded-card border border-brand-stone bg-brand-cream p-5">
          <h2 className="section-title mb-3">Et ensuite ?</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-brand-ink marker:font-semibold marker:text-brand-gold">
            <li>Envoyez votre aile à l&apos;adresse ci-dessus.</li>
            <li>Communiquez le numéro de suivi à votre école via la messagerie de votre demande.</li>
            <li>Votre école réceptionnera et inspectera votre aile.</li>
            <li>Vous serez tenu informé de l&apos;avancement à chaque étape par email.</li>
            <li>Une fois le problème résolu, votre aile vous sera retournée.</li>
          </ol>
        </section>
      )}

      {/* ── In-person mode: scheduling reminder ─────────────────── */}
      {!isPostal && (
        <section className="card p-5">
          <h2 className="section-title mb-3">Prochaines étapes</h2>
          <ul className="space-y-2 text-sm text-brand-ink">
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5">📞</span>
              <span>
                Appelez ou écrivez à l&apos;école <strong>avant de vous déplacer</strong>{' '}
                pour convenir d&apos;un créneau de dépôt.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5">🎒</span>
              <span>
                Apportez votre aile dans son sac d&apos;origine si possible.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5">💬</span>
              <span>
                L&apos;école vous recontactera après inspection via la messagerie
                de la demande.
              </span>
            </li>
          </ul>
        </section>
      )}

      {/* ── Navigation ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href={`/client/ticket/${ticket.id}`}
          className="btn-secondary flex-1"
        >
          Voir ma demande
        </Link>
        <Link href="/client" className="btn-secondary flex-1">
          Retour à mes demandes
        </Link>
      </div>
    </main>
  )
}
