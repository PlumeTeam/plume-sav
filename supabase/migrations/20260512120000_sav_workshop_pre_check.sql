-- =============================================================
-- Migration : SAV — pré-check atelier (T5 bis)
-- Date      : 2026-05-12
-- Notes     : À l'étape "Aile reçue" l'atelier choisit entre
--               * problème évident → diagnostic direct (T6)
--               * problème pas clair → pré-check court (~1h)
--             Le pré-check est facturé à Plume au tarif fixe défini
--             dans plume_settings.pre_check_fee_eur (singleton id=1,
--             cf. migration 20260512010000). Le tarif est figé sur le
--             ticket (pre_check_fee_eur) au moment de la complétion
--             pour garantir l'historique facturation.
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Nouveau statut request_status (sous-étape T5 bis)
-- ------------------------------------------------------------
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'workshop_pre_checking';

-- ------------------------------------------------------------
-- 2. Colonnes pré-check sur service_requests
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS pre_check_started_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pre_check_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pre_check_observations TEXT,
  ADD COLUMN IF NOT EXISTS pre_check_fee_eur      NUMERIC(10, 2);

COMMENT ON COLUMN public.service_requests.pre_check_fee_eur IS
  'Tarif du pré-check facturé à Plume, figé au moment de la complétion (snapshot de plume_settings.pre_check_fee_eur).';

-- ------------------------------------------------------------
-- 3. Colonne tarif sur plume_settings (singleton id=1)
-- ------------------------------------------------------------
ALTER TABLE public.plume_settings
  ADD COLUMN IF NOT EXISTS pre_check_fee_eur NUMERIC(10, 2) NOT NULL DEFAULT 50
    CHECK (pre_check_fee_eur >= 0);

COMMENT ON COLUMN public.plume_settings.pre_check_fee_eur IS
  'Tarif fixe (€) facturé à Plume pour un pré-check atelier (~1h max). Modifiable depuis /plume/settings.';

-- ------------------------------------------------------------
-- 4. Étendre la policy RLS atelier pour inclure le nouveau statut
-- ------------------------------------------------------------
-- L'atelier doit pouvoir SELECT et UPDATE un ticket en workshop_pre_checking.
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
      WHERE ur.user_id = auth.uid() AND ur.role = 'atelier'
    )
    AND assigned_workshop_id IS NOT NULL
    AND status IN (
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
