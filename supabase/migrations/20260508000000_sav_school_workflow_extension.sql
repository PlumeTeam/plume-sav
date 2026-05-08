-- =============================================================
-- Migration : SAV — extension du workflow école
-- Date      : 2026-05-08
-- Notes     : Trois nouveaux états transitoires + un flag urgence Plume.
--             - workshop_advice_requested : école demande un avis distance
--             - reflection                : école n'a pas encore décidé
--             - is_plume_urgent           : alerte HQ pour défaut grave
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Étendre l'enum school_resolution
-- ------------------------------------------------------------
-- Drop l'ancien CHECK et ajoute les 2 nouvelles valeurs.
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_school_resolution_check;

ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_school_resolution_check
  CHECK (school_resolution IN (
    'resolved_by_school',          -- école a fait un petit SAV (ripstop, conseil, réglage)
    'normal_behavior_explained',   -- école a expliqué que tout est normal
    'escalated_to_workshop',       -- école envoie l'aile à un atelier
    'escalated_to_plume',          -- cas exceptionnel, remontée HQ
    'workshop_advice_requested',   -- NEW: école demande un avis distance, sans envoyer l'aile
    'reflection'                   -- NEW: école n'a pas encore décidé
  ));

-- ------------------------------------------------------------
-- 2. Flag urgence Plume (niveau 3 — défaut grave)
-- ------------------------------------------------------------
-- Quand l'école identifie un défaut grave (sécurité), elle escalade vers
-- l'atelier ET déclenche une alerte HQ. Le bandeau Plume HQ affiche
-- ces tickets en priorité.
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS is_plume_urgent BOOLEAN NOT NULL DEFAULT FALSE;

-- Partial index : les tickets non urgents (la majorité) ne sont pas indexés.
CREATE INDEX IF NOT EXISTS idx_service_requests_is_plume_urgent
  ON public.service_requests(is_plume_urgent)
  WHERE is_plume_urgent = TRUE;
