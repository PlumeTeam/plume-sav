-- Adds an unread-tracking mechanism for workshop users on service_requests.
-- Mirror of school_last_read_at / client_last_read_at.
--
-- Ownership model is looser than school: assigned_workshop_id is a free-form
-- text identifier (PARTNER_WORKSHOPS in code), not a FK to a user. We
-- therefore gate by the 'workshop' role in user_roles + the ticket being
-- actually escalated (assigned_workshop_id IS NOT NULL). In V1 there is one
-- workshop user (Plume HQ) so a single timestamp per ticket is enough.

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS workshop_last_read_at TIMESTAMPTZ;

UPDATE public.service_requests
SET workshop_last_read_at = now()
WHERE workshop_last_read_at IS NULL;

CREATE OR REPLACE FUNCTION public.mark_ticket_read_by_workshop(p_ticket_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.service_requests
  SET workshop_last_read_at = now()
  WHERE id = p_ticket_id
    AND assigned_workshop_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'workshop'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.mark_ticket_read_by_workshop(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_ticket_read_by_workshop(UUID) TO authenticated;

-- The existing workshop_update_escalated_tickets policy (USING +
-- WITH CHECK both gating on status) does NOT cover statuses 'completed'
-- nor 'cancelled', and could thus block the read-tracking UPDATE on
-- closed tickets. Since the SECURITY DEFINER function bypasses RLS, this
-- isn't an issue: the only writer is the function itself.
