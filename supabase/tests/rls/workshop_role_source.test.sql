-- =============================================================
-- Tests RLS — SAV : double source de vérité du rôle atelier
-- Cible : migration 20260516130000_sav_workshop_role_source_fix.sql
--
-- Scénario central : un compte atelier dont le rôle métier vit
-- UNIQUEMENT dans profiles.role (et PAS dans user_roles) doit voir
-- ses tickets, ses messages de canal et les photos — comme un compte
-- atelier "classique" déclaré dans user_roles.
--
-- Couvre les 4 rôles métier : client / school(ecole) / workshop(atelier)
-- / plume_admin, sur service_requests, ticket_messages, ticket_photos.
--
-- Exécution : pgTAP via `supabase test db` (les helpers tests.* sont
-- fournis par l'extension supabase test helpers — basejump/supabase-test-helpers).
-- Lecture seule logique : tout est encapsulé dans BEGIN ... ROLLBACK.
-- =============================================================
BEGIN;
SELECT plan(18);

-- -------------------------------------------------------------
-- 0. Pré-requis : le helper et les policies existent
-- -------------------------------------------------------------
SELECT has_function(
  'public', 'current_user_is_workshop', ARRAY[]::text[],
  'le helper current_user_is_workshop() existe'
);

SELECT policy_cmd_is(
  'public', 'service_requests', 'atelier_select_assigned_tickets', 'SELECT',
  'atelier_select_assigned_tickets est une policy SELECT'
);

SELECT policy_cmd_is(
  'public', 'ticket_photos', 'atelier_select_photos', 'SELECT',
  'atelier_select_photos est une policy SELECT'
);

-- -------------------------------------------------------------
-- 1. Setup utilisateurs
-- -------------------------------------------------------------
-- 4 comptes couvrant les 4 rôles + le cas particulier.
SELECT tests.create_supabase_user('client_a');       -- client owner du ticket
SELECT tests.create_supabase_user('client_b');       -- autre client (témoin négatif)
SELECT tests.create_supabase_user('ecole_x');        -- rôle école dans user_roles
SELECT tests.create_supabase_user('atelier_ur');     -- atelier déclaré dans user_roles
SELECT tests.create_supabase_user('atelier_profile'); -- atelier déclaré UNIQUEMENT dans profiles.role
SELECT tests.create_supabase_user('plume_admin_u');  -- plume_admin

-- Rôles dans user_roles
INSERT INTO public.user_roles (user_id, role) VALUES
  (tests.get_supabase_uid('client_a'),      'client'),
  (tests.get_supabase_uid('client_b'),      'client'),
  (tests.get_supabase_uid('ecole_x'),       'ecole'),
  (tests.get_supabase_uid('atelier_ur'),    'atelier'),
  (tests.get_supabase_uid('plume_admin_u'), 'plume_admin');
-- atelier_profile : VOLONTAIREMENT aucune ligne dans user_roles.

-- Rôle dans profiles.role pour le compte "profile-only".
-- profiles.user_id = auth.users.id (cf. features/auth/queries.ts).
-- On insère/aligne la ligne profiles correspondante.
INSERT INTO public.profiles (user_id, role)
VALUES (tests.get_supabase_uid('atelier_profile'), 'atelier')
ON CONFLICT (user_id) DO UPDATE SET role = EXCLUDED.role;

-- -------------------------------------------------------------
-- 2. Setup données : un ticket dans le pipeline atelier
-- -------------------------------------------------------------
-- status 'pending_workshop' + assigned_workshop_id non NULL = ticket
-- visible côté atelier selon atelier_select_assigned_tickets.
INSERT INTO public.service_requests (id, client_id, status, assigned_workshop_id)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  tests.get_supabase_uid('client_a'),
  'pending_workshop',
  'plume-annecy'
);

