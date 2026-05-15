// Helpers haut-niveau pour générer des notifications SAV à partir
// d'événements business (BAT validé, message reçu, aile reçue, etc.).
// Chaque helper :
//   1. Résout le destinataire (client_id depuis le ticket).
//   2. Construit le titre + message localisés.
//   3. Délègue à notifyUser. Best-effort — un échec ne propage pas.
//
// Centraliser la logique ici évite que chaque action SAV reinvente le
// libellé / l'URL cible. Quand on étendra aux notifs école/atelier, on
// ajoutera ici des `notifySchoolForX` / `notifyWorkshopForX` plutôt que
// de dupliquer dans chaque action.

import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyUser } from './server'
import type { MessageChannel, MessageSenderRole } from '../tickets/types'

// Canaux dont les messages sont visibles côté client (5-canaux). Si un
// message est posté sur un autre canal (workshop_school, workshop_plume,
// school_plume), le client n'est PAS notifié — il n'a pas accès au contenu.
const CLIENT_VISIBLE_CHANNELS: ReadonlyArray<MessageChannel> = [
  'school_client',
  'client_workshop',
  'group',
]

const SENDER_LABEL: Record<MessageSenderRole, string> = {
  client:      'Le client',
  school:      "L'école",
  workshop:    "L'atelier",
  plume_admin: 'Plume',
}

interface TicketContext {
  client_id:      string | null
  user_id:        string | null
  product_brand:  string | null
  product_model:  string | null
}

async function loadTicketContext(
  supabase: SupabaseClient,
  ticketId: string,
): Promise<TicketContext | null> {
  const { data, error } = await supabase
    .from('service_requests')
    .select('client_id, user_id, product_brand, product_model')
    .eq('id', ticketId)
    .maybeSingle()
    .returns<TicketContext>()

  if (error || !data) {
    console.warn('[notif] loadTicketContext failed:', error?.message ?? 'no data')
    return null
  }
  return data
}

function productLineOf(t: TicketContext): string {
  return [t.product_brand, t.product_model].filter(Boolean).join(' ') || 'votre demande'
}

function clientUserIdOf(t: TicketContext): string | null {
  return t.client_id ?? t.user_id
}

// ─── Messages ────────────────────────────────────────────────────────────

/**
 * Notifie le client qu'il a reçu un nouveau message — sauf si c'est lui
 * qui l'a posté, ou si le canal ne lui est pas visible.
 */
export async function notifyClientOnIncomingMessage(
  supabase:   SupabaseClient,
  ticketId:   string,
  senderRole: MessageSenderRole,
  channel:    MessageChannel | null,
): Promise<void> {
  if (senderRole === 'client') return
  // Legacy (channel NULL) : on suppose visible client (cohérent avec le
  // calcul du badge unread legacy qui regarde visibility_level='all').
  if (channel && !CLIENT_VISIBLE_CHANNELS.includes(channel)) return

  const ticket = await loadTicketContext(supabase, ticketId)
  if (!ticket) return
  const clientId = clientUserIdOf(ticket)
  if (!clientId) return

  await notifyUser(supabase, {
    targetUserId: clientId,
    ticketId,
    eventType:    'message_received',
    title:        `${SENDER_LABEL[senderRole]} vous a répondu`,
    message:      `Nouveau message sur ${productLineOf(ticket)}.`,
    actionUrl:    `/client/ticket/${ticketId}`,
    severity:     'info',
  })
}

// ─── Shipping (BAT) ──────────────────────────────────────────────────────

export async function notifyClientOnShippingApproved(
  supabase: SupabaseClient,
  ticketId: string,
): Promise<void> {
  const ticket = await loadTicketContext(supabase, ticketId)
  if (!ticket) return
  const clientId = clientUserIdOf(ticket)
  if (!clientId) return

  await notifyUser(supabase, {
    targetUserId: clientId,
    ticketId,
    eventType:    'shipping_approved',
    title:        'Bon de transport validé',
    message:      `L'école a validé l'envoi postal de ${productLineOf(ticket)}. Vous pouvez générer votre étiquette.`,
    actionUrl:    `/client/ticket/${ticketId}`,
    severity:     'success',
  })
}

export async function notifyClientOnShippingRefused(
  supabase:      SupabaseClient,
  ticketId:      string,
  refusalReason: string | null,
): Promise<void> {
  const ticket = await loadTicketContext(supabase, ticketId)
  if (!ticket) return
  const clientId = clientUserIdOf(ticket)
  if (!clientId) return

  const reason = refusalReason?.trim() || "Voir le ticket pour plus de détails."
  await notifyUser(supabase, {
    targetUserId: clientId,
    ticketId,
    eventType:    'shipping_refused',
    title:        "Envoi postal refusé",
    message:      `L'école a refusé l'envoi postal de ${productLineOf(ticket)}. ${reason}`,
    actionUrl:    `/client/ticket/${ticketId}`,
    severity:     'warning',
  })
}

