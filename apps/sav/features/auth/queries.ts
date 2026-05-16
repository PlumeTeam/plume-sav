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

  const collected = new Set<UserRole>()

  // Source 1 — user_roles : table multi-rôles utilisée par le SAV (et les RLS
  // policies). Une ligne par rôle, `user_id` = auth.uid().
  const { data: userRolesRows } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .returns<UserRoleRow[]>()
  for (const r of userRolesRows ?? []) {
    const mapped = ROLE_MAP[r.role]
    if (mapped) collected.add(mapped)
  }

  // Source 2 — profiles.role : la plateforme Plume principale stocke le rôle
  // métier (ecole, atelier, admin…) directement sur `profiles`. Certains
  // comptes n'ont rien dans user_roles, le SAV doit donc lire cette colonne.
  //
  // Attention clé : sur la DB Plume, `profiles.id` ≠ `profiles.user_id`.
  // - profiles.id      = UUID interne au profil
  // - profiles.user_id = auth.users.id (ce que retourne supabase.auth.getUser)
  // Il faut donc filtrer sur user_id, pas id. La table profiles n'étant pas
  // dans les types DB du SAV, on passe par un cast best-effort.
  const db = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> }
  try {
    const r = await db
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()
    if (!r.error && r.data) {
      const role = (r.data as { role?: string | null }).role
      if (typeof role === 'string') {
        const mapped = ROLE_MAP[role]
        if (mapped) collected.add(mapped)
      }
    }
  } catch { /* table ou colonne absente — on ignore et on reste sur user_roles */ }

  return Array.from(collected)
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

  // Fallback : sur la plateforme Plume principale, le lien école↔user passe
  // directement par partner_schools.user_id (c'est ce que font les RLS — cf.
  // migration 20260510100000). Si user_roles est vide pour ce compte, on
  // résout l'école par cette colonne. Un compte peut représenter plusieurs
  // écoles ; on prend la première stable par created_at.
  if (!schoolId) {
    try {
      const r = await db
        .from('partner_schools')
        .select('id, name, city, region')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()
      if (!r.error && r.data) return r.data as CurrentSchool
    } catch { /* table ou colonne absente — on retourne null */ }
    return null
  }

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
 * represents. Source de vérité = partner_workshops (colonne user_id liée
 * à auth.users). Stratégies, dans l'ordre :
 *  1. SELECT partner_workshops WHERE user_id = current user
 *  2. fallback metadata.workshop_id → SELECT partner_workshops WHERE id = …
 *  3. fallback synth depuis user_metadata.full_name / first_name + last_name
 */
export type CurrentWorkshopRow = {
  id:      unknown
  name?:   unknown
  label?:  unknown
  city?:   unknown
  region?: unknown
}

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

  // partner_workshops vient d'être ajoutée aux types, on garde le cast unknown
  // pour rester compatible avec un env sans la table.
  const db = supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> }

  function normalizeRow(row: CurrentWorkshopRow): CurrentWorkshop {
    const id = String(row.id ?? '')
    const label = typeof row.label === 'string' ? row.label
                : typeof row.name  === 'string' ? row.name
                : id
    return {
      id,
      label,
      city:   typeof row.city   === 'string' ? row.city   : undefined,
      region: typeof row.region === 'string' ? row.region : undefined,
    }
  }

  // Strategy 1: lookup direct par user_id sur partner_workshops.
  try {
    const r = await db
      .from('partner_workshops')
      .select('id, name, city, region')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()
    if (!r.error && r.data) return normalizeRow(r.data as CurrentWorkshopRow)
  } catch { /* table absente, on tente la suite */ }

  // Strategy 2: metadata.workshop_id → lookup par id.
  if (wsId) {
    try {
      const r = await db
        .from('partner_workshops')
        .select('id, name, city, region')
        .eq('id', wsId)
        .maybeSingle()
      if (!r.error && r.data) return normalizeRow(r.data as CurrentWorkshopRow)
    } catch { /* idem */ }
  }

  // Strategy 3: synthesize depuis user_metadata.
  const synthLabel = name ?? ([first, last].filter(Boolean).join(' ') || null)
  if (synthLabel) return { id: `auth-${user.id}`, label: synthLabel }

  return null
}

/**
 * Renvoie l'`id` partner_workshops réel de l'atelier courant, ou `null` si on
 * ne peut pas le résoudre à une vraie row (compte non lié, ou résolu via
 * synthèse `auth-…` faute de linkage). Sert au scoping « la conversation suit
 * l'aile » : tant que l'id est null, aucun filtrage par atelier n'est appliqué
 * — pas de régression pour les comptes atelier non rattachés à partner_workshops.
 */
export async function getCurrentUserWorkshopId(): Promise<string | null> {
  const ws = await getCurrentUserWorkshop()
  if (!ws || ws.id.startsWith('auth-') || ws.id === '') return null
  return ws.id
}
