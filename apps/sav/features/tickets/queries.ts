import { createClient } from '@/lib/supabase/server'
import type { TicketWithPhotos, TicketDetail, TicketStatus, RequestStatus } from './types'

export type ClientWing = {
  id: string
  serial_number: string
  product_model: string   // kebab model code, e.g. "blow-ultra"
  product_label: string   // full display name, e.g. "Blow Ultra 22 Electric Blue"
  size: string | null
  color_name: string | null
  registered_at: string
  partner_school_id: string | null  // École référente liée à l'achat
}

export type PartnerSchool = {
  id:      string
  name:    string
  city?:   string | null
  region?: string | null
  /** Latitude in WGS84. May be missing for DB-sourced schools without coords. */
  lat?:    number | null
  /** Longitude in WGS84. */
  lng?:    number | null
}

// Hardcoded coord overlay: when a school comes from the DB without lat/lng,
// match it by id or name and patch coords. Coords approximate the city centre.
const SCHOOL_COORDS_BY_ID: Record<string, { lat: number; lng: number }> = {
  'plume-default-annecy':    { lat: 45.8992, lng: 6.1294 },
  'plume-default-stHilaire': { lat: 45.3000, lng: 5.8833 },
  'plume-default-chamonix':  { lat: 45.9237, lng: 6.8694 },
}

const SCHOOL_COORDS_BY_NAME: Record<string, { lat: number; lng: number }> = {
  'École Plume Annecy':            { lat: 45.8992, lng: 6.1294 },
  'Saint-Hilaire Parapente':       { lat: 45.3000, lng: 5.8833 },
  'Chamonix Parapente':            { lat: 45.9237, lng: 6.8694 },
  'Plume Saint-Hilaire':           { lat: 45.3000, lng: 5.8833 },
  'Plume Annecy':                  { lat: 45.8992, lng: 6.1294 },
}

// Hardcoded fallback used when partner_schools is empty/unavailable.
const FALLBACK_PARTNER_SCHOOLS: PartnerSchool[] = [
  { id: 'plume-default-annecy',    name: 'École Plume Annecy',      region: 'Haute-Savoie', city: 'Annecy',         lat: 45.8992, lng: 6.1294 },
  { id: 'plume-default-stHilaire', name: 'Saint-Hilaire Parapente', region: 'Isère',        city: 'Saint-Hilaire',  lat: 45.3000, lng: 5.8833 },
  { id: 'plume-default-chamonix',  name: 'Chamonix Parapente',      region: 'Haute-Savoie', city: 'Chamonix',       lat: 45.9237, lng: 6.8694 },
]

function enrichWithCoords(s: PartnerSchool): PartnerSchool {
  if (s.lat != null && s.lng != null) return s
  const fromId   = SCHOOL_COORDS_BY_ID[s.id]
  const fromName = SCHOOL_COORDS_BY_NAME[s.name]
  const coords   = fromId ?? fromName
  return coords ? { ...s, lat: coords.lat, lng: coords.lng } : s
}

export async function getPartnerSchools(): Promise<PartnerSchool[]> {
  const supabase = await createClient()
  // partner_schools is a shared-platform table not in the SAV DB types.
  const db = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> }

  // Try the optimistic select with coords; if columns don't exist, retry without.
  let data: PartnerSchool[] | null = null
  try {
    const r = await db
      .from('partner_schools')
      .select('id, name, city, region, lat, lng')
      .order('name', { ascending: true })
    if (!r.error) data = r.data as PartnerSchool[] | null
  } catch { /* will retry below */ }

  if (!data) {
    const r = await db
      .from('partner_schools')
      .select('id, name, city, region')
      .order('name', { ascending: true })
    if (r.error || !r.data || r.data.length === 0) {
      if (r.error) console.warn('getPartnerSchools fallback:', r.error.message)
      return FALLBACK_PARTNER_SCHOOLS.map(enrichWithCoords)
    }
    data = r.data as PartnerSchool[]
  }

  if (data.length === 0) return FALLBACK_PARTNER_SCHOOLS.map(enrichWithCoords)
  return data.map(enrichWithCoords)
}

