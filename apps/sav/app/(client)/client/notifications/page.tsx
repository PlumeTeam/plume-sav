import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getUserNotifications,
  type NotificationRow,
} from '@/features/notifications/server'
import { markAllNotificationsReadAction } from '@/features/notifications/actions'
import { formatDateTime } from '@/features/tickets/utils'

export const dynamic = 'force-dynamic'

// Page inbox notifications client. Liste les 50 dernières notifs SAV
// (events + messages reçus), triées par date desc. Cliquer ouvre le
// ticket associé (`action_url`) ET la notif est marquée lue au mount de
// la page ticket via markTicketNotificationsReadAction.
//
// Bouton "Tout marquer comme lu" en tête pour les clients qui veulent
// vider d'un coup sans cliquer notif par notif.

const SEVERITY_STYLES: Record<string, { bg: string; ring: string; dot: string }> = {
  success: { bg: 'bg-emerald-50/60', ring: 'ring-emerald-200',  dot: 'bg-emerald-500' },
  info:    { bg: 'bg-sky-50/60',     ring: 'ring-sky-200',      dot: 'bg-sky-500'     },
  warning: { bg: 'bg-amber-50/60',   ring: 'ring-amber-200',    dot: 'bg-amber-500'   },
  error:   { bg: 'bg-red-50/60',     ring: 'ring-red-200',      dot: 'bg-red-500'     },
}

// Wrapper void pour `<form action>` : Next.js exige une signature
// `(FormData) => void | Promise<void>`, alors que markAllNotificationsReadAction
// retourne {ok:true} | {error}. On enrobe pour ignorer le retour.
async function handleMarkAllRead() {
  'use server'
  await markAllNotificationsReadAction()
}

export default async function ClientNotificationsPage() {
  const supabase = await createClient()
  const notifs   = await getUserNotifications(supabase)
  const unread   = notifs.filter((n) => !n.read).length

  return (
    <main className="space-y-4 px-4 py-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-brand-ink">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unread > 0
              ? `${unread} non lue${unread > 1 ? 's' : ''} sur ${notifs.length} récente${notifs.length > 1 ? 's' : ''}.`
              : notifs.length > 0
                ? `Tout est à jour (${notifs.length} récente${notifs.length > 1 ? 's' : ''}).`
                : 'Aucune notification pour le moment.'}
          </p>
        </div>
        <Link
          href="/client"
          className="rounded-xl border border-brand-stone bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-brand-gold/40 hover:text-brand-ink"
        >
          ← Accueil
        </Link>
      </header>

      {unread > 0 && (
        <form action={handleMarkAllRead}>
          <button
            type="submit"
            className="w-full rounded-xl border border-brand-stone bg-white px-3 py-2 text-xs font-medium text-brand-ink hover:border-brand-gold/40 sm:w-auto"
          >
            ✓ Tout marquer comme lu
          </button>
        </form>
      )}

      {notifs.length === 0 ? (
        <div className="card border-dashed px-4 py-10 text-center">
          <p className="text-3xl" aria-hidden>🔔</p>
          <p className="mt-3 text-sm font-medium text-brand-ink">Pas encore de notification</p>
          <p className="mt-1 text-xs text-slate-500">
            Les mises à jour importantes (validation BAT, réception de l&apos;aile, message
            de votre école…) apparaîtront ici.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notifs.map((n) => (
            <li key={n.id}>
              <NotificationRowCard notif={n} />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

function NotificationRowCard({ notif }: { notif: NotificationRow }) {
  const sev   = SEVERITY_STYLES[notif.type ?? 'info'] ?? SEVERITY_STYLES['info']!
  const unread = !notif.read

  // Le link_url (colonne `action_url`) ouvre la page ticket : le mount
  // appelle markTicketNotificationsReadAction qui passe `read = true`
  // sur toutes les notifs de ce ticket.
  const href = notif.action_url ?? '/client'

  return (
    <Link
      href={href}
      className={`card group relative flex items-start gap-3 p-4 transition-all hover:-translate-y-0.5 active:scale-[0.99] ${unread ? `ring-2 ring-brand-gold/40 ${sev.bg}` : ''}`}
    >
      <span aria-hidden className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${unread ? sev.dot : 'bg-slate-300'}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`truncate text-sm ${unread ? 'font-bold text-brand-ink' : 'font-semibold text-brand-ink'}`}>
            {notif.title}
          </p>
          <time className="shrink-0 text-[11px] text-slate-400">
            {formatDateTime(notif.created_at)}
          </time>
        </div>
        <p className={`mt-1 line-clamp-2 text-sm ${unread ? 'text-brand-ink' : 'text-slate-600'}`}>
          {notif.message}
        </p>
      </div>
      <span className="self-center text-lg text-slate-300 group-hover:text-brand-gold transition-colors" aria-hidden>›</span>
    </Link>
  )
}
