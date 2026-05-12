-- =============================================================
-- Migration : SAV — 5 canaux de discussion par ticket
-- Date      : 2026-05-12
-- Notes     : Ajoute la colonne `channel` à ticket_messages pour distinguer
--             5 canaux explicites visibles par rôle :
--               - school_client    : école ↔ client (atelier exclu)
--               - client_workshop  : client ↔ atelier (école exclue, ouvert
--                                    après mise en relation par l'école)
--               - workshop_school  : atelier ↔ école (client exclu)
--               - group            : école + client + atelier (canal commun)
--               - workshop_plume   : atelier ↔ Plume HQ (client/école jamais)
--
--             La colonne legacy `visibility_level` est conservée : elle
--             continue de cadrer les notes admin Plume HQ (`plume_only`,
--             `school_plume`) qui n'appartiennent à aucun des 5 canaux
--             partagés. Côté Postgres aucune contrainte RLS supplémentaire :
--             le filtrage par rôle se fait côté server queries (cf.
--             apps/sav/features/tickets/channels.ts).
-- =============================================================

ALTER TABLE public.ticket_messages
  ADD COLUMN IF NOT EXISTS channel TEXT
    CHECK (channel IS NULL OR channel IN (
      'school_client', 'client_workshop', 'workshop_school', 'group', 'workshop_plume'
    ));

-- Backfill : on classe les messages existants dans le canal sémantiquement
-- le plus proche de leur visibility_level historique. Les notes admin
-- (plume_only) et le canal privé école↔Plume (school_plume) restent
-- channel = NULL — ils ne s'affichent pas dans les 5 onglets et restent
-- accessibles uniquement via la vue Plume HQ.
UPDATE public.ticket_messages
   SET channel = 'group'
 WHERE channel IS NULL
   AND visibility_level = 'all';

UPDATE public.ticket_messages
   SET channel = 'workshop_school'
 WHERE channel IS NULL
   AND visibility_level = 'workshop_plume';

CREATE INDEX IF NOT EXISTS idx_ticket_messages_channel
  ON public.ticket_messages(ticket_id, channel);
