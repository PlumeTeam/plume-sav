-- =============================================================
-- Migration : SAV — Rapport de révision (tickets type 'revision')
-- Date      : 2026-05-14
-- Notes     : Quand l'atelier traite un ticket de type "inspection /
--             contrôle / révision" (service_type = 'revision'), il
--             produit un rapport (PDF, image, doc) qui doit rester
--             attaché à l'aile pendant toute sa vie.
--
--             On stocke uniquement le storage_path dans le bucket
--             'tickets' (préfixe revision-reports/{ticket_id}/...),
--             plus quelques métadonnées d'audit légères. Le contenu
--             du fichier vit dans Supabase Storage.
--
--             Aucune contrainte FK sur uploaded_by — auth.users n'est
--             pas dans le schéma public, on garde l'UUID brut comme
--             ailleurs (workshop_assigned_by, school_resolved_by).
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS revision_report_path        TEXT,
  ADD COLUMN IF NOT EXISTS revision_report_filename    TEXT,
  ADD COLUMN IF NOT EXISTS revision_report_uploaded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revision_report_uploaded_by UUID;

COMMENT ON COLUMN public.service_requests.revision_report_path        IS 'Storage path (bucket tickets) du rapport de révision uploadé par l''atelier.';
COMMENT ON COLUMN public.service_requests.revision_report_filename    IS 'Nom de fichier original (pour download UI).';
COMMENT ON COLUMN public.service_requests.revision_report_uploaded_at IS 'Date d''upload du rapport de révision.';
COMMENT ON COLUMN public.service_requests.revision_report_uploaded_by IS 'auth.users.id de l''utilisateur atelier ou plume_admin qui a uploadé le rapport.';
