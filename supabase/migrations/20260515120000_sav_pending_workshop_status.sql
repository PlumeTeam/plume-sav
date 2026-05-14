-- =============================================================
-- Migration : SAV — statut initial 'pending_workshop' pour le
--             routage direct client → atelier (repair / inspection)
-- Date      : 2026-05-15
-- Notes     : Quand le client crée un ticket de type 'repair' ou
--             'inspection', le flow va directement vers un atelier
--             (pas d'étape école). Avant cette migration, ces tickets
--             étaient créés avec status='pending' — mais la policy RLS
--             `atelier_select_assigned_tickets` ne couvre QUE les
--             statuts du pipeline atelier (escalated_to_workshop →
--             wing_returned). Conséquence : les tickets repair/inspection
--             fraîchement créés étaient invisibles côté atelier.
--
--             Correctif : un statut dédié `pending_workshop` matérialise
--             l'état "ticket créé, en attente de réception physique de
--             l'aile à l'atelier (routage direct, pas d'escalade école)".
--             Les policies RLS atelier sont étendues pour inclure ce
--             statut, ce qui permet à l'atelier de voir le ticket dès
--             sa création.
--
--             Note Postgres : ALTER TYPE ADD VALUE puis usage dans
--             CREATE POLICY dans la même migration suit le même pattern
--             que `20260512120000_sav_workshop_pre_check.sql` (déjà
--             appliqué en prod). Si le runner wrappe en transaction
--             stricte, scinder en 2 fichiers ; sinon les statements
--             s'exécutent en autocommit côté Supabase.
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Nouveau statut request_status — routage direct atelier
-- ------------------------------------------------------------
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'pending_workshop';

-- ------------------------------------------------------------
-- 2. Étendre la policy SELECT atelier pour inclure 'pending_workshop'
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "atelier_select_assigned_tickets" ON public.service_requests;
CREATE POLICY "atelier_select_assigned_tickets"
  ON public.service_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'atelier'
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

-- ------------------------------------------------------------
-- 3. Étendre la policy UPDATE atelier pour inclure 'pending_workshop'
-- ------------------------------------------------------------
-- L'atelier doit pouvoir transitionner pending_workshop → wing_received_workshop
-- dès que l'aile arrive physiquement.
DROP POLICY IF EXISTS "atelier_update_assigned_tickets" ON public.service_requests;
CREATE POLICY "atelier_update_assigned_tickets"
  ON public.service_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'atelier'
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
