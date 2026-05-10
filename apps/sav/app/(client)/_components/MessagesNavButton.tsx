import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getClientUnreadTotal } from '@/features/tickets/messages-unread'

/**
 * Persistent header entry-point for the client's messaging inbox.
 * Server Component: re-renders on every navigation, so the badge stays
 * fresh without realtime. Failures degrade to "0 unread" silently.
 */
export async function MessagesNavButton() {
  const supabase = await createClient()
  const unread = await getClientUnreadTotal(supabase)

  return (
    <Link
      href="/client/messages"
      aria-label={unread > 0 ? `Messagerie — ${unread} non lu${unread > 1 ? 's' : ''}` : 'Messagerie'}
      className="group relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      <span aria-hidden className="text-base leading-none">💬</span>
      <span className="ml-1.5 hidden sm:inline">Messages</span>
      {unread > 0 && (
        <span
          aria-hidden
          className="absolute -right-1 -top-1 inline-flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-brand-navy"
        >
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
  )
}
