-- =============================================================
-- Migration : SAV — Durcissement RLS du bucket Storage 'tickets'
-- Date      : 2026-05-14
-- Notes     : Remplace les 4 policies permissives créées par
--             20260510200000_sav_storage_bucket.sql qui autorisaient
--             tout utilisateur authentifié à lire / écrire / modifier
--             / supprimer n'importe quel fichier du bucket.
--
--             Garde-fous mis en place :
--               * SELECT  → propriétaire OU path préfixé par auth.uid()
--                           OU acteur du ticket (via ticket_photos)
--                           OU plume_admin.
--               * INSERT  → path doit commencer par auth.uid() (le code
--                           force `${user.id}/...` côté StepReview et
--                           CheckWizard) OU plume_admin.
--               * UPDATE  → propriétaire OU plume_admin.
--               * DELETE  → propriétaire OU plume_admin.
--
--             ⚠️ Le bucket est `public = true` (cf. migration de création)
--             pour que getPublicUrl() rende des URLs HTTP accessibles à
--             plumes-projects (utilisateurs non-loggés en preview). Les
--             policies ci-dessous ne protègent QUE les accès via le client
--             Supabase (storage.from('tickets').download / .list /
--             .upload / .update / .remove). Le durcissement HTTP nécessite
--             de passer le bucket en privé + de remplacer getPublicUrl()
--             par createSignedUrl() — refonte non incluse ici.
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Drop des anciennes policies permissives
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "tickets_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "tickets_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "tickets_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "tickets_authenticated_delete" ON storage.objects;

-- ------------------------------------------------------------
-- 2. SELECT — propriétaire, uploader, acteur du ticket, admin
-- ------------------------------------------------------------
-- Sont autorisés à lire un objet du bucket 'tickets' :
--   a. plume_admin (tout)
--   b. owner = auth.uid() (uploader Storage)
--   c. path commençant par auth.uid()/ (premier segment = user id) — couvre
--      les uploads où le `owner` n'est pas peuplé (cas marginal selon la
--      version Storage)
--   d. acteur du ticket associé via ticket_photos.storage_path = name :
--        - client (sr.client_id ou sr.user_id)
--        - école assignée (school_id ou referent_school_id ∈
--          current_user_partner_school_ids())
--        - atelier (rôle 'atelier' + assigned_workshop_id non NULL)
DROP POLICY IF EXISTS "tickets_select_scoped" ON storage.objects;
CREATE POLICY "tickets_select_scoped"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'tickets'
    AND (
      -- a. plume_admin
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'plume_admin'
      )
      -- b. propriétaire Storage
      OR owner = auth.uid()
      -- c. path préfixé par auth.uid()/
      OR name LIKE auth.uid()::text || '/%'
      -- d. acteur lié au ticket via ticket_photos
      OR EXISTS (
        SELECT 1
        FROM public.ticket_photos tp
        JOIN public.service_requests sr ON sr.id = tp.ticket_id
        WHERE tp.storage_path = storage.objects.name
          AND (
            sr.client_id = auth.uid()
            OR sr.user_id  = auth.uid()
            OR sr.school_id IN (
              SELECT school_id FROM public.current_user_partner_school_ids()
            )
            OR sr.referent_school_id IN (
              SELECT school_id FROM public.current_user_partner_school_ids()
            )
            OR (
              sr.assigned_workshop_id IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM public.user_roles ur2
                WHERE ur2.user_id = auth.uid() AND ur2.role = 'atelier'
              )
            )
          )
      )
    )
  );

-- ------------------------------------------------------------
-- 3. INSERT — path préfixé par auth.uid() ou plume_admin
-- ------------------------------------------------------------
-- Force la convention `${user.id}/...` déjà appliquée côté wizard client
-- (StepReview.tsx) et inspection école (CheckWizard.tsx). Empêche un user
-- d'uploader sous le préfixe d'un autre user.
DROP POLICY IF EXISTS "tickets_insert_self_prefix" ON storage.objects;
CREATE POLICY "tickets_insert_self_prefix"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'tickets'
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'plume_admin'
      )
      OR name LIKE auth.uid()::text || '/%'
    )
  );

-- ------------------------------------------------------------
-- 4. UPDATE — propriétaire ou plume_admin
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "tickets_update_owner_or_admin" ON storage.objects;
CREATE POLICY "tickets_update_owner_or_admin"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'tickets'
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'plume_admin'
      )
      OR owner = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'tickets'
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'plume_admin'
      )
      OR owner = auth.uid()
    )
  );

-- ------------------------------------------------------------
-- 5. DELETE — propriétaire ou plume_admin
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "tickets_delete_owner_or_admin" ON storage.objects;
CREATE POLICY "tickets_delete_owner_or_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'tickets'
    AND (
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'plume_admin'
      )
      OR owner = auth.uid()
    )
  );
