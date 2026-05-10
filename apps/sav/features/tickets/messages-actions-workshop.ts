'use server'

// Server Action: workshop user marks one of their tickets as read. Backed
// by mark_ticket_read_by_workshop(uuid) which checks user_roles.role =
// 'workshop' + ticket assignment server-side.

import { createClient } from '@/lib/supabase/server'

export async function markTicketReadByWorkshopAction(
  ticketId: string,
): Promise<{ ok: true } | { error: string }> {
  if (!ticketId) return { error: 'missing_ticket_id' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('mark_ticket_read_by_workshop', {
    p_ticket_id: ticketId,
  })

  if (error) {
    console.warn('markTicketReadByWorkshopAction failed:', error.message)
    return { error: error.message }
  }
  return { ok: true }
}
