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