-- Un message de canal sur ce ticket (channel IS NOT NULL).
INSERT INTO public.ticket_messages (id, ticket_id, sender_id, sender_role, content, channel)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  '11111111-1111-1111-1111-111111111111',
  tests.get_supabase_uid('client_a'),
  'client',
  'Bonjour, voici mon aile.',
  'client_workshop'
);

-- Une photo sur ce ticket.
INSERT INTO public.ticket_photos (id, ticket_id, storage_path)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '11111111-1111-1111-1111-111111111111',
  'someuser/messages/ticket/photo1.jpg'
);

-- =============================================================
-- TESTS service_requests
-- =============================================================

-- Test : atelier déclaré dans user_roles voit le ticket (référence).
SELECT tests.authenticate_as('atelier_ur');
SELECT is(
  (SELECT count(*)::int FROM public.service_requests
   WHERE id = '11111111-1111-1111-1111-111111111111'),
  1,
  'atelier (user_roles) voit le ticket du pipeline atelier'
);

-- Test CENTRAL : atelier déclaré UNIQUEMENT dans profiles.role voit le ticket.
-- C'est le bug que la migration corrige : avant le helper, count = 0.
SELECT tests.authenticate_as('atelier_profile');
SELECT is(
  (SELECT count(*)::int FROM public.service_requests
   WHERE id = '11111111-1111-1111-1111-111111111111'),
  1,
  'atelier (profiles.role seul) voit le ticket — fix double-source service_requests'
);

-- Test : le client owner voit son ticket.
SELECT tests.authenticate_as('client_a');
SELECT is(
  (SELECT count(*)::int FROM public.service_requests
   WHERE id = '11111111-1111-1111-1111-111111111111'),
  1,
  'client owner voit son propre ticket'
);

-- Test négatif : un AUTRE client ne voit pas le ticket.
SELECT tests.authenticate_as('client_b');
SELECT is(
  (SELECT count(*)::int FROM public.service_requests
   WHERE id = '11111111-1111-1111-1111-111111111111'),
  0,
  'client_b ne voit PAS le ticket de client_a'
);

-- Test : plume_admin voit le ticket.
SELECT tests.authenticate_as('plume_admin_u');
SELECT is(
  (SELECT count(*)::int FROM public.service_requests
   WHERE id = '11111111-1111-1111-1111-111111111111'),
  1,
  'plume_admin voit le ticket'
);

-- Test UPDATE : atelier profile-only peut transitionner le statut.
SELECT tests.authenticate_as('atelier_profile');
SELECT lives_ok(
  $$UPDATE public.service_requests
    SET status = 'wing_received_workshop'
    WHERE id = '11111111-1111-1111-1111-111111111111'$$,
  'atelier (profiles.role seul) peut UPDATE le statut du ticket — fix double-source UPDATE'
);
-- on remet le statut pour les tests suivants
UPDATE public.service_requests SET status = 'pending_workshop'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- Test WITH CHECK : un atelier ne peut pas dé-assigner l'atelier (NULL).
SELECT tests.authenticate_as('atelier_profile');
SELECT throws_ok(
  $$UPDATE public.service_requests
    SET assigned_workshop_id = NULL
    WHERE id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  NULL,
  'atelier ne peut pas dé-assigner l''atelier (WITH CHECK assigned_workshop_id NOT NULL)'
);

-- =============================================================
-- TESTS ticket_messages — canaux
-- =============================================================

-- Test : atelier profile-only voit le message de canal.
SELECT tests.authenticate_as('atelier_profile');
SELECT is(
  (SELECT count(*)::int FROM public.ticket_messages
   WHERE id = '22222222-2222-2222-2222-222222222222'),
  1,
  'atelier (profiles.role seul) voit le message de canal — fix channel_select_messages'
);

-- Test : atelier profile-only peut INSÉRER un message de canal.
SELECT tests.authenticate_as('atelier_profile');
SELECT lives_ok(
  $$INSERT INTO public.ticket_messages (ticket_id, sender_id, sender_role, content, channel)
    VALUES (
      '11111111-1111-1111-1111-111111111111',
      tests.get_supabase_uid('atelier_profile'),
      'workshop',
      'Aile bien reçue, diagnostic en cours.',
      'client_workshop'
    )$$,
  'atelier (profiles.role seul) peut INSÉRER un message de canal — fix channel_insert_messages'
);

