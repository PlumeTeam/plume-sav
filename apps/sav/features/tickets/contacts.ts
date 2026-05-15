// Hydrate la liste des tickets école/admin avec les coordonnées des trois
// parties prenantes (client, école, atelier) pour les cartes/lignes de liste.
//
// - Client  : déjà sur le ticket (first_name/last_name/email/phone).
// - École   : un seul SELECT batch sur partner_schools.
// - Atelier : un seul SELECT batch sur partner_workshops.
//
// On garde ce module séparé pour éviter de gonfler queries.ts au-delà de 500 l.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { TicketWithPhotos } from './types'

export type ClientContact = {
  name:  string | null
  email: string | null
  phone: string | null
}

export type SchoolContact = {
  id:    string
  name:  string
  email: string | null
  phone: string | null
}

export type WorkshopContact = {
  id:    string
  label: string
  email: string | null
  phone: string | null
}

export type TicketContacts = {
  client:   ClientContact
  school:   SchoolContact   | null
  workshop: WorkshopContact | null
}

export type TicketWithContacts = TicketWithPhotos & {
  contacts: TicketContacts
}

function buildClientContact(ticket: TicketWithPhotos): ClientContact {
  const full = [ticket.first_name, ticket.last_name].filter(Boolean).join(' ').trim()
  return {
    name:  full.length > 0 ? full : null,
    email: ticket.email ?? null,
    phone: ticket.phone ?? null,
  }
}

function buildWorkshopContact(
  ticket: TicketWithPhotos,
  workshopsById: Map<string, WorkshopContact>,
): WorkshopContact | null {
  if (!ticket.assigned_workshop_id) return null
  const known = workshopsById.get(ticket.assigned_workshop_id)
  return {
    id:    ticket.assigned_workshop_id,
    label: ticket.assigned_workshop_label ?? known?.label ?? ticket.assigned_workshop_id,
    email: known?.email ?? null,
    phone: known?.phone ?? null,
  }
}

/**
 * Best-effort batch lookup of partner_workshops contact fields for a set of ids.
 * Cascade similaire à fetchSchoolContacts pour tolérer les schémas DB qui
 * n'auraient pas encore toutes les colonnes (test envs, RLS).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchWorkshopContacts(supabase: any, ids: string[]): Promise<Map<string, WorkshopContact>> {
  const out = new Map<string, WorkshopContact>()
  if (ids.length === 0) return out

  type Row = { id: unknown; name?: unknown; label?: unknown; email?: unknown; phone?: unknown }

  const attempts: Array<{ label: string; select: string }> = [
    { label: 'rich',    select: 'id, name, email, phone' },
    { label: 'noemail', select: 'id, name, phone' },
    { label: 'nophone', select: 'id, name, email' },
    { label: 'minimal', select: 'id, name' },
  ]

  for (const { label, select } of attempts) {
    try {
      const r = await supabase
        .from('partner_workshops')
        .select(select)
        .in('id', ids)
      if (r.error) {
        console.warn(`[fetchWorkshopContacts] "${label}" errored:`, r.error.message)
        continue
      }
      const rows = (r.data ?? []) as Row[]
      for (const row of rows) {
        const id = typeof row.id === 'string' ? row.id : null
        if (!id) continue
        const labelStr = typeof row.label === 'string' ? row.label
                       : typeof row.name  === 'string' ? row.name
                       : id
        out.set(id, {
          id,
          label: labelStr,
          email: typeof row.email === 'string' ? row.email : null,
          phone: typeof row.phone === 'string' ? row.phone : null,
        })
      }
      return out
    } catch (e) {
      console.warn(`[fetchWorkshopContacts] "${label}" threw:`, e)
    }
  }
  return out
}

/**
 * Best-effort batch lookup of partner_schools contact fields for a set of ids.
 * Falls back gracefully if `phone`/`email` columns are absent (older schemas).
 * Returns a Map indexed by id; missing ids simply aren't in the map.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchSchoolContacts(supabase: any, ids: string[]): Promise<Map<string, SchoolContact>> {
  const out = new Map<string, SchoolContact>()
  if (ids.length === 0) return out

  type Row = { id: unknown; name?: unknown; email?: unknown; phone?: unknown }

  // Cascade : on essaie d'abord avec phone+email, sinon on dégrade.
  const attempts: Array<{ label: string; select: string }> = [
    { label: 'rich',    select: 'id, name, email, phone' },
    { label: 'noemail', select: 'id, name, phone' },
    { label: 'nophone', select: 'id, name, email' },
    { label: 'minimal', select: 'id, name' },
  ]

  for (const { label, select } of attempts) {
    try {
      const r = await supabase
        .from('partner_schools')
        .select(select)
        .in('id', ids)
      if (r.error) {
        console.warn(`[fetchSchoolContacts] "${label}" errored:`, r.error.message)
        continue
      }
      const rows = (r.data ?? []) as Row[]
      for (const row of rows) {
        const id = typeof row.id === 'string' ? row.id : null
        if (!id) continue
        out.set(id, {
          id,
          name:  typeof row.name  === 'string' ? row.name  : id,
          email: typeof row.email === 'string' ? row.email : null,
          phone: typeof row.phone === 'string' ? row.phone : null,
        })
      }
      return out
    } catch (e) {
      console.warn(`[fetchSchoolContacts] "${label}" threw:`, e)
    }
  }
  return out
}

/**
 * Attach a `contacts` bundle to each ticket. Performs ONE batched query for
 * school contacts. Workshop info is resolved in-memory from constants.
 */
export async function attachContactsToList(
  supabase: SupabaseClient,
  tickets: TicketWithPhotos[],
): Promise<TicketWithContacts[]> {
  if (tickets.length === 0) return []

  const schoolIds = Array.from(
    new Set(tickets.map((t) => t.school_id).filter((id): id is string => !!id)),
  )
  const workshopIds = Array.from(
    new Set(tickets.map((t) => t.assigned_workshop_id).filter((id): id is string => !!id)),
  )
  const [schoolsById, workshopsById] = await Promise.all([
    fetchSchoolContacts(supabase, schoolIds),
    fetchWorkshopContacts(supabase, workshopIds),
  ])

  return tickets.map((t) => ({
    ...t,
    contacts: {
      client:   buildClientContact(t),
      school:   t.school_id ? schoolsById.get(t.school_id) ?? null : null,
      workshop: buildWorkshopContact(t, workshopsById),
    },
  }))
}
