// Notifications SAV — helpers serveur.
//
// La table `public.notifications` est PARTAGÉE entre toutes les apps Plume
// sur le Supabase mutualisé (gxighesxbavnzzyngjaz). Schéma existant :
//
//   id, user_id, title, message, type ('info'|'success'|'warning'|'error'),
//   read (boolean), related_id, related_type, action_url, created_at.
//
// On la réutilise pour le SAV avec `related_type = 'service_request'` et
// `related_id = ticket.id`. Le scoping côté queries (toujours filtrer sur
// related_type='service_request') évite de pourrir nos vues avec les notifs
// des autres apps Plume.
//
// La policy RLS sec_sav_actor_insert (migration 20260515160000) autorise
// un acteur du ticket à créer des notifications pour les autres acteurs.

import type { SupabaseClient } from '@supabase/supabase-js'

// La table n'est pas dans packages/db/src/types.ts (shared-platform table).
// On la déclare localement pour ce module.
export interface NotificationRow {
  id:           string
  user_id:      string
  title:        string
  message:      string
  type:         'info' | 'success' | 'warning' | 'error' | null
  read:         boolean | null
  related_id:   string | null
  related_type: string | null
  action_url:   string | null
  created_at:   string
}

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error'

export interface NotifyUserInput {
  /** UUID Supabase de l'utilisateur destinataire. Si vide ou égal à
   *  l'appelant, l'insert est skip (la policy refuserait de toute façon). */
  targetUserId: string
  /** UUID du ticket associé. Obligatoire — la policy SAV cadre sur
   *  related_type='service_request'. */
  ticketId:     string
  /** Identifiant machine-readable du type d'événement. Stocké tel quel
   *  dans la colonne `message` n'est PAS une bonne idée — on s'en sert
   *  uniquement pour le mapping severity + analytics futures. */
  eventType:    string
  /** Libellé court qui apparaît en tête de la notif. */
  title:        string
  /** Corps de la notif — ex: "L'école Vol Libre a validé votre BAT." */
  message:      string
  /** URL relative à ouvrir au clic, ex: `/client/ticket/<uuid>`. */
  actionUrl:    string
  /** Sévérité visuelle (default 'info'). 'success' pour validations
   *  positives, 'warning' pour refus / actions requises, 'error' pour échecs. */
  severity?:    NotificationSeverity
}

// On passe par `db` au lieu de `supabase` directement parce que la table
// `notifications` n'est pas dans Database['public']['Tables']. Le cast évite
// de polluer le type Database avec une table partagée non générée.
type AnyFrom = { from: (table: string) => ReturnType<SupabaseClient['from']> }

/**
 * Crée une notification pour un destinataire. Best-effort : un échec
 * (RLS, network) loggue mais ne bloque PAS l'action serveur appelante.
 * Une notif manquée est moins grave que de bloquer une transition de statut.
 *
 * Skip silencieusement si :
 *  - `targetUserId` vide / null
 *  - `targetUserId` === appelant (auto-notif, refusée par la policy)
 */
export async function notifyUser(
  supabase: SupabaseClient,
  input:    NotifyUserInput,
): Promise<{ ok: true } | { skipped: string } | { error: string }> {
  if (!input.targetUserId) return { skipped: 'empty_target' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }
  if (user.id === input.targetUserId) return { skipped: 'self_notify' }

  const db = supabase as unknown as AnyFrom
  const { error } = await db.from('notifications').insert({
    user_id:      input.targetUserId,
    title:        input.title,
    message:      input.message,
    type:         input.severity ?? 'info',
    related_id:   input.ticketId,
    related_type: 'service_request',
    action_url:   input.actionUrl,
    // `read` default = false (cf. column_default en DB).
  })

  if (error) {
    console.warn(`[notifyUser] event=${input.eventType} to=${input.targetUserId}: ${error.message}`)
    return { error: error.message }
  }
  return { ok: true }
}

/**
 * Notifie plusieurs destinataires en parallèle. Skip silencieusement les
 * UUIDs vides / doublons / auto-notif. Ne plante jamais — best-effort.
 */
export async function notifyUsers(
  supabase: SupabaseClient,
  inputs:   NotifyUserInput[],
): Promise<void> {
  const seen = new Set<string>()
  const tasks = inputs
    .filter((i) => {
      if (!i.targetUserId) return false
      if (seen.has(i.targetUserId)) return false
      seen.add(i.targetUserId)
      return true
    })
    .map((i) => notifyUser(supabase, i))
  await Promise.allSettled(tasks)
}

// ─── Lecture ─────────────────────────────────────────────────────────────

/**
 * Compte les notifs SAV non lues du user courant. Utilisé par le badge
 * en haut à droite (NotificationsNavButton). Retourne 0 sur erreur pour
 * ne jamais casser le rendu du layout.
 */
export async function getUnreadNotificationCount(
  supabase: SupabaseClient,
): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const db = supabase as unknown as AnyFrom
  const { count, error } = await db
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('read', false)
    .eq('related_type', 'service_request')

  if (error) {
    console.warn('[getUnreadNotificationCount] failed:', error.message)
    return 0
  }
  return count ?? 0
}

/**
 * Liste les notifs SAV du user courant, triées par date desc. Limitée à
 * 50 entrées (au-delà, c'est de l'archivage — on offrira une pagination
 * dédiée si besoin).
 */
export async function getUserNotifications(
  supabase: SupabaseClient,
  limit:    number = 50,
): Promise<NotificationRow[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const db = supabase as unknown as AnyFrom
  const { data, error } = await db
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('related_type', 'service_request')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.warn('[getUserNotifications] failed:', error.message)
    return []
  }
  return (data ?? []) as NotificationRow[]
}
