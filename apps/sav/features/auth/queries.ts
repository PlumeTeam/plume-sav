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
