-- =============================================================
-- Migration : SAV — validation école de l'envoi postal de l'aile
-- Date      : 2026-05-12
-- Notes     : Quand le client choisit delivery_method='postal', il ne
--             peut générer son bon de transport qu'après accord de
--             l'école. L'école peut :
--               - autoriser     → shipping_approved = TRUE
--               - refuser       → shipping_approved = FALSE + raison
--               - ne rien faire → shipping_approved = NULL (par défaut)
--
--             Le client voit dans son dashboard l'un des trois états :
--               NULL  → "En attente de validation par l'école"
--               TRUE  → bouton "Générer le bon de transport" actif
--               FALSE → message d'explication + piste de résolution
--
--             Audit : on garde l'auteur et la date de la décision pour
--             la traçabilité (et un éventuel rollback côté admin Plume).
--
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS shipping_approved        BOOLEAN,
  ADD COLUMN IF NOT EXISTS shipping_refusal_reason  TEXT,
  ADD COLUMN IF NOT EXISTS shipping_decided_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS shipping_decided_by      UUID REFERENCES auth.users(id);

-- Garde-fou : si refus, on exige une raison non vide pour ne pas laisser
-- le client sans explication.
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_shipping_refusal_consistent_chk;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_shipping_refusal_consistent_chk
    CHECK (
      shipping_approved IS DISTINCT FROM FALSE
      OR (shipping_refusal_reason IS NOT NULL AND length(btrim(shipping_refusal_reason)) > 0)
    );

-- Index partiel pour la queue école "validations d'envoi en attente"
CREATE INDEX IF NOT EXISTS idx_service_requests_pending_shipping_approval_school
  ON public.service_requests(referent_school_id, created_at DESC)
  WHERE delivery_method = 'postal' AND shipping_approved IS NULL;
