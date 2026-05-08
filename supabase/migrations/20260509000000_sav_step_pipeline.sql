-- =============================================================
-- Migration : SAV — pipeline d'étapes (école + atelier)
-- Date      : 2026-05-09
-- Notes     : Versionne le pipeline d'étapes déjà appliqué en prod via
--             MCP Supabase. Les ALTER sont idempotents (IF NOT EXISTS)
--             pour garantir une application sans erreur sur tout env.
--
--             10 nouveaux statuts request_status couvrent le parcours
--             complet (réception école → check → escalade atelier →
--             diagnostic → réparation → renvoi).
--
--             7 nouvelles colonnes timestamp matérialisent chaque
--             transition (write-once via Server Actions).
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Nouveaux statuts request_status
-- ------------------------------------------------------------
-- Branche école (pré-décision)
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'school_acknowledged';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'wing_received_school';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'school_checking';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'school_resolved';

-- Escalade vers atelier
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'escalated_to_workshop';

-- Branche atelier (post-escalade)
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'wing_received_workshop';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'workshop_diagnosing';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'workshop_repairing';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'workshop_done';
ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'wing_returned';

-- ------------------------------------------------------------
-- 2. Colonnes timestamp pour chaque transition
-- ------------------------------------------------------------
-- Branche école
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS school_acknowledged_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wing_received_school_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS escalated_to_workshop_at  TIMESTAMPTZ;

-- Branche atelier
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS wing_received_workshop_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS workshop_diagnosis_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS workshop_repair_done_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS wing_returned_at          TIMESTAMPTZ;
