'use server'

// Server Action: school marks one of its tickets as read. Backed by
// mark_ticket_read_by_school(uuid) which enforces ownership server-side via
// current_user_partner_school_ids(). Best-effort, never blocks page render.

import { createClient } from '@/lib/supabase/server'

export async function markTicketReadBySchoolAction(
  ticketId: string,
): Promise<{ ok: true } | { error: string }> {
  if (!ticketId) return { error: 'missing_ticket_id' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('mark_ticket_read_by_school', {
    p_ticket_id: ticketId,
  })

  if (error) {
    console.warn('markTicketReadBySchoolAction failed:', error.message)
    return { error: error.message }
  }
  return { ok: true }
}
