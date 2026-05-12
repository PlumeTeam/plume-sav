// 5 canaux de discussion explicites par ticket. Chaque canal a un public défini,
// strictement contrôlé côté server : un rôle ne fetche que les messages dont
// le `channel` appartient à son allowlist.
//
// Plume HQ admin voit TOUT (channels + legacy visibility_level admin), peu
// importe ce qui suit.

import type { MessageChannel, TicketMessage } from './types'

// Re-export pour les modules qui importaient MessageChannel d'ici.
// Source de vérité : packages/db/src/types.ts.
export type { MessageChannel }

export const MESSAGE_CHANNELS: readonly MessageChannel[] = [
  'school_client',
  'client_workshop',
  'workshop_school',
  'group',
  'workshop_plume',
]

export type ChannelRole = 'client' | 'school' | 'workshop' | 'plume'

/**
 * Allowlist par rôle. Source de vérité pour :
 *  - le filtrage server-side avant rendu (filterMessagesForRole)
 *  - la validation server-side avant insertion (addRoleMessageAction)
 *
 * Le rôle 'plume' admin voit tout (court-circuit dans les helpers).
 */
export const ROLE_CHANNELS: Record<Exclude<ChannelRole, 'plume'>, readonly MessageChannel[]> = {
  client:   ['school_client', 'client_workshop', 'group'],
  school:   ['school_client', 'workshop_school', 'group'],
  workshop: ['client_workshop', 'workshop_school', 'group', 'workshop_plume'],
}

/**
 * Vérifie si un message est visible pour un rôle donné. Les messages avec
 * `channel` non nul sont gouvernés par l'allowlist ; ceux avec `channel = NULL`
 * (legacy : notes admin, école↔Plume privé) suivent l'ancien filtre
 * `visibility_level` pour préserver la rétrocompat.
 */
export function isMessageVisibleToRole(
  msg: TicketMessage,
  role: ChannelRole,
): boolean {
  if (role === 'plume') return true

  const ch = (msg as TicketMessage & { channel?: MessageChannel | null }).channel ?? null

  if (ch !== null) {
    return (ROLE_CHANNELS[role] as readonly string[]).includes(ch)
  }

  // Fallback legacy (channel NULL) — reproduit la sémantique pré-migration.
  if (role === 'client') {
    return msg.visibility_level === 'all'
  }
  if (role === 'school') {
    return (
      msg.visibility_level === 'all' ||
      msg.visibility_level === 'workshop_plume' ||
      msg.visibility_level === 'school_plume'
    )
  }
  // workshop
  return msg.visibility_level === 'all' || msg.visibility_level === 'workshop_plume'
}

export function filterMessagesForRole(
  messages: TicketMessage[],
  role: ChannelRole,
): TicketMessage[] {
  return messages.filter((m) => isMessageVisibleToRole(m, role))
}

/**
 * Pour un canal donné, mappe sur la valeur de `visibility_level` la moins
 * fuyante qu'on doit poser à l'insertion. La colonne `visibility_level` reste
 * obligatoire (CHECK constraint), mais le filtrage utilise désormais
 * `channel` en priorité — la valeur posée ici sert uniquement de garde-fou
 * legacy si une requête bypassait le helper.
 */
export function visibilityLevelForChannel(channel: MessageChannel): string {
  switch (channel) {
    case 'group':           return 'all'
    case 'school_client':   return 'all'           // école+client voient via legacy 'all'
    case 'client_workshop': return 'all'           // client+atelier voient via legacy 'all'
    case 'workshop_school': return 'workshop_plume' // école+atelier voient via legacy 'workshop_plume'
    case 'workshop_plume':  return 'plume_only'    // legacy ne montre rien d'autre que admin → pas de fuite
  }
}
