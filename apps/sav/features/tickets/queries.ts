import { createClient } from '@/lib/supabase/server'
import type { TicketWithPhotos, TicketDetail, TicketStatus } from './types'

export type ClientWing = {
  id: string
  serial_number: string
  product_model: string   // kebab model code, e.g. "blow-ultra"
  product_label: string   // full display name, e.g. "Blow Ultra 22 Electric Blue"
  size: string | null
  color_name: string | null
  registered_at: string
}

const DETAIL_SELECT = `
  *,
  ticket_photos ( id, storage_path, photo_type, caption, sort_order, created_at ),
  ticket_status_history ( id, old_status, new_status, changed_by, note, changed_at ),
  ticket_messages ( id, sender_id, sender_role, content, is_internal, visibility_level, created_at )
`

export type TicketStats = {
  total: number
  urgent: number
  thisMonth: number
  byStatus: Partial<Record<TicketStatus, number>>
}

// ── Client ───────────────────────────────────────────────────────────────────

export async function getClientWings(): Promise<ClientWing[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // customer_wings is a shared-platform table not in the SAV DB types — cast via any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data, error } = await db
    .from('customer_wings')
    .select('id, serial_number, product_model, product_label, size, color_name, registered_at')
    .eq('owner_user_id', user.id)
    .order('registered_at', { ascending: false })

  if (error) {
    console.error('getClientWings error:', error.message)
    return []
  }
  return (data ?? []) as ClientWing[]
}

export async function getClientTickets(): Promise<TicketWithPhotos[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // RLS (updated by migration) handles visibility : client_id OR user_id = auth.uid()
  const { data, error } = await supabase
    .from('service_requests')
    .select('*, ticket_photos ( id, storage_path, photo_type, sort_order )')
    .neq('sav_status', 'draft')
    .order('created_at', { ascending: false })
    .returns<TicketWithPhotos[]>()

  if (error) {
    console.error('getClientTickets error:', error.message)
    return []
  }
  return data ?? []
}

export async function getTicketDetail(ticketId: string): Promise<TicketDetail | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('service_requests')
    .select(DETAIL_SELECT)
    .eq('id', ticketId)
    .single()
    .returns<TicketDetail>()

  if (error) {
    console.error('getTicketDetail error:', error.message)
    return null
  }
  return data
}

// ── School ───────────────────────────────────────────────────────────────────

export async function getSchoolTickets(): Promise<TicketWithPhotos[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // RLS filters to the user's school automatically
  const { data, error } = await supabase
    .from('service_requests')
    .select('*, ticket_photos ( id, storage_path, photo_type, sort_order )')
    .in('sav_status', ['submitted', 'in_review', 'diagnosed'])
    .order('urgency', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<TicketWithPhotos[]>()

  if (error) {
    console.error('getSchoolTickets error:', error.message)
    return []
  }
  return data ?? []
}

export async function getSchoolTicketDetail(ticketId: string): Promise<TicketDetail | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Schools see all messages (including internal ones from school)
  const { data, error } = await supabase
    .from('service_requests')
    .select(DETAIL_SELECT)
    .eq('id', ticketId)
    .single()
    .returns<TicketDetail>()

  if (error) {
    console.error('getSchoolTicketDetail error:', error.message)
    return null
  }
  return data
}

// ── Workshop ─────────────────────────────────────────────────────────────────

export async function getWorkshopTickets(): Promise<TicketWithPhotos[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('service_requests')
    .select('*, ticket_photos ( id, storage_path, photo_type, sort_order )')
    .in('sav_status', ['diagnosed', 'repair_in_progress', 'repaired', 'shipped'])
    .order('urgency', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<TicketWithPhotos[]>()

  if (error) {
    console.error('getWorkshopTickets error:', error.message)
    return []
  }
  return data ?? []
}

export async function getWorkshopTicketDetail(ticketId: string): Promise<TicketDetail | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('service_requests')
    .select(DETAIL_SELECT)
    .eq('id', ticketId)
    .single()
    .returns<TicketDetail>()

  if (error) {
    console.error('getWorkshopTicketDetail error:', error.message)
    return null
  }
  return data
}

// ── Plume Admin ───────────────────────────────────────────────────────────────

export async function getAllTickets(): Promise<TicketWithPhotos[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('service_requests')
    .select('*, ticket_photos ( id, storage_path, photo_type, sort_order )')
    .neq('sav_status', 'draft')
    .order('urgency', { ascending: false })
    .order('created_at', { ascending: false })
    .returns<TicketWithPhotos[]>()

  if (error) {
    console.error('getAllTickets error:', error.message)
    return []
  }
  return data ?? []
}

export async function getTicketStats(): Promise<TicketStats> {
  const tickets = await getAllTickets()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const byStatus: Partial<Record<TicketStatus, number>> = {}
  for (const t of tickets) {
    byStatus[t.sav_status] = (byStatus[t.sav_status] ?? 0) + 1
  }

  return {
    total: tickets.length,
    urgent: tickets.filter((t) => t.urgency === 'urgent').length,
    thisMonth: tickets.filter((t) => t.created_at >= startOfMonth).length,
    byStatus,
  }
}
