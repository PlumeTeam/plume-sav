-- =============================================================
-- Migration : SAV — ajoute caption + sort_order à ticket_photos
-- Date      : 2026-05-15
-- Notes     : Le code SAV insère depuis longtemps {caption, sort_order} dans
--             ticket_photos (cf. apps/sav/features/tickets/actions/creation.ts
--             et attachTicketPhotosAction). Or la table de prod ne portait que
--             {id, ticket_id, storage_path, photo_type, uploaded_by, created_at}.
--             Conséquence : PostgREST rejetait silencieusement TOUS les inserts
--             de photos (l'action loggait juste un console.warn → l'utilisateur
--             ne voyait jamais ses photos remontées dans la fiche ticket).
--             Ticket déclenchant : 2026-05-15 — JB signale que les photos
--             saisies au wizard n'apparaissent pas dans le rapport.
--
--             Choix : ajouter les colonnes plutôt que retirer leur usage du
--             code, parce que `sort_order` est utilisé pour ordonner les
--             photos partout (PhotoLightbox, TicketCard, ClientDeclarationPanel,
--             DeclarationFullDetails) et `caption` pour l'alt-text accessible.
-- =============================================================

ALTER TABLE public.ticket_photos
  ADD COLUMN IF NOT EXISTS caption    text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

-- Index utile pour les rendus triés (PhotoLightbox notamment), modeste mais
-- pas inutile : on lit toujours les photos d'un ticket dans l'ordre.
CREATE INDEX IF NOT EXISTS ticket_photos_ticket_sort_idx
  ON public.ticket_photos (ticket_id, sort_order);
