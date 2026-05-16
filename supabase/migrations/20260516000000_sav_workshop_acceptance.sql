-- =============================================================
-- Migration : SAV — validation atelier de la demande escaladée
-- Date      : 2026-05-16
-- Notes     : Quand l'école escalade un ticket vers un atelier
--             partenaire (school_resolution = 'escalated_to_workshop'),
--             l'atelier doit confirmer qu'il accepte la demande et
--             qu'il est disponible AVANT que l'école ne génère le bon
--             de transport.
--
--             Trois états sur la colonne `workshop_accepted` :
--               NULL  → en attente de réponse de l'atelier (défaut)
--               TRUE  → atelier disponible — l'école peut imprimer le
--                       ticket d'envoi
--               FALSE → atelier indisponible — `workshop_refusal_reason`
--                       explique pourquoi ; l'école doit choisir un
--                       autre atelier (la réassignation remet la colonne
--                       à NULL côté Server Action).
--
--             Audit : auteur + date de la décision conservés pour la
--             traçabilité.
--
-- Application : MCP Supabase apply_migration OU `supabase db push`
--               sur le projet gxighesxbavnzzyngjaz, puis régénérer les
--               types avec `pnpm db:gen-types`.
-- =============================================================

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS workshop_accepted        BOOLEAN,
  ADD COLUMN IF NOT EXISTS workshop_accepted_at     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS workshop_accepted_by     UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS workshop_refusal_reason  TEXT;

-- Garde-fou : si refus, on exige une raison non vide pour que l'école
-- comprenne pourquoi et puisse réorienter le ticket.
ALTER TABLE public.service_requests
  DROP CONSTRAINT IF EXISTS service_requests_workshop_refusal_consistent_chk;
ALTER TABLE public.service_requests
  ADD CONSTRAINT service_requests_workshop_refusal_consistent_chk
    CHECK (
      workshop_accepted IS DISTINCT FROM FALSE
      OR (workshop_refusal_reason IS NOT NULL AND length(btrim(workshop_refusal_reason)) > 0)
    );

-- Index partiel pour la queue atelier "demandes à valider".
CREATE INDEX IF NOT EXISTS idx_service_requests_pending_workshop_acceptance
  ON public.service_requests(assigned_workshop_id, created_at DESC)
  WHERE status = 'escalated_to_workshop' AND workshop_accepted IS NULL;
