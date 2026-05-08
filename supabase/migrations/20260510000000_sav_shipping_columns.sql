-- =============================================================
-- Migration : SAV — colonnes pour les bons de transport GLS
-- Date      : 2026-05-10
-- Notes     : Trois legs de transport possibles dans le parcours SAV :
--               1. client → école         (envoi postal du client)
--               2. école → atelier        (escalade vers atelier)
--               3. atelier → école/client (renvoi après réparation)
--             Chaque leg porte son propre tracking + URL de l'étiquette
--             PDF stockée dans le bucket `shipping-labels`.
--
--             `auto_approved_shipping` est un flag anti-abus :
--               - TRUE par défaut → étiquette générée tout de suite
--               - FALSE forcé par la Server Action si l'utilisateur a
--                 déjà ≥ 2 SAV cette année → admin Plume doit valider.
--
--             Le carrier défaut est GLS sur les 3 legs ; on stocke la
--             colonne uniquement sur le leg client→école pour traçabilité
--             (le client n'a pas le choix, mais on garde la trace pour
--             des audits ou un futur onboarding multi-carrier).
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Leg client → école (envoi postal initial)
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS client_school_tracking  TEXT,
  ADD COLUMN IF NOT EXISTS client_school_label_url TEXT,
  ADD COLUMN IF NOT EXISTS client_school_carrier   TEXT DEFAULT 'GLS';

-- ------------------------------------------------------------
-- 2. Leg école → atelier (escalade)
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS school_workshop_tracking  TEXT,
  ADD COLUMN IF NOT EXISTS school_workshop_label_url TEXT;

-- ------------------------------------------------------------
-- 3. Leg atelier → renvoi (école ou client direct)
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS workshop_return_tracking    TEXT,
  ADD COLUMN IF NOT EXISTS workshop_return_label_url   TEXT,
  ADD COLUMN IF NOT EXISTS workshop_return_destination TEXT
    CHECK (workshop_return_destination IS NULL
        OR workshop_return_destination IN ('school', 'client'));

-- ------------------------------------------------------------
-- 4. Anti-abus : approbation auto vs validation admin
-- ------------------------------------------------------------
-- Default TRUE pour ne pas casser les tickets existants ; la Server Action
-- le force à FALSE quand le compteur de SAV de l'utilisateur dépasse le
-- seuil annuel (cf. generateSavShippingLabelAction).
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS auto_approved_shipping BOOLEAN NOT NULL DEFAULT TRUE;

-- ------------------------------------------------------------
-- 5. Index partiels (la grande majorité des rows seront NULL —
--    le SAV ne représente qu'une partie des service_requests)
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_service_requests_client_school_tracking
  ON public.service_requests(client_school_tracking)
  WHERE client_school_tracking IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_school_workshop_tracking
  ON public.service_requests(school_workshop_tracking)
  WHERE school_workshop_tracking IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_service_requests_workshop_return_tracking
  ON public.service_requests(workshop_return_tracking)
  WHERE workshop_return_tracking IS NOT NULL;

-- Index pour la queue admin Plume : tickets en attente de validation manuelle.
CREATE INDEX IF NOT EXISTS idx_service_requests_pending_shipping_approval
  ON public.service_requests(auto_approved_shipping, created_at DESC)
  WHERE auto_approved_shipping = FALSE;
