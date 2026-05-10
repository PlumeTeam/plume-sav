'use server'

// Server Action: Plume admin marks a ticket as read in the per-user
// plume_admin_ticket_reads table. The RPC is a no-op for non-admin callers,
// so it can be called unconditionally from any of the shared ticket pages
// (school/workshop/client are entry points for plume_admins in support mode).

import { createClient } from '@/lib/supabase/server'

export async function markTicketReadByPlumeAction(
  ticketId: string,
): Promise<{ ok: true } | { error: string }> {
  if (!ticketId) return { error: 'missing_ticket_id' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('mark_ticket_read_by_plume', {
    p_ticket_id: ticketId,
  })

  if (error) {
    console.warn('markTicketReadByPlumeAction failed:', error.message)
    return { error: error.message }
  }
  return { ok: true }
}
