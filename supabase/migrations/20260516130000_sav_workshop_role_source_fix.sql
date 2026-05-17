-- =============================================================
-- Migration : SAV — alignement RLS atelier sur la double source de
--             vérité du rôle (user_roles ET profiles.role)
-- Date      : 2026-05-16
-- Notes     : Bug constaté — le dashboard atelier ne reçoit aucun
--             ticket ni message pour certains comptes atelier.
--
--             Cause racine : désalignement entre la résolution de
--             rôle applicative et les policies RLS.
--               - Côté Next.js, getCurrentUserRoles() (features/auth/
--                 queries.ts) reconnaît un compte atelier si le rôle
--                 est présent dans user_roles OU dans profiles.role
--                 (la plateforme Plume principale stocke le rôle métier
--                 directement sur profiles ; certains comptes n'ont
--                 rien dans user_roles).
--               - Côté DB, TOUTES les policies atelier interrogent
--                 EXCLUSIVEMENT user_roles. La policy permissive
--                 'authenticated_access' ayant été supprimée
--                 (20260514110000), un compte atelier dont le rôle ne
--                 vit que dans profiles.role passe le garde-fou du
--                 layout mais se voit refuser toutes les lignes par la
--                 RLS → dashboard vide.
--
--             Correctif : un helper current_user_is_workshop() qui
--             reconnaît le rôle depuis les deux sources (mêmes valeurs
--             que ROLE_MAP : 'atelier' et 'workshop'), puis réécriture
--             des policies atelier pour l'utiliser. SECURITY DEFINER
--             pour pouvoir lire profiles malgré sa propre RLS — calqué
--             sur current_user_partner_school_ids().
--
--             Périmètre (mis à jour 2026-05-16, réintégration sur main) :
--             ce fichier a été rédigé avant 20260516000000_sav_ticket_
--             photos_workshop_rls. L'audit de réintégration a montré que
--             la policy atelier_select_photos (ticket_photos) ET la
--             branche atelier de tickets_select_scoped (storage.objects)
--             souffrent du MÊME bug double-source. Les sections 8 et 9
--             ci-dessous les corrigent. Toutes les policies atelier
--             passent désormais par le helper — plus aucune ne lit
--             user_roles seul pour la branche atelier.
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. Helper — le user courant est-il un compte atelier ?
-- ------------------------------------------------------------
-- Vrai si le rôle atelier/workshop est présent dans user_roles OU
-- dans profiles.role. Attention : sur la DB Plume, profiles.id ≠
-- profiles.user_id — le lien vers auth.users passe par user_id.
CREATE OR REPLACE FUNCTION public.current_user_is_workshop()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('atelier', 'workshop')
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('atelier', 'workshop')
    );
$$;

REVOKE ALL ON FUNCTION public.current_user_is_workshop() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_is_workshop() TO authenticated;

-- ------------------------------------------------------------
-- 2. service_requests — SELECT atelier
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "atelier_select_assigned_tickets" ON public.service_requests;
CREATE POLICY "atelier_select_assigned_tickets"
  ON public.service_requests FOR SELECT
  USING (
    public.current_user_is_workshop()
    AND assigned_workshop_id IS NOT NULL
    AND status IN (
      'pending_workshop',
      'escalated_to_workshop',
      'wing_received_workshop',
      'workshop_pre_checking',
      'workshop_diagnosing',
      'workshop_repairing',
      'workshop_done',
      'wing_returned'
    )
  );

-- ------------------------------------------------------------
-- 3. service_requests — UPDATE atelier
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "atelier_update_assigned_tickets" ON public.service_requests;
CREATE POLICY "atelier_update_assigned_tickets"
  ON public.service_requests FOR UPDATE
  USING (
    public.current_user_is_workshop()
    AND assigned_workshop_id IS NOT NULL
    AND status IN (
      'pending_workshop',
      'escalated_to_workshop',
      'wing_received_workshop',
      'workshop_pre_checking',
      'workshop_diagnosing',
      'workshop_repairing',
      'workshop_done',
      'wing_returned'
    )
  )
  WITH CHECK (
    assigned_workshop_id IS NOT NULL
  );

-- ------------------------------------------------------------
-- 4. ticket_messages — INSERT atelier
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "atelier_insert_messages" ON public.ticket_messages;
CREATE POLICY "atelier_insert_messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'workshop'
    AND public.current_user_is_workshop()
  );

