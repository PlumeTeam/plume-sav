import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClientInboxThreads } from '@/features/tickets/messages-unread'
import { InboxThreadRow } from '@/features/tickets/components/InboxThreadRow'

export const dynamic = 'force-dynamic'

export default async function ClientMessagesPage() {
  const supabase = await createClient()
  const threads = await getClientInboxThreads(supabase)
  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0)

  return (
    <main className="space-y-4 px-4 py-6">
      {/* Header */}
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-ink">Messagerie</h1>
          <p className="mt-1 text-sm text-slate-500">
            {totalUnread > 0
              ? `${totalUnread} message${totalUnread > 1 ? 's' : ''} non lu${totalUnread > 1 ? 's' : ''} sur ${threads.length} conversation${threads.length > 1 ? 's' : ''}.`
              : threads.length > 0
                ? `${threads.length} conversation${threads.length > 1 ? 's' : ''}, tout est à jour.`
                : 'Aucune conversation pour le moment.'}
          </p>
        </div>
        <Link
          href="/client"
          className="rounded-xl border border-brand-stone bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-gold/40 hover:text-brand-ink"
        >
          ← Accueil
        </Link>
      </header>

      {/* Empty state */}
      {threads.length === 0 ? (
        <div className="card border-dashed px-4 py-10 text-center">
          <p className="text-3xl" aria-hidden>📭</p>
          <p className="mt-3 text-sm font-medium text-brand-ink">Pas encore de message</p>
          <p className="mt-1 text-xs text-slate-500">
            Vos échanges avec votre école apparaîtront ici dès la première réponse.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li key={t.ticketId}>
              <InboxThreadRow thread={t} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
