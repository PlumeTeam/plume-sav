import Link from 'next/link'
import type { InboxThread } from '@/features/tickets/messages-unread'
import { formatDateTime } from '@/features/tickets/utils'

/**
 * One row of the client message inbox — latest visible message preview,
 * unread badge, and a deep link to the ticket's Messages view. Shared by
 * /client/messages and the "Messages" tab on the client dashboard.
 */
export function InboxThreadRow({ thread }: { thread: InboxThread }) {
  const isUnread = thread.unreadCount > 0
  const senderLabel = thread.lastMessage
    ? thread.lastMessage.senderRole === 'client'
      ? 'Vous'
      : thread.lastMessage.senderRole === 'school'
        ? thread.schoolName ?? 'École'
        : thread.lastMessage.senderRole === 'workshop'
          ? 'Atelier'
          : thread.lastMessage.senderRole === 'plume_admin'
            ? 'Plume'
            : thread.lastMessage.senderRole
    : null

  const preview = thread.lastMessage?.content.trim() ?? ''
  const truncated = preview.length > 110 ? `${preview.slice(0, 110).trimEnd()}…` : preview

  return (
    <Link
      href={`/client/messages/${thread.ticketId}`}
      className={`card group relative flex items-start gap-3 p-4 transition-all hover:-translate-y-0.5 active:scale-[0.99] ${
        isUnread ? 'ring-2 ring-brand-gold/40' : ''
      }`}
    >
      {/* Avatar */}
      <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-cream text-2xl ring-1 ring-brand-stone" aria-hidden>
        🏫
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
            {thread.schoolName ?? 'Conversation'}
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
