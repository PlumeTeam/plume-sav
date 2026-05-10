-- Fixes the missing INSERT/SELECT policies on service_requests for clients.
-- Without these, /client wizard fails with "new row violates row-level security
-- policy for table service_requests" because no policy authorises a non-admin
-- authenticated user to create a ticket they own.
--
-- Symmetric with sec_client_insert_own_ticket on ticket_photos and
-- client_insert_messages on ticket_messages. Pure addition, no existing policy
-- modified — safe for the other Plume apps that share this DB.

-- 1. A client can create a ticket they own.
CREATE POLICY sec_client_insert_own
ON public.service_requests
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = (SELECT auth.uid())
);

-- 2. A client can read their own tickets (post-create redirect to
--    /client/ticket-created/[id] and the ticket list both depend on this).
CREATE POLICY sec_client_select_own
ON public.service_requests
FOR SELECT
TO authenticated
USING (
  user_id = (SELECT auth.uid())
  OR client_id = (SELECT auth.uid())
);

-- 3. The audit-trail insert in createTicketAction (ticket_status_history) was
--    silently dropped on console.warn. Allow it for the ticket owner only.
CREATE POLICY sec_client_insert_own_status
ON public.ticket_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  changed_by = (SELECT auth.uid())
  AND ticket_id IN (
    SELECT sr.id FROM public.service_requests sr
    WHERE sr.user_id = (SELECT auth.uid())
       OR sr.client_id = (SELECT auth.uid())
  )
);
