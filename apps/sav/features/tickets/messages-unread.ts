// Counts unread visible messages per ticket for the client.
//
// "Unread" = visibility_level === 'all' AND sender_role !== 'client' AND
// created_at > service_requests.client_last_read_at.
//
// Kept in its own file so we don't add to actions.ts / queries.ts which are
// already past the 300-line house limit.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { TicketWithPhotos } from './types'

export type TicketWithUnread = TicketWithPhotos & {
  unread_count: number
}

// Reads `client_last_read_at` from the row even though it may not yet be in
// the generated DB types — the migration adding the column was applied
// independently. Returns 0 when the column is missing (back-compat).
function readLastReadAt(ticket: TicketWithPhotos): number {
  const raw = (ticket as unknown as { client_last_read_at?: string | null })
    .client_last_read_at
  return raw ? new Date(raw).getTime() : 0
}

/**
 * Adds an `unread_count` field to each ticket. Performs ONE batched query for
 * all messages of the given tickets and folds them in-memory.
 */
export async function attachUnreadCounts(
  supabase: SupabaseClient,
  tickets: TicketWithPhotos[],
): Promise<TicketWithUnread[]> {
  if (tickets.length === 0) return []

  const ticketIds = tickets.map((t) => t.id)
  const { data: messages, error } = await supabase
    .from('ticket_messages')
    .select('ticket_id, sender_role, visibility_level, created_at')
    .in('ticket_id', ticketIds)

  if (error) {
    // RLS or transient issue — fall back to "all read" rather than blocking
    // the page render. The user just won't see badges.
    console.warn('attachUnreadCounts messages query failed:', error.message)
    return tickets.map((t) => ({ ...t, unread_count: 0 }))
  }

  const lastReadByTicket = new Map<string, number>()
  for (const t of tickets) lastReadByTicket.set(t.id, readLastReadAt(t))

  const unreadByTicket = new Map<string, number>()
  for (const m of messages ?? []) {
    if (m.sender_role === 'client') continue
    if (m.visibility_level !== 'all') continue
    const lastRead = lastReadByTicket.get(m.ticket_id) ?? 0
    if (new Date(m.created_at).getTime() > lastRead) {
      unreadByTicket.set(m.ticket_id, (unreadByTicket.get(m.ticket_id) ?? 0) + 1)
    }
  }

  return tickets.map((t) => ({
    ...t,
    unread_count: unreadByTicket.get(t.id) ?? 0,
  }))
}
