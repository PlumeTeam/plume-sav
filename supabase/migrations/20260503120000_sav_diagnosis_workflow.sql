-- =============================================================
-- Migration : SAV — workflow diagnostic école/atelier + escalation
-- Date      : 2026-05-03
-- Notes     : Ajoute les colonnes nécessaires pour stocker
--             - les checklists de diagnostic (école + atelier) en JSONB
--             - la résolution choisie par l'école (3 issues + escalation)
--             - l'atelier partenaire assigné
-- Application :
--   1) Vérifier le schéma sur staging via MCP Supabase apply_migration
--   2) Pousser sur prod après QA
-- =============================================================

-- ------------------------------------------------------------
-- 1. Colonnes diagnostic école
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS school_checklist        JSONB,
  ADD COLUMN IF NOT EXISTS school_resolution       TEXT
    CHECK (school_resolution IN (
      'resolved_by_school',          -- petit SAV fait sur place (ripstop, conseil, réglage)
      'normal_behavior_explained',   -- comportement normal, client informé
      'escalated_to_workshop',       -- transmis à un atelier du réseau
      'escalated_to_plume'           -- cas exceptionnel, remonté à Plume HQ
    )),
  ADD COLUMN IF NOT EXISTS school_resolution_note  TEXT,
  ADD COLUMN IF NOT EXISTS school_resolved_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS school_resolved_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 2. Colonnes diagnostic atelier
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS workshop_checklist      JSONB,
  ADD COLUMN IF NOT EXISTS assigned_workshop_id    TEXT,   -- code atelier (ex 'plume-annecy')
  ADD COLUMN IF NOT EXISTS assigned_workshop_label TEXT,   -- libellé affiché (ex 'Atelier Plume Annecy')
  ADD COLUMN IF NOT EXISTS workshop_assigned_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS workshop_assigned_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 3. Indexes pour les filtres de dashboard
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_service_requests_school_resolution
  ON public.service_requests(school_resolution);

CREATE INDEX IF NOT EXISTS idx_service_requests_assigned_workshop_id
  ON public.service_requests(assigned_workshop_id);

-- ------------------------------------------------------------
-- 4. RLS — pas de nouvelle policy nécessaire
--    Les colonnes ajoutées héritent des policies existantes sur
--    service_requests (client/school/workshop/plume_admin). Les
--    écritures se font via Server Actions vérifiées.
-- ------------------------------------------------------------
