-- =============================================================
-- Migration : SAV — policy SELECT manquante sur ticket_photos
--             pour le rôle atelier / workshop
-- Date      : 2026-05-16
-- Notes     : Bug constaté — les photos d'un ticket s'affichent côté
--             client et côté école mais PAS côté atelier.
--
--             Cause : ticket_photos n'a de policy SELECT que pour :
--               * client      → owner_select_photos
--               * école       → sec_partner_select_school
--               * plume_admin → plume_admin_all_photos
--             Aucune policy ne couvre le rôle atelier/workshop. La RLS
--             filtre donc silencieusement toutes les lignes : la query
--             hydrateTicket() renvoie ticket_photos = [], et la section
--             Photos (guard `length > 0`) n'est jamais rendue côté
--             atelier — alors que le composant PhotoLightbox y est bien
--             importé et la query identique aux autres rôles.
--
--             Correctif : policy SELECT calquée sur la condition de
--             `atelier_select_assigned_tickets` (service_requests) — la
--             photo est visible si son ticket parent est dans le pipeline
--             atelier et a un atelier assigné. On reste cohérent avec le
--             cloisonnement déjà en place : l'atelier ne voit les photos
--             que des tickets qu'il peut déjà lire.
--
--             Compat double valeur de rôle : on accepte 'atelier' ET
--             'workshop' (cf. 20260515130000_sav_workshop_atelier_role_compat).
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

DROP POLICY IF EXISTS "atelier_select_photos" ON public.ticket_photos;
CREATE POLICY "atelier_select_photos"
  ON public.ticket_photos FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role IN ('atelier', 'workshop')
    )
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
