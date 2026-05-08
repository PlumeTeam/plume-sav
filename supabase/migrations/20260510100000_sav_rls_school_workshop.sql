-- =============================================================
-- Migration : SAV — RLS école + atelier + ticket_status_history
-- Date      : 2026-05-10
-- Notes     : Complète les policies RLS manquantes sur les 3 tables clés
--             pour les rôles 'ecole' et 'atelier'.
--
--             En prod Supabase actuelle, une policy "authenticated_access"
--             permissive autorise tout user authentifié — on ne la touche
--             pas ici (elle reste pour compat). Les policies ci-dessous
--             servent à un environnement propre (staging/local) où l'on
--             veut un cloisonnement strict par rôle.
--
--             Pattern : DROP POLICY IF EXISTS + CREATE POLICY (Postgres
--             ne supporte pas CREATE POLICY IF NOT EXISTS).
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ============================================================
-- 1. Rôle ÉCOLE (role = 'ecole') — service_requests
-- ============================================================
-- L'école peut UPDATE les tickets affectés à son école. Le scoping passe
-- par partner_schools.user_id = auth.uid() (le compte école est associé
-- à une ou plusieurs écoles via cette colonne).
DROP POLICY IF EXISTS "ecole_update_assigned_tickets" ON public.service_requests;
CREATE POLICY "ecole_update_assigned_tickets"
  ON public.service_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'ecole'
    )
    AND school_id IN (
      SELECT ps.id FROM public.partner_schools ps
      WHERE ps.user_id = auth.uid()
    )
  )
  WITH CHECK (
    school_id IN (
      SELECT ps.id FROM public.partner_schools ps
      WHERE ps.user_id = auth.uid()
    )
  );

-- ============================================================
-- 2. Rôle ÉCOLE — ticket_messages (INSERT)
-- ============================================================
-- L'école peut écrire des messages tagués sender_role='school'.
DROP POLICY IF EXISTS "ecole_insert_messages" ON public.ticket_messages;
CREATE POLICY "ecole_insert_messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'school'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'ecole'
    )
  );

-- ============================================================
-- 3. Rôle ATELIER (role = 'atelier') — service_requests
-- ============================================================
-- L'atelier voit ET met à jour les tickets qui :
--   - lui sont assignés (assigned_workshop_id NOT NULL), ET
--   - sont dans une étape « branche atelier » (escalated → wing_returned).
-- Avant l'escalade, l'atelier ne doit rien voir de la branche école.
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
      'escalated_to_workshop',
      'wing_received_workshop',
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
      WHERE ur.user_id = auth.uid() AND ur.role = 'atelier'
    )
    AND assigned_workshop_id IS NOT NULL
    AND status IN (
      'escalated_to_workshop',
      'wing_received_workshop',
      'workshop_diagnosing',
      'workshop_repairing',
      'workshop_done',
      'wing_returned'
    )
  )
  WITH CHECK (
    assigned_workshop_id IS NOT NULL
  );

-- ============================================================
-- 4. Rôle ATELIER — ticket_messages (INSERT)
-- ============================================================
DROP POLICY IF EXISTS "atelier_insert_messages" ON public.ticket_messages;
CREATE POLICY "atelier_insert_messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'workshop'
    AND EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'atelier'
    )
  );

-- ============================================================
-- 5. ticket_status_history — INSERT pour TOUS les rôles authentifiés
-- ============================================================
-- Les Server Actions des 3 dashboards (client, école, atelier) écrivent
-- dans ticket_status_history pour tracer chaque transition. La policy
-- existante "plume_admin_all_history" couvre uniquement plume_admin —
-- les autres rôles voyaient leur INSERT silencieusement échouer.
--
-- Garde-fou : changed_by doit correspondre à auth.uid() pour éviter
-- l'usurpation d'identité dans le journal d'audit.
DROP POLICY IF EXISTS "authenticated_insert_history" ON public.ticket_status_history;
CREATE POLICY "authenticated_insert_history"
  ON public.ticket_status_history FOR INSERT
  TO authenticated
  WITH CHECK (changed_by = auth.uid());
