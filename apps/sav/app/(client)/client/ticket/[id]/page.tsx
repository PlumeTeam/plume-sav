import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTicketDetail, getPartnerSchoolById } from '@/features/tickets/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { formatDate, formatDateTime, TIMELINE_STEPS, getStatusStep } from '@/features/tickets/utils'
import { MessageForm } from './MessageForm'

interface PageProps {
  params: { id: string }
}

export const dynamic = 'force-dynamic'

export default async function TicketDetailPage({ params }: PageProps) {
  const ticket = await getTicketDetail(params.id)
  if (!ticket) notFound()

  const school = ticket.referent_school_id
    ? await getPartnerSchoolById(ticket.referent_school_id)
    : null

  const currentStep   = getStatusStep(ticket.status)
  const sortedPhotos  = [...ticket.ticket_photos].sort((a, b) => a.sort_order - b.sort_order)
  const publicMessages = ticket.ticket_messages
    .filter((m) => m.visibility_level === 'all')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`
  const isRejected = ticket.status === 'rejected' || ticket.status === 'cancelled'

  const cityRegion = [school?.city, school?.region].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen">
      {/* Contextual sub-header — sits on the cream background, no double bar */}
      <header className="bg-brand-cream">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 pt-4 pb-2">
          <Link
            href="/client"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink hover:bg-white"
            aria-label="Retour"
          >
            ←
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-mono text-xs text-slate-500">{ticketRef}</p>
            <p className="truncate text-sm font-semibold text-brand-ink">
              {ticket.product_brand} {ticket.product_model}
            </p>
          </div>
          <StatusBadge status={ticket.status} size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-3 p-4 pb-12">
        {/* Timeline — Domino's style */}
        <section className="card p-5">
          <h2 className="section-title mb-4">Suivi en temps réel</h2>
          {isRejected ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {ticket.status === 'rejected' ? 'Ticket rejeté' : 'Ticket annulé'}
            </div>
          ) : (
            <ol className="space-y-3">
              {TIMELINE_STEPS.map((step, idx) => {
                const stepIdx = idx + 1
                const isDone    = currentStep >= stepIdx + 1
                const isCurrent = currentStep === stepIdx
                return (
                  <li key={step.status} className="flex items-center gap-3">
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        isDone
                          ? 'bg-emerald-500 text-white'
                          : isCurrent
                          ? 'bg-brand-coral text-white ring-4 ring-brand-coral/20'
                          : 'bg-brand-stone text-slate-400'
                      }`}
                    >
                      {isDone ? '✓' : stepIdx}
                    </div>
                    <span
                      className={`text-sm ${
                        isDone    ? 'text-slate-500' :
                        isCurrent ? 'font-semibold text-brand-ink' :
                        'text-slate-400'
                      }`}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-brand-coral animate-pulse-dot" aria-hidden />
                    )}
                  </li>
                )
              })}
            </ol>
          )}
        </section>

        {/* Votre école — contact + chat shortcut */}
        {school && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Votre école</h2>
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-3xl">🏫</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-brand-ink">{school.name}</p>
                {cityRegion && (
                  <p className="mt-0.5 text-xs text-slate-500">{cityRegion}</p>
                )}

                {(school.phone || school.email || school.address) && (
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
                    {school.address && (
                      <p className="flex items-start gap-2 text-slate-700">
                        <span aria-hidden>📍</span>
                        <span className="whitespace-pre-line">{school.address}</span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <a
              href="#chat"
              className="btn-primary mt-4 inline-flex w-full items-center justify-center gap-2"
            >
              💬 Envoyer un message à l&apos;école
            </a>
          </section>
        )}

        {/* Product info */}
        <section className="card p-5">
          <h2 className="section-title mb-3">Produit</h2>
          <div className="space-y-2">
            <InfoRow label="Marque / Modèle" value={`${ticket.product_brand ?? '—'} ${ticket.product_model ?? '—'}`} />
            <InfoRow label="N° de série" value={ticket.serial_number ?? '—'} mono />
            {ticket.purchase_date && <InfoRow label="Date d'achat" value={formatDate(ticket.purchase_date)} />}
          </div>
        </section>

        {/* Description */}
        <section className="card p-5">
          <h2 className="section-title mb-3">Demande</h2>
          {ticket.description && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-brand-ink">{ticket.description}</p>
          )}
          {ticket.urgency_level === 2 && (
            <p className="mt-3 rounded-2xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              🚨 Signalé comme urgent
            </p>
          )}
        </section>

        {/* Photos */}
        {sortedPhotos.length > 0 && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Photos ({sortedPhotos.length})</h2>
            <PhotoLightbox photos={sortedPhotos} />
          </section>
        )}

        {/* Messages — chat-style thread between client and school */}
        <section id="chat" className="card scroll-mt-20 p-5">
          <h2 className="section-title mb-4">
            Échanges{school?.name ? ` avec ${school.name}` : " avec votre école"}
          </h2>

          {publicMessages.length === 0 ? (
            <p className="rounded-xl bg-brand-cream/60 p-3 text-sm text-slate-500">
              Aucun message pour l&apos;instant. Écrivez ci-dessous pour démarrer la conversation —
              {school?.name ? ` ${school.name}` : ' votre école'} vous répondra ici.
            </p>
          ) : (
            <div className="mb-4 space-y-3">
              {publicMessages.map((msg) => {
                const isClient = msg.sender_role === 'client'
                return (
                  <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        isClient
                          ? 'bg-brand-coral text-white rounded-br-sm'
                          : 'bg-brand-cream text-brand-ink ring-1 ring-brand-stone rounded-bl-sm'
                      }`}
                    >
                      {!isClient && (
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wider opacity-70">
                          {msg.sender_role === 'school' ? 'École' : msg.sender_role === 'workshop' ? 'Atelier' : msg.sender_role === 'plume_admin' ? 'Plume' : msg.sender_role}
                        </p>
                      )}
                      <p className="whitespace-pre-line text-sm leading-relaxed">{msg.content}</p>
                      <p className="mt-1 text-right text-[11px] opacity-60">{formatDateTime(msg.created_at)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <MessageForm ticketId={ticket.id} />
        </section>
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

