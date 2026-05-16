-- =============================================================
-- Migration : SAV — refonte du workflow des étapes atelier
-- Date      : 2026-05-16
-- Notes     : Le workflow atelier post-diagnostic devient un sous-pipeline
--             à 3 branches, piloté par `workshop_decision` :
--
--               - 'no_issue'    : RAS → créer ticket d'envoi → envoyer
--               - 'repair'      : réparation en cours (date estimée) →
--                                 réparation terminée → ticket d'envoi → envoyer
--               - 'replacement' : aile irréparable → validation Plume HQ →
--                                 ticket d'envoi (vers Plume) → envoyer
--
--             Les étapes post-décision sont matérialisées par des FLAGS
--             (timestamps / booléens) plutôt que par de nouveaux statuts :
--             ça permet un retour en arrière granulaire (bouton « Modifier »)
--             sans toucher au pipeline de statuts existant.
--
--             Nouvelles colonnes :
--               - workshop_repair_estimated_date : date de fin estimée de
--                 réparation (branche 'repair'), saisie à la décision.
--               - plume_replacement_approved + audit : validation Plume HQ
--                 du remplacement (branche 'replacement'). NULL = en attente,
--                 TRUE = approuvé, FALSE = refusé (raison obligatoire).
--               - workshop_deep_check_at : étape « Check approfondi » des
--                 branches 'no_issue' / 'replacement' (contrôle détaillé
--                 confirmé avant expédition).
--               - workshop_shipping_prepared_at : étape « Imprimer le ticket
--                 d'envoi » — débloque l'étape finale « Voile envoyée ».
--
--             `workshop_return_destination` accepte désormais 'plume' (renvoi
--             de l'aile irréparable vers Plume HQ).
--
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Nouvelles colonnes sur service_requests
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS workshop_repair_estimated_date    DATE,
  ADD COLUMN IF NOT EXISTS plume_replacement_approved        BOOLEAN,
  ADD COLUMN IF NOT EXISTS plume_replacement_approved_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plume_replacement_decided_by      UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS plume_replacement_refusal_reason  TEXT,
  ADD COLUMN IF NOT EXISTS workshop_deep_check_at            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS workshop_shipping_prepared_at     TIMESTAMPTZ;

-- ------------------------------------------------------------
-- 2. Contraintes
-- ------------------------------------------------------------

-- 2a. Refus de remplacement → raison obligatoire (même garde-fou que
--     plume_shipping_refusal_reason).
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_plume_replacement_refusal_chk;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_plume_replacement_refusal_chk
    CHECK (
      plume_replacement_approved IS DISTINCT FROM FALSE
      OR (plume_replacement_refusal_reason IS NOT NULL
          AND length(btrim(plume_replacement_refusal_reason)) > 0)
    );

-- 2b. `workshop_return_destination` accepte 'plume' en plus de school/client.
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_workshop_return_destination_check;
DO $$
BEGIN
  -- Le nom de contrainte auto-généré par le CHECK inline de la migration
  -- 20260510000000 dépend de Postgres ; on cherche/supprime toute contrainte
  -- portant sur cette colonne avant de re-créer une version élargie.
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.service_requests'::regclass
      AND conname LIKE '%workshop_return_destination%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE public.service_requests DROP CONSTRAINT ' || quote_ident(conname)
      FROM pg_constraint
      WHERE conrelid = 'public.service_requests'::regclass
        AND conname LIKE '%workshop_return_destination%'
      LIMIT 1
    );
  END IF;

  ALTER TABLE public.service_requests
    ADD CONSTRAINT service_requests_workshop_return_destination_check
    CHECK (
      workshop_return_destination IS NULL
      OR workshop_return_destination IN ('school', 'client', 'plume')
    );
END
$$;

-- ------------------------------------------------------------
-- 3. Index pour la queue Plume HQ « remplacements à valider »
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_service_requests_pending_plume_replacement
  ON public.service_requests(workshop_decision_at DESC)
  WHERE workshop_decision = 'replacement' AND plume_replacement_approved IS NULL;

-- Note : pas de RLS supplémentaire — les policies atelier / plume_admin
-- existantes couvrent déjà l'UPDATE des tickets escaladés, donc les nouvelles
-- colonnes par extension.