// Validation Plume HQ — déclenchée quand le client a dépassé le seuil annuel
// de SAV (auto_approved_shipping = FALSE). Sémantiquement proche des deux
// helpers école ci-dessus, mais le message indique clairement que c'est
// Plume HQ qui a tranché, pas l'école.
export async function notifyClientOnPlumeShippingApproved(
  supabase: SupabaseClient,
  ticketId: string,
): Promise<void> {
  const ticket = await loadTicketContext(supabase, ticketId)
  if (!ticket) return
  const clientId = clientUserIdOf(ticket)
  if (!clientId) return

  await notifyUser(supabase, {
    targetUserId: clientId,
    ticketId,
    eventType:    'shipping_approved',
    title:        'Bon de transport validé par Plume',
    message:      `Plume a validé votre demande d'envoi postal pour ${productLineOf(ticket)}. Vous pouvez générer votre étiquette.`,
    actionUrl:    `/client/ticket/${ticketId}`,
    severity:     'success',
  })
}

export async function notifyClientOnPlumeShippingRefused(
  supabase:      SupabaseClient,
  ticketId:      string,
  refusalReason: string | null,
): Promise<void> {
  const ticket = await loadTicketContext(supabase, ticketId)
  if (!ticket) return
  const clientId = clientUserIdOf(ticket)
  if (!clientId) return

  const reason = refusalReason?.trim() || "Voir le ticket pour plus de détails."
  await notifyUser(supabase, {
    targetUserId: clientId,
    ticketId,
    eventType:    'shipping_refused',
    title:        'Envoi postal refusé par Plume',
    message:      `Plume a refusé l'envoi postal de ${productLineOf(ticket)}. ${reason}`,
    actionUrl:    `/client/ticket/${ticketId}`,
    severity:     'warning',
  })
}

// ─── Pipeline statuts (client-visible) ───────────────────────────────────

export async function notifyClientOnWingReceivedSchool(
  supabase: SupabaseClient,
  ticketId: string,
): Promise<void> {
  const ticket = await loadTicketContext(supabase, ticketId)
  if (!ticket) return
  const clientId = clientUserIdOf(ticket)
  if (!clientId) return

  await notifyUser(supabase, {
    targetUserId: clientId,
    ticketId,
    eventType:    'wing_received_school',
    title:        `Votre aile est arrivée à l'école`,
    message:      `L'école a confirmé la réception de ${productLineOf(ticket)}.`,
    actionUrl:    `/client/ticket/${ticketId}`,
    severity:     'success',
  })
}

export async function notifyClientOnEscalatedToWorkshop(
  supabase: SupabaseClient,
  ticketId: string,
): Promise<void> {
  const ticket = await loadTicketContext(supabase, ticketId)
  if (!ticket) return
  const clientId = clientUserIdOf(ticket)
  if (!clientId) return

  await notifyUser(supabase, {
    targetUserId: clientId,
    ticketId,
    eventType:    'escalated_to_workshop',
    title:        `Votre aile part à l'atelier`,
    message:      `L'école a transmis ${productLineOf(ticket)} à l'atelier pour intervention.`,
    actionUrl:    `/client/ticket/${ticketId}`,
    severity:     'info',
  })
}

export async function notifyClientOnWorkshopDecision(
  supabase:    SupabaseClient,
  ticketId:    string,
  decision:    'no_issue' | 'repair' | 'replacement',
): Promise<void> {
  const ticket = await loadTicketContext(supabase, ticketId)
  if (!ticket) return
  const clientId = clientUserIdOf(ticket)
  if (!clientId) return

  const titleByDecision: Record<typeof decision, string> = {
    no_issue:    "Diagnostic atelier : pas d'intervention nécessaire",
    repair:      "Diagnostic atelier : réparation prévue",
    replacement: "Diagnostic atelier : remplacement de l'aile",
  }
  const severityByDecision: Record<typeof decision, 'info' | 'success' | 'warning'> = {
    no_issue:    'success',
    repair:      'info',
    replacement: 'warning',
  }

  await notifyUser(supabase, {
    targetUserId: clientId,
    ticketId,
    eventType:    `workshop_decision_${decision}`,
    title:        titleByDecision[decision],
    message:      `L'atelier a posé son diagnostic sur ${productLineOf(ticket)}.`,
    actionUrl:    `/client/ticket/${ticketId}`,
    severity:     severityByDecision[decision],
  })
}

export async function notifyClientOnWingReturned(
  supabase: SupabaseClient,
  ticketId: string,
): Promise<void> {
  const ticket = await loadTicketContext(supabase, ticketId)
  if (!ticket) return
  const clientId = clientUserIdOf(ticket)
  if (!clientId) return

  await notifyUser(supabase, {
    targetUserId: clientId,
    ticketId,
    eventType:    'wing_returned',
    title:        `${productLineOf(ticket)} repart vers vous`,
    message:      `L'atelier a renvoyé votre aile. Vous recevrez le numéro de suivi par message.`,
    actionUrl:    `/client/ticket/${ticketId}`,
    severity:     'success',
  })
}

export async function notifyClientOnTicketClosed(
  supabase: SupabaseClient,
  ticketId: string,
): Promise<void> {
  const ticket = await loadTicketContext(supabase, ticketId)
  if (!ticket) return
  const clientId = clientUserIdOf(ticket)
  if (!clientId) return

  await notifyUser(supabase, {
    targetUserId: clientId,
    ticketId,
    eventType:    'ticket_closed',
    title:        `Demande SAV clôturée`,
    message:      `Votre demande sur ${productLineOf(ticket)} a été clôturée. Vous pouvez la consulter dans votre historique.`,
    actionUrl:    `/client/ticket/${ticketId}`,
    severity:     'success',
  })
}
