-- =============================================================
-- Migration : SAV — compat double rôle workshop/atelier + backfill
--             tickets repair/inspection bloqués au statut 'pending'
-- Date      : 2026-05-15
-- Notes     : Trois correctifs pour débloquer la visibilité côté atelier.
--
--             1) BACKFILL des tickets existants : avant la migration
--                20260515120000, les tickets repair/inspection (routage
--                direct client → atelier) étaient créés avec status='pending'
--                — le statut école — et invisibles côté atelier puisque les
--                policies RLS atelier ne couvrent pas 'pending'. On les
--                bascule en 'pending_workshop' (assigned_workshop_id NOT NULL
--                + school_id IS NULL = signature du routage direct).
--
--             2) RPC mark_ticket_read_by_workshop : la version initiale
--                checkait `ur.role = 'workshop'`, mais la base mutualisée
--                Plume stocke 'atelier' (valeur canonique partagée entre
--                apps). Conséquence : le tracking unread atelier échouait
--                silencieusement. On accepte les deux valeurs (les apps
--                Plume coexistent — le code applicatif mappe via ROLE_MAP).
--
--             3) Policies RLS atelier : par défense, accepter aussi
--                ur.role = 'workshop' au cas où une app/installation utilise
--                la valeur canonique app-level. Aligné avec ROLE_MAP côté
--                Next.js (features/auth/queries.ts).
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Backfill tickets routage direct atelier (repair / inspection)
-- ------------------------------------------------------------
-- Signature d'un ticket routé direct atelier (avant le fix code) :
--   status = 'pending'                  (statut école par défaut)
--   AND assigned_workshop_id IS NOT NULL (atelier assigné dès la création)
--   AND school_id IS NULL               (pas d'école dans le flow)
-- Aucun risque de toucher un ticket école : ceux-ci ont school_id NOT NULL.
UPDATE public.service_requests
SET status = 'pending_workshop'
WHERE status = 'pending'
  AND assigned_workshop_id IS NOT NULL
  AND school_id IS NULL;

-- ------------------------------------------------------------
-- 2. RPC mark_ticket_read_by_workshop : accepte 'atelier' ET 'workshop'
-- ------------------------------------------------------------
-- Sans cette correction, l'horodatage workshop_last_read_at n'était jamais
-- mis à jour pour les utilisateurs ayant ur.role = 'atelier' (le cas réel
-- en prod), donc les badges "messages non lus" restaient figés.
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
        AND ur.role IN ('atelier', 'workshop')
    );
END;
$$;

-- ------------------------------------------------------------
-- 3. Policies RLS atelier : accepter 'atelier' ET 'workshop'
-- ------------------------------------------------------------
-- Garde-fou contre les divergences d'écriture entre les apps Plume qui
-- partagent la table user_roles. Le code applicatif (ROLE_MAP) mappe les
-- deux valeurs vers la même classe d'autorisations — la RLS suit.
DROP POLICY IF EXISTS "atelier_select_assigned_tickets" ON public.service_requests;
CREATE POLICY "atelier_select_assigned_tickets"
  ON public.service_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('atelier', 'workshop')
    )
    AND assigned_workshop_id IS NOT NULL
    AND status IN (
      'pending_workshop',
      'escalated_to_workshop',
      'wing_received_workshop',
      'workshop_pre_checking',
      'workshop_diagnosing',
      'workshop_repairing',
      'workshop_done',
      'wing_returned'
    )
  );

DROP POLICY IF EXISTS "atelier_update_assigned_tickets" ON public.service_requests;
CREATE POLICY "atelier_update_assigned_tickets"
  ON public.service_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('atelier', 'workshop')
    )
    AND assigned_workshop_id IS NOT NULL
    AND status IN (
      'pending_workshop',
      'escalated_to_workshop',
      'wing_received_workshop',
      'workshop_pre_checking',
      'workshop_diagnosing',
      'workshop_repairing',
      'workshop_done',
      'wing_returned'
    )
  )
  WITH CHECK (
    assigned_workshop_id IS NOT NULL
  );

-- ------------------------------------------------------------
-- 4. Policy atelier_insert_messages : accepter 'atelier' ET 'workshop'
-- ------------------------------------------------------------
-- La policy gardait `ur.role = 'atelier'` ; si une instance utilise
-- 'workshop' comme valeur canonique côté DB, les messages atelier seraient
-- silencieusement rejetés.
DROP POLICY IF EXISTS "atelier_insert_messages" ON public.ticket_messages;
CREATE POLICY "atelier_insert_messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'workshop'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role IN ('atelier', 'workshop')
    )
  );
