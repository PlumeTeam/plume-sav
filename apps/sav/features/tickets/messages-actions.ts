'use server'

// Server Actions related to the client-side messaging UX (mark-as-read).
// Lives outside actions.ts to keep that file under control — actions.ts
// already exceeds the 300-line house rule.

import { createClient } from '@/lib/supabase/server'

/**
 * Marks one ticket as fully read by the calling client. Backed by the
 * `mark_ticket_read_by_client(uuid)` Postgres function (SECURITY DEFINER),
 * which itself enforces ownership server-side, so we never need to grant the
 * client a generic UPDATE policy on service_requests.
 *
 * Idempotent and best-effort: a failure here just leaves the badge in place
 * until the next visit, never blocks the page render.
 */
export async function markTicketReadByClientAction(
  ticketId: string,
): Promise<{ ok: true } | { error: string }> {
  if (!ticketId) return { error: 'missing_ticket_id' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'unauthorized' }

  const { error } = await supabase.rpc('mark_ticket_read_by_client', {
    p_ticket_id: ticketId,
  })

  if (error) {
    console.warn('markTicketReadByClientAction failed:', error.message)
    return { error: error.message }
  }
  return { ok: true }
}
