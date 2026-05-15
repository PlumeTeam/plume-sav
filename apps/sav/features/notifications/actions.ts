'use server'

// Server Actions pour les notifications SAV (mark-as-read).
// Le helper notifyUser (server.ts) est appelé par les autres actions SAV
// — pas exposé comme Server Action puisqu'il ne vient jamais du client.

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

type AnyFrom = { from: (table: string) => ReturnType<ReturnType<typeof createClient> extends Promise<infer C> ? C extends { from: infer F } ? F : never : never> }

/**
 * Marque comme lues TOUTES les notifs SAV du user courant rattachées
 * à un ticket précis. Idéal pour l'appel au mount d'une page ticket /
 * conversation : un seul aller-retour vide le compteur pour ce ticket.
 *
 * Best-effort : une erreur loggue mais ne plante pas le rendu — le badge
 * restera "non lu" jusqu'à la prochaine occasion, jamais bloquant.
 *
 * IMPORTANT : revalidatePath('/client', 'layout') (et les 3 autres rôles)
 * est obligatoire pour que NotificationsNavButton dans le layout soit
 * re-rendu avec le nouveau compteur. Sans ça, Next.js sert le RSC en
 * cache et le badge reste rouge même après lecture (bug signalé par JB).
 */
export async function markTicketNotificationsReadAction(
  ticketId: string,
): Promise<{ ok: true } | { error: string }> {
  if (!ticketId) return { error: 'missing_ticket_id' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const db = supabase as unknown as AnyFrom
  const { error } = await db
    .from('notifications')
    .update({ read: true })
    .eq('user_id',      user.id)
    .eq('related_id',   ticketId)
    .eq('related_type', 'service_request')
    .eq('read',         false)

  if (error) {
    console.warn('[markTicketNotificationsReadAction] failed:', error.message)
    return { error: error.message }
  }

  // Invalide les caches RSC de tous les layouts qui rendent
  // NotificationsNavButton — le badge sera frais à la prochaine navigation.
  // 'layout' invalide le segment de layout (et toutes les pages en dessous).
  revalidatePath('/client',   'layout')
  revalidatePath('/school',   'layout')
  revalidatePath('/workshop', 'layout')
  revalidatePath('/plume',    'layout')

  return { ok: true }
}

/**
 * Marque une notif individuelle comme lue. Utilisé par la page inbox
 * `/client/notifications` quand l'user clique sur une entrée (sans
 * forcément ouvrir le ticket associé).
 */
export async function markNotificationReadAction(
  notificationId: string,
): Promise<{ ok: true } | { error: string }> {
  if (!notificationId) return { error: 'missing_notification_id' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const db = supabase as unknown as AnyFrom
  const { error } = await db
    .from('notifications')
    .update({ read: true })
    .eq('id',      notificationId)
    .eq('user_id', user.id)

  if (error) {
    console.warn('[markNotificationReadAction] failed:', error.message)
    return { error: error.message }
  }

  revalidatePath('/client',   'layout')
  revalidatePath('/school',   'layout')
  revalidatePath('/workshop', 'layout')
  revalidatePath('/plume',    'layout')

  return { ok: true }
}

/**
 * Marque comme lues TOUTES les notifs SAV du user courant. Utilisé par le
 * bouton "Tout marquer comme lu" en tête de la page inbox.
 */
export async function markAllNotificationsReadAction(): Promise<
  { ok: true } | { error: string }
> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const db = supabase as unknown as AnyFrom
  const { error } = await db
    .from('notifications')
    .update({ read: true })
    .eq('user_id',      user.id)
    .eq('related_type', 'service_request')
    .eq('read',         false)

  if (error) {
    console.warn('[markAllNotificationsReadAction] failed:', error.message)
    return { error: error.message }
  }

  revalidatePath('/client',   'layout')
  revalidatePath('/school',   'layout')
  revalidatePath('/workshop', 'layout')
  revalidatePath('/plume',    'layout')

  return { ok: true }
}
