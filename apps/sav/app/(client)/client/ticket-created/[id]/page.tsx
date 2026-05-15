import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTicketDetail, getPartnerSchoolById } from '@/features/tickets/queries'
import { WarrantyTierBadge } from '@/features/tickets/components/WarrantyTierBadge'
import type { WarrantyTier } from '@/features/tickets/types'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

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
  const tier: WarrantyTier = (ticket.warranty_tier as WarrantyTier | null) ?? 'out_of_warranty'

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

      {/* ── Tier de garantie ────────────────────────────────────── */}
      <section className="card flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Garantie de votre aile
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {tier === 'standard' && 'Tout est pris en charge par Plume.'}
            {tier === 'extended' && 'Couverture partielle — transport client→école à votre charge.'}
            {tier === 'out_of_warranty' && 'Transport et réparation à votre charge.'}
            {tier === 'plume_override' && 'Prise en charge exceptionnelle Plume HQ.'}
          </p>
        </div>
        <WarrantyTierBadge tier={tier} size="sm" compact />
      </section>

      {/* ── Prochaine étape — bloc d'action proéminent ───────────── */}
      <section className="rounded-card border-2 border-brand-gold bg-brand-gold/10 p-5 shadow-plume">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-ink">
          👉 Prochaine étape
        </p>
        {tier === 'out_of_warranty' ? (
          <p className="text-base leading-relaxed text-brand-ink">
            <strong>{schoolName}</strong> va recevoir votre demande et
            transmettre votre aile à un atelier partenaire pour devis. Le
            transport et la réparation sont à votre charge — vous validerez
            le devis avant toute intervention.
          </p>
        ) : tier === 'extended' ? (
          <p className="text-base leading-relaxed text-brand-ink">
            <strong>{schoolName}</strong> va effectuer un pré-check de votre
            demande. <strong>Le transport client → école est à votre charge ;</strong>
            {' '}la suite (atelier, réparation) est prise en charge par Plume
            selon la politique de garantie étendue.
          </p>
        ) : isPostal ? (
          <p className="text-base leading-relaxed text-brand-ink">
            <strong>{schoolName}</strong> va effectuer un pré-check de votre
            demande à partir des informations renseignées en ligne. Une fois
            ce pré-check validé, l&apos;école débloquera la possibilité pour
            vous de générer un bon de transport, qui vous permettra
            d&apos;envoyer l&apos;aile à l&apos;école pour vérification.{' '}
            <strong>Vous serez notifié dès que l&apos;école aura validé.</strong>
          </p>
        ) : (
          <p className="text-base leading-relaxed text-brand-ink">
            <strong>Contactez votre école</strong> pour fixer un rendez-vous
            afin de déposer votre aile. Cela permet de s&apos;assurer que
            l&apos;école sera ouverte au moment de votre venue.
          </p>
        )}
      </section>

      {tier === 'out_of_warranty' && (
        <section className="card border-brand-stone bg-brand-cream p-5">
          <p className="text-sm font-semibold text-brand-ink">Facturation</p>
          <p className="mt-1.5 text-sm leading-relaxed text-brand-ink/80">
            La facture de l&apos;atelier vous sera transmise directement via la
            messagerie du ticket. Le paiement se fait entre vous et l&apos;atelier.
          </p>
        </section>
      )}

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
