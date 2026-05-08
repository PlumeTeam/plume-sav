-- =============================================================
-- Migration : SAV — bucket Storage 'tickets' + policies d'accès
-- Date      : 2026-05-10
-- Notes     : Versionne le bucket Storage utilisé pour les photos
--             des tickets SAV. Bucket public en lecture (les URLs
--             des photos sont signées via getPublicUrl() côté UI).
--
--             Le bucket est probablement déjà créé en prod via le
--             dashboard Supabase ; ce fichier sert à le rejouer
--             proprement sur staging/local. Idempotent.
--
--             Pattern : ON CONFLICT DO NOTHING pour le bucket,
--             DROP POLICY IF EXISTS + CREATE POLICY pour les ACL
--             (Postgres ne supporte pas CREATE POLICY IF NOT EXISTS).
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Création du bucket
-- ------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('tickets', 'tickets', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 2. Policies d'accès (4 verbes) — utilisateurs authentifiés
-- ------------------------------------------------------------
-- SELECT — lecture par tout user authentifié (le bucket est public, mais
-- on garde une policy explicite pour pouvoir affiner par dossier plus tard).
DROP POLICY IF EXISTS "tickets_authenticated_select" ON storage.objects;
CREATE POLICY "tickets_authenticated_select"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'tickets');

-- INSERT — upload par tout user authentifié (le scoping fin se fait côté
-- Server Actions et via la RLS sur ticket_photos).
DROP POLICY IF EXISTS "tickets_authenticated_insert" ON storage.objects;
CREATE POLICY "tickets_authenticated_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'tickets');

-- UPDATE — métadonnées (rare, mais utile si l'on renomme un objet).
DROP POLICY IF EXISTS "tickets_authenticated_update" ON storage.objects;
CREATE POLICY "tickets_authenticated_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'tickets')
  WITH CHECK (bucket_id = 'tickets');

-- DELETE — réservé aux uploads ratés (best-effort cleanup côté wizard).
-- À durcir plus tard : ne permettre la suppression qu'au propriétaire de
-- l'objet ou à plume_admin.
DROP POLICY IF EXISTS "tickets_authenticated_delete" ON storage.objects;
CREATE POLICY "tickets_authenticated_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'tickets');
