-- =============================================================
-- Migration : SAV — décision réparation / remplacement (T6 atelier)
-- Date      : 2026-05-12
-- Notes     : Après pré-check, l'atelier estime le coût de réparation.
--             - Si coût ≤ seuil (plume_settings.repair_replacement_threshold_eur)
--               → décision « repair ».
--             - Sinon → décision « replacement » (aile neuve).
--
--             Garantie 2 ans depuis purchase_date par défaut (configurable
--             via plume_settings.warranty_duration_months).
--             Hors garantie → Plume ne prend pas en charge par défaut,
--             mais peut décider exceptionnellement de le faire (override
--             obligatoirement justifié dans `workshop_decision_note`).
--
--             Singleton `plume_settings` (id = 1) — table partagée entre
--             toutes les apps Plume, créée ici si elle n'existe pas encore.
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Table singleton plume_settings (paramètres globaux)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.plume_settings (
  id                                INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  repair_replacement_threshold_eur  NUMERIC(10, 2) NOT NULL DEFAULT 1500
    CHECK (repair_replacement_threshold_eur >= 0),
  warranty_duration_months          INTEGER NOT NULL DEFAULT 24
    CHECK (warranty_duration_months > 0 AND warranty_duration_months <= 240),
  updated_at                        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by                        UUID
);

-- Idempotent : insère la row par défaut si absente.
INSERT INTO public.plume_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Colonnes décision atelier sur service_requests
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS workshop_estimated_repair_cost      NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS workshop_decision                   TEXT,
  ADD COLUMN IF NOT EXISTS workshop_decision_at                TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS workshop_decision_by                UUID,
  ADD COLUMN IF NOT EXISTS workshop_decision_warranty_status   TEXT,
  ADD COLUMN IF NOT EXISTS workshop_decision_warranty_covered  BOOLEAN,
  ADD COLUMN IF NOT EXISTS workshop_decision_note              TEXT;

-- Contraintes (idempotentes via DO blocks — CHECK n'a pas de IF NOT EXISTS).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_requests_workshop_decision_check'
  ) THEN
    ALTER TABLE public.service_requests
      ADD CONSTRAINT service_requests_workshop_decision_check
      CHECK (workshop_decision IS NULL OR workshop_decision IN ('repair', 'replacement'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_requests_workshop_warranty_status_check'
  ) THEN
    ALTER TABLE public.service_requests
      ADD CONSTRAINT service_requests_workshop_warranty_status_check
      CHECK (workshop_decision_warranty_status IS NULL
             OR workshop_decision_warranty_status IN ('under_warranty', 'out_of_warranty'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_requests_workshop_repair_cost_check'
  ) THEN
    ALTER TABLE public.service_requests
      ADD CONSTRAINT service_requests_workshop_repair_cost_check
      CHECK (workshop_estimated_repair_cost IS NULL OR workshop_estimated_repair_cost >= 0);
  END IF;
END
$$;

-- ------------------------------------------------------------
-- 3. RLS plume_settings
-- ------------------------------------------------------------
ALTER TABLE public.plume_settings ENABLE ROW LEVEL SECURITY;

-- Tout user authentifié peut lire le seuil (l'atelier en a besoin pour
-- afficher la décision auto, l'école pour comprendre la couverture).
DROP POLICY IF EXISTS "authenticated_read_plume_settings" ON public.plume_settings;
CREATE POLICY "authenticated_read_plume_settings"
  ON public.plume_settings FOR SELECT
  TO authenticated
  USING (TRUE);

-- Seul Plume HQ peut modifier les paramètres globaux.
DROP POLICY IF EXISTS "plume_admin_update_settings" ON public.plume_settings;
CREATE POLICY "plume_admin_update_settings"
  ON public.plume_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('plume_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('plume_admin', 'admin')
    )
  );

DROP POLICY IF EXISTS "plume_admin_insert_settings" ON public.plume_settings;
CREATE POLICY "plume_admin_insert_settings"
  ON public.plume_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('plume_admin', 'admin')
    )
  );

-- Note : pas de RLS supplémentaire sur service_requests — les policies
-- atelier existantes (migration 20260510100000) couvrent déjà l'UPDATE
-- des tickets escaladés, donc des nouvelles colonnes par extension.
