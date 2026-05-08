import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSchoolTicketDetail } from '@/features/tickets/queries'
import { DiagnosisChecklist } from '@/features/tickets/components/DiagnosisChecklist'
import { SCHOOL_VISUAL_CHECKLIST, SCHOOL_BEHAVIOR_CHECKLIST } from '@/features/tickets/constants'
import { saveSchoolChecklistAction } from '@/features/tickets/actions'
import { PlumeLogo } from '@/app/_components/PlumeLogo'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

type ChecklistJson = { checkedIds?: string[]; notes?: string | null } | null

// Placeholder check page — uses the existing flat DiagnosisChecklist for now.
// Will be replaced in batch 3 with a one-question-per-page wizard.
export default async function SchoolTicketCheckPage({ params }: PageProps) {
  const ticket = await getSchoolTicketDetail(params.id)
  if (!ticket) notFound()

  // Refuse to render the check on a closed ticket — redirect back to detail.
  if (ticket.status === 'completed' || ticket.status === 'cancelled' || ticket.status === 'rejected') {
    redirect(`/school/ticket/${params.id}`)
  }

  const isBehavior =
    ticket.service_type === 'sav' ||
    /^\s*\[Comportements\]/m.test(ticket.description ?? '')
  const checklistItems = isBehavior ? SCHOOL_BEHAVIOR_CHECKLIST : SCHOOL_VISUAL_CHECKLIST

  const stored: ChecklistJson = (ticket.school_checklist ?? null) as ChecklistJson
  const initialChecked = Array.isArray(stored?.checkedIds) ? stored!.checkedIds! : []
  const initialNotes   = typeof stored?.notes === 'string' ? stored!.notes! : ''

  const ticketRef = ticket.ticket_number ?? `#${ticket.id.slice(0, 8).toUpperCase()}`

  return (
    <div className="min-h-screen bg-brand-cream">
      <header className="sticky top-0 z-20 border-b border-brand-stone/60 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <Link
            href={`/school/ticket/${params.id}`}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-brand-ink active:bg-brand-cream"
            aria-label="Retour au ticket"
          >
            ←
          </Link>
          <div className="min-w-0 flex-1 text-center">
            <p className="font-mono text-xs text-slate-500">{ticketRef}</p>
            <p className="truncate text-sm font-semibold text-brand-ink">
              🔍 Check de l&apos;aile — {isBehavior ? 'comportement' : 'visuel'}
            </p>
          </div>
          <span aria-hidden className="flex h-10 w-10 items-center justify-center">
            <PlumeLogo size="sm" />
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-4 p-4 pb-12">
        <div className="card p-5">
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
        </div>

        <div className="rounded-2xl bg-brand-cream p-3 text-xs text-slate-500">
          Une fois sauvegardé, le check apparaîtra comme « ✓ Check validé » sur la fiche du ticket.
          Vous pourrez ensuite prendre une décision (résolution, escalade vers un atelier…).
        </div>
      </main>
    </div>
  )
}