// Hydrates a ticket row with its related collections via 3 separate queries
// instead of a single PostgREST join. Reason: the joined tables (ticket_photos,
// ticket_status_history, ticket_messages) may not all exist on the live DB
// — a missing FK relationship makes the joined SELECT fail entirely. Splitting
// per-table makes each lookup independent and best-effort.
//
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function hydrateTicket(supabase: any, row: Record<string, unknown>): Promise<TicketDetail> {
  const ticketId = row.id as string

  const [photosR, historyR, messagesR] = await Promise.all([
    supabase
      .from('ticket_photos')
      .select('id, ticket_id, storage_path, photo_type, caption, sort_order, created_at')
      .eq('ticket_id', ticketId)
      .order('sort_order', { ascending: true })
      .then(
        (r: { data: unknown; error: { message: string } | null }) => r,
        (err: Error) => ({ data: null, error: { message: err.message } })
      ),
    supabase
      .from('ticket_status_history')
      .select('id, ticket_id, old_status, new_status, changed_by, note, changed_at')
      .eq('ticket_id', ticketId)
      .order('changed_at', { ascending: true })
      .then(
        (r: { data: unknown; error: { message: string } | null }) => r,
        (err: Error) => ({ data: null, error: { message: err.message } })
      ),
    supabase
      .from('ticket_messages')
      .select('id, ticket_id, sender_id, sender_role, content, is_internal, visibility_level, created_at')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true })
      .then(
        (r: { data: unknown; error: { message: string } | null }) => r,
        (err: Error) => ({ data: null, error: { message: err.message } })
      ),
  ])

  if (photosR.error)   console.warn('ticket_photos query failed:',         photosR.error.message)
  if (historyR.error)  console.warn('ticket_status_history query failed:', historyR.error.message)
  if (messagesR.error) console.warn('ticket_messages query failed:',       messagesR.error.message)

  return {
    ...(row as unknown as TicketDetail),
    ticket_photos:         (photosR.data   ?? []) as TicketDetail['ticket_photos'],
    ticket_status_history: (historyR.data  ?? []) as TicketDetail['ticket_status_history'],
    ticket_messages:       (messagesR.data ?? []) as TicketDetail['ticket_messages'],
  }
}

// Same idea for list queries: fetch tickets, then per-ticket photos.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function attachPhotosToList(supabase: any, rows: Array<Record<string, unknown>>): Promise<TicketWithPhotos[]> {
  if (rows.length === 0) return []
  const ids = rows.map((r) => r.id as string)
  let photos: Array<{ ticket_id: string; id: string; storage_path: string; photo_type: string; sort_order: number }> = []
  try {
    const r = await supabase
      .from('ticket_photos')
      .select('id, ticket_id, storage_path, photo_type, sort_order')
      .in('ticket_id', ids)
    if (!r.error && r.data) photos = r.data
    else if (r.error) console.warn('ticket_photos list query failed:', r.error.message)
  } catch (e) {
    console.warn('ticket_photos list query threw:', e)
  }

  const byTicket = new Map<string, typeof photos>()
  for (const p of photos) {
    const arr = byTicket.get(p.ticket_id) ?? []
    arr.push(p)
    byTicket.set(p.ticket_id, arr)
  }
  return rows.map((r) => ({
    ...(r as unknown as TicketWithPhotos),
    ticket_photos: (byTicket.get(r.id as string) ?? []) as TicketWithPhotos['ticket_photos'],
  }))
}

export type TicketStats = {
  total: number
  urgent: number
  thisMonth: number
  byStatus: Partial<Record<RequestStatus, number>>
}

// ── Client ───────────────────────────────────────────────────────────────────

