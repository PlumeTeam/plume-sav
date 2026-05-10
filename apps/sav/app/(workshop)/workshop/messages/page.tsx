import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getWorkshopInboxThreads, type WorkshopInboxThread } from '@/features/tickets/messages-unread-workshop'
import { formatDateTime } from '@/features/tickets/utils'

export const dynamic = 'force-dynamic'

export default async function WorkshopMessagesPage() {
  const supabase = await createClient()
  const threads = await getWorkshopInboxThreads(supabase)
  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0)

  return (
    <main className="space-y-4 px-4 py-6">
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
          href="/workshop"
          className="rounded-xl border border-brand-stone bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-gold/40 hover:text-brand-ink"
        >
          ← Tickets
        </Link>
      </header>

      {threads.length === 0 ? (
        <div className="card border-dashed px-4 py-10 text-center">
          <p className="text-3xl" aria-hidden>📭</p>
          <p className="mt-3 text-sm font-medium text-brand-ink">Pas encore de message</p>
          <p className="mt-1 text-xs text-slate-500">
            Les échanges sur les tickets escaladés à l&apos;atelier apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li key={t.ticketId}>
              <WorkshopThreadRow thread={t} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function WorkshopThreadRow({ thread }: { thread: WorkshopInboxThread }) {
  const isUnread = thread.unreadCount > 0
  const senderLabel = thread.lastMessage
    ? thread.lastMessage.senderRole === 'workshop'
      ? 'Vous'
      : thread.lastMessage.senderRole === 'school'
        ? 'École'
        : thread.lastMessage.senderRole === 'client'
          ? thread.clientName
          : thread.lastMessage.senderRole === 'plume_admin'
            ? 'Plume'
            : thread.lastMessage.senderRole
    : null

  const preview = thread.lastMessage?.content.trim() ?? ''
  const truncated = preview.length > 110 ? `${preview.slice(0, 110).trimEnd()}…` : preview

  return (
    <Link
      href={`/workshop/ticket/${thread.ticketId}`}
      className={`card group relative flex items-start gap-3 p-4 transition-all hover:-translate-y-0.5 active:scale-[0.99] ${
        isUnread ? 'ring-2 ring-brand-gold/40' : ''
      }`}
    >
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-cream text-2xl ring-1 ring-brand-stone" aria-hidden>
        🛠️
        {isUnread && (
          <span
            aria-hidden
            className="absolute -right-1 -top-1 inline-flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white ring-2 ring-white"
          >
            {thread.unreadCount > 9 ? '9+' : thread.unreadCount}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate text-sm ${isUnread ? 'font-bold text-brand-ink' : 'font-semibold text-brand-ink'}`}>
            {thread.clientName}
          </p>
          {thread.lastMessage && (
            <time className="shrink-0 text-[11px] text-slate-400">
              {formatDateTime(thread.lastMessage.createdAt)}
            </time>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-slate-500">
          {thread.productLine} · <span className="font-mono">{thread.ticketRef}</span>
        </p>
        {truncated ? (
          <p className={`mt-2 line-clamp-2 text-sm ${isUnread ? 'text-brand-ink' : 'text-slate-600'}`}>
            <span className="font-medium text-slate-500">{senderLabel} : </span>
            {truncated}
          </p>
        ) : (
          <p className="mt-2 text-sm italic text-slate-400">Aucun message échangé pour l&apos;instant.</p>
        )}
      </div>

      <span className="self-center text-lg text-slate-300 group-hover:text-brand-gold transition-colors" aria-hidden>›</span>
    </Link>
  )
}
