// Unread tracking for the SCHOOL role.
//
// Mirrors messages-unread.ts (client version) but with school-specific filters:
//  - "Unread" excludes messages whose sender_role === 'school' (own messages).
//  - Système 5-canaux : l'école voit school_client, workshop_school, group.
//    Fallback legacy (channel NULL) : visibility_level ∈ {all, workshop_plume,
//    school_plume}.
//  - Compared against service_requests.school_last_read_at.

import type { SupabaseClient } from '@supabase/supabase-js'

const SCHOOL_CHANNELS = ['school_client', 'workshop_school', 'group']
const SCHOOL_LEGACY_VISIBILITY = ['all', 'workshop_plume', 'school_plume']

function isSchoolVisible(m: { channel?: string | null; visibility_level: string }): boolean {
  if (m.channel) return SCHOOL_CHANNELS.includes(m.channel)
  return SCHOOL_LEGACY_VISIBILITY.includes(m.visibility_level)
}

export type SchoolInboxThread = {
  ticketId:     string
  ticketRef:    string
  productLine:  string
  status:       string
  clientName:   string             // "Prénom Nom" — the school's counterpart
  lastMessage:  { content: string; senderRole: string; createdAt: string } | null
  unreadCount:  number
  lastActivity: string
}

export async function getSchoolUnreadTotal(supabase: SupabaseClient): Promise<number> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  // RLS scopes to tickets visible to this school user (sec_partner_select_school).
  const { data: tickets, error: trErr } = await supabase
    .from('service_requests')
    .select('id, school_last_read_at')
  if (trErr || !tickets || tickets.length === 0) return 0

  const ticketIds = tickets.map((t: { id: string }) => t.id)
  const { data: messages, error: msgErr } = await supabase
    .from('ticket_messages')
    .select('ticket_id, sender_role, visibility_level, channel, created_at')
    .in('ticket_id', ticketIds)
  if (msgErr || !messages) return 0

  const lastReadByTicket = new Map<string, number>()
  for (const t of tickets as Array<{ id: string; school_last_read_at: string | null }>) {
    lastReadByTicket.set(t.id, t.school_last_read_at ? new Date(t.school_last_read_at).getTime() : 0)
  }

  let total = 0
  for (const m of messages as Array<{ ticket_id: string; sender_role: string; visibility_level: string; channel: string | null; created_at: string }>) {
    if (m.sender_role === 'school') continue
    if (!isSchoolVisible(m)) continue
    const lastRead = lastReadByTicket.get(m.ticket_id) ?? 0
    if (new Date(m.created_at).getTime() > lastRead) total += 1
  }
  return total
}

export async function getSchoolInboxThreads(supabase: SupabaseClient): Promise<SchoolInboxThread[]> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: tickets, error: trErr } = await supabase
    .from('service_requests')
    .select('id, status, first_name, last_name, product_brand, product_model, school_last_read_at, created_at')
    .order('created_at', { ascending: false })
  if (trErr) {
    console.warn('getSchoolInboxThreads tickets query failed:', trErr.message)
    return []
  }
  if (!tickets || tickets.length === 0) return []

  type TicketRow = {
    id: string; status: string
    first_name: string | null; last_name: string | null
    product_brand: string | null; product_model: string | null
    school_last_read_at: string | null
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
    const visibleMessages = msgRows.filter((m) => m.ticket_id === t.id && isSchoolVisible(m))
    const lastMsg = visibleMessages[visibleMessages.length - 1] ?? null
    const lastReadMs = t.school_last_read_at ? new Date(t.school_last_read_at).getTime() : 0
    const unread = visibleMessages.filter((m) => m.sender_role !== 'school' && new Date(m.created_at).getTime() > lastReadMs).length

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
