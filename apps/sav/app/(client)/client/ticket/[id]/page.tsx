import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getTicketDetail } from '@/features/tickets/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { formatDate, formatDateTime, getSupabasePublicUrl, TIMELINE_STEPS, getStatusStep } from '@/features/tickets/utils'
import { STATUS_CONFIG } from '@/features/tickets/types'
import { MessageForm } from './MessageForm'

interface PageProps {
  params: { id: string }
}

export default async function TicketDetailPage({ params }: PageProps) {
  const ticket = await getTicketDetail(params.id)
  if (!ticket) notFound()

  const currentStep = getStatusStep(ticket.status)
  const sortedPhotos = [...ticket.ticket_photos].sort((a, b) => a.sort_order - b.sort_order)
  const publicMessages = ticket.ticket_messages.filter((m) => m.visibility_level === 'all')

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/client"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 active:bg-slate-100"
            aria-label="Retour"
          >
            ←
          </Link>
          <div className="flex-1">
            <p className="text-sm font-semibold text-slate-900">
              {ticket.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-xs text-slate-500">
              {ticket.product_brand} {ticket.product_model}
            </p>
          </div>
          <StatusBadge status={ticket.status} size="sm" />
        </div>
      </header>

      <main className="divide-y divide-slate-100 pb-8">

        {/* Timeline — Domino's style */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-400 uppercase tracking-wide">
            Suivi en temps réel
          </h2>
          <ol className="space-y-3">
            {TIMELINE_STEPS.map((step, idx) => {
              const stepIdx = idx + 1
              const isDone = currentStep >= stepIdx + 1
              const isCurrent = currentStep === stepIdx
              return (
                <li key={step.status} className="flex items-center gap-3">
                  <div
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isDone
                        ? 'bg-green-500 text-white'
                        : isCurrent
                        ? 'bg-slate-900 text-white ring-4 ring-slate-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? '✓' : stepIdx}
                  </div>
                  <span
                    className={`text-sm ${
                      isDone ? 'text-slate-500 line-through' :
                      isCurrent ? 'font-semibold text-slate-900' :
                      'text-slate-400'
                    }`}
                  >
                    {step.label}
                  </span>
                  {isCurrent && (
                    <span className="ml-auto flex h-2 w-2 rounded-full bg-slate-900 animate-pulse" />
                  )}
                </li>
              )
            })}
          </ol>
        </section>

        {/* Service request info */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-400 uppercase tracking-wide">Produit</h2>
          <div className="space-y-2">
            <InfoRow label="Marque / Modèle" value={`${ticket.product_brand ?? '—'} ${ticket.product_model ?? '—'}`} />
            <InfoRow label="N° de série" value={ticket.serial_number ?? '—'} />
            {ticket.purchase_date && (
              <InfoRow label="Date d'achat" value={formatDate(ticket.purchase_date)} />
            )}
          </div>
        </section>

        {/* Description */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-400 uppercase tracking-wide">Demande</h2>
          {ticket.description && (
            <p className="text-sm text-slate-700 leading-relaxed">{ticket.description}</p>
          )}
          {ticket.urgency_level === 2 && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 font-medium">
              🚨 Signalé comme urgent
            </p>
          )}
        </section>

        {/* Photos */}
        {sortedPhotos.length > 0 && (
          <section className="bg-white px-4 py-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Photos ({sortedPhotos.length})
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {sortedPhotos.map((photo) => (
                <a
                  key={photo.id}
                  href={getSupabasePublicUrl(photo.storage_path)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square overflow-hidden rounded-xl"
                >
                  <Image
                    src={getSupabasePublicUrl(photo.storage_path)}
                    alt={photo.caption ?? 'Photo SAV'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 200px"
                  />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Messages */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-400 uppercase tracking-wide">Messages</h2>

          {publicMessages.length === 0 ? (
            <p className="text-sm text-slate-400">
              Aucun message pour l&apos;instant. Votre école vous contactera ici.
            </p>
          ) : (
            <div className="space-y-3 mb-4">
              {publicMessages.map((msg) => {
                const isClient = msg.sender_role === 'client'
                return (
                  <div key={msg.id} className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                        isClient
                          ? 'bg-slate-900 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                      }`}
                    >
                      {!isClient && (
                        <p className="mb-1 text-xs font-medium text-slate-500 capitalize">
                          {msg.sender_role}
                        </p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`mt-1 text-right text-xs ${isClient ? 'text-slate-400' : 'text-slate-400'}`}>
                        {formatDateTime(msg.created_at)}
                      </p>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <p className="text-xs text-slate-500 flex-shrink-0">{label}</p>
      <p className="text-sm text-slate-800 text-right">{value.trim() || '—'}</p>
    </div>
  )
}
