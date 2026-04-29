import { createClient } from '@/lib/supabase/server'

export type UserRole = 'client' | 'school' | 'workshop' | 'plume_admin'

type UserRoleRow = { role: string }

export async function getCurrentUserRoles(): Promise<UserRole[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .returns<UserRoleRow[]>()

  return (data ?? []).map(r => r.role as UserRole)
}
