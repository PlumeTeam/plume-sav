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

// ── Inbox helpers (nav badge + /client/messages page) ────────────────────────

/**
 * Lightweight count for the navbar badge — avoids fetching photo/message
 * payloads. Returns 0 on any error so the layout never crashes.
 */
export async function getClientUnreadTotal(supabase: SupabaseClient): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // RLS already scopes to the user's tickets — no manual filter needed.
  const { data: tickets, error: trErr } = await supabase
    .from('service_requests')
    .select('id, client_last_read_at')
  if (trErr || !tickets || tickets.length === 0) return 0

  const ticketIds = tickets.map((t: { id: string }) => t.id)
  const { data: messages, error: msgErr } = await supabase
    .from('ticket_messages')
    .select('ticket_id, sender_role, visibility_level, created_at')
    .in('ticket_id', ticketIds)
  if (msgErr || !messages) return 0

  const lastReadByTicket = new Map<string, number>()
  for (const t of tickets as Array<{ id: string; client_last_read_at: string | null }>) {
    lastReadByTicket.set(t.id, t.client_last_read_at ? new Date(t.client_last_read_at).getTime() : 0)
  }

  let total = 0
  for (const m of messages as Array<{ ticket_id: string; sender_role: string; visibility_level: string; created_at: string }>) {
    if (m.sender_role === 'client') continue
    if (m.visibility_level !== 'all') continue
    const lastRead = lastReadByTicket.get(m.ticket_id) ?? 0
    if (new Date(m.created_at).getTime() > lastRead) total += 1
  }
  return total
}

export type InboxThread = {
  ticketId:     string
  ticketRef:    string                // PLM-XXX or fallback short id
  productLine:  string
  status:       string
  schoolName:   string | null
  lastMessage:  { content: string; senderRole: string; createdAt: string } | null
  unreadCount:  number
  // For sorting in the UI
  lastActivity: string                // ISO timestamp of last message OR ticket creation
}

/**
 * Returns one row per ticket that the client owns, enriched with the latest
 * visible message and its unread count, sorted by last activity desc. Used
 * by /client/messages.
 */
export async function getClientInboxThreads(supabase: SupabaseClient): Promise<InboxThread[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // NB: `ticket_number` is not (yet) a real column on service_requests in
  // this Supabase project — selecting it makes PostgREST 400 the whole query
  // and the inbox silently goes empty. Fall back to the id slice for the ref.
  const { data: tickets, error: trErr } = await supabase
    .from('service_requests')
    .select('id, status, product_brand, product_model, referent_school_id, school_id, client_last_read_at, created_at')
    .order('created_at', { ascending: false })
  if (trErr) {
    console.warn('getClientInboxThreads tickets query failed:', trErr.message)
    return []
  }
  if (!tickets || tickets.length === 0) return []

  type TicketRow = {
    id: string
    status: string
    product_brand: string | null
    product_model: string | null
    referent_school_id: string | null
    school_id: string | null
    client_last_read_at: string | null
    created_at: string
  }

  const ticketRows = tickets as TicketRow[]
  const ticketIds = ticketRows.map((t) => t.id)

  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('id, ticket_id, sender_role, visibility_level, created_at, content')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: true })

  type MessageRow = { id: string; ticket_id: string; sender_role: string; visibility_level: string; created_at: string; content: string }
  const msgRows = (messages ?? []) as MessageRow[]

  // Resolve school names in a single batched query (no FK relationship
  // declared in PostgREST, so we can't nest-select).
  const schoolIds = Array.from(new Set(
    ticketRows.flatMap((t) => [t.school_id, t.referent_school_id]).filter((x): x is string => Boolean(x))
  ))
  const schoolNameById = new Map<string, string>()
  if (schoolIds.length > 0) {
    // partner_schools is a shared-platform table not in SAV DB types — cast.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: schools } = await (supabase as any)
      .from('partner_schools')
      .select('id, name')
      .in('id', schoolIds)
    for (const s of (schools ?? []) as Array<{ id: string; name: string }>) {
      schoolNameById.set(s.id, s.name)
    }
  }

  return ticketRows.map((t) => {
    const visibleMessages = msgRows.filter((m) => m.ticket_id === t.id && m.visibility_level === 'all')
    const lastMsg = visibleMessages[visibleMessages.length - 1] ?? null
    const lastReadMs = t.client_last_read_at ? new Date(t.client_last_read_at).getTime() : 0
    const unread = visibleMessages.filter((m) => m.sender_role !== 'client' && new Date(m.created_at).getTime() > lastReadMs).length

    const productLine = [t.product_brand, t.product_model].filter(Boolean).join(' ') || 'Aile'
    const ticketRef = `#${t.id.slice(0, 8).toUpperCase()}`
    const schoolName = (t.school_id && schoolNameById.get(t.school_id))
      ?? (t.referent_school_id && schoolNameById.get(t.referent_school_id))
      ?? null

    return {
      ticketId:     t.id,
      ticketRef,
      productLine,
      status:       t.status,
      schoolName,
      lastMessage:  lastMsg ? { content: lastMsg.content, senderRole: lastMsg.sender_role, createdAt: lastMsg.created_at } : null,
      unreadCount:  unread,
      lastActivity: lastMsg?.created_at ?? t.created_at,
    }
  }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
}
