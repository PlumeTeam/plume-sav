-- =============================================================
-- Migration : SAV — policy INSERT sur notifications (table partagée)
-- Date      : 2026-05-15
-- Notes     : La table public.notifications existe déjà (526 rows à
--             l'application, partagée avec d'autres apps Plume sur le
--             Supabase mutualisé gxighesxbavnzzyngjaz). Schéma :
--               id, user_id, title, message, type, read (bool),
--               related_id, related_type, action_url, created_at.
--
--             Ses policies actuelles n'autorisent que SELECT/UPDATE pour
--             le user propriétaire (sec_user_own_*). Pas de policy INSERT
--             côté `authenticated` → on ne peut pas créer de notification
--             depuis une Server Action SAV authentifiée.
--
--             On ajoute une policy INSERT *strictement cadrée au SAV* :
--               - related_type DOIT être 'service_request'
--               - related_id DOIT pointer sur un ticket auquel l'auteur
--                 (auth.uid()) a accès via user_can_access_ticket()
--               - le destinataire ne doit pas être l'auteur (pas d'auto-notif)
--
--             Cantonner la policy à related_type='service_request' garantit
--             qu'on ne perturbe pas les autres apps Plume qui inséreraient
--             via service_role avec un autre related_type.
--
--             Conséquence côté code : les Server Actions SAV (createMessage,
--             approveShipping, escalateToWorkshop, setWorkshopDecision, etc.)
--             peuvent maintenant créer des notifications via le client
--             Supabase user-scoped (pas besoin de service_role).
-- =============================================================

-- Cleanup défensif (idempotence)
DROP POLICY IF EXISTS sec_sav_actor_insert ON public.notifications;

CREATE POLICY sec_sav_actor_insert
  ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    -- Pas d'auto-notif : on n'envoie pas à soi-même
    user_id <> ( SELECT auth.uid() )
    -- Strict scope SAV : on cible toujours un ticket service_requests
    AND related_type = 'service_request'
    AND related_id   IS NOT NULL
    -- L'auteur de la notif doit être un acteur du ticket (client, école
    -- assignée, atelier assigné, plume_admin) — réutilise la fonction
    -- déjà éprouvée par les policies Storage et messages.
    AND user_can_access_ticket(related_id)
  );

COMMENT ON POLICY sec_sav_actor_insert ON public.notifications IS
  'SAV : un actor d''un ticket peut créer des notifications pour les autres acteurs du même ticket. Cadré par related_type = service_request pour ne pas affecter les autres apps Plume.';
