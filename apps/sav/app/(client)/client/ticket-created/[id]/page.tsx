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
          <strong>{schoolName}</strong> a reçu votre demande SAV.
        </p>

        <p className="mt-4 font-mono text-[11px] text-white/60">
          Référence&nbsp;: {ticketRef}
        </p>
      </section>

      {/* ── Prochaine étape (bloc bien visible) ─────────────────── */}
      <section className="rounded-card border-2 border-brand-gold bg-brand-gold/10 p-5 shadow-plume">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-ink">
          👉 Prochaine étape
        </p>
        {isPostal ? (
          <p className="text-sm leading-relaxed text-brand-ink">
            <strong>{schoolName}</strong> va effectuer un pré-check de votre
            demande à partir des informations renseignées en ligne. Une fois
            ce pré-check validé, l&apos;école débloquera la possibilité pour
            vous de générer un bon de transport.{' '}
            <strong>Vous serez notifié dès que l&apos;école aura validé.</strong>
          </p>
        ) : (
          <p className="text-sm leading-relaxed text-brand-ink">
            <strong>Contactez votre école</strong> pour fixer un rendez-vous
            afin de déposer votre aile. Cela permet de s&apos;assurer que
            l&apos;école sera ouverte au moment de votre venue.
          </p>
        )}
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
            requireScan
            wingSerial={ticket.serial_number ?? null}
          />
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
