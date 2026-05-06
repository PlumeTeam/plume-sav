import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSchoolTicketDetail } from '@/features/tickets/queries'
import { StatusBadge } from '@/features/tickets/components/StatusBadge'
import { TicketTimeline } from '@/features/tickets/components/TicketTimeline'
import { CommentThread } from '@/features/tickets/components/CommentThread'
import { PhotoLightbox } from '@/features/tickets/components/PhotoLightbox'
import { DiagnosisChecklist } from '@/features/tickets/components/DiagnosisChecklist'
import {
  SCHOOL_VISUAL_CHECKLIST,
  SCHOOL_BEHAVIOR_CHECKLIST,
} from '@/features/tickets/constants'
import { saveSchoolChecklistAction } from '@/features/tickets/actions'
import { formatDate } from '@/features/tickets/utils'
import { SchoolMessageBox } from './SchoolMessageBox'
import { SchoolResolutionPanel } from './SchoolResolutionPanel'
import type { SchoolResolution } from '@/features/tickets/types'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

type ChecklistJson = { checkedIds?: string[]; notes?: string | null } | null

export default async function SchoolTicketDetailPage({ params }: PageProps) {
  const ticket = await getSchoolTicketDetail(params.id)
  if (!ticket) notFound()

  const visibleMessages = ticket.ticket_messages
    .filter((m) => m.visibility_level === 'all' || m.sender_role === 'school')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`

  // Pick the relevant checklist based on the wizard's category.
  // problem_category === 'other' is the wizard's "Comportement" path.
  const isBehavior = ticket.problem_category === 'other'
  const checklistItems = isBehavior ? SCHOOL_BEHAVIOR_CHECKLIST : SCHOOL_VISUAL_CHECKLIST

  const stored: ChecklistJson = (ticket.school_checklist ?? null) as ChecklistJson
  const initialChecked = Array.isArray(stored?.checkedIds) ? stored!.checkedIds! : []
  const initialNotes   = typeof stored?.notes === 'string' ? stored!.notes! : ''

  return (
    <div className="min-h-screen">
      <header className="bg-brand-cream">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 pt-4 pb-2">
          <Link
            href="/school"
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink hover:bg-white"
            aria-label="Retour"
          >
            ←
          </Link>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-xs text-slate-500">{ticketRef}</p>
            <p className="truncate text-sm font-semibold text-brand-ink">
              {ticket.product_brand} {ticket.product_model}
            </p>
          </div>
          <StatusBadge status={ticket.status} size="sm" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-3 p-4 pb-12">
        {/* Delivery method banner — surfaces "is a parcel coming?" vs "client booking RDV" */}
        {ticket.delivery_method && (
          <section className={`card flex items-start gap-3 p-4 border-2 ${
            ticket.delivery_method === 'postal'
              ? 'border-amber-200 bg-amber-50'
              : 'border-emerald-200 bg-emerald-50'
          }`}>
            <span aria-hidden className="text-2xl">
              {ticket.delivery_method === 'postal' ? '📦' : '🤝'}
            </span>
            <div className="flex-1">
              <p className={`text-sm font-semibold ${
                ticket.delivery_method === 'postal' ? 'text-amber-900' : 'text-emerald-900'
              }`}>
                {ticket.delivery_method === 'postal'
                  ? 'Le client envoie son aile par la poste'
                  : 'Le client va déposer son aile en main propre'}
              </p>
              <p className={`mt-0.5 text-xs ${
                ticket.delivery_method === 'postal' ? 'text-amber-800/80' : 'text-emerald-800/80'
              }`}>
                {ticket.delivery_method === 'postal'
                  ? 'Vous devriez recevoir un colis prochainement. Le numéro de suivi vous sera communiqué via la messagerie.'
                  : 'Le client vous contactera pour prendre rendez-vous.'}
              </p>
            </div>
          </section>
        )}

        <section className="card p-5">
          <h2 className="section-title mb-4">Suivi</h2>
          <TicketTimeline status={ticket.status} />
        </section>

        {/* Checklist diagnostic */}
        <section className="card p-5">
          <h2 className="section-title mb-3">
            Checklist premier diagnostic — {isBehavior ? 'comportement' : 'visuel'}
          </h2>
          <DiagnosisChecklist
            ticketId={ticket.id}
            items={checklistItems}
            initialChecked={initialChecked}
            initialNotes={initialNotes}
            saveAction={saveSchoolChecklistAction}
            variant="coral"
            notesLabel="Observations école"
            notesPlaceholder="Constatations factuelles, mesures prises, échange avec le client…"
          />
        </section>

        {/* Issue / résolution */}
        <section className="card p-5">
          <h2 className="section-title mb-4">Décision</h2>
          <SchoolResolutionPanel
            ticketId={ticket.id}
            currentResolution={ticket.school_resolution as SchoolResolution | null}
            assignedWorkshopLabel={ticket.assigned_workshop_label}
          />
        </section>

        <section className="card p-5">
          <h2 className="section-title mb-3">Client</h2>
          <div className="space-y-2">
            <InfoRow label="Nom" value={[ticket.first_name, ticket.last_name].filter(Boolean).join(' ') || '—'} />
            <InfoRow label="Email" value={ticket.email ?? '—'} />
            {ticket.phone && <InfoRow label="Téléphone" value={ticket.phone} />}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="section-title mb-3">Produit</h2>
          <div className="space-y-2">
            <InfoRow label="Marque / Modèle" value={`${ticket.product_brand ?? '—'} ${ticket.product_model ?? '—'}`} />
            <InfoRow label="N° de série" value={ticket.serial_number ?? '—'} mono />
            {ticket.purchase_date && <InfoRow label="Date d'achat" value={formatDate(ticket.purchase_date)} />}
            {ticket.flight_hours_estimate != null && (
              <InfoRow label="Heures de vol" value={`${ticket.flight_hours_estimate} h`} />
            )}
          </div>
        </section>

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

        {ticket.ticket_photos.length > 0 && (
          <section className="card p-5">
            <h2 className="section-title mb-3">Photos ({ticket.ticket_photos.length})</h2>
            <PhotoLightbox photos={ticket.ticket_photos} />
          </section>
        )}

        <section className="card p-5">
          <h2 className="section-title mb-4">Messages</h2>
          <CommentThread
            messages={visibleMessages}
            ownRoles={['school']}
            showInternalBadge
            emptyText="Aucun message."
          />
          <div className="mt-4">
            <SchoolMessageBox ticketId={ticket.id} />
          </div>
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
