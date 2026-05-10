-- Fixes the missing SELECT policy on service_requests for partner schools.
-- school_update_assigned_tickets (UPDATE) exists but no matching SELECT, so
-- schools can mutate tickets they cannot read — meaning their dashboard list
-- query returns 0 rows, even when tickets are assigned to them.
--
-- Mirrors the pattern already in place on ticket_messages.school_read_messages,
-- ticket_photos.sec_partner_select_school and ticket_status_history.sec_partner_select_school.
-- Uses current_user_partner_school_ids() for consistency with sibling policies.

CREATE POLICY sec_partner_select_school
ON public.service_requests
FOR SELECT
TO authenticated
USING (
  school_id IN (
    SELECT school_id FROM public.current_user_partner_school_ids()
  )
  OR referent_school_id IN (
    SELECT school_id FROM public.current_user_partner_school_ids()
  )
);
