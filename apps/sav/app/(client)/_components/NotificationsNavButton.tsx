import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUnreadNotificationCount } from '@/features/notifications/server'

/**
 * Persistent header entry-point for the client's notifications.
 *
 * Server Component : re-rendered à chaque navigation. Les Server Actions
 * qui changent l'état (markRead, addMessage, BAT, etc.) invalident le
 * layout via `revalidatePath('/client', 'layout')`, donc le badge reste
 * frais sans realtime.
 *
 * Failures degrade silencieusement à "0 non lu" (cf. getUnreadNotificationCount).
 *
 * Compteur = `public.notifications` filtrée sur `related_type = 'service_request'`
 * + `read = false`. Inclut les events business (BAT, statuts...) ET les
 * messages reçus — un seul badge unifié pour tout ce qui demande l'attention
 * du client.
 */
export async function NotificationsNavButton() {
  const supabase = await createClient()
  const unread = await getUnreadNotificationCount(supabase)

  return (
    <Link
      href="/client/notifications"
      aria-label={unread > 0 ? `Notifications — ${unread} non lue${unread > 1 ? 's' : ''}` : 'Notifications'}
      className="group relative inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
    >
      <span aria-hidden className="text-base leading-none">🔔</span>
      <span className="ml-1.5 hidden sm:inline">Notifications</span>
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
