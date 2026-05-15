-- =============================================================
-- Migration : SAV — validation Plume HQ de l'envoi postal client
-- Date      : 2026-05-15
-- Notes     : Anti-abus. À partir du 2ème ticket SAV de l'année, le
--             leg client→école est mis en attente de validation Plume
--             (cf. shipping.ts, flag `auto_approved_shipping=FALSE`).
--             Cette migration ajoute la décision Plume HQ — distincte
--             de la validation école qui régit `shipping_approved`.
--
--             Trois états possibles sur `plume_shipping_approved` :
--               NULL  → en attente de décision Plume HQ (état initial
--                       quand `auto_approved_shipping = FALSE`)
--               TRUE  → Plume HQ autorise l'envoi → le client peut
--                       générer son bon de transport
--               FALSE → Plume HQ refuse → `plume_shipping_refusal_reason`
--                       explique pourquoi
--
--             Pourquoi ne pas réutiliser `shipping_approved` ? Cette
--             colonne porte la décision **école** (validation de la
--             demande d'envoi postal en soi). La décision Plume HQ est
--             une seconde porte, ajoutée pour les clients récidivistes :
--             les deux peuvent diverger (école OK, Plume KO ou vice-versa).
--
--             Audit : auteur + date stockés pour la traçabilité, à
--             l'identique du pattern `shipping_decided_at/by`.
--
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS plume_shipping_approved        BOOLEAN,
  ADD COLUMN IF NOT EXISTS plume_shipping_refusal_reason  TEXT,
  ADD COLUMN IF NOT EXISTS plume_shipping_decided_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS plume_shipping_decided_by      UUID REFERENCES auth.users(id);

-- Si refus, raison obligatoire (même garde-fou que shipping_refusal_reason)
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_plume_shipping_refusal_consistent_chk;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_plume_shipping_refusal_consistent_chk
    CHECK (
      plume_shipping_approved IS DISTINCT FROM FALSE
      OR (plume_shipping_refusal_reason IS NOT NULL AND length(btrim(plume_shipping_refusal_reason)) > 0)
    );

-- Index partiel pour la queue Plume HQ "validations d'envoi en attente"
CREATE INDEX IF NOT EXISTS idx_service_requests_pending_plume_shipping
  ON public.service_requests(created_at DESC)
  WHERE auto_approved_shipping = FALSE AND plume_shipping_approved IS NULL;
