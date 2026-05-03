// Placeholder — remplacer via `pnpm db:gen-types` (MCP Supabase, project gxighesxbavnzzyngjaz)
// Structure exacte requise par @supabase/postgrest-js GenericTable (Relationships obligatoire)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// Enum partagé entre les apps Plume (valeurs réelles dans le projet Supabase)
export type RequestStatus =
  | 'pending' | 'PENDING' | 'processing' | 'SUCCESS' | 'ERROR'
  | 'approved' | 'rejected' | 'completed' | 'cancelled'

// Enum SAV workflow (table ticket_status créée par la migration SAV)
export type TicketStatus =
  | 'draft' | 'submitted' | 'in_review' | 'diagnosed'
  | 'repair_in_progress' | 'repaired' | 'shipped' | 'closed' | 'rejected'

export type ServiceType = 'sav' | 'revision' | 'repair' | 'information'

export type ProblemCategory =
  | 'tear' | 'line_issue' | 'riser_issue' | 'buckle_issue' | 'porosity' | 'other'

export type UrgencyLevel = 'normal' | 'urgent'

export type PhotoType = 'overview' | 'damage_closeup' | 'serial_tag' | 'other'

export type MessageSenderRole = 'client' | 'school' | 'workshop' | 'plume_admin'

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
          created_at: string
        }
        Insert: {
          id?: string
          ticket_id: string
          storage_path: string
          photo_type?: PhotoType
          caption?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          ticket_id?: string
          storage_path?: string
          photo_type?: PhotoType
          caption?: string | null
          sort_order?: number
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
      ticket_messages: {
        Row: {
          id: string
          ticket_id: string
          sender_id: string
          sender_role: MessageSenderRole
          content: string
          is_internal: boolean
          visibility_level: string
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
    Functions: Record<string, never>
    Enums: {
      ticket_status: TicketStatus
      problem_category: ProblemCategory
      urgency_level: UrgencyLevel
      photo_type: PhotoType
      message_sender_role: MessageSenderRole
      request_status: RequestStatus
      service_type: ServiceType
    }
    CompositeTypes: Record<string, never>
  }
}