export async function getClientWings(): Promise<ClientWing[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // customer_wings is a shared-platform table not in the SAV DB types — cast via unknown
  const db = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> }

  // Try the optimistic select with partner_school_id; if column is missing, retry without.
  let rows: ClientWing[] | null = null
  try {
    const r = await db
      .from('customer_wings')
      .select('id, serial_number, product_model, product_label, size, color_name, registered_at, partner_school_id')
      .eq('owner_user_id', user.id)
      .order('registered_at', { ascending: false })
    if (!r.error) rows = (r.data ?? []) as ClientWing[]
  } catch { /* fall through */ }

  if (!rows) {
    const r = await db
      .from('customer_wings')
      .select('id, serial_number, product_model, product_label, size, color_name, registered_at')
      .eq('owner_user_id', user.id)
      .order('registered_at', { ascending: false })
    if (r.error) {
      console.error('getClientWings error:', r.error.message)
      return []
    }
    rows = (r.data ?? []).map((w: Omit<ClientWing, 'partner_school_id'>) => ({
      ...w,
      partner_school_id: null,
    }))
  }
  return rows ?? []
}

export async function getClientTickets(): Promise<TicketWithPhotos[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  // RLS already scopes to the user's own rows; we don't need a manual filter.
  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getClientTickets error:', error.message)
    return []
  }
  return attachPhotosToList(supabase, (data ?? []) as Array<Record<string, unknown>>)
}

export async function getTicketDetail(ticketId: string): Promise<TicketDetail | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('id', ticketId)
    .single()

  if (error || !data) {
    console.error('getTicketDetail error:', error?.message ?? 'no data')
    return null
  }
  return hydrateTicket(supabase, data as Record<string, unknown>)
}

// ── School ───────────────────────────────────────────────────────────────────

export async function getSchoolTickets(): Promise<TicketWithPhotos[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .order('urgency_level', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getSchoolTickets error:', error.message)
    return []
  }
  return attachPhotosToList(supabase, (data ?? []) as Array<Record<string, unknown>>)
}

export async function getSchoolTicketDetail(ticketId: string): Promise<TicketDetail | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('id', ticketId)
    .single()

  if (error || !data) {
    console.error('getSchoolTicketDetail error:', error?.message ?? 'no data')
    return null
  }
  return hydrateTicket(supabase, data as Record<string, unknown>)
}

// ── Workshop ─────────────────────────────────────────────────────────────────

export async function getWorkshopTickets(): Promise<TicketWithPhotos[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .in('status', ['processing', 'approved', 'completed'])
    .order('urgency_level', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getWorkshopTickets error:', error.message)
    return []
  }
  return attachPhotosToList(supabase, (data ?? []) as Array<Record<string, unknown>>)
}

export async function getWorkshopTicketDetail(ticketId: string): Promise<TicketDetail | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .eq('id', ticketId)
    .single()

  if (error || !data) {
    console.error('getWorkshopTicketDetail error:', error?.message ?? 'no data')
    return null
  }
  return hydrateTicket(supabase, data as Record<string, unknown>)
}

// ── Plume Admin ───────────────────────────────────────────────────────────────

export async function getAllTickets(): Promise<TicketWithPhotos[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('service_requests')
    .select('*')
    .order('urgency_level', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getAllTickets error:', error.message)
    return []
  }
  return attachPhotosToList(supabase, (data ?? []) as Array<Record<string, unknown>>)
}

export async function getTicketStats(): Promise<TicketStats> {
  const tickets = await getAllTickets()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const byStatus: Partial<Record<RequestStatus, number>> = {}
  for (const t of tickets) {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1
  }

  return {
    total: tickets.length,
    urgent: tickets.filter((t) => t.urgency_level === 2).length,
    thisMonth: tickets.filter((t) => t.created_at >= startOfMonth).length,
    byStatus,
  }
}
