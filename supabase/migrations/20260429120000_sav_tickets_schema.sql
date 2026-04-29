-- =============================================================
-- Migration : SAV Plume — schéma tickets + photos + messages
-- Date      : 2026-04-29
-- Notes     : service_requests existe déjà (0 lignes, RLS activée)
--             On étend avec ADD COLUMN IF NOT EXISTS (safe replay)
--             Nouvelles tables : ticket_photos, ticket_messages,
--             ticket_status_history
-- =============================================================

-- ------------------------------------------------------------
-- 1. TYPES ENUM
-- ------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE ticket_status AS ENUM (
    'draft', 'submitted', 'in_review', 'diagnosed',
    'repair_in_progress', 'repaired', 'shipped', 'closed', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE problem_category AS ENUM (
    'tear', 'line_issue', 'riser_issue', 'buckle_issue', 'porosity', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE urgency_level AS ENUM ('normal', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE photo_type AS ENUM (
    'overview', 'damage_closeup', 'serial_tag', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_sender_role AS ENUM (
    'client', 'school', 'workshop', 'plume_admin'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ------------------------------------------------------------
-- 2. EXTENSION service_requests (table existante)
--    ADD COLUMN IF NOT EXISTS → safe si colonnes déjà présentes
-- ------------------------------------------------------------
ALTER TABLE public.service_requests
  ADD COLUMN IF NOT EXISTS ticket_number   TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS status          ticket_status NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS client_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS school_id       UUID REFERENCES public.partner_schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS wing_brand      TEXT,
  ADD COLUMN IF NOT EXISTS wing_model      TEXT,
  ADD COLUMN IF NOT EXISTS wing_size       TEXT,
  ADD COLUMN IF NOT EXISTS wing_serial_number TEXT,
  ADD COLUMN IF NOT EXISTS wing_color      TEXT,
  ADD COLUMN IF NOT EXISTS purchase_date   DATE,
  ADD COLUMN IF NOT EXISTS flight_hours_estimate INTEGER CHECK (flight_hours_estimate >= 0),
  ADD COLUMN IF NOT EXISTS problem_category problem_category,
  ADD COLUMN IF NOT EXISTS problem_description TEXT,
  ADD COLUMN IF NOT EXISTS urgency         urgency_level NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS health_score    INTEGER DEFAULT 0 CHECK (health_score >= 0),
  ADD COLUMN IF NOT EXISTS created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Auto-generate ticket_number: TKT-YYYYMM-XXXX
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.ticket_number IS NULL THEN
    NEW.ticket_number := 'TKT-' ||
      TO_CHAR(NOW(), 'YYYYMM') || '-' ||
      LPAD(NEXTVAL('ticket_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

CREATE SEQUENCE IF NOT EXISTS ticket_number_seq START 1;

DROP TRIGGER IF EXISTS trg_ticket_number ON public.service_requests;
CREATE TRIGGER trg_ticket_number
  BEFORE INSERT ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION generate_ticket_number();

-- updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_service_requests_updated_at ON public.service_requests;
CREATE TRIGGER trg_service_requests_updated_at
  BEFORE UPDATE ON public.service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes performance
CREATE INDEX IF NOT EXISTS idx_service_requests_client_id ON public.service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status    ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON public.service_requests(created_at DESC);

-- ------------------------------------------------------------
-- 3. ticket_photos
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_photos (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  photo_type   photo_type NOT NULL DEFAULT 'other',
  caption      TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_photos_ticket_id ON public.ticket_photos(ticket_id);

-- ------------------------------------------------------------
-- 4. ticket_status_history (timeline Domino's)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_status_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id  UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  old_status ticket_status,
  new_status ticket_status NOT NULL,
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  note       TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_status_history_ticket_id
  ON public.ticket_status_history(ticket_id, changed_at DESC);

-- ------------------------------------------------------------
-- 5. ticket_messages (messagerie par ticket)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id       UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_role     message_sender_role NOT NULL,
  content         TEXT NOT NULL CHECK (LENGTH(content) > 0),
  is_internal     BOOLEAN NOT NULL DEFAULT FALSE,
  visibility_level TEXT NOT NULL DEFAULT 'all'
    CHECK (visibility_level IN ('all', 'school_plume', 'workshop_plume', 'plume_only')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id
  ON public.ticket_messages(ticket_id, created_at DESC);

-- ------------------------------------------------------------
-- 6. RLS — service_requests
-- ------------------------------------------------------------
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

-- Client : voit et modifie uniquement ses propres tickets
DROP POLICY IF EXISTS "client_select_own_tickets" ON public.service_requests;
CREATE POLICY "client_select_own_tickets"
  ON public.service_requests FOR SELECT
  USING (client_id = auth.uid());

DROP POLICY IF EXISTS "client_insert_own_tickets" ON public.service_requests;
CREATE POLICY "client_insert_own_tickets"
  ON public.service_requests FOR INSERT
  WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "client_update_draft_tickets" ON public.service_requests;
CREATE POLICY "client_update_draft_tickets"
  ON public.service_requests FOR UPDATE
  USING (client_id = auth.uid() AND status = 'draft')
  WITH CHECK (client_id = auth.uid());

-- Plume admin : accès complet
DROP POLICY IF EXISTS "plume_admin_all_tickets" ON public.service_requests;
CREATE POLICY "plume_admin_all_tickets"
  ON public.service_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'plume_admin'
    )
  );

-- School : voit les tickets de ses clients (school_id correspond)
DROP POLICY IF EXISTS "school_select_assigned_tickets" ON public.service_requests;
CREATE POLICY "school_select_assigned_tickets"
  ON public.service_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      JOIN public.partner_schools ps ON ps.id = school_id
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'school'
        AND ps.id = service_requests.school_id
    )
  );

-- ------------------------------------------------------------
-- 7. RLS — ticket_photos
-- ------------------------------------------------------------
ALTER TABLE public.ticket_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "owner_select_photos" ON public.ticket_photos;
CREATE POLICY "owner_select_photos"
  ON public.ticket_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = ticket_id AND sr.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "owner_insert_photos" ON public.ticket_photos;
CREATE POLICY "owner_insert_photos"
  ON public.ticket_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = ticket_id AND sr.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "owner_delete_photos" ON public.ticket_photos;
CREATE POLICY "owner_delete_photos"
  ON public.ticket_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = ticket_id
        AND sr.client_id = auth.uid()
        AND sr.status = 'draft'
    )
  );

DROP POLICY IF EXISTS "plume_admin_all_photos" ON public.ticket_photos;
CREATE POLICY "plume_admin_all_photos"
  ON public.ticket_photos FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'plume_admin'
    )
  );

-- ------------------------------------------------------------
-- 8. RLS — ticket_status_history
-- ------------------------------------------------------------
ALTER TABLE public.ticket_status_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_read_own_history" ON public.ticket_status_history;
CREATE POLICY "client_read_own_history"
  ON public.ticket_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = ticket_id AND sr.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "plume_admin_all_history" ON public.ticket_status_history;
CREATE POLICY "plume_admin_all_history"
  ON public.ticket_status_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'plume_admin'
    )
  );

-- ------------------------------------------------------------
-- 9. RLS — ticket_messages
-- ------------------------------------------------------------
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "client_read_visible_messages" ON public.ticket_messages;
CREATE POLICY "client_read_visible_messages"
  ON public.ticket_messages FOR SELECT
  USING (
    visibility_level = 'all'
    AND EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = ticket_id AND sr.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "client_insert_messages" ON public.ticket_messages;
CREATE POLICY "client_insert_messages"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND is_internal = FALSE
    AND visibility_level = 'all'
    AND EXISTS (
      SELECT 1 FROM public.service_requests sr
      WHERE sr.id = ticket_id AND sr.client_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "plume_admin_all_messages" ON public.ticket_messages;
CREATE POLICY "plume_admin_all_messages"
  ON public.ticket_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'plume_admin'
    )
  );
