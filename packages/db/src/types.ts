// TODO: Replace manual types with auto-generated ones by running: SUPABASE_ACCESS_TOKEN=xxx pnpm db:gen-types
// Placeholder — remplacer via `pnpm db:gen-types` (MCP Supabase, project gxighesxbavnzzyngjaz)
// Structure exacte requise par @supabase/postgrest-js GenericTable (Relationships obligatoire)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Enum partagé entre les apps Plume (valeurs réelles dans le projet Supabase).
// Pipeline SAV étendu (migration 20260509000000) : étapes école + atelier.
export type RequestStatus =
  // Statuts historiques (table service_requests partagée avec d'autres apps)
  | 'pending' | 'PENDING' | 'processing' | 'SUCCESS' | 'ERROR'
  | 'approved' | 'rejected' | 'completed' | 'cancelled'
  // Nouveau pipeline école → atelier
  | 'school_acknowledged'
  | 'wing_received_school'
  | 'school_checking'
  | 'school_resolved'
  | 'escalated_to_workshop'
  // Routage direct client → atelier (repair / inspection) : statut initial
  // dédié, distinct de 'pending' (réservé au flow école). Voir migration
  // 20260515120000_sav_pending_workshop_status.sql.
  | 'pending_workshop'
  | 'wing_received_workshop'
  | 'workshop_pre_checking'
  | 'workshop_diagnosing'
  | 'workshop_repairing'
  | 'workshop_done'
  | 'wing_returned'

// Enum SAV workflow (table ticket_status créée par la migration SAV)
export type TicketStatus =
  | 'draft' | 'submitted' | 'in_review' | 'diagnosed'
  | 'repair_in_progress' | 'repaired' | 'shipped' | 'closed' | 'rejected'

export type ServiceType = 'sav' | 'revision' | 'repair' | 'information'

// Type de demande SAV — 3 entrées possibles pour le client (migration request_type)
//  - repair                : dommage constaté sur l'aile, réparation directe atelier
//  - inspection            : contrôle / révision périodique, atelier
//  - manufacturing_defect  : suspicion de défaut d'origine → école si sous garantie,
//                            atelier sinon. Valeur par défaut historique (couvre
//                            les tickets créés avant l'ajout de la colonne).
export type RequestType = 'repair' | 'inspection' | 'manufacturing_defect'

export type ProblemCategory =
  | 'tear' | 'line_issue' | 'riser_issue' | 'buckle_issue' | 'porosity' | 'other'

export type UrgencyLevel = 'normal' | 'urgent'

export type PhotoType = 'overview' | 'damage_closeup' | 'serial_tag' | 'other'

export type MessageSenderRole = 'client' | 'school' | 'workshop' | 'plume_admin'

// Canaux de discussion explicites sur ticket_messages (migration 20260512300000).
// Remplace à terme le système legacy `visibility_level` (qu'on conserve pour
// rétrocompat). Quand `channel IS NULL`, la visibilité passe par
// `visibility_level` ; sinon par les policies RLS de la migration ci-dessus.
export type MessageChannel =
  | 'school_client'
  | 'client_workshop'
  | 'workshop_school'
  | 'group'
  | 'workshop_plume'

// Tier de garantie calculé à la création du ticket (chantier garantie).
//  - 'standard'       : garantie d'origine (< warranty_standard_years)
//  - 'extended'       : garantie étendue (< warranty_extended_years, dans
//                       les limites de max_sav_claims_extended)
//  - 'out_of_warranty': hors période ou quota SAV dépassé
//  - 'plume_override' : Plume HQ prend en charge exceptionnellement
export type WarrantyTier =
  | 'standard'
  | 'extended'
  | 'out_of_warranty'
  | 'plume_override'

// Statut final SAV — choisi à la clôture (migration 20260512200000 — T7).
// Le client ne peut pas clôturer ; seuls école/atelier/Plume HQ ont le droit.
export type ClosureOutcome =
  | 'resolved_in_consultation' // Résolu en consultation (école — pas d'atelier)
  | 'repaired'                 // Réparé (atelier)
  | 'replaced'                 // Remplacé (atelier ou Plume HQ — neuf en échange)
  | 'no_repair_needed'         // Pas de réparation nécessaire (comportement normal, etc.)
  | 'invalid'                  // Demande non valide / hors SAV
  | 'client_cancelled'         // Annulé par le client
  | 'other'                    // Autre — note de clôture obligatoire

