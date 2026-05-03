import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getTicketDetail } from '@/features/tickets/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { formatDate, formatDateTime, getSupabasePublicUrl, TIMELINE_STEPS, getStatusStep } from '@/features/tickets/utils'
import { PROBLEM_CATEGORIES, STATUS_CONFIG } from '@/features/tickets/types'
import { MessageForm } from './MessageForm'

interface PageProps {
  params: { id: string }
}

export default async function TicketDetailPage({ params }: PageProps) {
  const ticket = await getTicketDetail(params.id)
  if (!ticket) notFound()

  const currentStep = getStatusStep(ticket.sav_status)
  const problemLabel = PROBLEM_CATEGORIES.find((c) => c.value === ticket.problem_category)
  const sortedPhotos = [...ticket.ticket_photos].sort((a, b) => a.sort_order - b.sort_order)
  const publicMessages = ticket.ticket_messages.filter((m) => m.visibility_level === 'all')
  const sortedHistory = [...ticket.ticket_status_history].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
  )

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
              {ticket.ticket_number ?? 'Ticket SAV'}
            </p>
            <p className="text-xs text-slate-500">
              {ticket.wing_brand} {ticket.wing_model} {ticket.wing_size}
            </p>
          </div>
          <StatusBadge status={ticket.sav_status} size="sm" />
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

        {/* Wing info */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-400 uppercase tracking-wide">Votre aile</h2>
          <div className="space-y-2">
            <InfoRow label="Marque / Modèle" value={`${ticket.wing_brand ?? '—'} ${ticket.wing_model ?? ''} ${ticket.wing_size ?? ''}`} />
            <InfoRow label="Couleur" value={ticket.wing_color ?? '—'} />
            <InfoRow label="N° de série" value={ticket.wing_serial_number ?? '—'} />
            {ticket.purchase_date && (
              <InfoRow label="Date d'achat" value={formatDate(ticket.purchase_date)} />
            )}
            {ticket.flight_hours_estimate != null && (
              <InfoRow label="Heures de vol" value={`${ticket.flight_hours_estimate} h`} />
            )}
          </div>
        </section>

        {/* Problem */}
        <section className="bg-white px-4 py-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-400 uppercase tracking-wide">Problème déclaré</h2>
          {problemLabel && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">
              <span aria-hidden>{problemLabel.emoji}</span>
              {problemLabel.label}
            </div>
          )}
          {ticket.problem_description && (
            <p className="text-sm text-slate-700 leading-relaxed">{ticket.problem_description}</p>
          )}
          {ticket.urgency === 'urgent' && (
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

        {/* Status history */}
        {sortedHistory.length > 0 && (
          <section className="bg-white px-4 py-5">
            <h2 className="mb-3 text-sm font-semibold text-slate-400 uppercase tracking-wide">Historique</h2>
            <ol className="space-y-3">
              {sortedHistory.map((event) => {
                const config = STATUS_CONFIG[event.new_status] ?? { label: 'Inconnu', color: 'text-slate-500', bg: 'bg-slate-100' }
                return (
                  <li key={event.id} className="flex items-start gap-3">
                    <span className={`mt-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <div>
                      <p className="text-xs text-slate-400">{formatDateTime(event.changed_at)}</p>
                      {event.note && <p className="mt-0.5 text-sm text-slate-600">{event.note}</p>}
                    </div>
                  </li>
                )
              })}
            </ol>
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
