-- Adds an unread-tracking mechanism for Plume HQ admins.
--
-- Unlike client/school/workshop where one user maps to one role at most for
-- a given ticket, Plume admins are MULTIPLE distinct users sharing the same
-- bird's-eye view. A single timestamp column on service_requests would fight
-- between admins. We use a per-user table instead.

CREATE TABLE IF NOT EXISTS public.plume_admin_ticket_reads (
  user_id   UUID        NOT NULL,
  ticket_id UUID        NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  read_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ticket_id)
);

CREATE INDEX IF NOT EXISTS idx_plume_admin_ticket_reads_user
  ON public.plume_admin_ticket_reads (user_id);

ALTER TABLE public.plume_admin_ticket_reads ENABLE ROW LEVEL SECURITY;

-- Each plume_admin sees and writes only their own rows.
CREATE POLICY sec_plume_select_own_reads
ON public.plume_admin_ticket_reads
FOR SELECT
TO authenticated
USING (user_id = (SELECT auth.uid()));

CREATE POLICY sec_plume_insert_own_reads
ON public.plume_admin_ticket_reads
FOR INSERT
TO authenticated
WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY sec_plume_update_own_reads
ON public.plume_admin_ticket_reads
FOR UPDATE
TO authenticated
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- Backfill: for every existing plume_admin × every existing ticket,
-- insert a "read at now()" row so the new feature does NOT flag historical
-- messages as unread on first load.
INSERT INTO public.plume_admin_ticket_reads (user_id, ticket_id, read_at)
SELECT ur.user_id, sr.id, now()
FROM public.user_roles ur
CROSS JOIN public.service_requests sr
WHERE ur.role = 'plume_admin'
ON CONFLICT (user_id, ticket_id) DO NOTHING;

-- RPC: upsert one read row for the calling plume admin. No-op for non-admins
-- so the function can be called unconditionally from the shared ticket pages
-- (school/workshop/client) without role-checking on the caller side.
CREATE OR REPLACE FUNCTION public.mark_ticket_read_by_plume(p_ticket_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'plume_admin'
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.plume_admin_ticket_reads (user_id, ticket_id, read_at)
  VALUES (auth.uid(), p_ticket_id, now())
  ON CONFLICT (user_id, ticket_id) DO UPDATE
  SET read_at = EXCLUDED.read_at;
END;
$$;

REVOKE ALL ON FUNCTION public.mark_ticket_read_by_plume(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_ticket_read_by_plume(UUID) TO authenticated;
