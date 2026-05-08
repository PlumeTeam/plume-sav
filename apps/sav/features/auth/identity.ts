// Shared client-identity resolver used by:
//  - Server Actions (createTicketAction) to fill NOT NULL columns on insert
//  - Server Components (client home page) to greet the user by first name
//
// Cascade of fallbacks:
//  1. customer_profiles / profiles / users  (best-effort row lookup)
//  2. user.user_metadata.first_name / last_name / phone
//  3. split user_metadata.full_name / .name into first + last
//  4. derive a first name from the email local part ("jeremy.dupont" → "Jeremy")
//  5. hardcoded "Pilote" / "Plume" so NOT NULL constraints never fail

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@plume/db'

export type ClientIdentity = {
  firstName: string
  lastName:  string
  email:     string
  phone:     string
}

type AuthUserLike = {
  id:             string
  email?:         string | null
  user_metadata?: Record<string, unknown> | null
}

function stringOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  return trimmed.length > 0 ? trimmed : null
}

export async function resolveClientIdentity(
  supabase: SupabaseClient<Database>,
  user:     AuthUserLike,
): Promise<ClientIdentity> {
  const meta      = (user.user_metadata ?? {}) as Record<string, unknown>
  const metaFirst = stringOrNull(meta.first_name) ?? stringOrNull(meta.firstName)
  const metaLast  = stringOrNull(meta.last_name)  ?? stringOrNull(meta.lastName)
  const metaPhone = stringOrNull(meta.phone)
  const metaName  = stringOrNull(meta.full_name)  ?? stringOrNull(meta.name)

  // customer_profiles / profiles / users are shared-platform tables not in the
  // SAV DB types — cast through unknown for the best-effort lookup.
  const db = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> }

  let dbFirst: string | null = null
  let dbLast:  string | null = null
  let dbPhone: string | null = null
  let dbEmail: string | null = null

  for (const table of ['customer_profiles', 'profiles', 'users']) {
    try {
      const r = await db
        .from(table)
        .select('first_name, last_name, email, phone')
        .or(`id.eq.${user.id},user_id.eq.${user.id}`)
        .maybeSingle()
      if (r?.data) {
        const row = r.data as Record<string, unknown>
        dbFirst = stringOrNull(row.first_name)
        dbLast  = stringOrNull(row.last_name)
        dbPhone = stringOrNull(row.phone)
        dbEmail = stringOrNull(row.email)
        break
      }
    } catch {
      /* table doesn't exist — try next */
    }
  }

  // Split a "Full Name" string into first / last
  let splitFirst: string | null = null
  let splitLast:  string | null = null
  if (metaName) {
    const parts = metaName.trim().split(/\s+/)
    splitFirst = parts[0] ?? null
    splitLast  = parts.slice(1).join(' ') || null
  }

  const email      = dbEmail ?? user.email ?? ''
  const emailLocal = email.split('@')[0] ?? ''
  const emailFirst = emailLocal
    .split(/[._-]/)[0]
    ?.replace(/^./, (c) => c.toUpperCase()) || null

  return {
    firstName: dbFirst ?? metaFirst ?? splitFirst ?? emailFirst ?? 'Pilote',
    lastName:  dbLast  ?? metaLast  ?? splitLast  ?? 'Plume',
    email,
    phone:     dbPhone ?? metaPhone ?? '',
  }
}
