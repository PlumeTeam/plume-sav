-- =============================================================
-- Migration : SAV — heures de vol max avant fin de garantie
-- Date      : 2026-05-15
-- Notes     : Ajoute warranty_max_hours sur le singleton plume_settings
--             (id=1, créé par 20260512010000_sav_repair_replacement_decision).
--             Plafond d'heures de vol au-delà duquel la garantie est
--             considérée expirée — quelle que soit la durée écoulée depuis
--             l'achat. À l'avenir, sera comparé aux flight_hours déclarées
--             à la création d'un ticket pour basculer warranty_tier.
--
--             300 h par défaut — ordre de grandeur cohérent avec l'usage
--             école (l'aile reste sous garantie jusqu'à ce que l'élève
--             passe en autonomie). Aucune feature n'utilise encore la
--             colonne — stockage et affichage uniquement.
--
--             Réutilise les policies RLS existantes sur plume_settings
--             (read = tout authentifié, update/insert = plume_admin only).
-- =============================================================

ALTER TABLE public.plume_settings
  ADD COLUMN IF NOT EXISTS warranty_max_hours INTEGER NOT NULL DEFAULT 300
    CHECK (warranty_max_hours >= 0 AND warranty_max_hours <= 100000);

COMMENT ON COLUMN public.plume_settings.warranty_max_hours IS
  'Plafond d''heures de vol au-delà duquel la garantie expire, quelle que soit la date d''achat. Configurable par Plume HQ.';
