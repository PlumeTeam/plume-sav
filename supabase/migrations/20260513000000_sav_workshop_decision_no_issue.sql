-- =============================================================
-- Migration : SAV — extension décision atelier ('no_issue')
-- Date      : 2026-05-13
-- Notes     : La décision atelier passe de 2 → 3 options :
--               - 'repair'      : coût ≤ seuil Plume → réparation
--               - 'replacement' : coût > seuil OU réparation jugée impossible
--               - 'no_issue'    : aucun défaut constaté → renvoi direct
--
--             La 3e option (no_issue) déclenche un saut de pipeline :
--             workshop_diagnosing → wing_returned (skip workshop_repairing
--             + workshop_done). La transition de statut est gérée par la
--             Server Action submitWorkshopDecisionAction.
--
--             L'ancienne contrainte CHECK 'repair' | 'replacement' est
--             remplacée pour autoriser 'no_issue'.
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'service_requests_workshop_decision_check'
  ) THEN
    ALTER TABLE public.service_requests
      DROP CONSTRAINT service_requests_workshop_decision_check;
  END IF;

  ALTER TABLE public.service_requests
    ADD CONSTRAINT service_requests_workshop_decision_check
    CHECK (
      workshop_decision IS NULL
      OR workshop_decision IN ('repair', 'replacement', 'no_issue')
    );
END
$$;
