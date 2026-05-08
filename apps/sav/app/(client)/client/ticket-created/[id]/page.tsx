import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTicketDetail, getPartnerSchoolById } from '@/features/tickets/queries'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

export default async function TicketCreatedPage({ params }: PageProps) {
  const ticket = await getTicketDetail(params.id)
  if (!ticket) notFound()

  const school = ticket.referent_school_id
    ? await getPartnerSchoolById(ticket.referent_school_id)
    : null

  const isPostal = ticket.delivery_method === 'postal'
  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
  const schoolName = school?.name ?? 'Votre école partenaire'
  const cityRegion = [school?.city, school?.region].filter(Boolean).join(' · ')

  return (
    <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      {/* ── Hero / Confirmation ─────────────────────────────────── */}
      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-brand-ink px-5 py-7 text-white shadow-soft">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200">
          ✓ Demande créée
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold">
          {isPostal
            ? 'Votre demande SAV a bien été créée !'
            : 'Votre demande SAV a bien été créée !'}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/85">
          {isPostal ? (
            <>
              <strong>{schoolName}</strong> va réceptionner votre aile et reviendra
              vers vous une fois l&apos;analyse effectuée.
            </>
          ) : (
            <>
              Contactez <strong>{schoolName}</strong> pour convenir d&apos;un rendez-vous
              et déposer votre aile.
            </>
          )}
        </p>
        <p className="mt-3 font-mono text-[11px] text-white/60">
          Référence : {ticketRef}
        </p>
      </section>

      {/* ── School identity card ────────────────────────────────── */}
      {school && (
        <section className="card flex items-start gap-4 p-5">
          <span aria-hidden className="text-3xl">🏫</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-brand-ink">{school.name}</p>
            {cityRegion && <p className="mt-0.5 text-xs text-slate-500">{cityRegion}</p>}

            {/* Contact channels — only render the ones we actually have */}
            <div className="mt-3 space-y-1.5 text-sm">
              {school.phone && (
                <a
                  href={`tel:${school.phone.replace(/\s+/g, '')}`}
                  className="flex items-center gap-2 text-brand-ink hover:text-brand-coral"
                >
                  <span aria-hidden>📞</span>
                  <span>{school.phone}</span>
                </a>
              )}
              {school.email && (
                <a
                  href={`mailto:${school.email}?subject=SAV%20${encodeURIComponent(ticketRef)}`}
                  className="flex items-center gap-2 text-brand-ink hover:text-brand-coral"
                >
                  <span aria-hidden>✉️</span>
                  <span className="break-all">{school.email}</span>
                </a>
              )}
              {isPostal && school.address && (
                <p className="flex items-start gap-2 text-slate-700">
                  <span aria-hidden>📍</span>
                  <span className="whitespace-pre-line">{school.address}</span>
                </p>
              )}
            </div>
          </div>
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
                Communiquez le numéro de suivi à l&apos;école via la messagerie du
                ticket dès que le colis est expédié.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5">🛡️</span>
              <span>
                Pensez à assurer le colis selon la valeur de votre aile.
              </span>
            </li>
            {!school?.address && (
              <li className="flex items-start gap-2 text-slate-600">
                <span aria-hidden className="mt-0.5">⚠️</span>
                <span>
                  L&apos;adresse postale exacte de l&apos;école n&apos;est pas
                  enregistrée — contactez-la avant l&apos;envoi pour la confirmer.
                </span>
              </li>
            )}
          </ul>
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
                Contactez l&apos;école pour convenir d&apos;un créneau de dépôt.
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
                du ticket.
              </span>
            </li>
          </ul>
        </section>
      )}

      {/* ── CTAs ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {!isPostal && school?.email && (
          <a
            href={`mailto:${school.email}?subject=SAV%20${encodeURIComponent(ticketRef)}%20%E2%80%94%20prise%20de%20rendez-vous`}
            className="btn-primary flex-1"
          >
            ✉️ Contacter l&apos;école
          </a>
        )}
        {!isPostal && !school?.email && school?.phone && (
          <a
            href={`tel:${school.phone.replace(/\s+/g, '')}`}
            className="btn-primary flex-1"
          >
            📞 Appeler l&apos;école
          </a>
        )}
        <Link
          href={`/client/ticket/${ticket.id}`}
          className="btn-secondary flex-1"
        >
          Voir mon ticket
        </Link>
        <Link href="/client" className="btn-secondary flex-1">
          Retour à mes tickets
        </Link>
      </div>
    </main>
  )
}
