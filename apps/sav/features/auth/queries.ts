import { createClient } from '@/lib/supabase/server'

export type UserRole = 'client' | 'school' | 'workshop' | 'plume_admin'

type UserRoleRow = { role: string }

// Maps shared user_roles values (used across all Plume apps) to SAV roles.
// 'admin' on the main platform = plume_admin access in SAV.
const ROLE_MAP: Partial<Record<string, UserRole>> = {
  plume_admin: 'plume_admin',
  admin:       'plume_admin',
  client:      'client',
  customer:    'client',
  school:      'school',
  ecole:       'school',
  workshop:    'workshop',
  atelier:     'workshop',
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserRoles(): Promise<UserRole[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .returns<UserRoleRow[]>()

  return (data ?? [])
    .map(r => ROLE_MAP[r.role])
    .filter((r): r is UserRole => r !== undefined)
}

export type CurrentSchool = {
  id:     string
  name:   string
  city?:  string | null
  region?: string | null
}

/**
 * Resolves the partner_school the current user belongs to (when they have
 * a 'school' / 'ecole' role with a partner_school_id link in user_roles).
 * Best-effort: returns null if the table or columns aren't set up yet.
 */
export async function getCurrentUserSchool(): Promise<CurrentSchool | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Strategy: try user_roles → partner_school_id, then look up partner_schools.
  const db = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> }

  let schoolId: string | null = null
  try {
    const r = await db
      .from('user_roles')
      .select('partner_school_id')
      .eq('user_id', user.id)
      .in('role', ['school', 'ecole'])
      .limit(1)
      .maybeSingle()
    if (!r.error && r.data) {
      const sid = (r.data as { partner_school_id?: string | null }).partner_school_id
      if (typeof sid === 'string' && sid.length > 0) schoolId = sid
    }
  } catch { /* table or column missing — fall through */ }

  if (!schoolId) return null

  try {
    const r = await db
      .from('partner_schools')
      .select('id, name, city, region')
      .eq('id', schoolId)
      .maybeSingle()
    if (!r.error && r.data) return r.data as CurrentSchool
  } catch { /* missing table — bail */ }

  return null
}

export type CurrentWorkshop = {
  id:      string
  label:   string
  city?:   string
  region?: string
}

/**
 * Best-effort resolution of the workshop the current authenticated user
 * represents. Workshops aren't in DB yet — they live in the hardcoded
 * PARTNER_WORKSHOPS list in features/tickets/constants.ts. We try a few
 * matching strategies in order:
 *  1. user.user_metadata.workshop_id matches a PARTNER_WORKSHOPS entry
 *  2. user.user_metadata.full_name / .name matches a workshop label
 *     (case-insensitive)
 *  3. fallback: synthesize a record from user_metadata.full_name (or
 *     first_name + last_name) so the dashboard at least has a name.
 *
 * Imported lazily to avoid pulling tickets-feature constants at the top
 * of the auth module.
 */
export async function getCurrentUserWorkshop(): Promise<CurrentWorkshop | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const meta  = (user.user_metadata ?? {}) as Record<string, unknown>
  const wsId  = typeof meta.workshop_id === 'string' ? meta.workshop_id.trim() : null
  const name  = typeof meta.full_name   === 'string' ? meta.full_name.trim()
              : typeof meta.name        === 'string' ? meta.name.trim()
              : null
  const first = typeof meta.first_name  === 'string' ? meta.first_name.trim() : null
  const last  = typeof meta.last_name   === 'string' ? meta.last_name.trim()  : null

  // Lazy import so the auth feature doesn't depend on the tickets feature
  // unless this code path actually fires.
  const { PARTNER_WORKSHOPS } = await import('@/features/tickets/constants')

  // Strategy 1: explicit workshop_id in metadata
  if (wsId) {
    const w = PARTNER_WORKSHOPS.find((x) => x.id === wsId)
    if (w) return { id: w.id, label: w.label, city: w.city, region: w.region }
  }

  // Strategy 2: full_name matches a workshop label (case-insensitive)
  if (name) {
    const lc = name.toLowerCase()
    const w  = PARTNER_WORKSHOPS.find((x) => x.label.toLowerCase() === lc)
    if (w) return { id: w.id, label: w.label, city: w.city, region: w.region }
  }

  // Strategy 3: synthesize from metadata (no DB row, no PARTNER_WORKSHOPS hit)
  const synthLabel = name ?? ([first, last].filter(Boolean).join(' ') || null)
  if (synthLabel) return { id: `auth-${user.id}`, label: synthLabel }

  return null
}
