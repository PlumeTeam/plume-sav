-- =============================================================
-- Migration : SAV — repasse le bucket 'tickets' en public = true
-- Date      : 2026-05-15
-- Notes     : Quelqu'un a flipé le bucket 'tickets' en public = false
--             après la migration 20260514100000_sav_storage_tickets_harden,
--             qui documentait pourtant explicitement le contraire :
--
--               ⚠️ Le bucket est `public = true` (cf. migration de création)
--               pour que getPublicUrl() rende des URLs HTTP accessibles à
--               plumes-projects (utilisateurs non-loggés en preview). Les
--               policies ci-dessous ne protègent QUE les accès via le
--               client Supabase. Le durcissement HTTP nécessite de passer
--               le bucket en privé + de remplacer getPublicUrl() par
--               createSignedUrl() — refonte non incluse ici.
--
--             Conséquence du flip : les 6 callsites qui font
--             getSupabasePublicUrl() (PhotoLightbox, TicketCard,
--             RevisionReportView, CheckWizard, RevisionReportUploader,
--             rehydratePhotos) renvoyaient des URLs en 400/403 → photos
--             cassées dans la fiche déclaration (placeholder image
--             cassée signalé par JB le 2026-05-15).
--
--             On restaure public = true pour redonner accès HTTP. Les
--             policies RLS de la migration 20260514100000 restent en
--             place et protègent les opérations via le client Supabase
--             (download / list / upload / update / remove).
--
--             ➤ DETTE TECHNIQUE — pour un vrai durcissement HTTP, il
--             faudra refondre les 6 callsites pour utiliser
--             createSignedUrl() (signed URL temporaires) et seulement
--             ensuite repasser public = false. À planifier hors mode démo.
-- =============================================================

UPDATE storage.buckets
SET public = true
WHERE id = 'tickets';
