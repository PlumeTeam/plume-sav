// Unread tracking for the PLUME ADMIN role.
//
// Plume admins are MULTIPLE distinct users sharing the same overarching view
// — so unread state is per-user, not per-ticket. Backed by the
// plume_admin_ticket_reads(user_id, ticket_id, read_at) table.
//
// Plume sees EVERY message regardless of visibility_level (admin notes
// included). "Unread" = sender_role !== 'plume_admin' AND created_at >
// read_at (or no read row at all).

import type { SupabaseClient } from '@supabase/supabase-js'

export type PlumeInboxThread = {
  ticketId:     string
  ticketRef:    string
  productLine:  string
  status:       string
  clientName:   string
  lastMessage:  { content: string; senderRole: string; createdAt: string; visibilityLevel: string } | null
  unreadCount:  number
  lastActivity: string
}

async function loadReadMap(
  supabase: SupabaseClient,
  userId: string,
  ticketIds: string[],
): Promise<Map<string, number>> {
  if (ticketIds.length === 0) return new Map()
  // plume_admin_ticket_reads is a shared-platform table not in SAV DB types.
  const db = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> }
  const { data: reads } = await db
    .from('plume_admin_ticket_reads')
    .select('ticket_id, read_at')
    .eq('user_id', userId)
    .in('ticket_id', ticketIds)
  const map = new Map<string, number>()
  for (const r of (reads ?? []) as Array<{ ticket_id: string; read_at: string }>) {
    map.set(r.ticket_id, new Date(r.read_at).getTime())
  }
  return map
}

export async function getPlumeUnreadTotal(supabase: SupabaseClient): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // Plume admins have sec_admin_all on service_requests (USING is_admin()).
  const { data: tickets, error: trErr } = await supabase
    .from('service_requests')
    .select('id')
  if (trErr || !tickets || tickets.length === 0) return 0

  const ticketIds = (tickets as Array<{ id: string }>).map((t) => t.id)

  const [readMap, msgRes] = await Promise.all([
    loadReadMap(supabase, user.id, ticketIds),
    supabase
      .from('ticket_messages')
      .select('ticket_id, sender_role, created_at')
      .in('ticket_id', ticketIds),
  ])
  if (msgRes.error || !msgRes.data) return 0

  let total = 0
  for (const m of msgRes.data as Array<{ ticket_id: string; sender_role: string; created_at: string }>) {
    if (m.sender_role === 'plume_admin') continue
    const lastRead = readMap.get(m.ticket_id) ?? 0
    if (new Date(m.created_at).getTime() > lastRead) total += 1
  }
  return total
}

export async function getPlumeInboxThreads(supabase: SupabaseClient): Promise<PlumeInboxThread[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: tickets, error: trErr } = await supabase
    .from('service_requests')
    .select('id, status, first_name, last_name, product_brand, product_model, created_at')
    .order('created_at', { ascending: false })
  if (trErr) {
    console.warn('getPlumeInboxThreads tickets query failed:', trErr.message)
    return []
  }
  if (!tickets || tickets.length === 0) return []

  type TicketRow = {
    id: string; status: string
    first_name: string | null; last_name: string | null
    product_brand: string | null; product_model: string | null
    created_at: string
  }
  const ticketRows = tickets as TicketRow[]
  const ticketIds = ticketRows.map((t) => t.id)

  const [readMap, msgRes] = await Promise.all([
    loadReadMap(supabase, user.id, ticketIds),
    supabase
      .from('ticket_messages')
      .select('id, ticket_id, sender_role, visibility_level, created_at, content')
      .in('ticket_id', ticketIds)
      .order('created_at', { ascending: true }),
  ])
  type MessageRow = { id: string; ticket_id: string; sender_role: string; visibility_level: string; created_at: string; content: string }
  const msgRows = (msgRes.data ?? []) as MessageRow[]

  return ticketRows.map((t) => {
    const visibleMessages = msgRows.filter((m) => m.ticket_id === t.id)
    const lastMsg = visibleMessages[visibleMessages.length - 1] ?? null
    const lastReadMs = readMap.get(t.id) ?? 0
    const unread = visibleMessages.filter((m) => m.sender_role !== 'plume_admin' && new Date(m.created_at).getTime() > lastReadMs).length

    const productLine = [t.product_brand, t.product_model].filter(Boolean).join(' ') || 'Aile'
    const ticketRef = `#${t.id.slice(0, 8).toUpperCase()}`
    const clientName = [t.first_name, t.last_name].filter(Boolean).join(' ') || 'Client'

    return {
      ticketId:     t.id,
      ticketRef,
      productLine,
      status:       t.status,
      clientName,
      lastMessage:  lastMsg
        ? {
            content:         lastMsg.content,
            senderRole:      lastMsg.sender_role,
            createdAt:       lastMsg.created_at,
            visibilityLevel: lastMsg.visibility_level,
          }
        : null,
      unreadCount:  unread,
      lastActivity: lastMsg?.created_at ?? t.created_at,
    }
  }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
}
