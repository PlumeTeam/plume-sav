-- =============================================================
-- Migration : SAV — méthode de remise de l'aile à l'école
-- Date      : 2026-05-07
-- Notes     : Le client choisit dans le wizard s'il dépose son aile
--             en main propre à l'école ou s'il l'envoie par la poste.
--             L'école a besoin de l'info pour savoir si elle attend
--             un colis ou un client en RDV.
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS delivery_method TEXT
    CHECK (delivery_method IN ('in_person', 'postal'));

-- Index pour les filtres/queues école : "colis attendus" vs "RDV à programmer"
CREATE INDEX IF NOT EXISTS idx_service_requests_delivery_method
  ON public.service_requests(delivery_method)
  WHERE delivery_method IS NOT NULL;