-- ------------------------------------------------------------
-- 5. ticket_messages — INSERT par canal (channel_insert_messages)
-- ------------------------------------------------------------
-- Réécriture : la branche atelier passe par le helper, plume_admin et
-- ecole restent sur user_roles (leur résolution applicative n'utilise
-- pas profiles pour l'instant).
DROP POLICY IF EXISTS "channel_insert_messages" ON public.ticket_messages;
CREATE POLICY "channel_insert_messages"
  ON public.ticket_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND channel IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = ticket_id
        AND (
          sr.client_id = auth.uid()
          OR public.current_user_is_workshop()
          OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('plume_admin', 'ecole')
          )
        )
    )
  );

-- ------------------------------------------------------------
-- 6. ticket_messages — SELECT par canal (channel_select_messages)
-- ------------------------------------------------------------
-- Réécriture : la branche atelier passe par le helper. plume_admin,
-- ecole et client owner inchangés.
DROP POLICY IF EXISTS "channel_select_messages" ON public.ticket_messages;
CREATE POLICY "channel_select_messages"
  ON public.ticket_messages FOR SELECT
  TO authenticated
  USING (
    channel IS NOT NULL
    AND (
      -- plume_admin : voit tout
      EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'plume_admin'
      )
      -- atelier : voit les 5 canaux
      OR public.current_user_is_workshop()
      -- école : voit tout sauf workshop_plume
      OR (
        channel <> 'workshop_plume'
        AND EXISTS (
          SELECT 1 FROM public.user_roles ur
          WHERE ur.user_id = auth.uid() AND ur.role = 'ecole'
        )
      )
      -- client owner : 3 canaux où il a sa place
      OR (
        channel IN ('school_client', 'client_workshop', 'group')
        AND EXISTS (
          SELECT 1 FROM public.service_requests sr
          WHERE sr.id = ticket_id AND sr.client_id = auth.uid()
        )
      )
    )
  );

-- ------------------------------------------------------------
-- 7. RPC mark_ticket_read_by_workshop — même double source
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_ticket_read_by_workshop(p_ticket_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.service_requests
  SET workshop_last_read_at = now()
  WHERE id = p_ticket_id
    AND assigned_workshop_id IS NOT NULL
    AND public.current_user_is_workshop();
END;
$$;

-- ------------------------------------------------------------
-- 8. ticket_photos — SELECT atelier (atelier_select_photos)
-- ------------------------------------------------------------
-- Cette policy a été ajoutée par 20260516000000_sav_ticket_photos_workshop_rls
-- APRÈS la rédaction initiale de ce fichier. Elle souffre exactement du même
-- bug : la branche atelier n'interroge que user_roles. Un compte atelier dont
-- le rôle vit uniquement dans profiles.role ne voit donc aucune photo de
-- ticket → section Photos jamais rendue côté atelier.
-- On réécrit la policy en repartant de la définition à jour de main et en
-- remplaçant le test de rôle par le helper. Le cloisonnement (statut +
-- assigned_workshop_id) est conservé à l'identique.
DROP POLICY IF EXISTS "atelier_select_photos" ON public.ticket_photos;
CREATE POLICY "atelier_select_photos"
  ON public.ticket_photos FOR SELECT
  TO authenticated
  USING (
    public.current_user_is_workshop()
    AND EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = ticket_photos.ticket_id
        AND sr.assigned_workshop_id IS NOT NULL
        AND sr.status IN (
          'pending_workshop',
          'escalated_to_workshop',
          'wing_received_workshop',
          'workshop_pre_checking',
          'workshop_diagnosing',
          'workshop_repairing',
          'workshop_done',
          'wing_returned'
        )
    )
  );

-- ------------------------------------------------------------
-- 9. storage.objects — SELECT bucket 'tickets' (tickets_select_scoped)
-- ------------------------------------------------------------
-- La policy tickets_select_scoped (20260514100000_sav_storage_tickets_harden)
-- contrôle l'accès aux FICHIERS photos dans le bucket Storage 'tickets'.
-- Sa branche atelier (cas d.) avait DEUX défauts cumulés :
--   1. elle n'interroge que user_roles → invisible pour un atelier vivant
--      dans profiles.role (même bug que ci-dessus) ;
--   2. elle teste ur.role = 'atelier' STRICT, sans accepter 'workshop' —
--      régression vs la compat double valeur posée par 20260515130000.
-- Sans ce correctif, la policy ticket_photos (§8) laisse passer la LIGNE
-- mais l'URL signée / le download du FICHIER reste refusé : la photo
-- s'affiche cassée côté atelier.
-- On réécrit la policy en repartant de la définition à jour de main ; seule
-- la branche atelier (cas d.) change : helper à la place du sous-SELECT
-- user_roles. Les cas a/b/c et la branche école sont conservés à l'identique.
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
              AND public.current_user_is_workshop()
            )
          )
      )
    )
  );