// Résolution choisie par l'école au terme du diagnostic — voir migration 20260503120000
export type SchoolResolution =
  | 'resolved_by_school'
  | 'normal_behavior_explained'
  | 'escalated_to_workshop'
  | 'escalated_to_plume'
  | 'workshop_advice_requested'  // école demande un avis distance, sans envoyer l'aile
  | 'reflection'                 // école n'a pas encore décidé

export interface Database {
  public: {
    Tables: {
      service_requests: {
        Row: {
          id: string
          // Colonnes originales (table partagée entre les apps Plume)
          user_id: string | null
          service_type: ServiceType | null
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          product_brand: string | null
          product_model: string | null
          serial_number: string | null
          description: string | null
          urgency_level: number | null
          status: RequestStatus
          estimated_cost: number | null
          actual_cost: number | null
          completion_date: string | null
          technician_notes: string | null
          images: Json | null
          // Colonnes ajoutées par la migration SAV
          ticket_number: string | null
          sav_status: TicketStatus
          client_id: string | null
          school_id: string | null
          wing_brand: string | null
          wing_model: string | null
          wing_size: string | null
          wing_serial_number: string | null
          wing_color: string | null
          purchase_date: string | null
          flight_hours_estimate: number | null
          problem_category: ProblemCategory | null
          problem_description: string | null
          urgency: UrgencyLevel
          health_score: number
          diagnosis_notes: string | null
          estimated_hours: number | null
          parts_needed: string | null
          // Diagnostic workflow (migration 20260503120000)
          school_checklist: Json | null
          school_resolution: SchoolResolution | null
          school_resolution_note: string | null
          school_resolved_at: string | null
          school_resolved_by: string | null
          workshop_checklist: Json | null
          assigned_workshop_id: string | null
          assigned_workshop_label: string | null
          workshop_assigned_at: string | null
          workshop_assigned_by: string | null
          // School-change capture (migration 20260507000000)
          school_change_reason_code: string | null
          school_change_reason_note: string | null
          referent_school_id: string | null
          // Delivery method (migration 20260507100000)
          delivery_method: 'in_person' | 'postal' | null
          // Plume HQ severity flag (migration 20260508000000)
          is_plume_urgent: boolean
          // Step pipeline timestamps (migration 20260509000000)
          school_acknowledged_at:    string | null
          wing_received_school_at:   string | null
          escalated_to_workshop_at:  string | null
          wing_received_workshop_at: string | null
          workshop_diagnosis_at:     string | null
          workshop_repair_done_at:   string | null
          wing_returned_at:          string | null
          // Pré-check atelier (migration 20260512000000)
          pre_check_started_at:      string | null
          pre_check_completed_at:    string | null
          pre_check_observations:    string | null
          pre_check_fee_eur:         number | null
          // Shipping legs (migration 20260510000000)
          client_school_tracking:      string | null
          client_school_label_url:     string | null
          client_school_carrier:       string | null
          school_workshop_tracking:    string | null
          school_workshop_label_url:   string | null
          workshop_return_tracking:    string | null
          workshop_return_label_url:   string | null
          workshop_return_destination: 'school' | 'client' | null
          auto_approved_shipping:      boolean
          // Lazy-captured client shipping address (added with shipping migration)
          client_shipping_address:     Json | null
          // School approval of the client's postal shipping (migration 20260512000000)
          shipping_approved:           boolean | null
          shipping_refusal_reason:     string | null
          shipping_decided_at:         string | null
          shipping_decided_by:         string | null
          // Plume HQ approval of the client's postal shipping (migration 20260515000000)
          // Triggered when auto_approved_shipping = FALSE (≥ threshold annuel).
          plume_shipping_approved:       boolean | null
          plume_shipping_refusal_reason: string | null
          plume_shipping_decided_at:     string | null
          plume_shipping_decided_by:     string | null
          // Repair vs replacement decision (migration 20260512010000)
          workshop_estimated_repair_cost:     number | null
          workshop_decision:                  'repair' | 'replacement' | 'no_issue' | null
          workshop_decision_at:               string | null
          workshop_decision_by:               string | null
          workshop_decision_warranty_status:  'under_warranty' | 'out_of_warranty' | null
          workshop_decision_warranty_covered: boolean | null
          workshop_decision_note:             string | null
          // Ticket closure (migration 20260512200000 — T7)
          closed_by:        string | null
          closed_at:        string | null
          closed_by_role:   'school' | 'workshop' | 'plume_admin' | null
          closure_outcome:  ClosureOutcome | null
          closure_note:     string | null
          // Garantie (chantier garantie)
          warranty_tier:         WarrantyTier | null
          sav_claim_number:      number | null
          warranty_expires_at:   string | null
          warranty_override_by:  string | null
          warranty_override_at:  string | null
          warranty_override_note: string | null
          // Type de demande SAV — colonne ajoutée par la migration request_type
          request_type: RequestType
          // Revision report (migration 20260514000000) — uploaded by workshop
          // for tickets with request_type='inspection' (contrôle/révision).
          revision_report_path:        string | null
          revision_report_filename:    string | null
          revision_report_uploaded_at: string | null
          revision_report_uploaded_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          service_type?: ServiceType | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          product_brand?: string | null
          product_model?: string | null
          serial_number?: string | null
          description?: string | null
          urgency_level?: number | null
          status?: RequestStatus
          estimated_cost?: number | null
          actual_cost?: number | null
          completion_date?: string | null
          technician_notes?: string | null
          images?: Json | null
          ticket_number?: string | null
          sav_status?: TicketStatus
          client_id?: string | null
          school_id?: string | null
          wing_brand?: string | null
          wing_model?: string | null
          wing_size?: string | null
          wing_serial_number?: string | null
          wing_color?: string | null
          purchase_date?: string | null
          flight_hours_estimate?: number | null
          problem_category?: ProblemCategory | null
          problem_description?: string | null
          urgency?: UrgencyLevel
          health_score?: number
          diagnosis_notes?: string | null
          estimated_hours?: number | null
          parts_needed?: string | null
          school_checklist?: Json | null
          school_resolution?: SchoolResolution | null
          school_resolution_note?: string | null
          school_resolved_at?: string | null
          school_resolved_by?: string | null
          workshop_checklist?: Json | null
          assigned_workshop_id?: string | null
          assigned_workshop_label?: string | null
          workshop_assigned_at?: string | null
          workshop_assigned_by?: string | null
          school_change_reason_code?: string | null
          school_change_reason_note?: string | null
          referent_school_id?: string | null
          delivery_method?: 'in_person' | 'postal' | null
          is_plume_urgent?: boolean
          school_acknowledged_at?:    string | null
          wing_received_school_at?:   string | null
          escalated_to_workshop_at?:  string | null
          wing_received_workshop_at?: string | null
          workshop_diagnosis_at?:     string | null
          workshop_repair_done_at?:   string | null
          wing_returned_at?:          string | null
          pre_check_started_at?:      string | null
          pre_check_completed_at?:    string | null
          pre_check_observations?:    string | null
          pre_check_fee_eur?:         number | null
          client_school_tracking?:      string | null
          client_school_label_url?:     string | null
          client_school_carrier?:       string | null
          school_workshop_tracking?:    string | null
          school_workshop_label_url?:   string | null
          workshop_return_tracking?:    string | null
          workshop_return_label_url?:   string | null
          workshop_return_destination?: 'school' | 'client' | null
          auto_approved_shipping?:      boolean
          client_shipping_address?:     Json | null
          shipping_approved?:           boolean | null
          shipping_refusal_reason?:     string | null
          shipping_decided_at?:         string | null
          shipping_decided_by?:         string | null
          plume_shipping_approved?:       boolean | null
          plume_shipping_refusal_reason?: string | null
          plume_shipping_decided_at?:     string | null
          plume_shipping_decided_by?:     string | null
          workshop_estimated_repair_cost?:     number | null
          workshop_decision?:                  'repair' | 'replacement' | 'no_issue' | null
          workshop_decision_at?:               string | null
          workshop_decision_by?:               string | null
          workshop_decision_warranty_status?:  'under_warranty' | 'out_of_warranty' | null
          workshop_decision_warranty_covered?: boolean | null
          workshop_decision_note?:             string | null
          closed_by?:        string | null
          closed_at?:        string | null
          closed_by_role?:   'school' | 'workshop' | 'plume_admin' | null
          closure_outcome?:  ClosureOutcome | null
          closure_note?:     string | null
          warranty_tier?:         WarrantyTier | null
          sav_claim_number?:      number | null
          warranty_expires_at?:   string | null
          warranty_override_by?:  string | null
          warranty_override_at?:  string | null
          warranty_override_note?: string | null
          request_type?: RequestType
          revision_report_path?:        string | null
          revision_report_filename?:    string | null
          revision_report_uploaded_at?: string | null
          revision_report_uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          service_type?: ServiceType | null
          first_name?: string | null
          last_name?: string | null
          email?: string | null
          phone?: string | null
          product_brand?: string | null
          product_model?: string | null
          serial_number?: string | null
          description?: string | null
          urgency_level?: number | null
          status?: RequestStatus
          estimated_cost?: number | null
          actual_cost?: number | null
          completion_date?: string | null
          technician_notes?: string | null
          images?: Json | null
          ticket_number?: string | null
          sav_status?: TicketStatus
          client_id?: string | null
          school_id?: string | null
          wing_brand?: string | null
          wing_model?: string | null
          wing_size?: string | null
          wing_serial_number?: string | null
          wing_color?: string | null
          purchase_date?: string | null
          flight_hours_estimate?: number | null
          problem_category?: ProblemCategory | null
          problem_description?: string | null
          urgency?: UrgencyLevel
          health_score?: number
          diagnosis_notes?: string | null
          estimated_hours?: number | null
          parts_needed?: string | null
          school_checklist?: Json | null
          school_resolution?: SchoolResolution | null
          school_resolution_note?: string | null
          school_resolved_at?: string | null
          school_resolved_by?: string | null
          workshop_checklist?: Json | null
          assigned_workshop_id?: string | null
          assigned_workshop_label?: string | null
          workshop_assigned_at?: string | null
          workshop_assigned_by?: string | null
          school_change_reason_code?: string | null
          school_change_reason_note?: string | null
          referent_school_id?: string | null
          delivery_method?: 'in_person' | 'postal' | null
          is_plume_urgent?: boolean
          school_acknowledged_at?:    string | null
          wing_received_school_at?:   string | null
          escalated_to_workshop_at?:  string | null
          wing_received_workshop_at?: string | null
          workshop_diagnosis_at?:     string | null
          workshop_repair_done_at?:   string | null
          wing_returned_at?:          string | null
          pre_check_started_at?:      string | null
          pre_check_completed_at?:    string | null
          pre_check_observations?:    string | null
          pre_check_fee_eur?:         number | null
          client_school_tracking?:      string | null
          client_school_label_url?:     string | null
          client_school_carrier?:       string | null
          school_workshop_tracking?:    string | null
          school_workshop_label_url?:   string | null
          workshop_return_tracking?:    string | null
          workshop_return_label_url?:   string | null
          workshop_return_destination?: 'school' | 'client' | null
          auto_approved_shipping?:      boolean
          client_shipping_address?:     Json | null
          shipping_approved?:           boolean | null
          shipping_refusal_reason?:     string | null
          shipping_decided_at?:         string | null
          shipping_decided_by?:         string | null
          plume_shipping_approved?:       boolean | null
          plume_shipping_refusal_reason?: string | null
          plume_shipping_decided_at?:     string | null
          plume_shipping_decided_by?:     string | null
          workshop_estimated_repair_cost?:     number | null
          workshop_decision?:                  'repair' | 'replacement' | 'no_issue' | null
          workshop_decision_at?:               string | null
          workshop_decision_by?:               string | null
          workshop_decision_warranty_status?:  'under_warranty' | 'out_of_warranty' | null
          workshop_decision_warranty_covered?: boolean | null
          workshop_decision_note?:             string | null
          closed_by?:        string | null
          closed_at?:        string | null
          closed_by_role?:   'school' | 'workshop' | 'plume_admin' | null
          closure_outcome?:  ClosureOutcome | null
          closure_note?:     string | null
          warranty_tier?:         WarrantyTier | null
          sav_claim_number?:      number | null
          warranty_expires_at?:   string | null
          warranty_override_by?:  string | null
          warranty_override_at?:  string | null
          warranty_override_note?: string | null
          request_type?: RequestType
          revision_report_path?:        string | null
          revision_report_filename?:    string | null
          revision_report_uploaded_at?: string | null
          revision_report_uploaded_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ticket_photos: {
        Row: {
          id: string
          ticket_id: string
          storage_path: string
          photo_type: PhotoType
          caption: string | null
          sort_order: number
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          storage_path: string
          photo_type?: PhotoType
          caption?: string | null
          sort_order?: number
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          storage_path?: string
          photo_type?: PhotoType
          caption?: string | null
          sort_order?: number
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_photos_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'service_requests'
            referencedColumns: ['id']
          }
        ]
      }
      ticket_status_history: {
        Row: {
          id: string
          ticket_id: string
          old_status: TicketStatus | null
          new_status: TicketStatus
          changed_by: string | null
          note: string | null
          changed_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          old_status?: TicketStatus | null
          new_status: TicketStatus
          changed_by?: string | null
          note?: string | null
          changed_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          old_status?: TicketStatus | null
          new_status?: TicketStatus
          changed_by?: string | null
          note?: string | null
          changed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_status_history_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'service_requests'
            referencedColumns: ['id']
          }
        ]
      }
      plume_settings: {
        Row: {
          id: number
          repair_replacement_threshold_eur: number
          warranty_duration_months: number
          pre_check_fee_eur: number
          // Politique garantie (chantier garantie)
          warranty_standard_years: number
          warranty_extended_years: number
          max_sav_claims_standard: number   // 0 = illimité
          max_sav_claims_extended: number
          repair_threshold_extended_eur: number
          extended_covers_precheck:                  boolean
          extended_covers_school_workshop_shipping:  boolean
          extended_covers_repair:                    boolean
          extended_covers_replacement:               boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          repair_replacement_threshold_eur?: number
          warranty_duration_months?: number
          pre_check_fee_eur?: number
          warranty_standard_years?: number
          warranty_extended_years?: number
          max_sav_claims_standard?: number
          max_sav_claims_extended?: number
          repair_threshold_extended_eur?: number
          extended_covers_precheck?:                  boolean
          extended_covers_school_workshop_shipping?:  boolean
          extended_covers_repair?:                    boolean
          extended_covers_replacement?:               boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          repair_replacement_threshold_eur?: number
          warranty_duration_months?: number
          pre_check_fee_eur?: number
          warranty_standard_years?: number
          warranty_extended_years?: number
          max_sav_claims_standard?: number
          max_sav_claims_extended?: number
          repair_threshold_extended_eur?: number
          extended_covers_precheck?:                  boolean
          extended_covers_school_workshop_shipping?:  boolean
          extended_covers_repair?:                    boolean
          extended_covers_replacement?:               boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      partner_workshops: {
        // Réseau d'ateliers partenaires Plume. Même structure que partner_schools.
        // user_id pointe sur le compte authentifié de l'atelier (utilisé par la
        // RLS pour scoper la lecture des tickets côté atelier).
        Row: {
          id: string
          name: string
          city: string | null
          region: string | null
          address: string | null
          email: string | null
          phone: string | null
          lat: number | null
          lng: number | null
          is_affiliated: boolean | null
          active: boolean | null
          user_id: string | null
          company_address: Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          city?: string | null
          region?: string | null
          address?: string | null
          email?: string | null
          phone?: string | null
          lat?: number | null
          lng?: number | null
          is_affiliated?: boolean | null
          active?: boolean | null
          user_id?: string | null
          company_address?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          city?: string | null
          region?: string | null
          address?: string | null
          email?: string | null
          phone?: string | null
          lat?: number | null
          lng?: number | null
          is_affiliated?: boolean | null
          active?: boolean | null
          user_id?: string | null
          company_address?: Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          sender_id: string
          sender_role: MessageSenderRole
          content: string
          is_internal: boolean
          visibility_level: string
          channel: MessageChannel | null
          attachment_paths: string[]
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          sender_id: string
          sender_role: MessageSenderRole
          content: string
          is_internal?: boolean
          visibility_level?: string
          channel?: MessageChannel | null
          attachment_paths?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          sender_id?: string
          sender_role?: MessageSenderRole
          content?: string
          is_internal?: boolean
          visibility_level?: string
          channel?: MessageChannel | null
          attachment_paths?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'ticket_messages_ticket_id_fkey'
            columns: ['ticket_id']
            isOneToOne: false
            referencedRelation: 'service_requests'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      mark_ticket_read_by_client: {
        Args: { p_ticket_id: string }
        Returns: void
      }
      mark_ticket_read_by_school: {
        Args: { p_ticket_id: string }
        Returns: void
      }
      mark_ticket_read_by_workshop: {
        Args: { p_ticket_id: string }
        Returns: void
      }
      mark_ticket_read_by_plume: {
        Args: { p_ticket_id: string }
        Returns: void
      }
    }
    Enums: {
      ticket_status: TicketStatus
      problem_category: ProblemCategory
      urgency_level: UrgencyLevel
      photo_type: PhotoType
      message_sender_role: MessageSenderRole
      message_channel: MessageChannel
      request_status: RequestStatus
      service_type: ServiceType
    }
    CompositeTypes: Record<string, never>
  }
}
