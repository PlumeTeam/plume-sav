// Placeholder — remplacer via `pnpm db:gen-types` (MCP Supabase, project gxighesxbavnzzyngjaz)
// Structure exacte requise par @supabase/postgrest-js GenericTable (Relationships obligatoire)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type TicketStatus =
  | 'draft' | 'submitted' | 'in_review' | 'diagnosed'
  | 'repair_in_progress' | 'repaired' | 'shipped' | 'closed' | 'rejected'

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
          ticket_number: string | null
          status: TicketStatus
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
          estimated_cost: number | null
          estimated_hours: number | null
          parts_needed: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          ticket_number?: string | null
          status?: TicketStatus
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
          estimated_cost?: number | null
          estimated_hours?: number | null
          parts_needed?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          ticket_number?: string | null
          status?: TicketStatus
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
          estimated_cost?: number | null
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
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          created_at?: string | null
        }
        Relationships: []
      }
      partner_schools: {
        Row: {
          id: string
          name: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ticket_status: TicketStatus
      problem_category: ProblemCategory
      urgency_level: UrgencyLevel
      photo_type: PhotoType
      message_sender_role: MessageSenderRole
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
