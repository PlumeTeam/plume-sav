-- Adds an unread-tracking mechanism for clients on service_requests.
--
-- Design:
--  * `client_last_read_at` is a single timestamp per ticket per client (the
--    client owns one ticket = one thread). Cheaper than a per-message
--    ticket_message_reads junction table for the V1 needs.
--  * Backfill with now() so the new column does NOT mark every existing
--    message as unread on first load — only NEW messages after this migration
--    will count as unread.
--  * The client must NOT get a generic UPDATE policy on service_requests
--    (that would let them tamper with status, school_id, etc). Instead we
--    expose ONE narrow SECURITY DEFINER function that updates only this
--    timestamp, and only when the caller owns the ticket.

-- 1) Column
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS client_last_read_at TIMESTAMPTZ;

-- 2) Backfill: existing tickets considered already-read at migration time.
UPDATE public.service_requests
SET client_last_read_at = now()
WHERE client_last_read_at IS NULL;

-- 3) RPC: client marks one of their tickets as read. SECURITY DEFINER so the
--    update bypasses RLS for this single column, but the WHERE clause
--    enforces ownership manually — equivalent to a per-column policy.
CREATE OR REPLACE FUNCTION public.mark_ticket_read_by_client(p_ticket_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.service_requests
  SET client_last_read_at = now()
  WHERE id = p_ticket_id
    AND (user_id = auth.uid() OR client_id = auth.uid());
END;
$$;

REVOKE ALL ON FUNCTION public.mark_ticket_read_by_client(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_ticket_read_by_client(UUID) TO authenticated;
