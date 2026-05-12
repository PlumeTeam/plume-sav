-- =============================================================
-- Migration : SAV — canaux de discussion ticket (T3 atelier)
-- Date      : 2026-05-12
-- Notes     : Introduit 5 canaux de discussion explicites sur
--             ticket_messages, en complément du système legacy
--             `visibility_level` (qu'on garde pour rétrocompat).
--
--             Canaux :
--               - school_client     : école ↔ client
--               - client_workshop   : client ↔ atelier
--               - workshop_school   : atelier ↔ école
--               - group             : tous (client+école+atelier+plume)
--               - workshop_plume    : atelier ↔ Plume HQ (privé)
--
--             Stratégie : `channel` est nullable — les messages
--             legacy (sans canal) continuent d'être routés par
--             `visibility_level`. Les nouveaux messages (UI
--             atelier T3) sont marqués `channel IS NOT NULL` et
--             routés par les policies ci-dessous.
--
--             Photos : `attachment_paths TEXT[]` — storage paths
--             dans le bucket `tickets`. Compression côté client
--             (browser-image-compression) avant upload.
-- Application : MCP Supabase apply_migration sur gxighesxbavnzzyngjaz
-- =============================================================

-- ------------------------------------------------------------
-- 1. ENUM message_channel
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE message_channel AS ENUM (
    'school_client',
    'client_workshop',
    'workshop_school',
    'group',
    'workshop_plume'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 2. Colonnes channel + attachment_paths
-- ------------------------------------------------------------
ALTER TABLE public.ticket_messages
  ADD COLUMN IF NOT EXISTS channel          message_channel,
  ADD COLUMN IF NOT EXISTS attachment_paths TEXT[] NOT NULL DEFAULT '{}';

-- Lecture par canal (onglets atelier)
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_channel
  ON public.ticket_messages(ticket_id, channel, created_at);

-- ------------------------------------------------------------
-- 3. RLS — INSERT par canal
-- ------------------------------------------------------------
-- Garde-fou : sender_id = auth.uid() (anti-spoof) + le user a au
-- moins un lien plausible avec le ticket (owner client, rôle école
-- ou atelier, plume_admin). Le contrôle fin (qui peut écrire sur
-- quel canal) reste à l'UI — la RLS reste large pour ne pas casser
-- les composers Plume HQ existants.
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
          OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
              AND ur.role IN ('plume_admin', 'atelier', 'ecole')
          )
        )
    )
  );

-- ------------------------------------------------------------
-- 4. RLS — SELECT par canal (visibilité par rôle)
-- ------------------------------------------------------------
-- Règles (channel IS NOT NULL) :
--   - plume_admin               : voit tout
--   - atelier                   : voit les 5 canaux (transparence côté atelier)
--   - ecole                     : voit tout SAUF workshop_plume
--   - client (owner du ticket)  : voit school_client, client_workshop, group
--
-- Quand channel IS NULL → les policies legacy basées sur
-- visibility_level prennent la main (rien à changer ici).
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
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        WHERE ur.user_id = auth.uid() AND ur.role = 'atelier'
      )
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
-- 5. Storage — bucket 'tickets' déjà créé (migration 20260510200000)
--    Aucune nouvelle policy nécessaire : on réutilise le bucket
--    avec un préfixe de path `<userId>/messages/<ticketId>/...`.
-- ------------------------------------------------------------
