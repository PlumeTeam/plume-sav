-- =============================================================
-- Migration : SAV — raison de changement d'école référente
-- Date      : 2026-05-07
-- Notes     : Quand un client choisit une école différente de son
--             école référente (celle liée à l'achat), on capture la
--             raison pour que Plume puisse suivre les motifs business
--             (école fermée, déménagement, problème relationnel…).
-- Application : MCP Supabase apply_migration sur project gxighesxbavnzzyngjaz
-- =============================================================

ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS school_change_reason_code TEXT
    CHECK (school_change_reason_code IN (
      'school_closed',     -- L'école a fermé / cessé son activité
      'moved_region',      -- Le client n'est plus dans la région
      'relationship',      -- Problème relationnel avec l'école
      'other'              -- Autre raison (texte libre dans school_change_reason_note)
    )),
  ADD COLUMN IF NOT EXISTS school_change_reason_note TEXT,
  ADD COLUMN IF NOT EXISTS referent_school_id        UUID; -- école normalement liée à l'aile au moment de la création

-- Index pour les analyses Plume HQ (combien d'écoles sont contournées et pourquoi)
CREATE INDEX IF NOT EXISTS idx_service_requests_school_change_reason_code
  ON public.service_requests(school_change_reason_code)
  WHERE school_change_reason_code IS NOT NULL;
