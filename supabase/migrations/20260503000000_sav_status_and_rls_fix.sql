-- =============================================================
-- Migration : SAV — sav_status + colonnes diagnostic + fix RLS
-- Date      : 2026-05-03
-- Problème  : service_requests.status utilise request_status (enum
--             partagé entre les apps Plume). Le SAV a besoin de son
--             propre workflow status (ticket_status enum déjà créé).
--             Solution : ajouter sav_status (ticket_status) et laisser
--             status (request_status) pour la compatibilité cross-app.
-- =============================================================

-- ------------------------------------------------------------
-- 1. Colonne sav_status pour le workflow SAV
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS sav_status ticket_status NOT NULL DEFAULT 'submitted';

-- Backfill : mapping request_status → ticket_status pour les tickets existants
UPDATE public.service_requests
SET sav_status =
  CASE status::text
    WHEN 'completed' THEN 'closed'::ticket_status
    WHEN 'SUCCESS'   THEN 'closed'::ticket_status
    WHEN 'processing' THEN 'in_review'::ticket_status
    WHEN 'approved'  THEN 'diagnosed'::ticket_status
    WHEN 'rejected'  THEN 'rejected'::ticket_status
    WHEN 'cancelled' THEN 'closed'::ticket_status
    ELSE 'submitted'::ticket_status
  END;

-- ------------------------------------------------------------
-- 2. Colonnes diagnostic manquantes dans la migration initiale
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS diagnosis_notes  TEXT,
  ADD COLUMN IF NOT EXISTS estimated_hours  NUMERIC CHECK (estimated_hours >= 0),
  ADD COLUMN IF NOT EXISTS parts_needed     TEXT;

-- ------------------------------------------------------------
-- 3. Backfill client_id depuis user_id (tickets créés avant SAV)
-- ------------------------------------------------------------
UPDATE public.service_requests
  SET client_id = user_id
  WHERE client_id IS NULL AND user_id IS NOT NULL;

-- ------------------------------------------------------------
-- 4. Fix RLS service_requests
--    SELECT : reconnaît client_id (SAV) ET user_id (plateforme)
--    INSERT : on exige toujours client_id = auth.uid() (sécurisé)
--    UPDATE : autoriser les deux colonnes, guard sur sav_status
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "client_select_own_tickets" ON public.service_requests;
CREATE POLICY "client_select_own_tickets"
  ON public.service_requests FOR SELECT
  USING (client_id = auth.uid() OR user_id = auth.uid());

DROP POLICY IF EXISTS "client_update_draft_tickets" ON public.service_requests;
CREATE POLICY "client_update_draft_tickets"
  ON public.service_requests FOR UPDATE
  USING (
    (client_id = auth.uid() OR user_id = auth.uid())
    AND sav_status = 'draft'
  )
  WITH CHECK (client_id = auth.uid() OR user_id = auth.uid());

-- Index pour sav_status (filtres fréquents par dashboard)
CREATE INDEX IF NOT EXISTS idx_service_requests_sav_status
  ON public.service_requests(sav_status);
