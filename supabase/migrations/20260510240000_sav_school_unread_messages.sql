-- Adds an unread-tracking mechanism for schools on service_requests, mirror
-- of the existing client_last_read_at column. Same design rationale:
-- single timestamp per ticket per school user (one user per school in V1),
-- backfilled to now() to avoid a "everything is unread" flood at rollout.

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS school_last_read_at TIMESTAMPTZ;

UPDATE public.service_requests
SET school_last_read_at = now()
WHERE school_last_read_at IS NULL;

-- The RPC bypasses RLS for this single column. Ownership check uses
-- current_user_partner_school_ids() — the same helper used by sibling SELECT
-- policies on service_requests/ticket_photos/ticket_status_history.
CREATE OR REPLACE FUNCTION public.mark_ticket_read_by_school(p_ticket_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.service_requests
  SET school_last_read_at = now()
  WHERE id = p_ticket_id
    AND (
      school_id IN (SELECT school_id FROM public.current_user_partner_school_ids())
      OR referent_school_id IN (SELECT school_id FROM public.current_user_partner_school_ids())
    );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_ticket_read_by_school(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_ticket_read_by_school(UUID) TO authenticated;

-- Schools also need to UPDATE this single timestamp via the existing
-- school_update_assigned_tickets policy (which already uses school_id).
-- The new column is covered by it because that policy is FOR UPDATE without
-- column restrictions — no extra policy needed.
