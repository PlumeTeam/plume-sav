-- =============================================================
-- Migration : SAV — clôture explicite du ticket (T7)
-- Date      : 2026-05-12
-- Notes     : Ajoute 5 colonnes pour matérialiser la clôture d'un ticket :
--               - closed_by         qui a cliqué le bouton clôture
--               - closed_at         quand
--               - closed_by_role    depuis quel espace (école/atelier/plume_admin)
--               - closure_outcome   statut final (résolu en consultation / réparé / remplacé / non valide / etc.)
--               - closure_note      note libre optionnelle
--
--             Le client n'a JAMAIS le droit de clôturer (validation côté
--             Server Action). Le ticket clôturé reste consultable dans
--             l'historique de chaque espace.
--
--             closure_outcome est un TEXT + CHECK plutôt qu'un enum PG :
--             facile à étendre, cohérent avec workshop_return_destination
--             (mig. 20260510000000). Les libellés UI vivent côté code.
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Colonnes de clôture (idempotent)
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS closed_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS closed_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_by_role  TEXT,
  ADD COLUMN IF NOT EXISTS closure_outcome TEXT,
  ADD COLUMN IF NOT EXISTS closure_note    TEXT;

-- ------------------------------------------------------------
-- 2. CHECK constraints (idempotents)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_requests_closed_by_role_check'
  ) THEN
    ALTER TABLE public.service_requests
      ADD CONSTRAINT service_requests_closed_by_role_check
      CHECK (closed_by_role IS NULL OR closed_by_role IN ('school', 'workshop', 'plume_admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_requests_closure_outcome_check'
  ) THEN
    ALTER TABLE public.service_requests
      ADD CONSTRAINT service_requests_closure_outcome_check
      CHECK (closure_outcome IS NULL OR closure_outcome IN (
        'resolved_in_consultation',
        'repaired',
        'replaced',
        'no_repair_needed',
        'invalid',
        'client_cancelled',
        'other'
      ));
  END IF;
END$$;

-- ------------------------------------------------------------
-- 3. Index pour les listes "tickets clôturés"
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS service_requests_closed_at_idx
  ON public.service_requests (closed_at DESC)
  WHERE closed_at IS NOT NULL;

COMMENT ON COLUMN public.service_requests.closure_outcome IS
  'Statut final SAV : resolved_in_consultation | repaired | replaced | no_repair_needed | invalid | client_cancelled | other.';
COMMENT ON COLUMN public.service_requests.closed_by_role IS
  'Espace depuis lequel la clôture a été effectuée : school | workshop | plume_admin. Le client ne peut pas clôturer.';
