import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getSchoolUnreadTotal } from '@/features/tickets/messages-unread-school'

/**
 * Header entry point for the school inbox. Mirror of the client variant —
 * Server Component, refreshes on every navigation, fails silently to 0 unread.
 */
export async function SchoolMessagesNavButton() {
  const supabase = await createClient()
  const unread = await getSchoolUnreadTotal(supabase)

  return (
    <Link
      href="/school/messages"
      aria-label={unread > 0 ? `Messagerie — ${unread} non lu${unread > 1 ? 's' : ''}` : 'Messagerie'}
      className="group relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
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
