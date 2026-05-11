import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getSchoolTicketDetail } from '@/features/tickets/queries'
import { PlumeLogo } from '@/app/_components/PlumeLogo'
import { CheckWizard } from '@/features/tickets/inspection/CheckWizard'
import { extractReportedCategory, readSchoolCheckPayload } from '@/features/tickets/inspection/steps'
import { SchoolCheckGate } from './SchoolCheckGate'

interface PageProps { params: { id: string } }

export const dynamic = 'force-dynamic'

export default async function SchoolTicketCheckPage({ params }: PageProps) {
  const ticket = await getSchoolTicketDetail(params.id)
  if (!ticket) notFound()

  // No point checking a closed ticket — bounce back.
  if (ticket.status === 'completed' || ticket.status === 'cancelled' || ticket.status === 'rejected') {
    redirect(`/school/ticket/${params.id}`)
  }

  const reportedCategory = extractReportedCategory(ticket.description)
  const initial = readSchoolCheckPayload(ticket.school_checklist)
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
              🔍 Check de l&apos;aile
            </p>
          </div>
          <span aria-hidden className="flex h-10 w-10 items-center justify-center">
            <PlumeLogo size="sm" />
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-3 p-4 pb-12">
        <SchoolCheckGate
          ticketId={ticket.id}
          ticketHref={`/school/ticket/${ticket.id}`}
          wingSerial={ticket.serial_number ?? null}
        >
          <CheckWizard
            ticketId={ticket.id}
            ticketHref={`/school/ticket/${ticket.id}`}
            reportedCategory={reportedCategory}
            initial={initial}
          />
        </SchoolCheckGate>
      </main>
    </div>
  )
}
