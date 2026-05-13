-- =============================================================
-- Migration : SAV — durcissement RLS DELETE bucket 'tickets'
-- Date      : 2026-05-13
-- Notes     : La policy DELETE de la migration 20260510200000 autorise
--             tout user authentifié à supprimer N'IMPORTE QUEL fichier
--             du bucket. Un client pouvait techniquement effacer les
--             photos d'un autre client en appelant Supabase Storage
--             directement (le scoping côté Server Actions n'est pas
--             un garde-fou si l'utilisateur a un anon key valide).
--
--             Nouveau modèle : DELETE autorisé UNIQUEMENT à
--               - l'owner de l'objet (storage.objects.owner = auth.uid())
--               - OU un user avec le rôle plume_admin / admin
--
--             Note Supabase Storage : storage.objects.owner est rempli
--             automatiquement à l'INSERT avec l'auth.uid() de
--             l'uploader. Les objets uploadés avant ce durcissement
--             gardent leur owner historique — pas de migration de
--             données nécessaire.
--
--             Pas de changement sur INSERT/SELECT/UPDATE — le bucket
--             reste public en lecture (URLs signées via getPublicUrl()
--             côté UI), et l'INSERT reste ouvert (le scoping fin se
--             fait via le path `<userId>/...` côté wizard).
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

DROP POLICY IF EXISTS "tickets_authenticated_delete" ON storage.objects;

CREATE POLICY "tickets_owner_or_admin_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'tickets'
    AND (
      owner = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid()
          AND ur.role IN ('plume_admin', 'admin')
      )
    )
  );