-- Test : atelier profile-only peut INSÉRER via atelier_insert_messages
-- (message sans canal, sender_role = workshop).
SELECT tests.authenticate_as('atelier_profile');
SELECT lives_ok(
  $$INSERT INTO public.ticket_messages (ticket_id, sender_id, sender_role, content)
    VALUES (
      '11111111-1111-1111-1111-111111111111',
      tests.get_supabase_uid('atelier_profile'),
      'workshop',
      'Message atelier legacy sans canal.'
    )$$,
  'atelier (profiles.role seul) peut INSÉRER un message atelier sans canal — fix atelier_insert_messages'
);

-- Test anti-spoof : on ne peut pas insérer un message au nom d'un autre user.
SELECT tests.authenticate_as('atelier_profile');
SELECT throws_ok(
  $$INSERT INTO public.ticket_messages (ticket_id, sender_id, sender_role, content, channel)
    VALUES (
      '11111111-1111-1111-1111-111111111111',
      tests.get_supabase_uid('client_a'),
      'workshop',
      'Message usurpé.',
      'client_workshop'
    )$$,
  '42501',
  NULL,
  'atelier ne peut pas insérer un message avec sender_id usurpé (anti-spoof)'
);

-- Test négatif : client_b (non concerné) ne voit pas le message de canal.
SELECT tests.authenticate_as('client_b');
SELECT is(
  (SELECT count(*)::int FROM public.ticket_messages
   WHERE id = '22222222-2222-2222-2222-222222222222'),
  0,
  'client_b ne voit PAS le message de canal du ticket de client_a'
);

-- Test cloisonnement canal : le client owner ne voit PAS le canal workshop_plume.
-- Insertion d'un message workshop_plume par l'atelier, puis lecture client.
SELECT tests.authenticate_as('atelier_profile');
INSERT INTO public.ticket_messages (id, ticket_id, sender_id, sender_role, content, channel)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  '11111111-1111-1111-1111-111111111111',
  tests.get_supabase_uid('atelier_profile'),
  'workshop',
  'Note privée atelier vers Plume HQ.',
  'workshop_plume'
);
SELECT tests.authenticate_as('client_a');
SELECT is(
  (SELECT count(*)::int FROM public.ticket_messages
   WHERE id = '44444444-4444-4444-4444-444444444444'),
  0,
  'client owner ne voit PAS le canal privé workshop_plume'
);

-- =============================================================
-- TESTS ticket_photos
-- =============================================================

-- Test : atelier déclaré dans user_roles voit la photo (référence).
SELECT tests.authenticate_as('atelier_ur');
SELECT is(
  (SELECT count(*)::int FROM public.ticket_photos
   WHERE id = '33333333-3333-3333-3333-333333333333'),
  1,
  'atelier (user_roles) voit la photo du ticket'
);

-- Test CENTRAL : atelier profile-only voit la photo.
-- Avant l'extension §8 de la migration, count = 0 (atelier_select_photos
-- interrogeait user_roles seul).
SELECT tests.authenticate_as('atelier_profile');
SELECT is(
  (SELECT count(*)::int FROM public.ticket_photos
   WHERE id = '33333333-3333-3333-3333-333333333333'),
  1,
  'atelier (profiles.role seul) voit la photo — fix double-source atelier_select_photos'
);

-- Test négatif : client_b ne voit pas la photo du ticket de client_a.
SELECT tests.authenticate_as('client_b');
SELECT is(
  (SELECT count(*)::int FROM public.ticket_photos
   WHERE id = '33333333-3333-3333-3333-333333333333'),
  0,
  'client_b ne voit PAS la photo du ticket de client_a'
);

SELECT * FROM finish();
ROLLBACK;
