// Unread tracking for the WORKSHOP role.
//
// Mirrors the school version with workshop-specific filters:
//  - "Unread" excludes messages whose sender_role === 'workshop'.
//  - Visible levels: 'all' + 'workshop_plume' (cf. workshop ticket detail
//    page filter — workshops do NOT see 'school_plume' or 'plume_only').
//  - Compared against service_requests.workshop_last_read_at.
//
// Note: workshop SELECT policy on service_requests scopes to
// (assigned_workshop_id IS NOT NULL AND status IN escalated set), so the
// inbox naturally excludes pending/cancelled tickets the workshop can't see.

import type { SupabaseClient } from '@supabase/supabase-js'

// 5-canaux : l'atelier voit client_workshop, workshop_school, group,
// workshop_plume. Fallback legacy (channel NULL) sur visibility_level.
const WORKSHOP_CHANNELS = ['client_workshop', 'workshop_school', 'group', 'workshop_plume']
const WORKSHOP_LEGACY_VISIBILITY = ['all', 'workshop_plume']

function isWorkshopVisible(m: { channel?: string | null; visibility_level: string }): boolean {
  if (m.channel) return WORKSHOP_CHANNELS.includes(m.channel)
  return WORKSHOP_LEGACY_VISIBILITY.includes(m.visibility_level)
}

export type WorkshopInboxThread = {
  ticketId:     string
  ticketRef:    string
  productLine:  string
  status:       string
  clientName:   string
  lastMessage:  { content: string; senderRole: string; createdAt: string } | null
  unreadCount:  number
  lastActivity: string
}

export async function getWorkshopUnreadTotal(supabase: SupabaseClient): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  const { data: tickets, error: trErr } = await supabase
    .from('service_requests')
    .select('id, workshop_last_read_at')
  if (trErr || !tickets || tickets.length === 0) return 0

  const ticketIds = tickets.map((t: { id: string }) => t.id)
  const { data: messages, error: msgErr } = await supabase
    .from('ticket_messages')
    .select('ticket_id, sender_role, visibility_level, channel, created_at')
    .in('ticket_id', ticketIds)
  if (msgErr || !messages) return 0

  const lastReadByTicket = new Map<string, number>()
  for (const t of tickets as Array<{ id: string; workshop_last_read_at: string | null }>) {
    lastReadByTicket.set(t.id, t.workshop_last_read_at ? new Date(t.workshop_last_read_at).getTime() : 0)
  }

  let total = 0
  for (const m of messages as Array<{ ticket_id: string; sender_role: string; visibility_level: string; channel: string | null; created_at: string }>) {
    if (m.sender_role === 'workshop') continue
    if (!isWorkshopVisible(m)) continue
    const lastRead = lastReadByTicket.get(m.ticket_id) ?? 0
    if (new Date(m.created_at).getTime() > lastRead) total += 1
  }
  return total
}

export async function getWorkshopInboxThreads(supabase: SupabaseClient): Promise<WorkshopInboxThread[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: tickets, error: trErr } = await supabase
    .from('service_requests')
    .select('id, status, first_name, last_name, product_brand, product_model, workshop_last_read_at, created_at')
    .order('created_at', { ascending: false })
  if (trErr) {
    console.warn('getWorkshopInboxThreads tickets query failed:', trErr.message)
    return []
  }
  if (!tickets || tickets.length === 0) return []

  type TicketRow = {
    id: string; status: string
    first_name: string | null; last_name: string | null
    product_brand: string | null; product_model: string | null
    workshop_last_read_at: string | null
    created_at: string
  }
  const ticketRows = tickets as TicketRow[]
  const ticketIds = ticketRows.map((t) => t.id)

  const { data: messages } = await supabase
    .from('ticket_messages')
    .select('id, ticket_id, sender_role, visibility_level, channel, created_at, content')
    .in('ticket_id', ticketIds)
    .order('created_at', { ascending: true })

  type MessageRow = { id: string; ticket_id: string; sender_role: string; visibility_level: string; channel: string | null; created_at: string; content: string }
  const msgRows = (messages ?? []) as MessageRow[]

  return ticketRows.map((t) => {
    const visibleMessages = msgRows.filter((m) => m.ticket_id === t.id && isWorkshopVisible(m))
    const lastMsg = visibleMessages[visibleMessages.length - 1] ?? null
    const lastReadMs = t.workshop_last_read_at ? new Date(t.workshop_last_read_at).getTime() : 0
    const unread = visibleMessages.filter((m) => m.sender_role !== 'workshop' && new Date(m.created_at).getTime() > lastReadMs).length

    const productLine = [t.product_brand, t.product_model].filter(Boolean).join(' ') || 'Aile'
    const ticketRef = `#${t.id.slice(0, 8).toUpperCase()}`
    const clientName = [t.first_name, t.last_name].filter(Boolean).join(' ') || 'Client'

    return {
      ticketId:     t.id,
      ticketRef,
      productLine,
      status:       t.status,
      clientName,
      lastMessage:  lastMsg ? { content: lastMsg.content, senderRole: lastMsg.sender_role, createdAt: lastMsg.created_at } : null,
      unreadCount:  unread,
      lastActivity: lastMsg?.created_at ?? t.created_at,
    }
  }).sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())
}
