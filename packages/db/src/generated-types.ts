export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accounting_bank: {
        Row: {
          account_iban: string | null
          accounting_account: string | null
          amount: number | null
          bank_name: string | null
          bridge_account_id: string | null
          bridge_category: string | null
          bridge_transaction_id: string | null
          business_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          exchange_rate_used: number | null
          id: number
          is_eurozone: boolean | null
          is_reconciled: boolean | null
          origin_country: string | null
          original_amount: number | null
          original_currency: string | null
          raw_data: Json | null
          reconciled_with_id: number | null
          reconciled_with_table: string | null
          transaction_date: string | null
          transaction_type: string | null
          validation_status: string | null
          value_date: string | null
        }
        Insert: {
          account_iban?: string | null
          accounting_account?: string | null
          amount?: number | null
          bank_name?: string | null
          bridge_account_id?: string | null
          bridge_category?: string | null
          bridge_transaction_id?: string | null
          business_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          id?: number
          is_eurozone?: boolean | null
          is_reconciled?: boolean | null
          origin_country?: string | null
          original_amount?: number | null
          original_currency?: string | null
          raw_data?: Json | null
          reconciled_with_id?: number | null
          reconciled_with_table?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          validation_status?: string | null
          value_date?: string | null
        }
        Update: {
          account_iban?: string | null
          accounting_account?: string | null
          amount?: number | null
          bank_name?: string | null
          bridge_account_id?: string | null
          bridge_category?: string | null
          bridge_transaction_id?: string | null
          business_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          id?: number
          is_eurozone?: boolean | null
          is_reconciled?: boolean | null
          origin_country?: string | null
          original_amount?: number | null
          original_currency?: string | null
          raw_data?: Json | null
          reconciled_with_id?: number | null
          reconciled_with_table?: string | null
          transaction_date?: string | null
          transaction_type?: string | null
          validation_status?: string | null
          value_date?: string | null
        }
        Relationships: []
      }
      accounting_cash_book: {
        Row: {
          bank_amount: number | null
          bank_date: string | null
          bank_description: string | null
          bank_id: number | null
          business_name: string | null
          context_amount: number | null
          context_date: string | null
          context_description: string | null
          context_id: string | null
          context_table: string | null
          created_at: string | null
          currency: string | null
          final_amount: number | null
          final_date: string | null
          flow_type: string | null
          has_bank: boolean | null
          has_context: boolean | null
          has_justif: boolean | null
          id: number
          is_reconciled: boolean | null
          justif_amount: number | null
          justif_date: string | null
          justif_description: string | null
          justif_id: string | null
          justif_image_url: string | null
          justif_table: string | null
          match_reasons: Json | null
          match_score: number | null
          match_status: string | null
          match_type: string | null
          notes: string | null
          reconciled_at: string | null
          reconciled_by: string | null
          updated_at: string | null
        }
        Insert: {
          bank_amount?: number | null
          bank_date?: string | null
          bank_description?: string | null
          bank_id?: number | null
          business_name?: string | null
          context_amount?: number | null
          context_date?: string | null
          context_description?: string | null
          context_id?: string | null
          context_table?: string | null
          created_at?: string | null
          currency?: string | null
          final_amount?: number | null
          final_date?: string | null
          flow_type?: string | null
          has_bank?: boolean | null
          has_context?: boolean | null
          has_justif?: boolean | null
          id?: number
          is_reconciled?: boolean | null
          justif_amount?: number | null
          justif_date?: string | null
          justif_description?: string | null
          justif_id?: string | null
          justif_image_url?: string | null
          justif_table?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          match_status?: string | null
          match_type?: string | null
          notes?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_amount?: number | null
          bank_date?: string | null
          bank_description?: string | null
          bank_id?: number | null
          business_name?: string | null
          context_amount?: number | null
          context_date?: string | null
          context_description?: string | null
          context_id?: string | null
          context_table?: string | null
          created_at?: string | null
          currency?: string | null
          final_amount?: number | null
          final_date?: string | null
          flow_type?: string | null
          has_bank?: boolean | null
          has_context?: boolean | null
          has_justif?: boolean | null
          id?: number
          is_reconciled?: boolean | null
          justif_amount?: number | null
          justif_date?: string | null
          justif_description?: string | null
          justif_id?: string | null
          justif_image_url?: string | null
          justif_table?: string | null
          match_reasons?: Json | null
          match_score?: number | null
          match_status?: string | null
          match_type?: string | null
          notes?: string | null
          reconciled_at?: string | null
          reconciled_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      accounting_config: {
        Row: {
          description: string | null
          id: number
          param_name: string
          param_value: string
        }
        Insert: {
          description?: string | null
          id?: number
          param_name: string
          param_value: string
        }
        Update: {
          description?: string | null
          id?: number
          param_name?: string
          param_value?: string
        }
        Relationships: []
      }
      accounting_expense_entries: {
        Row: {
          accounting_account: string | null
          address: string | null
          amount_eur_estimated: number | null
          business_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          exchange_rate_used: number | null
          expense_type: string | null
          id: string
          image_url: string | null
          is_complete: boolean | null
          is_eurozone: boolean | null
          origin_country: string | null
          original_amount_ttc: number | null
          payment_method: string | null
          raw_analysis: string | null
          receipt_date: string | null
          receipt_time: string | null
          siret: string | null
          source: string | null
          submitted_by_name: string | null
          submitted_by_telegram_id: number | null
          submitted_by_username: string | null
          telegram_chat_id: number | null
          total_euro_excl_tax: number | null
          total_euro_incl_tax: number | null
          total_excl_tax: number | null
          total_incl_tax: number | null
          total_vat: number | null
          validation_status: string | null
          vat_10: number | null
          vat_20: number | null
          vat_55: number | null
        }
        Insert: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          business_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          expense_type?: string | null
          id?: string
          image_url?: string | null
          is_complete?: boolean | null
          is_eurozone?: boolean | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          payment_method?: string | null
          raw_analysis?: string | null
          receipt_date?: string | null
          receipt_time?: string | null
          siret?: string | null
          source?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          total_euro_excl_tax?: number | null
          total_euro_incl_tax?: number | null
          total_excl_tax?: number | null
          total_incl_tax?: number | null
          total_vat?: number | null
          validation_status?: string | null
          vat_10?: number | null
          vat_20?: number | null
          vat_55?: number | null
        }
        Update: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          business_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          expense_type?: string | null
          id?: string
          image_url?: string | null
          is_complete?: boolean | null
          is_eurozone?: boolean | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          payment_method?: string | null
          raw_analysis?: string | null
          receipt_date?: string | null
          receipt_time?: string | null
          siret?: string | null
          source?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          total_euro_excl_tax?: number | null
          total_euro_incl_tax?: number | null
          total_excl_tax?: number | null
          total_incl_tax?: number | null
          total_vat?: number | null
          validation_status?: string | null
          vat_10?: number | null
          vat_20?: number | null
          vat_55?: number | null
        }
        Relationships: []
      }
      accounting_one_off_income: {
        Row: {
          accounting_account: string | null
          address: string | null
          amount_eur_estimated: number | null
          business_name: string | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          exchange_rate_used: number | null
          id: number
          image_url: string | null
          income_type: string | null
          invoice_date: string | null
          invoice_number: string | null
          is_complete: boolean | null
          is_eurozone: boolean | null
          items_sold: string | null
          message_date: string | null
          message_type: string | null
          needs_justification: boolean | null
          origin_country: string | null
          original_amount_ttc: number | null
          original_message: string | null
          payment_method: string | null
          payment_status: string | null
          platform: string | null
          raw_analysis: string | null
          receipt_date: string | null
          receipt_time: string | null
          siret: string | null
          siret_client: string | null
          source: string | null
          source_name: string | null
          submitted_by_name: string | null
          submitted_by_telegram_id: number | null
          submitted_by_username: string | null
          telegram_chat_id: number | null
          total_excl_tax: number | null
          total_incl_tax: number | null
          total_vat: number | null
          validation_status: string | null
          vat_10: number | null
          vat_20: number | null
          vat_55: number | null
        }
        Insert: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          business_name?: string | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          id?: number
          image_url?: string | null
          income_type?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_complete?: boolean | null
          is_eurozone?: boolean | null
          items_sold?: string | null
          message_date?: string | null
          message_type?: string | null
          needs_justification?: boolean | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          original_message?: string | null
          payment_method?: string | null
          payment_status?: string | null
          platform?: string | null
          raw_analysis?: string | null
          receipt_date?: string | null
          receipt_time?: string | null
          siret?: string | null
          siret_client?: string | null
          source?: string | null
          source_name?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          total_excl_tax?: number | null
          total_incl_tax?: number | null
          total_vat?: number | null
          validation_status?: string | null
          vat_10?: number | null
          vat_20?: number | null
          vat_55?: number | null
        }
        Update: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          business_name?: string | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          id?: number
          image_url?: string | null
          income_type?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_complete?: boolean | null
          is_eurozone?: boolean | null
          items_sold?: string | null
          message_date?: string | null
          message_type?: string | null
          needs_justification?: boolean | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          original_message?: string | null
          payment_method?: string | null
          payment_status?: string | null
          platform?: string | null
          raw_analysis?: string | null
          receipt_date?: string | null
          receipt_time?: string | null
          siret?: string | null
          siret_client?: string | null
          source?: string | null
          source_name?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          total_excl_tax?: number | null
          total_incl_tax?: number | null
          total_vat?: number | null
          validation_status?: string | null
          vat_10?: number | null
          vat_20?: number | null
          vat_55?: number | null
        }
        Relationships: []
      }
      "accounting_One-off_Income": {
        Row: {
          accounting_account: string | null
          address: string | null
          amount_eur_estimated: number | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          exchange_rate_used: number | null
          id: string
          image_url: string | null
          income_type: string | null
          invoice_date: string | null
          invoice_number: string | null
          is_complete: boolean | null
          is_eurozone: boolean | null
          origin_country: string | null
          original_amount_ttc: number | null
          payment_method: string | null
          payment_status: string | null
          platform: string | null
          raw_analysis: string | null
          siret_client: string | null
          source: string | null
          source_name: string | null
          submitted_by_name: string | null
          submitted_by_telegram_id: number | null
          submitted_by_username: string | null
          telegram_chat_id: number | null
          total_excl_tax: number | null
          total_incl_tax: number | null
          total_vat: number | null
          validation_status: string | null
        }
        Insert: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          id?: string
          image_url?: string | null
          income_type?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_complete?: boolean | null
          is_eurozone?: boolean | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          payment_method?: string | null
          payment_status?: string | null
          platform?: string | null
          raw_analysis?: string | null
          siret_client?: string | null
          source?: string | null
          source_name?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          total_excl_tax?: number | null
          total_incl_tax?: number | null
          total_vat?: number | null
          validation_status?: string | null
        }
        Update: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          id?: string
          image_url?: string | null
          income_type?: string | null
          invoice_date?: string | null
          invoice_number?: string | null
          is_complete?: boolean | null
          is_eurozone?: boolean | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          payment_method?: string | null
          payment_status?: string | null
          platform?: string | null
          raw_analysis?: string | null
          siret_client?: string | null
          source?: string | null
          source_name?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          total_excl_tax?: number | null
          total_incl_tax?: number | null
          total_vat?: number | null
          validation_status?: string | null
        }
        Relationships: []
      }
      accounting_pending_income: {
        Row: {
          accounting_account: string | null
          address: string | null
          amount_eur_estimated: number | null
          business_name: string | null
          client_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          exchange_rate_used: number | null
          id: string
          income_type: string | null
          invoice_number: string | null
          is_eurozone: boolean | null
          message_date: string | null
          message_type: string | null
          needs_justification: boolean | null
          origin_country: string | null
          original_amount: number | null
          original_amount_ttc: number | null
          original_message: string | null
          payment_method: string | null
          platform: string | null
          source_name: string | null
          submitted_by_name: string | null
          submitted_by_telegram_id: number | null
          submitted_by_username: string | null
          telegram_chat_id: number | null
          total_amount: number | null
          total_excl_tax: number | null
          total_ht: number | null
          total_incl_tax: number | null
          total_tva: number | null
          total_vat: number | null
          validation_status: string | null
        }
        Insert: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          business_name?: string | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          id?: string
          income_type?: string | null
          invoice_number?: string | null
          is_eurozone?: boolean | null
          message_date?: string | null
          message_type?: string | null
          needs_justification?: boolean | null
          origin_country?: string | null
          original_amount?: number | null
          original_amount_ttc?: number | null
          original_message?: string | null
          payment_method?: string | null
          platform?: string | null
          source_name?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          total_amount?: number | null
          total_excl_tax?: number | null
          total_ht?: number | null
          total_incl_tax?: number | null
          total_tva?: number | null
          total_vat?: number | null
          validation_status?: string | null
        }
        Update: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          business_name?: string | null
          client_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          id?: string
          income_type?: string | null
          invoice_number?: string | null
          is_eurozone?: boolean | null
          message_date?: string | null
          message_type?: string | null
          needs_justification?: boolean | null
          origin_country?: string | null
          original_amount?: number | null
          original_amount_ttc?: number | null
          original_message?: string | null
          payment_method?: string | null
          platform?: string | null
          source_name?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          total_amount?: number | null
          total_excl_tax?: number | null
          total_ht?: number | null
          total_incl_tax?: number | null
          total_tva?: number | null
          total_vat?: number | null
          validation_status?: string | null
        }
        Relationships: []
      }
      accounting_pending_justifications: {
        Row: {
          accounting_account: string | null
          address: string | null
          amount_eur_estimated: number | null
          business_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          exchange_rate_used: number | null
          expense_type: string | null
          id: string
          image_url: string | null
          is_eurozone: boolean | null
          items_purchased: string | null
          message_date: string | null
          message_type: string | null
          needs_justification: boolean | null
          origin_country: string | null
          original_amount_ttc: number | null
          original_message: string | null
          payment_method: string | null
          platform: string | null
          submitted_by_name: string | null
          submitted_by_telegram_id: number | null
          submitted_by_username: string | null
          telegram_chat_id: number | null
          total_excl_tax: number | null
          total_incl_tax: number | null
          total_vat: number | null
          validation_status: string | null
        }
        Insert: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          business_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          expense_type?: string | null
          id?: string
          image_url?: string | null
          is_eurozone?: boolean | null
          items_purchased?: string | null
          message_date?: string | null
          message_type?: string | null
          needs_justification?: boolean | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          original_message?: string | null
          payment_method?: string | null
          platform?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          total_excl_tax?: number | null
          total_incl_tax?: number | null
          total_vat?: number | null
          validation_status?: string | null
        }
        Update: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          business_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          expense_type?: string | null
          id?: string
          image_url?: string | null
          is_eurozone?: boolean | null
          items_purchased?: string | null
          message_date?: string | null
          message_type?: string | null
          needs_justification?: boolean | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          original_message?: string | null
          payment_method?: string | null
          platform?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          total_excl_tax?: number | null
          total_incl_tax?: number | null
          total_vat?: number | null
          validation_status?: string | null
        }
        Relationships: []
      }
      accounting_raw: {
        Row: {
          amount: number | null
          category: string | null
          created_at: string
          description: string | null
          external_id: string | null
          id: number
          notes: string | null
          raw_data: Json | null
          receipt_date: string | null
          source: string | null
          validation_status: string | null
        }
        Insert: {
          amount?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: never
          notes?: string | null
          raw_data?: Json | null
          receipt_date?: string | null
          source?: string | null
          validation_status?: string | null
        }
        Update: {
          amount?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          external_id?: string | null
          id?: never
          notes?: string | null
          raw_data?: Json | null
          receipt_date?: string | null
          source?: string | null
          validation_status?: string | null
        }
        Relationships: []
      }
      accounting_subscriptions: {
        Row: {
          accounting_account: string | null
          amount_eur_estimated: number | null
          amount_ht: number | null
          amount_ttc: number
          billing_cycle: string | null
          billing_date_status: string | null
          billing_day: number | null
          cancellation_date: string | null
          cancellation_reason: string | null
          card_last_digits: string | null
          category: string | null
          cost_center: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          duration_months: number | null
          end_date: string | null
          exchange_rate_used: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_deductible: boolean | null
          is_eurozone: boolean | null
          last_billed_date: string | null
          next_billing_date: string | null
          notes: string | null
          origin_country: string | null
          original_amount_ttc: number | null
          payment_method: string | null
          raw_message: string | null
          service_name: string
          source: string | null
          start_date: string
          status: string | null
          submitted_by_name: string | null
          submitted_by_telegram_id: number | null
          submitted_by_username: string | null
          telegram_chat_id: number | null
          updated_at: string | null
          vat_amount: number | null
          vat_rate: number | null
          website_url: string | null
        }
        Insert: {
          accounting_account?: string | null
          amount_eur_estimated?: number | null
          amount_ht?: number | null
          amount_ttc: number
          billing_cycle?: string | null
          billing_date_status?: string | null
          billing_day?: number | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          card_last_digits?: string | null
          category?: string | null
          cost_center?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_months?: number | null
          end_date?: string | null
          exchange_rate_used?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_deductible?: boolean | null
          is_eurozone?: boolean | null
          last_billed_date?: string | null
          next_billing_date?: string | null
          notes?: string | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          payment_method?: string | null
          raw_message?: string | null
          service_name: string
          source?: string | null
          start_date?: string
          status?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          website_url?: string | null
        }
        Update: {
          accounting_account?: string | null
          amount_eur_estimated?: number | null
          amount_ht?: number | null
          amount_ttc?: number
          billing_cycle?: string | null
          billing_date_status?: string | null
          billing_day?: number | null
          cancellation_date?: string | null
          cancellation_reason?: string | null
          card_last_digits?: string | null
          category?: string | null
          cost_center?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          duration_months?: number | null
          end_date?: string | null
          exchange_rate_used?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_deductible?: boolean | null
          is_eurozone?: boolean | null
          last_billed_date?: string | null
          next_billing_date?: string | null
          notes?: string | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          payment_method?: string | null
          raw_message?: string | null
          service_name?: string
          source?: string | null
          start_date?: string
          status?: string | null
          submitted_by_name?: string | null
          submitted_by_telegram_id?: number | null
          submitted_by_username?: string | null
          telegram_chat_id?: number | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          website_url?: string | null
        }
        Relationships: []
      }
      accounting_web_receipts: {
        Row: {
          accounting_account: string | null
          address: string | null
          amount_eur_estimated: number | null
          business_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          exchange_rate_used: number | null
          external_id: string | null
          id: number
          image_url: string | null
          income_type: string | null
          is_complete: boolean | null
          is_eurozone: boolean | null
          items_sold: string | null
          origin_country: string | null
          original_amount_ttc: number | null
          payment_method: string | null
          platform: string | null
          raw_analysis: string | null
          receipt_date: string | null
          receipt_time: string | null
          siret: string | null
          source: string | null
          total_excl_tax: number | null
          total_incl_tax: number | null
          total_vat: number | null
          validation_status: string | null
          vat_10: number | null
          vat_20: number | null
          vat_55: number | null
          webhook_data: Json | null
        }
        Insert: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          business_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          external_id?: string | null
          id?: number
          image_url?: string | null
          income_type?: string | null
          is_complete?: boolean | null
          is_eurozone?: boolean | null
          items_sold?: string | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          payment_method?: string | null
          platform?: string | null
          raw_analysis?: string | null
          receipt_date?: string | null
          receipt_time?: string | null
          siret?: string | null
          source?: string | null
          total_excl_tax?: number | null
          total_incl_tax?: number | null
          total_vat?: number | null
          validation_status?: string | null
          vat_10?: number | null
          vat_20?: number | null
          vat_55?: number | null
          webhook_data?: Json | null
        }
        Update: {
          accounting_account?: string | null
          address?: string | null
          amount_eur_estimated?: number | null
          business_name?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          exchange_rate_used?: number | null
          external_id?: string | null
          id?: number
          image_url?: string | null
          income_type?: string | null
          is_complete?: boolean | null
          is_eurozone?: boolean | null
          items_sold?: string | null
          origin_country?: string | null
          original_amount_ttc?: number | null
          payment_method?: string | null
          platform?: string | null
          raw_analysis?: string | null
          receipt_date?: string | null
          receipt_time?: string | null
          siret?: string | null
          source?: string | null
          total_excl_tax?: number | null
          total_incl_tax?: number | null
          total_vat?: number | null
          validation_status?: string | null
          vat_10?: number | null
          vat_20?: number | null
          vat_55?: number | null
          webhook_data?: Json | null
        }
        Relationships: []
      }
      admin_audit_logs: {
        Row: {
          action_type: string
          changes: Json | null
          created_at: string | null
          description: string | null
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          new_values: Json | null
          old_values: Json | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action_type: string
          changes?: Json | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string
          changes?: Json | null
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_client_conversations: {
        Row: {
          client_user_id: string
          context_description: string | null
          created_at: string | null
          id: string
          inspection_incident_id: string | null
          is_locked: boolean | null
          lock_reason: string | null
          locked_at: string | null
          locked_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          client_user_id: string
          context_description?: string | null
          created_at?: string | null
          id?: string
          inspection_incident_id?: string | null
          is_locked?: boolean | null
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          client_user_id?: string
          context_description?: string | null
          created_at?: string | null
          id?: string
          inspection_incident_id?: string | null
          is_locked?: boolean | null
          lock_reason?: string | null
          locked_at?: string | null
          locked_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_client_conversations_inspection_incident_id_fkey"
            columns: ["inspection_incident_id"]
            isOneToOne: false
            referencedRelation: "inspection_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_client_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          read_at: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          read_at?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_client_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "admin_client_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title: string
          type?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      admin_partner_conversations: {
        Row: {
          booking_context_id: string | null
          context_description: string | null
          created_at: string | null
          id: string
          partner_school_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          booking_context_id?: string | null
          context_description?: string | null
          created_at?: string | null
          id?: string
          partner_school_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_context_id?: string | null
          context_description?: string | null
          created_at?: string | null
          id?: string
          partner_school_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_partner_conversations_booking_context_id_fkey"
            columns: ["booking_context_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_partner_conversations_booking_context_id_fkey"
            columns: ["booking_context_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_partner_conversations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "admin_partner_conversations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_partner_conversations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      admin_partner_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          read_at: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          read_at?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_partner_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "admin_partner_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      anonymous_votes: {
        Row: {
          created_at: string | null
          fingerprint: string | null
          id: string
          ip_hash: string | null
          submission_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string | null
          fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          submission_id: string
          voter_id: string
        }
        Update: {
          created_at?: string | null
          fingerprint?: string | null
          id?: string
          ip_hash?: string | null
          submission_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anonymous_votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "contest_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      app_config: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      athlete_applications: {
        Row: {
          achievements: string | null
          bio: string
          birth_date: string | null
          country: string
          created_at: string
          current_wing: string
          email: string
          facebook: string | null
          facebook_followers: string | null
          first_name: string
          flight_hours: string | null
          id: string
          instagram: string | null
          instagram_followers: string | null
          ip_address: unknown
          language: string
          last_name: string
          level_brevet: string | null
          media_links: string[]
          other_social: string | null
          other_sponsors: string | null
          paragliding_sponsors: string | null
          phone: string
          practices: string[]
          profiles: string[]
          projects: string
          region: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rgpd_consent: boolean
          showreel_links: string[]
          start_year: number | null
          status: Database["public"]["Enums"]["athlete_application_status"]
          tiktok: string | null
          tiktok_followers: string | null
          user_agent: string | null
          website: string | null
          why_plume: string
          youtube: string | null
          youtube_followers: string | null
        }
        Insert: {
          achievements?: string | null
          bio: string
          birth_date?: string | null
          country: string
          created_at?: string
          current_wing: string
          email: string
          facebook?: string | null
          facebook_followers?: string | null
          first_name: string
          flight_hours?: string | null
          id?: string
          instagram?: string | null
          instagram_followers?: string | null
          ip_address?: unknown
          language?: string
          last_name: string
          level_brevet?: string | null
          media_links?: string[]
          other_social?: string | null
          other_sponsors?: string | null
          paragliding_sponsors?: string | null
          phone: string
          practices?: string[]
          profiles?: string[]
          projects: string
          region: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rgpd_consent?: boolean
          showreel_links?: string[]
          start_year?: number | null
          status?: Database["public"]["Enums"]["athlete_application_status"]
          tiktok?: string | null
          tiktok_followers?: string | null
          user_agent?: string | null
          website?: string | null
          why_plume: string
          youtube?: string | null
          youtube_followers?: string | null
        }
        Update: {
          achievements?: string | null
          bio?: string
          birth_date?: string | null
          country?: string
          created_at?: string
          current_wing?: string
          email?: string
          facebook?: string | null
          facebook_followers?: string | null
          first_name?: string
          flight_hours?: string | null
          id?: string
          instagram?: string | null
          instagram_followers?: string | null
          ip_address?: unknown
          language?: string
          last_name?: string
          level_brevet?: string | null
          media_links?: string[]
          other_social?: string | null
          other_sponsors?: string | null
          paragliding_sponsors?: string | null
          phone?: string
          practices?: string[]
          profiles?: string[]
          projects?: string
          region?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rgpd_consent?: boolean
          showreel_links?: string[]
          start_year?: number | null
          status?: Database["public"]["Enums"]["athlete_application_status"]
          tiktok?: string | null
          tiktok_followers?: string | null
          user_agent?: string | null
          website?: string | null
          why_plume?: string
          youtube?: string | null
          youtube_followers?: string | null
        }
        Relationships: []
      }
      bag_fabric_consumption: {
        Row: {
          area_m2: number
          bag_product_id: string
          color_group: string | null
          fabric_type: string
          id: string
          notes: string | null
          size_label: string
        }
        Insert: {
          area_m2: number
          bag_product_id: string
          color_group?: string | null
          fabric_type: string
          id?: string
          notes?: string | null
          size_label: string
        }
        Update: {
          area_m2?: number
          bag_product_id?: string
          color_group?: string | null
          fabric_type?: string
          id?: string
          notes?: string | null
          size_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "bag_fabric_consumption_bag_product_id_fkey"
            columns: ["bag_product_id"]
            isOneToOne: false
            referencedRelation: "bag_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bag_product_colors: {
        Row: {
          bag_product_id: string
          color_code: string
          display_order: number
          hex_preview: string | null
          id: string
          is_active: boolean
          shop_display_name: string
        }
        Insert: {
          bag_product_id: string
          color_code: string
          display_order?: number
          hex_preview?: string | null
          id?: string
          is_active?: boolean
          shop_display_name: string
        }
        Update: {
          bag_product_id?: string
          color_code?: string
          display_order?: number
          hex_preview?: string | null
          id?: string
          is_active?: boolean
          shop_display_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "bag_product_colors_bag_product_id_fkey"
            columns: ["bag_product_id"]
            isOneToOne: false
            referencedRelation: "bag_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bag_product_images: {
        Row: {
          alt_text: string | null
          bag_product_id: string
          created_at: string
          display_order: number
          id: string
          image_url: string
          is_primary: boolean
        }
        Insert: {
          alt_text?: string | null
          bag_product_id: string
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          is_primary?: boolean
        }
        Update: {
          alt_text?: string | null
          bag_product_id?: string
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bag_product_images_bag_product_id_fkey"
            columns: ["bag_product_id"]
            isOneToOne: false
            referencedRelation: "bag_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bag_product_sizes: {
        Row: {
          bag_product_id: string
          capacity_l: number | null
          display_order: number
          id: string
          size_label: string
          size_numeric: string | null
        }
        Insert: {
          bag_product_id: string
          capacity_l?: number | null
          display_order?: number
          id?: string
          size_label: string
          size_numeric?: string | null
        }
        Update: {
          bag_product_id?: string
          capacity_l?: number | null
          display_order?: number
          id?: string
          size_label?: string
          size_numeric?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bag_product_sizes_bag_product_id_fkey"
            columns: ["bag_product_id"]
            isOneToOne: false
            referencedRelation: "bag_products"
            referencedColumns: ["id"]
          },
        ]
      }
      bag_product_skus: {
        Row: {
          bag_product_id: string
          color_display_name: string | null
          color_id: string | null
          futurlog_sku: string | null
          hs_code: string | null
          id: string
          is_active: boolean
          origin_country_code: string | null
          price_ht: number | null
          size_id: string
          weight_kg: number | null
        }
        Insert: {
          bag_product_id: string
          color_display_name?: string | null
          color_id?: string | null
          futurlog_sku?: string | null
          hs_code?: string | null
          id?: string
          is_active?: boolean
          origin_country_code?: string | null
          price_ht?: number | null
          size_id: string
          weight_kg?: number | null
        }
        Update: {
          bag_product_id?: string
          color_display_name?: string | null
          color_id?: string | null
          futurlog_sku?: string | null
          hs_code?: string | null
          id?: string
          is_active?: boolean
          origin_country_code?: string | null
          price_ht?: number | null
          size_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bag_product_skus_bag_product_id_fkey"
            columns: ["bag_product_id"]
            isOneToOne: false
            referencedRelation: "bag_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bag_product_skus_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "bag_product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bag_product_skus_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "bag_product_sizes"
            referencedColumns: ["id"]
          },
        ]
      }
      bag_products: {
        Row: {
          base_price_ht: number
          created_at: string
          delivery_time: string | null
          description: string | null
          display_order: number
          hero_image_url: string | null
          hs_code: string | null
          id: string
          is_active: boolean
          name: string
          origin_country_code: string
          product_page_enabled: boolean
          product_page_slug: string | null
          subtitle: string | null
          updated_at: string
        }
        Insert: {
          base_price_ht?: number
          created_at?: string
          delivery_time?: string | null
          description?: string | null
          display_order?: number
          hero_image_url?: string | null
          hs_code?: string | null
          id: string
          is_active?: boolean
          name: string
          origin_country_code?: string
          product_page_enabled?: boolean
          product_page_slug?: string | null
          subtitle?: string | null
          updated_at?: string
        }
        Update: {
          base_price_ht?: number
          created_at?: string
          delivery_time?: string | null
          description?: string | null
          display_order?: number
          hero_image_url?: string | null
          hs_code?: string | null
          id?: string
          is_active?: boolean
          name?: string
          origin_country_code?: string
          product_page_enabled?: boolean
          product_page_slug?: string | null
          subtitle?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bank_transfers: {
        Row: {
          amount: number
          bank_name: string | null
          beneficiary_bic: string | null
          beneficiary_iban: string
          beneficiary_name: string
          created_at: string | null
          currency: string
          executed_at: string | null
          external_reference: string | null
          failure_reason: string | null
          id: string
          initiated_by: string
          invoice_id: string | null
          metadata: Json | null
          notes: string | null
          partner_school_id: string
          scheduled_date: string | null
          status: string
          transfer_reference: string | null
          updated_at: string | null
          validated_by: string | null
        }
        Insert: {
          amount: number
          bank_name?: string | null
          beneficiary_bic?: string | null
          beneficiary_iban: string
          beneficiary_name: string
          created_at?: string | null
          currency?: string
          executed_at?: string | null
          external_reference?: string | null
          failure_reason?: string | null
          id?: string
          initiated_by: string
          invoice_id?: string | null
          metadata?: Json | null
          notes?: string | null
          partner_school_id: string
          scheduled_date?: string | null
          status?: string
          transfer_reference?: string | null
          updated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          amount?: number
          bank_name?: string | null
          beneficiary_bic?: string | null
          beneficiary_iban?: string
          beneficiary_name?: string
          created_at?: string | null
          currency?: string
          executed_at?: string | null
          external_reference?: string | null
          failure_reason?: string | null
          id?: string
          initiated_by?: string
          invoice_id?: string | null
          metadata?: Json | null
          notes?: string | null
          partner_school_id?: string
          scheduled_date?: string | null
          status?: string
          transfer_reference?: string | null
          updated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_transfers_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "partner_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "bank_transfers_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transfers_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      blocked_checkout_attempts: {
        Row: {
          attempted_at: string
          country_code: string
          id: string
          ip_address: string | null
          payment_method: string | null
          user_id: string | null
        }
        Insert: {
          attempted_at?: string
          country_code: string
          id?: string
          ip_address?: string | null
          payment_method?: string | null
          user_id?: string | null
        }
        Update: {
          attempted_at?: string
          country_code?: string
          id?: string
          ip_address?: string | null
          payment_method?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blocked_countries: {
        Row: {
          blocked_at: string
          blocked_by: string | null
          country_code: string
          country_name: string
          reason: string | null
        }
        Insert: {
          blocked_at?: string
          blocked_by?: string | null
          country_code: string
          country_name: string
          reason?: string | null
        }
        Update: {
          blocked_at?: string
          blocked_by?: string | null
          country_code?: string
          country_name?: string
          reason?: string | null
        }
        Relationships: []
      }
      booking_messages: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          sender_id: string | null
          sender_type: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          sender_id?: string | null
          sender_type?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          sender_id?: string | null
          sender_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      briancon_stock: {
        Row: {
          available_quantity: number
          futurlog_sku: string
          id: string
          last_updated_at: string | null
          notes: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          available_quantity?: number
          futurlog_sku: string
          id?: string
          last_updated_at?: string | null
          notes?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          available_quantity?: number
          futurlog_sku?: string
          id?: string
          last_updated_at?: string | null
          notes?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "briancon_stock_futurlog_sku_fkey"
            columns: ["futurlog_sku"]
            isOneToOne: true
            referencedRelation: "futurlog_products"
            referencedColumns: ["futurlog_sku"]
          },
        ]
      }
      bridge_sync_logs: {
        Row: {
          accounts_found: number | null
          created_at: string | null
          details: Json | null
          duration_ms: number | null
          error_message: string | null
          id: number
          source: string
          status: string
          transactions_synced: number | null
        }
        Insert: {
          accounts_found?: number | null
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: never
          source?: string
          status?: string
          transactions_synced?: number | null
        }
        Update: {
          accounts_found?: number | null
          created_at?: string | null
          details?: Json | null
          duration_ms?: number | null
          error_message?: string | null
          id?: never
          source?: string
          status?: string
          transactions_synced?: number | null
        }
        Relationships: []
      }
      contact_tags: {
        Row: {
          color: string
          created_at: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          color?: string
          created_at?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      contacts_other: {
        Row: {
          account_created_date: string | null
          attachments: string[] | null
          birthday: string | null
          company: string | null
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          info_notes: string | null
          job_tags: string[] | null
          last_name: string
          phone_fixe: string | null
          phone_number: string | null
          postal_address: string | null
          preferred_contact_method: string | null
          profile_tags: string[] | null
          school_id: string | null
          school_name: string | null
          total_orders: number | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          account_created_date?: string | null
          attachments?: string[] | null
          birthday?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          info_notes?: string | null
          job_tags?: string[] | null
          last_name: string
          phone_fixe?: string | null
          phone_number?: string | null
          postal_address?: string | null
          preferred_contact_method?: string | null
          profile_tags?: string[] | null
          school_id?: string | null
          school_name?: string | null
          total_orders?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          account_created_date?: string | null
          attachments?: string[] | null
          birthday?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          info_notes?: string | null
          job_tags?: string[] | null
          last_name?: string
          phone_fixe?: string | null
          phone_number?: string | null
          postal_address?: string | null
          preferred_contact_method?: string | null
          profile_tags?: string[] | null
          school_id?: string | null
          school_name?: string | null
          total_orders?: number | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_other_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "contacts_paragliding_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts_paragliding_schools: {
        Row: {
          action_zone: Json | null
          address: string | null
          city: string
          contact_status: string
          country: string
          created_at: string | null
          description: string | null
          email: string | null
          id: string
          interest_level: number | null
          last_visit_date: string | null
          latitude: number
          longitude: number
          name: string
          nb_eleves_annuel: number | null
          nb_moniteurs: number | null
          notes: string | null
          partner_school_id: string | null
          partner_workshop_id: string | null
          phone: string | null
          status: string
          tool_settings: Json | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          action_zone?: Json | null
          address?: string | null
          city: string
          contact_status?: string
          country: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          interest_level?: number | null
          last_visit_date?: string | null
          latitude: number
          longitude: number
          name: string
          nb_eleves_annuel?: number | null
          nb_moniteurs?: number | null
          notes?: string | null
          partner_school_id?: string | null
          partner_workshop_id?: string | null
          phone?: string | null
          status?: string
          tool_settings?: Json | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          action_zone?: Json | null
          address?: string | null
          city?: string
          contact_status?: string
          country?: string
          created_at?: string | null
          description?: string | null
          email?: string | null
          id?: string
          interest_level?: number | null
          last_visit_date?: string | null
          latitude?: number
          longitude?: number
          name?: string
          nb_eleves_annuel?: number | null
          nb_moniteurs?: number | null
          notes?: string | null
          partner_school_id?: string | null
          partner_workshop_id?: string | null
          phone?: string | null
          status?: string
          tool_settings?: Json | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_paragliding_schools_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "contacts_paragliding_schools_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_paragliding_schools_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "contacts_paragliding_schools_partner_workshop_id_fkey"
            columns: ["partner_workshop_id"]
            isOneToOne: false
            referencedRelation: "partner_workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts_school_contacts: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          linked_contact_id: string | null
          mailing_enabled: boolean
          phone: string | null
          role_note: string | null
          school_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          linked_contact_id?: string | null
          mailing_enabled?: boolean
          phone?: string | null
          role_note?: string | null
          school_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          linked_contact_id?: string | null
          mailing_enabled?: boolean
          phone?: string | null
          role_note?: string | null
          school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_school_contacts_linked_contact_id_fkey"
            columns: ["linked_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_other"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_school_contacts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "contacts_paragliding_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts_school_notes_history: {
        Row: {
          attachments: Json | null
          created_at: string | null
          created_by: string | null
          id: string
          interaction_type: string | null
          note: string
          note_date: string | null
          school_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interaction_type?: string | null
          note: string
          note_date?: string | null
          school_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          interaction_type?: string | null
          note?: string
          note_date?: string | null
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_school_notes_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "contacts_paragliding_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts_school_visits_history: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          interaction_type: string | null
          notes: string | null
          school_id: string
          subject: string | null
          visit_date: string
          visit_time: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          interaction_type?: string | null
          notes?: string | null
          school_id: string
          subject?: string | null
          visit_date: string
          visit_time?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          interaction_type?: string | null
          notes?: string | null
          school_id?: string
          subject?: string | null
          visit_date?: string
          visit_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_school_visits_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "contacts_paragliding_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_likes: {
        Row: {
          created_at: string
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_likes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "contest_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_submissions: {
        Row: {
          colors: Json
          created_at: string
          display_pseudo: string
          id: string
          likes_count: number
          screenshot_url: string | null
          user_id: string
          wing_model: string
        }
        Insert: {
          colors: Json
          created_at?: string
          display_pseudo: string
          id?: string
          likes_count?: number
          screenshot_url?: string | null
          user_id: string
          wing_model?: string
        }
        Update: {
          colors?: Json
          created_at?: string
          display_pseudo?: string
          id?: string
          likes_count?: number
          screenshot_url?: string | null
          user_id?: string
          wing_model?: string
        }
        Relationships: []
      }
      customer_invoices: {
        Row: {
          billing_address: Json | null
          booking_id: string | null
          created_at: string | null
          currency: string | null
          customer_address: string | null
          customer_country: string | null
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          delivered_at: string | null
          discount_amount: number | null
          discount_percent: number | null
          final_price: number
          id: string
          invoice_number: string
          invoice_pdf_url: string | null
          metadata: Json | null
          notes: string | null
          original_price: number
          paid_at: string | null
          price_excluding_vat: number | null
          product_description: string
          shipped_at: string | null
          shipping_address: Json | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
          stripe_session_id: string | null
          updated_at: string | null
          vat_amount: number | null
          vat_rate: number | null
          wing_inventory_id: string | null
          wing_model: string | null
          wing_serial_number: string | null
          wing_size: string | null
        }
        Insert: {
          billing_address?: Json | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_address?: string | null
          customer_country?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          final_price: number
          id?: string
          invoice_number: string
          invoice_pdf_url?: string | null
          metadata?: Json | null
          notes?: string | null
          original_price: number
          paid_at?: string | null
          price_excluding_vat?: number | null
          product_description: string
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          wing_inventory_id?: string | null
          wing_model?: string | null
          wing_serial_number?: string | null
          wing_size?: string | null
        }
        Update: {
          billing_address?: Json | null
          booking_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_address?: string | null
          customer_country?: string | null
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          final_price?: number
          id?: string
          invoice_number?: string
          invoice_pdf_url?: string | null
          metadata?: Json | null
          notes?: string | null
          original_price?: number
          paid_at?: string | null
          price_excluding_vat?: number | null
          product_description?: string
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: string | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          stripe_session_id?: string | null
          updated_at?: string | null
          vat_amount?: number | null
          vat_rate?: number | null
          wing_inventory_id?: string | null
          wing_model?: string | null
          wing_serial_number?: string | null
          wing_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_invoices_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_invoices_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_wings: {
        Row: {
          color_config: Json | null
          color_name: string | null
          created_at: string
          id: string
          owner_user_id: string
          partner_school_id: string | null
          product_label: string
          product_model: string
          registered_at: string
          serial_number: string
          size: string | null
        }
        Insert: {
          color_config?: Json | null
          color_name?: string | null
          created_at?: string
          id?: string
          owner_user_id: string
          partner_school_id?: string | null
          product_label: string
          product_model: string
          registered_at?: string
          serial_number: string
          size?: string | null
        }
        Update: {
          color_config?: Json | null
          color_name?: string | null
          created_at?: string
          id?: string
          owner_user_id?: string
          partner_school_id?: string | null
          product_label?: string
          product_model?: string
          registered_at?: string
          serial_number?: string
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_wings_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "customer_wings_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_wings_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      delivery_incidents: {
        Row: {
          booking_id: string
          business_days: number
          carrier: string | null
          created_at: string
          id: string
          is_return: boolean | null
          notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          start_date: string
          tracking_number: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          business_days: number
          carrier?: string | null
          created_at?: string
          id?: string
          is_return?: boolean | null
          notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          start_date: string
          tracking_number: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          business_days?: number
          carrier?: string | null
          created_at?: string
          id?: string
          is_return?: boolean | null
          notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          start_date?: string
          tracking_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_bookings: {
        Row: {
          actual_test_end_date: string | null
          actual_test_start_date: string | null
          approval_deadline: string | null
          auto_cancel_reason: string | null
          auto_cancelled_at: string | null
          bank_validation_amount: number | null
          bank_validation_at: string | null
          billing_address: Json | null
          block_end_date: string | null
          block_start_date: string | null
          conversation_lock_reason: string | null
          conversation_locked: boolean | null
          conversation_locked_at: string | null
          conversation_locked_by: string | null
          created_at: string
          delivery_address_full: string | null
          delivery_address_lat: number | null
          delivery_address_lng: number | null
          delivery_method: string | null
          delivery_over_75km_check_passed: boolean | null
          estimated_shipping_cost: number | null
          expires_at: string | null
          fulfillment_location_id: string | null
          gls_track_id: string | null
          home_delivery: boolean | null
          id: string
          inspection_outgoing_id: string | null
          inspection_outgoing_missed: boolean | null
          inspection_outgoing_out_of_window: boolean | null
          inspection_outgoing_required: boolean | null
          inspection_reception_id: string | null
          inspection_reception_missed: boolean | null
          inspection_reception_required: boolean | null
          loan_terms_accepted_at: string | null
          loan_terms_version: string | null
          location_city: string
          location_lat: number | null
          location_lng: number | null
          migration_history: Json | null
          model: string
          order_id: string | null
          original_test_start_date: string | null
          partner_approval_date: string | null
          partner_approval_status: string | null
          partner_distance_km: number | null
          partner_rejection_reason: string | null
          partner_school: string | null
          partner_school_id: string | null
          partner_validated_at: string | null
          partner_validated_by: string | null
          partner_workshop_id: string | null
          payment_link_created_at: string | null
          payment_link_expires_at: string | null
          payment_link_token: string | null
          payment_validated_at: string | null
          payment_validation_data: Json | null
          pending_at: string | null
          pending_notes: string | null
          purchase_completed: boolean | null
          purchase_date: string | null
          purchase_decision: boolean | null
          purchase_invoice_id: string | null
          purchase_offer_discount_percent: number | null
          purchase_offer_sent_at: string | null
          purchase_offer_token: string | null
          relay_point_address: Json | null
          relay_point_id: string | null
          relay_point_name: string | null
          return_label_generated_at: string | null
          return_reminder_sent_at: string | null
          return_sendcloud_label_url: string | null
          return_sendcloud_parcel_id: number | null
          return_tracking_number: string | null
          sendcloud_label_url: string | null
          sendcloud_parcel_id: number | null
          sendcloud_shipment_id: number | null
          sendcloud_tracking_url: string | null
          shipping_address: Json | null
          shipping_carrier: string | null
          shipping_cost: number | null
          shipping_cost_estimated: number | null
          shipping_invoice_number: string | null
          shipping_invoice_url: string | null
          shipping_lead_days_used: number | null
          shipping_paid_by_customer: boolean | null
          shipping_payment_date: string | null
          shipping_rate_id: string | null
          shipping_tracking_number: string | null
          shippo_shipment_id: string | null
          shippo_transaction_id: string | null
          size: string
          soft_hold_id: string | null
          status: string | null
          stripe_identity_required: boolean | null
          stripe_identity_session_id: string | null
          stripe_identity_verified: boolean | null
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
          stripe_shipping_payment_id: string | null
          stripe_shipping_payment_status: string | null
          test_end_date: string | null
          test_start_date: string | null
          updated_at: string
          user_id: string
          wing_condition_after: string | null
          wing_condition_before: string | null
          wing_inventory_id: string | null
        }
        Insert: {
          actual_test_end_date?: string | null
          actual_test_start_date?: string | null
          approval_deadline?: string | null
          auto_cancel_reason?: string | null
          auto_cancelled_at?: string | null
          bank_validation_amount?: number | null
          bank_validation_at?: string | null
          billing_address?: Json | null
          block_end_date?: string | null
          block_start_date?: string | null
          conversation_lock_reason?: string | null
          conversation_locked?: boolean | null
          conversation_locked_at?: string | null
          conversation_locked_by?: string | null
          created_at?: string
          delivery_address_full?: string | null
          delivery_address_lat?: number | null
          delivery_address_lng?: number | null
          delivery_method?: string | null
          delivery_over_75km_check_passed?: boolean | null
          estimated_shipping_cost?: number | null
          expires_at?: string | null
          fulfillment_location_id?: string | null
          gls_track_id?: string | null
          home_delivery?: boolean | null
          id?: string
          inspection_outgoing_id?: string | null
          inspection_outgoing_missed?: boolean | null
          inspection_outgoing_out_of_window?: boolean | null
          inspection_outgoing_required?: boolean | null
          inspection_reception_id?: string | null
          inspection_reception_missed?: boolean | null
          inspection_reception_required?: boolean | null
          loan_terms_accepted_at?: string | null
          loan_terms_version?: string | null
          location_city: string
          location_lat?: number | null
          location_lng?: number | null
          migration_history?: Json | null
          model: string
          order_id?: string | null
          original_test_start_date?: string | null
          partner_approval_date?: string | null
          partner_approval_status?: string | null
          partner_distance_km?: number | null
          partner_rejection_reason?: string | null
          partner_school?: string | null
          partner_school_id?: string | null
          partner_validated_at?: string | null
          partner_validated_by?: string | null
          partner_workshop_id?: string | null
          payment_link_created_at?: string | null
          payment_link_expires_at?: string | null
          payment_link_token?: string | null
          payment_validated_at?: string | null
          payment_validation_data?: Json | null
          pending_at?: string | null
          pending_notes?: string | null
          purchase_completed?: boolean | null
          purchase_date?: string | null
          purchase_decision?: boolean | null
          purchase_invoice_id?: string | null
          purchase_offer_discount_percent?: number | null
          purchase_offer_sent_at?: string | null
          purchase_offer_token?: string | null
          relay_point_address?: Json | null
          relay_point_id?: string | null
          relay_point_name?: string | null
          return_label_generated_at?: string | null
          return_reminder_sent_at?: string | null
          return_sendcloud_label_url?: string | null
          return_sendcloud_parcel_id?: number | null
          return_tracking_number?: string | null
          sendcloud_label_url?: string | null
          sendcloud_parcel_id?: number | null
          sendcloud_shipment_id?: number | null
          sendcloud_tracking_url?: string | null
          shipping_address?: Json | null
          shipping_carrier?: string | null
          shipping_cost?: number | null
          shipping_cost_estimated?: number | null
          shipping_invoice_number?: string | null
          shipping_invoice_url?: string | null
          shipping_lead_days_used?: number | null
          shipping_paid_by_customer?: boolean | null
          shipping_payment_date?: string | null
          shipping_rate_id?: string | null
          shipping_tracking_number?: string | null
          shippo_shipment_id?: string | null
          shippo_transaction_id?: string | null
          size: string
          soft_hold_id?: string | null
          status?: string | null
          stripe_identity_required?: boolean | null
          stripe_identity_session_id?: string | null
          stripe_identity_verified?: boolean | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          stripe_shipping_payment_id?: string | null
          stripe_shipping_payment_status?: string | null
          test_end_date?: string | null
          test_start_date?: string | null
          updated_at?: string
          user_id: string
          wing_condition_after?: string | null
          wing_condition_before?: string | null
          wing_inventory_id?: string | null
        }
        Update: {
          actual_test_end_date?: string | null
          actual_test_start_date?: string | null
          approval_deadline?: string | null
          auto_cancel_reason?: string | null
          auto_cancelled_at?: string | null
          bank_validation_amount?: number | null
          bank_validation_at?: string | null
          billing_address?: Json | null
          block_end_date?: string | null
          block_start_date?: string | null
          conversation_lock_reason?: string | null
          conversation_locked?: boolean | null
          conversation_locked_at?: string | null
          conversation_locked_by?: string | null
          created_at?: string
          delivery_address_full?: string | null
          delivery_address_lat?: number | null
          delivery_address_lng?: number | null
          delivery_method?: string | null
          delivery_over_75km_check_passed?: boolean | null
          estimated_shipping_cost?: number | null
          expires_at?: string | null
          fulfillment_location_id?: string | null
          gls_track_id?: string | null
          home_delivery?: boolean | null
          id?: string
          inspection_outgoing_id?: string | null
          inspection_outgoing_missed?: boolean | null
          inspection_outgoing_out_of_window?: boolean | null
          inspection_outgoing_required?: boolean | null
          inspection_reception_id?: string | null
          inspection_reception_missed?: boolean | null
          inspection_reception_required?: boolean | null
          loan_terms_accepted_at?: string | null
          loan_terms_version?: string | null
          location_city?: string
          location_lat?: number | null
          location_lng?: number | null
          migration_history?: Json | null
          model?: string
          order_id?: string | null
          original_test_start_date?: string | null
          partner_approval_date?: string | null
          partner_approval_status?: string | null
          partner_distance_km?: number | null
          partner_rejection_reason?: string | null
          partner_school?: string | null
          partner_school_id?: string | null
          partner_validated_at?: string | null
          partner_validated_by?: string | null
          partner_workshop_id?: string | null
          payment_link_created_at?: string | null
          payment_link_expires_at?: string | null
          payment_link_token?: string | null
          payment_validated_at?: string | null
          payment_validation_data?: Json | null
          pending_at?: string | null
          pending_notes?: string | null
          purchase_completed?: boolean | null
          purchase_date?: string | null
          purchase_decision?: boolean | null
          purchase_invoice_id?: string | null
          purchase_offer_discount_percent?: number | null
          purchase_offer_sent_at?: string | null
          purchase_offer_token?: string | null
          relay_point_address?: Json | null
          relay_point_id?: string | null
          relay_point_name?: string | null
          return_label_generated_at?: string | null
          return_reminder_sent_at?: string | null
          return_sendcloud_label_url?: string | null
          return_sendcloud_parcel_id?: number | null
          return_tracking_number?: string | null
          sendcloud_label_url?: string | null
          sendcloud_parcel_id?: number | null
          sendcloud_shipment_id?: number | null
          sendcloud_tracking_url?: string | null
          shipping_address?: Json | null
          shipping_carrier?: string | null
          shipping_cost?: number | null
          shipping_cost_estimated?: number | null
          shipping_invoice_number?: string | null
          shipping_invoice_url?: string | null
          shipping_lead_days_used?: number | null
          shipping_paid_by_customer?: boolean | null
          shipping_payment_date?: string | null
          shipping_rate_id?: string | null
          shipping_tracking_number?: string | null
          shippo_shipment_id?: string | null
          shippo_transaction_id?: string | null
          size?: string
          soft_hold_id?: string | null
          status?: string | null
          stripe_identity_required?: boolean | null
          stripe_identity_session_id?: string | null
          stripe_identity_verified?: boolean | null
          stripe_payment_intent_id?: string | null
          stripe_payment_status?: string | null
          stripe_shipping_payment_id?: string | null
          stripe_shipping_payment_status?: string | null
          test_end_date?: string | null
          test_start_date?: string | null
          updated_at?: string
          user_id?: string
          wing_condition_after?: string | null
          wing_condition_before?: string | null
          wing_inventory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_bookings_fulfillment_location_id_fkey"
            columns: ["fulfillment_location_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_bookings_inspection_outgoing_id_fkey"
            columns: ["inspection_outgoing_id"]
            isOneToOne: false
            referencedRelation: "wing_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_bookings_inspection_reception_id_fkey"
            columns: ["inspection_reception_id"]
            isOneToOne: false
            referencedRelation: "wing_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_bookings_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "demo_bookings_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_bookings_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "demo_bookings_partner_workshop_id_fkey"
            columns: ["partner_workshop_id"]
            isOneToOne: false
            referencedRelation: "partner_workshops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_bookings_purchase_invoice_id_fkey"
            columns: ["purchase_invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_demo_bookings_wing_inventory"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_demo_bookings_wing_inventory"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          assigned_product_id: string | null
          created_at: string
          email: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          first_name: string
          height: number
          id: string
          insurance_confirmed: boolean
          last_name: string
          message: string | null
          notes: string | null
          phone: string
          preferred_location: string | null
          preferred_size: Database["public"]["Enums"]["wing_size"] | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          terms_accepted: boolean
          updated_at: string
          user_id: string
          weight: number
          wing_type: Database["public"]["Enums"]["wing_type"]
        }
        Insert: {
          assigned_product_id?: string | null
          created_at?: string
          email: string
          experience_level: Database["public"]["Enums"]["experience_level"]
          first_name: string
          height: number
          id?: string
          insurance_confirmed?: boolean
          last_name: string
          message?: string | null
          notes?: string | null
          phone: string
          preferred_location?: string | null
          preferred_size?: Database["public"]["Enums"]["wing_size"] | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          terms_accepted?: boolean
          updated_at?: string
          user_id: string
          weight: number
          wing_type: Database["public"]["Enums"]["wing_type"]
        }
        Update: {
          assigned_product_id?: string | null
          created_at?: string
          email?: string
          experience_level?: Database["public"]["Enums"]["experience_level"]
          first_name?: string
          height?: number
          id?: string
          insurance_confirmed?: boolean
          last_name?: string
          message?: string | null
          notes?: string | null
          phone?: string
          preferred_location?: string | null
          preferred_size?: Database["public"]["Enums"]["wing_size"] | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          terms_accepted?: boolean
          updated_at?: string
          user_id?: string
          weight?: number
          wing_type?: Database["public"]["Enums"]["wing_type"]
        }
        Relationships: [
          {
            foreignKeyName: "demo_requests_assigned_product_id_fkey"
            columns: ["assigned_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_wing_inventory: {
        Row: {
          active: boolean
          base_price: number
          blocked: boolean | null
          blocked_at: string | null
          blocked_by: string | null
          blocked_incident_id: string | null
          blocked_reason: string | null
          calculated_price: number | null
          client_delivery_address: Json | null
          color: string
          created_at: string
          current_location_details: Json | null
          current_location_type: string | null
          current_partner_school_id: string | null
          current_sendcloud_parcel_id: number | null
          enabled_for_test: boolean | null
          futurlog_order_pending: boolean | null
          gls_track_id: string | null
          id: string
          incident_resolution_type: string | null
          incident_resolved_at: string | null
          last_location_update: string | null
          last_shipping_event_at: string | null
          model: string
          owner_since: string | null
          owner_type: string | null
          owner_user_id: string | null
          pending_futurlog_order_data: Json | null
          replacement_status: string | null
          replacement_wing_id: string | null
          scheduled_futurlog_ship_date: string | null
          serial_number: string | null
          shipping_carrier: string | null
          shipping_status: string | null
          shipping_tracking_number: string | null
          shipping_updated_at: string | null
          shippo_transaction_id: string | null
          size: string
          sold_at: string | null
          standby_partner_school_id: string | null
          standby_requested_at: string | null
          standby_response_token: string | null
          standby_since: string | null
          standby_status: string | null
          test_count: number
          wing_type: string | null
        }
        Insert: {
          active?: boolean
          base_price?: number
          blocked?: boolean | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_incident_id?: string | null
          blocked_reason?: string | null
          calculated_price?: number | null
          client_delivery_address?: Json | null
          color: string
          created_at?: string
          current_location_details?: Json | null
          current_location_type?: string | null
          current_partner_school_id?: string | null
          current_sendcloud_parcel_id?: number | null
          enabled_for_test?: boolean | null
          futurlog_order_pending?: boolean | null
          gls_track_id?: string | null
          id?: string
          incident_resolution_type?: string | null
          incident_resolved_at?: string | null
          last_location_update?: string | null
          last_shipping_event_at?: string | null
          model: string
          owner_since?: string | null
          owner_type?: string | null
          owner_user_id?: string | null
          pending_futurlog_order_data?: Json | null
          replacement_status?: string | null
          replacement_wing_id?: string | null
          scheduled_futurlog_ship_date?: string | null
          serial_number?: string | null
          shipping_carrier?: string | null
          shipping_status?: string | null
          shipping_tracking_number?: string | null
          shipping_updated_at?: string | null
          shippo_transaction_id?: string | null
          size: string
          sold_at?: string | null
          standby_partner_school_id?: string | null
          standby_requested_at?: string | null
          standby_response_token?: string | null
          standby_since?: string | null
          standby_status?: string | null
          test_count?: number
          wing_type?: string | null
        }
        Update: {
          active?: boolean
          base_price?: number
          blocked?: boolean | null
          blocked_at?: string | null
          blocked_by?: string | null
          blocked_incident_id?: string | null
          blocked_reason?: string | null
          calculated_price?: number | null
          client_delivery_address?: Json | null
          color?: string
          created_at?: string
          current_location_details?: Json | null
          current_location_type?: string | null
          current_partner_school_id?: string | null
          current_sendcloud_parcel_id?: number | null
          enabled_for_test?: boolean | null
          futurlog_order_pending?: boolean | null
          gls_track_id?: string | null
          id?: string
          incident_resolution_type?: string | null
          incident_resolved_at?: string | null
          last_location_update?: string | null
          last_shipping_event_at?: string | null
          model?: string
          owner_since?: string | null
          owner_type?: string | null
          owner_user_id?: string | null
          pending_futurlog_order_data?: Json | null
          replacement_status?: string | null
          replacement_wing_id?: string | null
          scheduled_futurlog_ship_date?: string | null
          serial_number?: string | null
          shipping_carrier?: string | null
          shipping_status?: string | null
          shipping_tracking_number?: string | null
          shipping_updated_at?: string | null
          shippo_transaction_id?: string | null
          size?: string
          sold_at?: string | null
          standby_partner_school_id?: string | null
          standby_requested_at?: string | null
          standby_response_token?: string | null
          standby_since?: string | null
          standby_status?: string | null
          test_count?: number
          wing_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_wing_inventory_current_partner_school_id_fkey"
            columns: ["current_partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "demo_wing_inventory_current_partner_school_id_fkey"
            columns: ["current_partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_wing_inventory_current_partner_school_id_fkey"
            columns: ["current_partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "demo_wing_inventory_replacement_wing_id_fkey"
            columns: ["replacement_wing_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_wing_inventory_replacement_wing_id_fkey"
            columns: ["replacement_wing_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_wing_inventory_standby_partner_school_id_fkey"
            columns: ["standby_partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "demo_wing_inventory_standby_partner_school_id_fkey"
            columns: ["standby_partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_wing_inventory_standby_partner_school_id_fkey"
            columns: ["standby_partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      email_bounces: {
        Row: {
          bounce_count: number
          bounce_type: string | null
          created_at: string
          email: string
          first_bounced_at: string
          last_bounced_at: string
          last_subject: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          bounce_count?: number
          bounce_type?: string | null
          created_at?: string
          email: string
          first_bounced_at?: string
          last_bounced_at?: string
          last_subject?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          bounce_count?: number
          bounce_type?: string | null
          created_at?: string
          email?: string
          first_bounced_at?: string
          last_bounced_at?: string
          last_subject?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_global_variables: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      email_notifications: {
        Row: {
          body: string
          booking_id: string | null
          created_at: string
          email_type: string
          error: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          sent_at: string | null
          subject: string
          user_id: string | null
        }
        Insert: {
          body: string
          booking_id?: string | null
          created_at?: string
          email_type: string
          error?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          sent_at?: string | null
          subject: string
          user_id?: string | null
        }
        Update: {
          body?: string
          booking_id?: string | null
          created_at?: string
          email_type?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          sent_at?: string | null
          subject?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          active: boolean | null
          body_html: string
          body_text: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          language: string
          preview_text: string | null
          subject: string
          template_type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          active?: boolean | null
          body_html: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          language?: string
          preview_text?: string | null
          subject: string
          template_type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          active?: boolean | null
          body_html?: string
          body_text?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          language?: string
          preview_text?: string | null
          subject?: string
          template_type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      fabric_colors: {
        Row: {
          available: boolean
          brand: string
          color_group: string
          color_group_label: string
          color_group_label_i18n: Json | null
          color_name: string
          color_name_i18n: Json | null
          color_ref: string
          created_at: string | null
          fabric_type: string
          fabric_type_label: string
          fabric_type_label_i18n: Json | null
          hex_color: string
          id: string
          render_hex: string | null
          stock_quantity: number | null
          stock_updated_at: string | null
          updated_at: string | null
        }
        Insert: {
          available?: boolean
          brand: string
          color_group: string
          color_group_label: string
          color_group_label_i18n?: Json | null
          color_name: string
          color_name_i18n?: Json | null
          color_ref: string
          created_at?: string | null
          fabric_type: string
          fabric_type_label: string
          fabric_type_label_i18n?: Json | null
          hex_color?: string
          id?: string
          render_hex?: string | null
          stock_quantity?: number | null
          stock_updated_at?: string | null
          updated_at?: string | null
        }
        Update: {
          available?: boolean
          brand?: string
          color_group?: string
          color_group_label?: string
          color_group_label_i18n?: Json | null
          color_name?: string
          color_name_i18n?: Json | null
          color_ref?: string
          created_at?: string | null
          fabric_type?: string
          fabric_type_label?: string
          fabric_type_label_i18n?: Json | null
          hex_color?: string
          id?: string
          render_hex?: string | null
          stock_quantity?: number | null
          stock_updated_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      fabric_consumption_log: {
        Row: {
          area_m2: number
          batch_item_id: string | null
          color_group: string
          created_at: string
          fabric_color_id: string
          fabric_type: string
          futurlog_sku: string | null
          id: string
          reason: string
          size_label: string
          stock_after: number | null
          stock_before: number | null
          wing_id: string
          zone_key: string
        }
        Insert: {
          area_m2: number
          batch_item_id?: string | null
          color_group: string
          created_at?: string
          fabric_color_id: string
          fabric_type: string
          futurlog_sku?: string | null
          id?: string
          reason?: string
          size_label: string
          stock_after?: number | null
          stock_before?: number | null
          wing_id: string
          zone_key: string
        }
        Update: {
          area_m2?: number
          batch_item_id?: string | null
          color_group?: string
          created_at?: string
          fabric_color_id?: string
          fabric_type?: string
          futurlog_sku?: string | null
          id?: string
          reason?: string
          size_label?: string
          stock_after?: number | null
          stock_before?: number | null
          wing_id?: string
          zone_key?: string
        }
        Relationships: []
      }
      factory_stock: {
        Row: {
          available_quantity: number
          created_at: string | null
          futurlog_sku: string
          id: string
          last_auto_replenish_at: string | null
          last_updated_at: string | null
          location: string
          notes: string | null
          updated_by: string | null
        }
        Insert: {
          available_quantity?: number
          created_at?: string | null
          futurlog_sku: string
          id?: string
          last_auto_replenish_at?: string | null
          last_updated_at?: string | null
          location?: string
          notes?: string | null
          updated_by?: string | null
        }
        Update: {
          available_quantity?: number
          created_at?: string | null
          futurlog_sku?: string
          id?: string
          last_auto_replenish_at?: string | null
          last_updated_at?: string | null
          location?: string
          notes?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      factory_tab_visibility: {
        Row: {
          tab_id: string
          updated_at: string | null
          visible: boolean
        }
        Insert: {
          tab_id: string
          updated_at?: string | null
          visible?: boolean
        }
        Update: {
          tab_id?: string
          updated_at?: string | null
          visible?: boolean
        }
        Relationships: []
      }
      flight_log_transfers: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          created_at: string | null
          from_user_id: string
          id: string
          rejected_at: string | null
          status: string
          to_email: string
          to_user_id: string | null
          token_expires_at: string
          transfer_token: string
          wing_inventory_id: string
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          from_user_id: string
          id?: string
          rejected_at?: string | null
          status?: string
          to_email: string
          to_user_id?: string | null
          token_expires_at?: string
          transfer_token?: string
          wing_inventory_id: string
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          from_user_id?: string
          id?: string
          rejected_at?: string | null
          status?: string
          to_email?: string
          to_user_id?: string | null
          token_expires_at?: string
          transfer_token?: string
          wing_inventory_id?: string
        }
        Relationships: []
      }
      fulfillment_locations: {
        Row: {
          active: boolean | null
          address_name: string
          business_hours: Json | null
          can_ship_normal_orders: boolean | null
          can_ship_test_wings: boolean | null
          city: string
          country: string
          created_at: string | null
          email: string
          id: string
          latitude: number | null
          location_type: string
          longitude: number | null
          max_daily_shipments: number | null
          name: string
          notes: string | null
          partner_school_id: string | null
          phone: string
          postal_code: string
          preferred_carriers: string[] | null
          processing_time_days: number | null
          state: string | null
          street1: string
          street2: string | null
          tracks_inventory: boolean | null
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          address_name: string
          business_hours?: Json | null
          can_ship_normal_orders?: boolean | null
          can_ship_test_wings?: boolean | null
          city: string
          country?: string
          created_at?: string | null
          email: string
          id?: string
          latitude?: number | null
          location_type: string
          longitude?: number | null
          max_daily_shipments?: number | null
          name: string
          notes?: string | null
          partner_school_id?: string | null
          phone: string
          postal_code: string
          preferred_carriers?: string[] | null
          processing_time_days?: number | null
          state?: string | null
          street1: string
          street2?: string | null
          tracks_inventory?: boolean | null
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          address_name?: string
          business_hours?: Json | null
          can_ship_normal_orders?: boolean | null
          can_ship_test_wings?: boolean | null
          city?: string
          country?: string
          created_at?: string | null
          email?: string
          id?: string
          latitude?: number | null
          location_type?: string
          longitude?: number | null
          max_daily_shipments?: number | null
          name?: string
          notes?: string | null
          partner_school_id?: string | null
          phone?: string
          postal_code?: string
          preferred_carriers?: string[] | null
          processing_time_days?: number | null
          state?: string | null
          street1?: string
          street2?: string | null
          tracks_inventory?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fulfillment_locations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "fulfillment_locations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fulfillment_locations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      futurlog_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          auto_resolved_at: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          fulfilled_quantity: number | null
          id: string
          severity: string
          target_quantity: number | null
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          auto_resolved_at?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          fulfilled_quantity?: number | null
          id?: string
          severity?: string
          target_quantity?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          auto_resolved_at?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          fulfilled_quantity?: number | null
          id?: string
          severity?: string
          target_quantity?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      futurlog_batch_ac: {
        Row: {
          attendu_receipt_number: string | null
          auto_fulfill: boolean | null
          batch_type: string
          billing_address: Json | null
          color_config: Json | null
          color_name: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          factory_carrier_name: string | null
          factory_shipped_at: string | null
          factory_tracking_number: string | null
          futurlog_order_number: string | null
          futurlog_sku: string
          id: string
          is_custom: boolean | null
          notes: string | null
          order_date: string | null
          order_number: string | null
          product_label: string | null
          product_model: string | null
          product_type: string
          production_marked_at: string | null
          production_notes: string | null
          quantity: number | null
          serial_number: string | null
          shipping_address: Json | null
          shop_order_id: string | null
          size: string | null
          snapshot_url: string | null
          status: string
          total_amount: number | null
          unit_price: number | null
          updated_at: string | null
        }
        Insert: {
          attendu_receipt_number?: string | null
          auto_fulfill?: boolean | null
          batch_type: string
          billing_address?: Json | null
          color_config?: Json | null
          color_name?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          factory_carrier_name?: string | null
          factory_shipped_at?: string | null
          factory_tracking_number?: string | null
          futurlog_order_number?: string | null
          futurlog_sku: string
          id?: string
          is_custom?: boolean | null
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          product_label?: string | null
          product_model?: string | null
          product_type?: string
          production_marked_at?: string | null
          production_notes?: string | null
          quantity?: number | null
          serial_number?: string | null
          shipping_address?: Json | null
          shop_order_id?: string | null
          size?: string | null
          snapshot_url?: string | null
          status?: string
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Update: {
          attendu_receipt_number?: string | null
          auto_fulfill?: boolean | null
          batch_type?: string
          billing_address?: Json | null
          color_config?: Json | null
          color_name?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          factory_carrier_name?: string | null
          factory_shipped_at?: string | null
          factory_tracking_number?: string | null
          futurlog_order_number?: string | null
          futurlog_sku?: string
          id?: string
          is_custom?: boolean | null
          notes?: string | null
          order_date?: string | null
          order_number?: string | null
          product_label?: string | null
          product_model?: string | null
          product_type?: string
          production_marked_at?: string | null
          production_notes?: string | null
          quantity?: number | null
          serial_number?: string | null
          shipping_address?: Json | null
          shop_order_id?: string | null
          size?: string | null
          snapshot_url?: string | null
          status?: string
          total_amount?: number | null
          unit_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_futurlog_batch_ac_shop_order"
            columns: ["shop_order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      futurlog_config: {
        Row: {
          api_key: string
          auto_sync_enabled: boolean | null
          base_url: string
          brand_code: string | null
          created_at: string
          default_height_cm: number | null
          default_length_cm: number | null
          default_weight_kg: number | null
          default_width_cm: number | null
          environment: string
          id: string
          last_error_check_at: string | null
          last_shipment_sync_at: string | null
          last_stock_sync_at: string | null
          login: string
          merchant_code: string
          product_mapping: Json | null
          size_mapping: Json | null
          stock_alert_threshold: number | null
          sync_interval_minutes: number | null
          updated_at: string
          warehouse_address: Json | null
        }
        Insert: {
          api_key?: string
          auto_sync_enabled?: boolean | null
          base_url?: string
          brand_code?: string | null
          created_at?: string
          default_height_cm?: number | null
          default_length_cm?: number | null
          default_weight_kg?: number | null
          default_width_cm?: number | null
          environment?: string
          id?: string
          last_error_check_at?: string | null
          last_shipment_sync_at?: string | null
          last_stock_sync_at?: string | null
          login?: string
          merchant_code?: string
          product_mapping?: Json | null
          size_mapping?: Json | null
          stock_alert_threshold?: number | null
          sync_interval_minutes?: number | null
          updated_at?: string
          warehouse_address?: Json | null
        }
        Update: {
          api_key?: string
          auto_sync_enabled?: boolean | null
          base_url?: string
          brand_code?: string | null
          created_at?: string
          default_height_cm?: number | null
          default_length_cm?: number | null
          default_weight_kg?: number | null
          default_width_cm?: number | null
          environment?: string
          id?: string
          last_error_check_at?: string | null
          last_shipment_sync_at?: string | null
          last_stock_sync_at?: string | null
          login?: string
          merchant_code?: string
          product_mapping?: Json | null
          size_mapping?: Json | null
          stock_alert_threshold?: number | null
          sync_interval_minutes?: number | null
          updated_at?: string
          warehouse_address?: Json | null
        }
        Relationships: []
      }
      futurlog_dismissed_errors: {
        Row: {
          dismissed_at: string
          error_key: string
          id: string
        }
        Insert: {
          dismissed_at?: string
          error_key: string
          id?: string
        }
        Update: {
          dismissed_at?: string
          error_key?: string
          id?: string
        }
        Relationships: []
      }
      futurlog_orders: {
        Row: {
          billing_address: Json | null
          carrier_code: string | null
          carrier_label: string | null
          created_at: string
          created_by: string | null
          delivered_at: string | null
          error_message: string | null
          futurlog_order_number: string
          futurlog_status_code: number | null
          futurlog_status_label: string | null
          id: string
          items: Json | null
          last_sync_at: string | null
          notes: string | null
          order_type: string | null
          picker_comments: string | null
          raw_response: Json | null
          sent_at: string | null
          serial_numbers: Json | null
          shipped_at: string | null
          shipping_address: Json | null
          shop_order_id: string | null
          status: string | null
          total_amount: number | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          wing_inventory_id: string | null
        }
        Insert: {
          billing_address?: Json | null
          carrier_code?: string | null
          carrier_label?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          error_message?: string | null
          futurlog_order_number: string
          futurlog_status_code?: number | null
          futurlog_status_label?: string | null
          id?: string
          items?: Json | null
          last_sync_at?: string | null
          notes?: string | null
          order_type?: string | null
          picker_comments?: string | null
          raw_response?: Json | null
          sent_at?: string | null
          serial_numbers?: Json | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shop_order_id?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          wing_inventory_id?: string | null
        }
        Update: {
          billing_address?: Json | null
          carrier_code?: string | null
          carrier_label?: string | null
          created_at?: string
          created_by?: string | null
          delivered_at?: string | null
          error_message?: string | null
          futurlog_order_number?: string
          futurlog_status_code?: number | null
          futurlog_status_label?: string | null
          id?: string
          items?: Json | null
          last_sync_at?: string | null
          notes?: string | null
          order_type?: string | null
          picker_comments?: string | null
          raw_response?: Json | null
          sent_at?: string | null
          serial_numbers?: Json | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shop_order_id?: string | null
          status?: string | null
          total_amount?: number | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          wing_inventory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_futurlog_orders_shop_order"
            columns: ["shop_order_id"]
            isOneToOne: false
            referencedRelation: "shop_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "futurlog_orders_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "futurlog_orders_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      futurlog_products: {
        Row: {
          barcode: string | null
          cart_product_id: string | null
          cart_size_id: string | null
          color_config: Json | null
          color_hex: string | null
          color_name: string | null
          created_at: string
          family: string | null
          futurlog_sku: string
          height_cm: number | null
          id: string
          is_active: boolean | null
          is_custom: boolean | null
          length_cm: number | null
          product_label: string
          product_model: string
          product_type: string
          shop_order_id: string | null
          size: string | null
          sync_error: string | null
          sync_status: string | null
          synced_at: string | null
          updated_at: string
          weight_kg: number | null
          width_cm: number | null
        }
        Insert: {
          barcode?: string | null
          cart_product_id?: string | null
          cart_size_id?: string | null
          color_config?: Json | null
          color_hex?: string | null
          color_name?: string | null
          created_at?: string
          family?: string | null
          futurlog_sku: string
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          length_cm?: number | null
          product_label: string
          product_model: string
          product_type?: string
          shop_order_id?: string | null
          size?: string | null
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
          updated_at?: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Update: {
          barcode?: string | null
          cart_product_id?: string | null
          cart_size_id?: string | null
          color_config?: Json | null
          color_hex?: string | null
          color_name?: string | null
          created_at?: string
          family?: string | null
          futurlog_sku?: string
          height_cm?: number | null
          id?: string
          is_active?: boolean | null
          is_custom?: boolean | null
          length_cm?: number | null
          product_label?: string
          product_model?: string
          product_type?: string
          shop_order_id?: string | null
          size?: string | null
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
          updated_at?: string
          weight_kg?: number | null
          width_cm?: number | null
        }
        Relationships: []
      }
      futurlog_receipts: {
        Row: {
          carrier_name: string | null
          created_at: string
          delivery_comments: string | null
          futurlog_status_code: number | null
          id: string
          items: Json | null
          receipt_number: string
          scheduled_date: string
          shop_order_id: string | null
          status: string | null
          supplier_name: string | null
          sync_error: string | null
          sync_status: string | null
          synced_at: string | null
          updated_at: string
        }
        Insert: {
          carrier_name?: string | null
          created_at?: string
          delivery_comments?: string | null
          futurlog_status_code?: number | null
          id?: string
          items?: Json | null
          receipt_number: string
          scheduled_date: string
          shop_order_id?: string | null
          status?: string | null
          supplier_name?: string | null
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
          updated_at?: string
        }
        Update: {
          carrier_name?: string | null
          created_at?: string
          delivery_comments?: string | null
          futurlog_status_code?: number | null
          id?: string
          items?: Json | null
          receipt_number?: string
          scheduled_date?: string
          shop_order_id?: string | null
          status?: string | null
          supplier_name?: string | null
          sync_error?: string | null
          sync_status?: string | null
          synced_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      futurlog_shipping_rates: {
        Row: {
          carrier: string | null
          created_at: string | null
          id: string
          is_express: boolean | null
          max_weight_kg: number
          price_ht: number
          zone: string
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          id?: string
          is_express?: boolean | null
          max_weight_kg: number
          price_ht: number
          zone: string
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          id?: string
          is_express?: boolean | null
          max_weight_kg?: number
          price_ht?: number
          zone?: string
        }
        Relationships: []
      }
      futurlog_stock: {
        Row: {
          available_quantity: number | null
          created_at: string
          futurlog_sku: string
          id: string
          last_sync_at: string | null
          reserved_quantity: number | null
          updated_at: string
        }
        Insert: {
          available_quantity?: number | null
          created_at?: string
          futurlog_sku: string
          id?: string
          last_sync_at?: string | null
          reserved_quantity?: number | null
          updated_at?: string
        }
        Update: {
          available_quantity?: number | null
          created_at?: string
          futurlog_sku?: string
          id?: string
          last_sync_at?: string | null
          reserved_quantity?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      futurlog_sync_logs: {
        Row: {
          action: string
          created_at: string
          duration_ms: number | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          request_payload: Json | null
          response_payload: Json | null
          status: string
        }
        Insert: {
          action: string
          created_at?: string
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status: string
        }
        Update: {
          action?: string
          created_at?: string
          duration_ms?: number | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string
        }
        Relationships: []
      }
      gls_shipping_rates: {
        Row: {
          active: boolean
          country_codes: string[]
          created_at: string | null
          estimated_days_max: number | null
          estimated_days_min: number | null
          id: string
          price_ht: number
          price_ttc: number | null
          service_fee: number | null
          service_name: string | null
          service_type: string
          updated_at: string | null
          weight_max: number
          weight_min: number
          zone_name: string
        }
        Insert: {
          active?: boolean
          country_codes: string[]
          created_at?: string | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          price_ht: number
          price_ttc?: number | null
          service_fee?: number | null
          service_name?: string | null
          service_type?: string
          updated_at?: string | null
          weight_max: number
          weight_min?: number
          zone_name: string
        }
        Update: {
          active?: boolean
          country_codes?: string[]
          created_at?: string | null
          estimated_days_max?: number | null
          estimated_days_min?: number | null
          id?: string
          price_ht?: number
          price_ttc?: number | null
          service_fee?: number | null
          service_name?: string | null
          service_type?: string
          updated_at?: string | null
          weight_max?: number
          weight_min?: number
          zone_name?: string
        }
        Relationships: []
      }
      inspection_incidents: {
        Row: {
          admin_comments: Json | null
          admin_notified_at: string | null
          booking_id: string
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string
          created_known_defect_id: string | null
          id: string
          inspection_id: string
          issues_detected: Json
          priority: string
          reported_by_type: string
          reported_by_user_id: string
          resolution_notes: string | null
          resolution_type: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
          user_notes: string | null
          wing_color: string | null
          wing_inventory_id: string
          wing_model: string | null
          wing_serial_number: string | null
          wing_size: string | null
        }
        Insert: {
          admin_comments?: Json | null
          admin_notified_at?: string | null
          booking_id: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_known_defect_id?: string | null
          id?: string
          inspection_id: string
          issues_detected?: Json
          priority?: string
          reported_by_type: string
          reported_by_user_id: string
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
          user_notes?: string | null
          wing_color?: string | null
          wing_inventory_id: string
          wing_model?: string | null
          wing_serial_number?: string | null
          wing_size?: string | null
        }
        Update: {
          admin_comments?: Json | null
          admin_notified_at?: string | null
          booking_id?: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string
          created_known_defect_id?: string | null
          id?: string
          inspection_id?: string
          issues_detected?: Json
          priority?: string
          reported_by_type?: string
          reported_by_user_id?: string
          resolution_notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
          user_notes?: string | null
          wing_color?: string | null
          wing_inventory_id?: string
          wing_model?: string | null
          wing_serial_number?: string | null
          wing_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inspection_incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_incidents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_incidents_created_known_defect_id_fkey"
            columns: ["created_known_defect_id"]
            isOneToOne: false
            referencedRelation: "wing_known_defects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_incidents_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "wing_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_incidents_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inspection_incidents_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      inspection_photos: {
        Row: {
          created_at: string
          file_name: string | null
          file_path: string
          file_size: number | null
          id: string
          inspection_id: string
          mime_type: string | null
          photo_type: string
          upload_token: string | null
          uploaded_at: string
        }
        Insert: {
          created_at?: string
          file_name?: string | null
          file_path: string
          file_size?: number | null
          id?: string
          inspection_id: string
          mime_type?: string | null
          photo_type: string
          upload_token?: string | null
          uploaded_at?: string
        }
        Update: {
          created_at?: string
          file_name?: string | null
          file_path?: string
          file_size?: number | null
          id?: string
          inspection_id?: string
          mime_type?: string | null
          photo_type?: string
          upload_token?: string | null
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inspection_photos_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "wing_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_settings: {
        Row: {
          bank_details: Json | null
          company_address: string | null
          company_city: string | null
          company_country: string | null
          company_logo_url: string | null
          company_name: string | null
          company_phone: string | null
          company_siret: string | null
          company_vat_number: string | null
          created_at: string | null
          font_family: string | null
          header_background_color: string | null
          id: string
          invoice_background_url: string | null
          invoice_footer_text: string | null
          invoice_prefix: string | null
          payment_terms: string | null
          primary_color: string | null
          secondary_color: string | null
          updated_at: string | null
        }
        Insert: {
          bank_details?: Json | null
          company_address?: string | null
          company_city?: string | null
          company_country?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_siret?: string | null
          company_vat_number?: string | null
          created_at?: string | null
          font_family?: string | null
          header_background_color?: string | null
          id?: string
          invoice_background_url?: string | null
          invoice_footer_text?: string | null
          invoice_prefix?: string | null
          payment_terms?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_details?: Json | null
          company_address?: string | null
          company_city?: string | null
          company_country?: string | null
          company_logo_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          company_siret?: string | null
          company_vat_number?: string | null
          created_at?: string | null
          font_family?: string | null
          header_background_color?: string | null
          id?: string
          invoice_background_url?: string | null
          invoice_footer_text?: string | null
          invoice_prefix?: string | null
          payment_terms?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      jb_knowledge: {
        Row: {
          content: string
          context: string | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          source: string | null
        }
        Insert: {
          content: string
          context?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Update: {
          content?: string
          context?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
        }
        Relationships: []
      }
      jb_pending_emails: {
        Row: {
          body: string
          created_at: string | null
          id: string
          status: string | null
          subject: string
          to_email: string
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          status?: string | null
          subject: string
          to_email: string
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          status?: string | null
          subject?: string
          to_email?: string
        }
        Relationships: []
      }
      jb_todos: {
        Row: {
          completed_at: string | null
          context: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          importance: string | null
          notes: string | null
          priority: string | null
          status: string | null
          status_changed_at: string | null
          task_number: number | null
          title: string
          updated_at: string | null
          urgency_override: string | null
        }
        Insert: {
          completed_at?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          importance?: string | null
          notes?: string | null
          priority?: string | null
          status?: string | null
          status_changed_at?: string | null
          task_number?: number | null
          title: string
          updated_at?: string | null
          urgency_override?: string | null
        }
        Update: {
          completed_at?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          importance?: string | null
          notes?: string | null
          priority?: string | null
          status?: string | null
          status_changed_at?: string | null
          task_number?: number | null
          title?: string
          updated_at?: string | null
          urgency_override?: string | null
        }
        Relationships: []
      }
      jb_todos_history: {
        Row: {
          changed_at: string
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          todo_id: string
        }
        Insert: {
          changed_at?: string
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          todo_id: string
        }
        Update: {
          changed_at?: string
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          todo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jb_todos_history_todo_id_fkey"
            columns: ["todo_id"]
            isOneToOne: false
            referencedRelation: "jb_todos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jb_todos_history_todo_id_fkey"
            columns: ["todo_id"]
            isOneToOne: false
            referencedRelation: "jb_todos_enriched"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_terms_acceptances: {
        Row: {
          accepted: boolean
          accepted_at: string
          booking_id: string
          created_at: string
          id: string
          ip_address: string | null
          terms_document_url: string | null
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted?: boolean
          accepted_at?: string
          booking_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          terms_document_url?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted?: boolean
          accepted_at?: string
          booking_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          terms_document_url?: string | null
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_terms_acceptances_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_terms_acceptances_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      location_inventory: {
        Row: {
          created_at: string
          fulfillment_location_id: string
          id: string
          last_stock_update: string
          product_id: string | null
          quantity_available: number
          quantity_in_transit: number
          quantity_reserved: number
          status: string
          updated_at: string
          wing_inventory_id: string | null
        }
        Insert: {
          created_at?: string
          fulfillment_location_id: string
          id?: string
          last_stock_update?: string
          product_id?: string | null
          quantity_available?: number
          quantity_in_transit?: number
          quantity_reserved?: number
          status?: string
          updated_at?: string
          wing_inventory_id?: string | null
        }
        Update: {
          created_at?: string
          fulfillment_location_id?: string
          id?: string
          last_stock_update?: string
          product_id?: string | null
          quantity_available?: number
          quantity_in_transit?: number
          quantity_reserved?: number
          status?: string
          updated_at?: string
          wing_inventory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "location_inventory_fulfillment_location_id_fkey"
            columns: ["fulfillment_location_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_inventory_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_inventory_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      message_notification_throttle: {
        Row: {
          booking_id: string
          created_at: string | null
          id: string
          last_email_sent: string
          pending_messages_count: number | null
          recipient_user_id: string
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          created_at?: string | null
          id?: string
          last_email_sent: string
          pending_messages_count?: number | null
          recipient_user_id: string
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          created_at?: string | null
          id?: string
          last_email_sent?: string
          pending_messages_count?: number | null
          recipient_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_notification_throttle_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_notification_throttle_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_campaign_recipients: {
        Row: {
          campaign_id: string
          created_at: string
          error: string | null
          id: string
          opened_at: string | null
          recipient_email: string
          resend_id: string | null
          sent_at: string | null
          status: string
          subscriber_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          error?: string | null
          id?: string
          opened_at?: string | null
          recipient_email: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subscriber_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          error?: string | null
          id?: string
          opened_at?: string | null
          recipient_email?: string
          resend_id?: string | null
          sent_at?: string | null
          status?: string
          subscriber_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_campaign_recipients_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "newsletter_subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_campaigns: {
        Row: {
          body_html: string
          body_text: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_by_email: string | null
          failed_count: number
          from_email: string
          from_name: string
          id: string
          opened_count: number
          preheader: string | null
          recipients_count: number
          reply_to: string | null
          scheduled_for: string | null
          sent_count: number
          started_at: string | null
          status: string
          subject: string
          unsubscribed_count: number
          updated_at: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          failed_count?: number
          from_email?: string
          from_name?: string
          id?: string
          opened_count?: number
          preheader?: string | null
          recipients_count?: number
          reply_to?: string | null
          scheduled_for?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject: string
          unsubscribed_count?: number
          updated_at?: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          failed_count?: number
          from_email?: string
          from_name?: string
          id?: string
          opened_count?: number
          preheader?: string | null
          recipients_count?: number
          reply_to?: string | null
          scheduled_for?: string | null
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string
          unsubscribed_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmation_token: string
          confirmed_at: string | null
          consent_at: string
          created_at: string
          email: string
          id: string
          ip_address: string | null
          language: string | null
          source: string | null
          status: string
          unsubscribe_reason: string | null
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          confirmation_token?: string
          confirmed_at?: string | null
          consent_at?: string
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          language?: string | null
          source?: string | null
          status?: string
          unsubscribe_reason?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          confirmation_token?: string
          confirmed_at?: string | null
          consent_at?: string
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          language?: string | null
          source?: string | null
          status?: string
          unsubscribe_reason?: string | null
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      newsletter_templates: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string
          created_by: string | null
          id: string
          name: string
          preheader: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          preheader?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          preheader?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean | null
          related_id: string | null
          related_type: string | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          related_id?: string | null
          related_type?: string | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          related_id?: string | null
          related_type?: string | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          quantity?: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          actual_delivery_date: string | null
          billing_address: Json
          created_at: string
          estimated_delivery_days: number | null
          fulfillment_location_id: string | null
          gls_track_id: string | null
          id: string
          notes: string | null
          order_number: string
          payment_method: string | null
          payment_status: string | null
          shipping_address: Json
          shipping_carrier: string | null
          shipping_cost: number | null
          shipping_label_url: string | null
          shipping_method: string | null
          shipping_service_level: string | null
          shipping_status: string | null
          shipping_tracking_url: string | null
          shippo_shipment_id: string | null
          shippo_transaction_id: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          stripe_payment_id: string | null
          total_amount: number
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_delivery_date?: string | null
          billing_address: Json
          created_at?: string
          estimated_delivery_days?: number | null
          fulfillment_location_id?: string | null
          gls_track_id?: string | null
          id?: string
          notes?: string | null
          order_number: string
          payment_method?: string | null
          payment_status?: string | null
          shipping_address: Json
          shipping_carrier?: string | null
          shipping_cost?: number | null
          shipping_label_url?: string | null
          shipping_method?: string | null
          shipping_service_level?: string | null
          shipping_status?: string | null
          shipping_tracking_url?: string | null
          shippo_shipment_id?: string | null
          shippo_transaction_id?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          stripe_payment_id?: string | null
          total_amount: number
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_delivery_date?: string | null
          billing_address?: Json
          created_at?: string
          estimated_delivery_days?: number | null
          fulfillment_location_id?: string | null
          gls_track_id?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: string | null
          payment_status?: string | null
          shipping_address?: Json
          shipping_carrier?: string | null
          shipping_cost?: number | null
          shipping_label_url?: string | null
          shipping_method?: string | null
          shipping_service_level?: string | null
          shipping_status?: string | null
          shipping_tracking_url?: string | null
          shippo_shipment_id?: string | null
          shippo_transaction_id?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          stripe_payment_id?: string | null
          total_amount?: number
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_fulfillment_location_id_fkey"
            columns: ["fulfillment_location_id"]
            isOneToOne: false
            referencedRelation: "fulfillment_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          address: string
          application_type: Database["public"]["Enums"]["partner_application_type"]
          contact_email: string
          contact_first_name: string
          contact_last_name: string
          contact_phone: string
          contact_role: string
          country: string
          course_types: string[] | null
          created_at: string
          establishment_name: string
          facebook: string | null
          founding_year: number | null
          free_note: string | null
          has_laser_cut: boolean | null
          id: string
          instagram: string | null
          ip_address: unknown
          is_also_school: boolean | null
          language: string
          non_courses_activity: string[] | null
          num_instructors: number | null
          num_seamstresses: number | null
          offers_paragliding_courses: boolean | null
          online_shop: boolean | null
          other_social: string | null
          physical_shop: boolean | null
          plans_future_courses: boolean | null
          resold_brands: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          rgpd_consent: boolean
          status: Database["public"]["Enums"]["partner_application_status"]
          students_per_year: number | null
          user_agent: string | null
          website: string | null
        }
        Insert: {
          address: string
          application_type: Database["public"]["Enums"]["partner_application_type"]
          contact_email: string
          contact_first_name: string
          contact_last_name: string
          contact_phone: string
          contact_role: string
          country: string
          course_types?: string[] | null
          created_at?: string
          establishment_name: string
          facebook?: string | null
          founding_year?: number | null
          free_note?: string | null
          has_laser_cut?: boolean | null
          id?: string
          instagram?: string | null
          ip_address?: unknown
          is_also_school?: boolean | null
          language?: string
          non_courses_activity?: string[] | null
          num_instructors?: number | null
          num_seamstresses?: number | null
          offers_paragliding_courses?: boolean | null
          online_shop?: boolean | null
          other_social?: string | null
          physical_shop?: boolean | null
          plans_future_courses?: boolean | null
          resold_brands?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rgpd_consent?: boolean
          status?: Database["public"]["Enums"]["partner_application_status"]
          students_per_year?: number | null
          user_agent?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          application_type?: Database["public"]["Enums"]["partner_application_type"]
          contact_email?: string
          contact_first_name?: string
          contact_last_name?: string
          contact_phone?: string
          contact_role?: string
          country?: string
          course_types?: string[] | null
          created_at?: string
          establishment_name?: string
          facebook?: string | null
          founding_year?: number | null
          free_note?: string | null
          has_laser_cut?: boolean | null
          id?: string
          instagram?: string | null
          ip_address?: unknown
          is_also_school?: boolean | null
          language?: string
          non_courses_activity?: string[] | null
          num_instructors?: number | null
          num_seamstresses?: number | null
          offers_paragliding_courses?: boolean | null
          online_shop?: boolean | null
          other_social?: string | null
          physical_shop?: boolean | null
          plans_future_courses?: boolean | null
          resold_brands?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          rgpd_consent?: boolean
          status?: Database["public"]["Enums"]["partner_application_status"]
          students_per_year?: number | null
          user_agent?: string | null
          website?: string | null
        }
        Relationships: []
      }
      partner_availability: {
        Row: {
          created_at: string
          id: string
          partner_school_id: string
          reason: string | null
          unavailable_end_date: string
          unavailable_start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          partner_school_id: string
          reason?: string | null
          unavailable_end_date: string
          unavailable_start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          partner_school_id?: string
          reason?: string | null
          unavailable_end_date?: string
          unavailable_start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_availability_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_availability_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_availability_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      partner_commission_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string | null
          id: string
          invoice_url: string | null
          metadata: Json | null
          order_id: string | null
          partner_school_id: string
          payout_date: string | null
          payout_method: string | null
          status: string
          transaction_type: string
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_url?: string | null
          metadata?: Json | null
          order_id?: string | null
          partner_school_id: string
          payout_date?: string | null
          payout_method?: string | null
          status?: string
          transaction_type: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_url?: string | null
          metadata?: Json | null
          order_id?: string | null
          partner_school_id?: string
          payout_date?: string | null
          payout_method?: string | null
          status?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_commission_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commission_transactions_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      partner_dashboards: {
        Row: {
          created_at: string | null
          id: string
          last_login: string | null
          partner_school_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_login?: string | null
          partner_school_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_login?: string | null
          partner_school_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_dashboards_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_dashboards_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_dashboards_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      partner_documents: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          file_path: string
          file_size: number
          file_type: string
          id: string
          name: string
          partner_school_id: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          file_path: string
          file_size: number
          file_type: string
          id?: string
          name: string
          partner_school_id: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          name?: string
          partner_school_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_documents_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_documents_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_documents_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      partner_email_campaign_recipients: {
        Row: {
          campaign_id: string
          contact_id: string | null
          contact_name: string | null
          created_at: string
          error: string | null
          id: string
          recipient_email: string
          resend_id: string | null
          school_id: string | null
          school_name: string | null
          sent_at: string | null
          status: string
        }
        Insert: {
          campaign_id: string
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          error?: string | null
          id?: string
          recipient_email: string
          resend_id?: string | null
          school_id?: string | null
          school_name?: string | null
          sent_at?: string | null
          status: string
        }
        Update: {
          campaign_id?: string
          contact_id?: string | null
          contact_name?: string | null
          created_at?: string
          error?: string | null
          id?: string
          recipient_email?: string
          resend_id?: string | null
          school_id?: string | null
          school_name?: string | null
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "partner_email_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_email_campaign_recipients_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_school_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_email_campaign_recipients_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "contacts_paragliding_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_email_campaigns: {
        Row: {
          body_html: string
          body_text: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          created_by_email: string | null
          failed_count: number
          filters_used: Json | null
          from_email: string
          from_name: string
          id: string
          recipients_count: number
          reply_to: string
          send_mode: string
          sent_count: number
          started_at: string | null
          status: string
          subject: string
          suppressed_count: number
        }
        Insert: {
          body_html: string
          body_text?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          failed_count?: number
          filters_used?: Json | null
          from_email: string
          from_name: string
          id?: string
          recipients_count?: number
          reply_to: string
          send_mode: string
          sent_count?: number
          started_at?: string | null
          status?: string
          subject: string
          suppressed_count?: number
        }
        Update: {
          body_html?: string
          body_text?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          created_by_email?: string | null
          failed_count?: number
          filters_used?: Json | null
          from_email?: string
          from_name?: string
          id?: string
          recipients_count?: number
          reply_to?: string
          send_mode?: string
          sent_count?: number
          started_at?: string | null
          status?: string
          subject?: string
          suppressed_count?: number
        }
        Relationships: []
      }
      partner_email_senders: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          display_name: string
          email: string
          id: string
          is_default: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          display_name: string
          email: string
          id?: string
          is_default?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          display_name?: string
          email?: string
          id?: string
          is_default?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      partner_email_templates: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string
          created_by: string | null
          id: string
          language: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          language?: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          language?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_funds: {
        Row: {
          available_balance: number | null
          created_at: string
          id: string
          last_payout_date: string | null
          partner_school_id: string
          pending_balance: number | null
          total_commissions: number | null
          total_withdrawn: number | null
          updated_at: string
        }
        Insert: {
          available_balance?: number | null
          created_at?: string
          id?: string
          last_payout_date?: string | null
          partner_school_id: string
          pending_balance?: number | null
          total_commissions?: number | null
          total_withdrawn?: number | null
          updated_at?: string
        }
        Update: {
          available_balance?: number | null
          created_at?: string
          id?: string
          last_payout_date?: string | null
          partner_school_id?: string
          pending_balance?: number | null
          total_commissions?: number | null
          total_withdrawn?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_funds_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: true
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_funds_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: true
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_funds_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: true
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      partner_invoices: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_details: Json | null
          commission_transaction_id: string | null
          created_at: string | null
          currency: string
          due_date: string | null
          id: string
          invoice_date: string
          invoice_file_name: string | null
          invoice_file_url: string | null
          invoice_number: string
          metadata: Json | null
          notes: string | null
          paid_at: string | null
          partner_school_id: string
          payment_notes: string | null
          payment_reference: string | null
          payout_method: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: Json | null
          commission_transaction_id?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_file_name?: string | null
          invoice_file_url?: string | null
          invoice_number: string
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          partner_school_id: string
          payment_notes?: string | null
          payment_reference?: string | null
          payout_method?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_details?: Json | null
          commission_transaction_id?: string | null
          created_at?: string | null
          currency?: string
          due_date?: string | null
          id?: string
          invoice_date?: string
          invoice_file_name?: string | null
          invoice_file_url?: string | null
          invoice_number?: string
          metadata?: Json | null
          notes?: string | null
          paid_at?: string | null
          partner_school_id?: string
          payment_notes?: string | null
          payment_reference?: string | null
          payout_method?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_invoices_commission_transaction_id_fkey"
            columns: ["commission_transaction_id"]
            isOneToOne: false
            referencedRelation: "partner_commission_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_invoices_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_invoices_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_invoices_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      partner_messages: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          read_at: string | null
          sender_id: string | null
          sender_type: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          read_at?: string | null
          sender_id?: string | null
          sender_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_monitors: {
        Row: {
          added_at: string
          added_by: string | null
          email: string
          id: string
          partner_school_id: string
          user_id: string
        }
        Insert: {
          added_at?: string
          added_by?: string | null
          email: string
          id?: string
          partner_school_id: string
          user_id: string
        }
        Update: {
          added_at?: string
          added_by?: string | null
          email?: string
          id?: string
          partner_school_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_monitors_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_monitors_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_monitors_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      partner_notifications: {
        Row: {
          booking_id: string | null
          created_at: string | null
          id: string
          message: string
          notification_type: string | null
          partner_school_id: string | null
          priority: string | null
          read: boolean | null
          read_at: string | null
          read_by: string | null
          title: string
          viewed_at: string | null
          viewed_by: string | null
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          notification_type?: string | null
          partner_school_id?: string | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          read_by?: string | null
          title: string
          viewed_at?: string | null
          viewed_by?: string | null
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          notification_type?: string | null
          partner_school_id?: string | null
          priority?: string | null
          read?: boolean | null
          read_at?: string | null
          read_by?: string | null
          title?: string
          viewed_at?: string | null
          viewed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_notifications_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_notifications_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_notifications_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      partner_purchase_offers: {
        Row: {
          created_at: string | null
          customer_email: string
          customer_id: string | null
          customer_name: string | null
          discount_percent: number | null
          expires_at: string
          final_price: number
          id: string
          invoice_id: string | null
          original_price: number
          partner_id: string
          purchase_url: string | null
          purchased_at: string | null
          sent_at: string | null
          status: string | null
          updated_at: string | null
          viewed_at: string | null
          wing_id: string | null
        }
        Insert: {
          created_at?: string | null
          customer_email: string
          customer_id?: string | null
          customer_name?: string | null
          discount_percent?: number | null
          expires_at: string
          final_price: number
          id?: string
          invoice_id?: string | null
          original_price: number
          partner_id: string
          purchase_url?: string | null
          purchased_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          viewed_at?: string | null
          wing_id?: string | null
        }
        Update: {
          created_at?: string | null
          customer_email?: string
          customer_id?: string | null
          customer_name?: string | null
          discount_percent?: number | null
          expires_at?: string
          final_price?: number
          id?: string
          invoice_id?: string | null
          original_price?: number
          partner_id?: string
          purchase_url?: string | null
          purchased_at?: string | null
          sent_at?: string | null
          status?: string | null
          updated_at?: string | null
          viewed_at?: string | null
          wing_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_purchase_offers_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "customer_invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_purchase_offers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_purchase_offers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_purchase_offers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_purchase_offers_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_purchase_offers_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_schools: {
        Row: {
          active: boolean | null
          avatar_url: string | null
          bank_details: Json | null
          city: string
          company_address: Json | null
          contact_person: string | null
          country_code: string | null
          created_at: string
          custom_status: string | null
          custom_status_updated_at: string | null
          delivery_address: Json | null
          email: string | null
          id: string
          is_affiliated: boolean | null
          language: string
          lat: number
          legal_form: string | null
          legal_name: string | null
          lng: number
          name: string
          phone: string | null
          siret: string | null
          user_id: string | null
          vat_company_name: string | null
          vat_number: string | null
          vat_verified: boolean | null
          vat_verified_at: string | null
        }
        Insert: {
          active?: boolean | null
          avatar_url?: string | null
          bank_details?: Json | null
          city: string
          company_address?: Json | null
          contact_person?: string | null
          country_code?: string | null
          created_at?: string
          custom_status?: string | null
          custom_status_updated_at?: string | null
          delivery_address?: Json | null
          email?: string | null
          id?: string
          is_affiliated?: boolean | null
          language?: string
          lat: number
          legal_form?: string | null
          legal_name?: string | null
          lng: number
          name: string
          phone?: string | null
          siret?: string | null
          user_id?: string | null
          vat_company_name?: string | null
          vat_number?: string | null
          vat_verified?: boolean | null
          vat_verified_at?: string | null
        }
        Update: {
          active?: boolean | null
          avatar_url?: string | null
          bank_details?: Json | null
          city?: string
          company_address?: Json | null
          contact_person?: string | null
          country_code?: string | null
          created_at?: string
          custom_status?: string | null
          custom_status_updated_at?: string | null
          delivery_address?: Json | null
          email?: string | null
          id?: string
          is_affiliated?: boolean | null
          language?: string
          lat?: number
          legal_form?: string | null
          legal_name?: string | null
          lng?: number
          name?: string
          phone?: string | null
          siret?: string | null
          user_id?: string | null
          vat_company_name?: string | null
          vat_number?: string | null
          vat_verified?: boolean | null
          vat_verified_at?: string | null
        }
        Relationships: []
      }
      partner_validations: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          order_id: string | null
          partner_school_id: string
          rejection_reason: string | null
          status: string
          validated_at: string | null
          validated_by: string | null
          validation_type: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          order_id?: string | null
          partner_school_id: string
          rejection_reason?: string | null
          status?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_type: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          order_id?: string | null
          partner_school_id?: string
          rejection_reason?: string | null
          status?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_validations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_validations_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_validations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_validations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_validations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_validations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      partner_workshop_conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          last_message_at: string | null
          partner_school_id: string
          status: string
          subject: string | null
          updated_at: string
          workshop_contact_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string | null
          partner_school_id: string
          status?: string
          subject?: string | null
          updated_at?: string
          workshop_contact_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          last_message_at?: string | null
          partner_school_id?: string
          status?: string
          subject?: string | null
          updated_at?: string
          workshop_contact_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_workshop_conversations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_workshop_conversations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_workshop_conversations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "partner_workshop_conversations_workshop_contact_id_fkey"
            columns: ["workshop_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_paragliding_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_workshop_messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          message: string
          read: boolean | null
          read_at: string | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          read_at?: string | null
          sender_id: string
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          read_at?: string | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_workshop_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "partner_workshop_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_workshops: {
        Row: {
          active: boolean | null
          address: string | null
          business_hours: Json | null
          city: string
          contact_person: string | null
          country_code: string | null
          created_at: string
          email: string | null
          id: string
          lat: number | null
          lng: number | null
          name: string
          notes: string | null
          phone: string | null
          region: string | null
          siret: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          address?: string | null
          business_hours?: Json | null
          city: string
          contact_person?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          siret?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          address?: string | null
          business_hours?: Json | null
          city?: string
          contact_person?: string | null
          country_code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          notes?: string | null
          phone?: string | null
          region?: string | null
          siret?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      plume_admin_ticket_reads: {
        Row: {
          read_at: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          read_at?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          read_at?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plume_admin_ticket_reads_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      plume_settings: {
        Row: {
          extended_covers_precheck: boolean
          extended_covers_repair: boolean
          extended_covers_replacement: boolean
          extended_covers_school_workshop_shipping: boolean
          id: number
          max_repair_cost_pct: number
          max_sav_claims_extended: number
          max_sav_claims_standard: number
          pre_check_fee_eur: number
          repair_replacement_threshold_eur: number
          repair_threshold_extended_eur: number
          updated_at: string
          updated_by: string | null
          warranty_duration_years: number
          warranty_extended_years: number
          warranty_max_hours: number
          warranty_standard_years: number
        }
        Insert: {
          extended_covers_precheck?: boolean
          extended_covers_repair?: boolean
          extended_covers_replacement?: boolean
          extended_covers_school_workshop_shipping?: boolean
          id?: number
          max_repair_cost_pct?: number
          max_sav_claims_extended?: number
          max_sav_claims_standard?: number
          pre_check_fee_eur?: number
          repair_replacement_threshold_eur?: number
          repair_threshold_extended_eur?: number
          updated_at?: string
          updated_by?: string | null
          warranty_duration_years?: number
          warranty_extended_years?: number
          warranty_max_hours?: number
          warranty_standard_years?: number
        }
        Update: {
          extended_covers_precheck?: boolean
          extended_covers_repair?: boolean
          extended_covers_replacement?: boolean
          extended_covers_school_workshop_shipping?: boolean
          id?: number
          max_repair_cost_pct?: number
          max_sav_claims_extended?: number
          max_sav_claims_standard?: number
          pre_check_fee_eur?: number
          repair_replacement_threshold_eur?: number
          repair_threshold_extended_eur?: number
          updated_at?: string
          updated_by?: string | null
          warranty_duration_years?: number
          warranty_extended_years?: number
          warranty_max_hours?: number
          warranty_standard_years?: number
        }
        Relationships: []
      }
      product_documents: {
        Row: {
          created_at: string
          description: string | null
          description_i18n: Json
          display_order: number
          doc_type: string
          file_name: string
          file_size: number
          id: string
          is_public: boolean
          language: string | null
          mime_type: string
          product_id: string
          product_type: string
          published_at: string | null
          storage_path: string
          title: string
          title_i18n: Json
          updated_at: string
          version: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          description_i18n?: Json
          display_order?: number
          doc_type: string
          file_name: string
          file_size?: number
          id?: string
          is_public?: boolean
          language?: string | null
          mime_type?: string
          product_id: string
          product_type: string
          published_at?: string | null
          storage_path: string
          title: string
          title_i18n?: Json
          updated_at?: string
          version?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          description_i18n?: Json
          display_order?: number
          doc_type?: string
          file_name?: string
          file_size?: number
          id?: string
          is_public?: boolean
          language?: string | null
          mime_type?: string
          product_id?: string
          product_type?: string
          published_at?: string | null
          storage_path?: string
          title?: string
          title_i18n?: Json
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      product_inventory: {
        Row: {
          active: boolean | null
          color: string | null
          created_at: string
          id: string
          price_override: number | null
          product_id: string
          product_type: string
          quantity_available: number
          quantity_minimum: number | null
          quantity_reserved: number
          size: string | null
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          id?: string
          price_override?: number | null
          product_id: string
          product_type: string
          quantity_available?: number
          quantity_minimum?: number | null
          quantity_reserved?: number
          size?: string | null
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          active?: boolean | null
          color?: string | null
          created_at?: string
          id?: string
          price_override?: number | null
          product_id?: string
          product_type?: string
          quantity_available?: number
          quantity_minimum?: number | null
          quantity_reserved?: number
          size?: string | null
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      product_shipping_specs: {
        Row: {
          active: boolean | null
          created_at: string
          fragile: boolean | null
          height_cm: number
          id: string
          insurance_required: boolean | null
          insurance_value_eur: number | null
          length_cm: number
          model: string
          packing_notes: string | null
          preferred_carrier: string | null
          preferred_service_level: string | null
          product_type: string
          requires_special_handling: boolean | null
          size: string | null
          special_instructions: string | null
          updated_at: string
          weight_kg: number
          width_cm: number
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          fragile?: boolean | null
          height_cm?: number
          id?: string
          insurance_required?: boolean | null
          insurance_value_eur?: number | null
          length_cm?: number
          model: string
          packing_notes?: string | null
          preferred_carrier?: string | null
          preferred_service_level?: string | null
          product_type: string
          requires_special_handling?: boolean | null
          size?: string | null
          special_instructions?: string | null
          updated_at?: string
          weight_kg?: number
          width_cm?: number
        }
        Update: {
          active?: boolean | null
          created_at?: string
          fragile?: boolean | null
          height_cm?: number
          id?: string
          insurance_required?: boolean | null
          insurance_value_eur?: number | null
          length_cm?: number
          model?: string
          packing_notes?: string | null
          preferred_carrier?: string | null
          preferred_service_level?: string | null
          product_type?: string
          requires_special_handling?: boolean | null
          size?: string | null
          special_instructions?: string | null
          updated_at?: string
          weight_kg?: number
          width_cm?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          available_for_demo: boolean | null
          brand: string | null
          category: Database["public"]["Enums"]["product_category"]
          certification: string | null
          condition: Database["public"]["Enums"]["product_condition"] | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          model: string | null
          name: string
          price: number | null
          size: Database["public"]["Enums"]["wing_size"] | null
          specifications: Json | null
          stock_quantity: number | null
          updated_at: string
          weight_range_max: number | null
          weight_range_min: number | null
          year: number | null
        }
        Insert: {
          available_for_demo?: boolean | null
          brand?: string | null
          category: Database["public"]["Enums"]["product_category"]
          certification?: string | null
          condition?: Database["public"]["Enums"]["product_condition"] | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          model?: string | null
          name: string
          price?: number | null
          size?: Database["public"]["Enums"]["wing_size"] | null
          specifications?: Json | null
          stock_quantity?: number | null
          updated_at?: string
          weight_range_max?: number | null
          weight_range_min?: number | null
          year?: number | null
        }
        Update: {
          available_for_demo?: boolean | null
          brand?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          certification?: string | null
          condition?: Database["public"]["Enums"]["product_condition"] | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          model?: string | null
          name?: string
          price?: number | null
          size?: Database["public"]["Enums"]["wing_size"] | null
          specifications?: Json | null
          stock_quantity?: number | null
          updated_at?: string
          weight_range_max?: number | null
          weight_range_min?: number | null
          year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          birth_date: string | null
          civil_title: string | null
          client_rating: string | null
          created_at: string
          custom_status: string | null
          custom_status_updated_at: string | null
          display_pseudo: string | null
          email: string | null
          experience_level:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name: string | null
          height: number | null
          id: string
          identity_verified: boolean | null
          identity_verified_at: string | null
          identity_verified_by: string | null
          insurance_valid: boolean | null
          language: string
          last_name: string | null
          license_number: string | null
          nationality: string | null
          newsletters_enabled: boolean | null
          phone: string | null
          pilot_license_url: string | null
          preferred_location: string | null
          profile_completion_percentage: number | null
          role: string | null
          stripe_identity_session_id: string | null
          stripe_identity_verified: boolean | null
          stripe_identity_verified_at: string | null
          terms_accepted_at: string | null
          terms_version: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          civil_title?: string | null
          client_rating?: string | null
          created_at?: string
          custom_status?: string | null
          custom_status_updated_at?: string | null
          display_pseudo?: string | null
          email?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name?: string | null
          height?: number | null
          id?: string
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          identity_verified_by?: string | null
          insurance_valid?: boolean | null
          language?: string
          last_name?: string | null
          license_number?: string | null
          nationality?: string | null
          newsletters_enabled?: boolean | null
          phone?: string | null
          pilot_license_url?: string | null
          preferred_location?: string | null
          profile_completion_percentage?: number | null
          role?: string | null
          stripe_identity_session_id?: string | null
          stripe_identity_verified?: boolean | null
          stripe_identity_verified_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          civil_title?: string | null
          client_rating?: string | null
          created_at?: string
          custom_status?: string | null
          custom_status_updated_at?: string | null
          display_pseudo?: string | null
          email?: string | null
          experience_level?:
            | Database["public"]["Enums"]["experience_level"]
            | null
          first_name?: string | null
          height?: number | null
          id?: string
          identity_verified?: boolean | null
          identity_verified_at?: string | null
          identity_verified_by?: string | null
          insurance_valid?: boolean | null
          language?: string
          last_name?: string | null
          license_number?: string | null
          nationality?: string | null
          newsletters_enabled?: boolean | null
          phone?: string | null
          pilot_license_url?: string | null
          preferred_location?: string | null
          profile_completion_percentage?: number | null
          role?: string | null
          stripe_identity_session_id?: string | null
          stripe_identity_verified?: boolean | null
          stripe_identity_verified_at?: string | null
          terms_accepted_at?: string | null
          terms_version?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_identity_verified_by_fkey"
            columns: ["identity_verified_by"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "profiles_identity_verified_by_fkey"
            columns: ["identity_verified_by"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_identity_verified_by_fkey"
            columns: ["identity_verified_by"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      proto_activity_log: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          actor_id: string | null
          created_at: string
          description: string
          id: string
          metadata: Json | null
          order_id: string | null
          project_id: string | null
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          actor_id?: string | null
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          project_id?: string | null
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          actor_id?: string | null
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          order_id?: string | null
          project_id?: string | null
        }
        Relationships: []
      }
      proto_feedback: {
        Row: {
          id: string
          items: Json
          order_code: string
          project_name: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          items?: Json
          order_code: string
          project_name: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          items?: Json
          order_code?: string
          project_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      proto_file_column_templates: {
        Row: {
          category: Database["public"]["Enums"]["file_category"]
          id: string
          is_required: boolean
          label: string
          project_type: Database["public"]["Enums"]["project_type"]
          sort_order: number
        }
        Insert: {
          category: Database["public"]["Enums"]["file_category"]
          id?: string
          is_required?: boolean
          label: string
          project_type: Database["public"]["Enums"]["project_type"]
          sort_order?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["file_category"]
          id?: string
          is_required?: boolean
          label?: string
          project_type?: Database["public"]["Enums"]["project_type"]
          sort_order?: number
        }
        Relationships: []
      }
      proto_file_downloads: {
        Row: {
          downloaded_at: string
          file_id: string
          id: string
          user_id: string
        }
        Insert: {
          downloaded_at?: string
          file_id: string
          id?: string
          user_id: string
        }
        Update: {
          downloaded_at?: string
          file_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proto_file_downloads_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "proto_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_file_downloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "proto_users"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_file_grid: {
        Row: {
          file_dates: Json
          file_note: string
          files: Json
          id: string
          order_code: string
          project_name: string
          updated_at: string
        }
        Insert: {
          file_dates?: Json
          file_note?: string
          files?: Json
          id?: string
          order_code: string
          project_name: string
          updated_at?: string
        }
        Update: {
          file_dates?: Json
          file_note?: string
          files?: Json
          id?: string
          order_code?: string
          project_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      proto_file_rows: {
        Row: {
          created_at: string
          created_by: string
          id: string
          notes_detail: string | null
          notes_title: string | null
          order_id: string
          row_date: string
          row_number: number
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          notes_detail?: string | null
          notes_title?: string | null
          order_id: string
          row_date?: string
          row_number: number
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          notes_detail?: string | null
          notes_title?: string | null
          order_id?: string
          row_date?: string
          row_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "proto_file_rows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "proto_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_file_rows_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "proto_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_files: {
        Row: {
          category: Database["public"]["Enums"]["file_category"]
          color_version: number
          file_name: string
          file_row_id: string
          file_size: number | null
          file_url: string
          id: string
          inherited_from_file_id: string | null
          is_inherited: boolean
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          category: Database["public"]["Enums"]["file_category"]
          color_version?: number
          file_name: string
          file_row_id: string
          file_size?: number | null
          file_url: string
          id?: string
          inherited_from_file_id?: string | null
          is_inherited?: boolean
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          category?: Database["public"]["Enums"]["file_category"]
          color_version?: number
          file_name?: string
          file_row_id?: string
          file_size?: number | null
          file_url?: string
          id?: string
          inherited_from_file_id?: string | null
          is_inherited?: boolean
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "proto_files_file_row_id_fkey"
            columns: ["file_row_id"]
            isOneToOne: false
            referencedRelation: "proto_file_rows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_files_inherited_from_file_id_fkey"
            columns: ["inherited_from_file_id"]
            isOneToOne: false
            referencedRelation: "proto_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "proto_users"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_finishing_assignments: {
        Row: {
          created_at: string
          finishing_code: string
          finishing_name: string
          id: string
          order_code: string
          project_name: string
        }
        Insert: {
          created_at?: string
          finishing_code: string
          finishing_name: string
          id?: string
          order_code: string
          project_name: string
        }
        Update: {
          created_at?: string
          finishing_code?: string
          finishing_name?: string
          id?: string
          order_code?: string
          project_name?: string
        }
        Relationships: []
      }
      proto_finishings: {
        Row: {
          created_at: string
          file_url: string | null
          file_urls: string[] | null
          finishing_code: string
          id: string
          material_categories: string[]
          name: string
          note: string | null
          photos: string[] | null
          position_categories: string[]
          positions: number[] | null
          project_type: Database["public"]["Enums"]["project_type"]
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_url?: string | null
          file_urls?: string[] | null
          finishing_code: string
          id?: string
          material_categories?: string[]
          name: string
          note?: string | null
          photos?: string[] | null
          position_categories?: string[]
          positions?: number[] | null
          project_type: Database["public"]["Enums"]["project_type"]
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_url?: string | null
          file_urls?: string[] | null
          finishing_code?: string
          id?: string
          material_categories?: string[]
          name?: string
          note?: string | null
          photos?: string[] | null
          position_categories?: string[]
          positions?: number[] | null
          project_type?: Database["public"]["Enums"]["project_type"]
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proto_notifications: {
        Row: {
          activity_id: string | null
          created_at: string
          id: string
          is_read: boolean
          user_id: string
        }
        Insert: {
          activity_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          user_id: string
        }
        Update: {
          activity_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proto_notifications_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "proto_activity_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "proto_users"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_order_components: {
        Row: {
          component_project_id: string
          id: string
          order_id: string
          sort_order: number
          version_label: string | null
        }
        Insert: {
          component_project_id: string
          id?: string
          order_id: string
          sort_order?: number
          version_label?: string | null
        }
        Update: {
          component_project_id?: string
          id?: string
          order_id?: string
          sort_order?: number
          version_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proto_order_components_component_project_id_fkey"
            columns: ["component_project_id"]
            isOneToOne: false
            referencedRelation: "proto_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_order_components_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "proto_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_order_fields: {
        Row: {
          assigned_bag: string | null
          assigned_handle: string | null
          assigned_riser: string | null
          cost: string | null
          id: string
          order_code: string
          prod_date: string | null
          project_name: string
          reception_date: string | null
          sent_date: string | null
          serial: string | null
          ship_date: string | null
          updated_at: string
        }
        Insert: {
          assigned_bag?: string | null
          assigned_handle?: string | null
          assigned_riser?: string | null
          cost?: string | null
          id?: string
          order_code: string
          prod_date?: string | null
          project_name: string
          reception_date?: string | null
          sent_date?: string | null
          serial?: string | null
          ship_date?: string | null
          updated_at?: string
        }
        Update: {
          assigned_bag?: string | null
          assigned_handle?: string | null
          assigned_riser?: string | null
          cost?: string | null
          id?: string
          order_code?: string
          prod_date?: string | null
          project_name?: string
          reception_date?: string | null
          sent_date?: string | null
          serial?: string | null
          ship_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proto_order_finishings: {
        Row: {
          created_at: string
          finishing_id: string
          id: string
          notes: string | null
          order_id: string
          position: number
        }
        Insert: {
          created_at?: string
          finishing_id: string
          id?: string
          notes?: string | null
          order_id: string
          position: number
        }
        Update: {
          created_at?: string
          finishing_id?: string
          id?: string
          notes?: string | null
          order_id?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "proto_order_finishings_finishing_id_fkey"
            columns: ["finishing_id"]
            isOneToOne: false
            referencedRelation: "proto_finishings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_order_finishings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "proto_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_order_returns: {
        Row: {
          corrective_action: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          order_id: string
          severity: Database["public"]["Enums"]["return_severity"]
          sort_order: number
          source_order_id: string | null
          source_qc_item_id: string | null
          status: Database["public"]["Enums"]["return_status"]
          title: string
          updated_at: string
        }
        Insert: {
          corrective_action?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          order_id: string
          severity?: Database["public"]["Enums"]["return_severity"]
          sort_order?: number
          source_order_id?: string | null
          source_qc_item_id?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          title: string
          updated_at?: string
        }
        Update: {
          corrective_action?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          order_id?: string
          severity?: Database["public"]["Enums"]["return_severity"]
          sort_order?: number
          source_order_id?: string | null
          source_qc_item_id?: string | null
          status?: Database["public"]["Enums"]["return_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proto_order_returns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "proto_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_order_returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "proto_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_order_returns_source_order_id_fkey"
            columns: ["source_order_id"]
            isOneToOne: false
            referencedRelation: "proto_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_order_returns_source_qc_item_id_fkey"
            columns: ["source_qc_item_id"]
            isOneToOne: false
            referencedRelation: "proto_qc_items"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_order_status_overrides: {
        Row: {
          created_at: string
          id: string
          order_code: string
          project_name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_code: string
          project_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          order_code?: string
          project_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      proto_orders: {
        Row: {
          cost: number | null
          cost_currency: string
          created_at: string
          created_by: string
          id: string
          is_locked: boolean
          locked_at: string | null
          order_number: number
          planned_proto_date: string | null
          project_id: string
          proto_label: string
          reception_date: string | null
          sent_date: string | null
          serial_number: string | null
          shipping_date: string | null
          status: Database["public"]["Enums"]["order_status"]
          updated_at: string
        }
        Insert: {
          cost?: number | null
          cost_currency?: string
          created_at?: string
          created_by: string
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          order_number?: number
          planned_proto_date?: string | null
          project_id: string
          proto_label: string
          reception_date?: string | null
          sent_date?: string | null
          serial_number?: string | null
          shipping_date?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Update: {
          cost?: number | null
          cost_currency?: string
          created_at?: string
          created_by?: string
          id?: string
          is_locked?: boolean
          locked_at?: string | null
          order_number?: number
          planned_proto_date?: string | null
          project_id?: string
          proto_label?: string
          reception_date?: string | null
          sent_date?: string | null
          serial_number?: string | null
          shipping_date?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proto_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "proto_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "proto_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_project_links: {
        Row: {
          created_at: string
          id: string
          linked_project_id: string
          wing_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_project_id: string
          wing_id: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_project_id?: string
          wing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proto_project_links_linked_project_id_fkey"
            columns: ["linked_project_id"]
            isOneToOne: false
            referencedRelation: "proto_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_project_links_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "proto_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_project_orders: {
        Row: {
          created_at: string
          order_code: string
          project_name: string
          proto_label: string
          sort_index: number
        }
        Insert: {
          created_at?: string
          order_code: string
          project_name: string
          proto_label: string
          sort_index?: number
        }
        Update: {
          created_at?: string
          order_code?: string
          project_name?: string
          proto_label?: string
          sort_index?: number
        }
        Relationships: []
      }
      proto_projects: {
        Row: {
          certification: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          subtype: string | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at: string
          weight_class: string | null
        }
        Insert: {
          certification?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          subtype?: string | null
          type: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          weight_class?: string | null
        }
        Update: {
          certification?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          subtype?: string | null
          type?: Database["public"]["Enums"]["project_type"]
          updated_at?: string
          weight_class?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proto_projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "proto_users"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_qc_checklist: {
        Row: {
          id: string
          items: Json
          order_code: string
          project_name: string
          updated_at: string
        }
        Insert: {
          id?: string
          items?: Json
          order_code: string
          project_name: string
          updated_at?: string
        }
        Update: {
          id?: string
          items?: Json
          order_code?: string
          project_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      proto_qc_items: {
        Row: {
          checked_at: string | null
          checked_by: string | null
          created_at: string
          created_by: string
          description: string | null
          factory_notes: string | null
          id: string
          is_checked: boolean
          order_id: string
          plume_comment: string | null
          sort_order: number
          status: Database["public"]["Enums"]["qc_status"]
          title: string
        }
        Insert: {
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          factory_notes?: string | null
          id?: string
          is_checked?: boolean
          order_id: string
          plume_comment?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["qc_status"]
          title: string
        }
        Update: {
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          factory_notes?: string | null
          id?: string
          is_checked?: boolean
          order_id?: string
          plume_comment?: string | null
          sort_order?: number
          status?: Database["public"]["Enums"]["qc_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "proto_qc_items_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "proto_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_qc_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "proto_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_qc_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "proto_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_qc_media: {
        Row: {
          file_name: string
          file_url: string
          id: string
          media_type: Database["public"]["Enums"]["media_type"]
          qc_item_id: string
          uploaded_at: string
          uploaded_by: string
        }
        Insert: {
          file_name: string
          file_url: string
          id?: string
          media_type: Database["public"]["Enums"]["media_type"]
          qc_item_id: string
          uploaded_at?: string
          uploaded_by: string
        }
        Update: {
          file_name?: string
          file_url?: string
          id?: string
          media_type?: Database["public"]["Enums"]["media_type"]
          qc_item_id?: string
          uploaded_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "proto_qc_media_qc_item_id_fkey"
            columns: ["qc_item_id"]
            isOneToOne: false
            referencedRelation: "proto_qc_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proto_qc_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "proto_users"
            referencedColumns: ["id"]
          },
        ]
      }
      proto_users: {
        Row: {
          avatar_url: string | null
          company: Database["public"]["Enums"]["company_type"]
          created_at: string
          email: string
          id: string
          name: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          avatar_url?: string | null
          company?: Database["public"]["Enums"]["company_type"]
          created_at?: string
          email: string
          id: string
          name: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          avatar_url?: string | null
          company?: Database["public"]["Enums"]["company_type"]
          created_at?: string
          email?: string
          id?: string
          name?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      role_purchase_config: {
        Row: {
          created_at: string | null
          discount_percent: number | null
          id: string
          purchase_limit: number | null
          purchase_limit_enabled: boolean | null
          role: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number | null
          id?: string
          purchase_limit?: number | null
          purchase_limit_enabled?: boolean | null
          role: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_percent?: number | null
          id?: string
          purchase_limit?: number | null
          purchase_limit_enabled?: boolean | null
          role?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sav_analytics: {
        Row: {
          actual_cost: number | null
          closed_at: string | null
          closed_by_role: string | null
          closure_outcome: string | null
          escalated_to_workshop_at: string | null
          flight_hours_at_sav: number | null
          problem_category: string | null
          referent_school_id: string | null
          request_type: string | null
          resolution_days: number | null
          sav_claim_number: number | null
          school_acknowledged_at: string | null
          school_id: string | null
          school_response_hours: number | null
          service_type: string | null
          status: string | null
          synced_at: string
          ticket_created_at: string
          ticket_id: string
          warranty_covered_by_workshop: boolean | null
          warranty_override: boolean
          warranty_tier: string | null
          wing_age_days_at_ticket: number | null
          wing_id: string | null
          wing_model: string | null
          wing_purchase_date: string | null
          wing_received_school_at: string | null
          wing_received_workshop_at: string | null
          wing_registered_at: string | null
          wing_returned_at: string | null
          wing_serial: string | null
          wing_size: string | null
          workshop_decision: string | null
          workshop_decision_cost: number | null
          workshop_diagnosis_at: string | null
          workshop_diagnosis_hours: number | null
          workshop_id: string | null
          workshop_repair_done_at: string | null
          workshop_repair_hours: number | null
        }
        Insert: {
          actual_cost?: number | null
          closed_at?: string | null
          closed_by_role?: string | null
          closure_outcome?: string | null
          escalated_to_workshop_at?: string | null
          flight_hours_at_sav?: number | null
          problem_category?: string | null
          referent_school_id?: string | null
          request_type?: string | null
          resolution_days?: number | null
          sav_claim_number?: number | null
          school_acknowledged_at?: string | null
          school_id?: string | null
          school_response_hours?: number | null
          service_type?: string | null
          status?: string | null
          synced_at?: string
          ticket_created_at: string
          ticket_id: string
          warranty_covered_by_workshop?: boolean | null
          warranty_override?: boolean
          warranty_tier?: string | null
          wing_age_days_at_ticket?: number | null
          wing_id?: string | null
          wing_model?: string | null
          wing_purchase_date?: string | null
          wing_received_school_at?: string | null
          wing_received_workshop_at?: string | null
          wing_registered_at?: string | null
          wing_returned_at?: string | null
          wing_serial?: string | null
          wing_size?: string | null
          workshop_decision?: string | null
          workshop_decision_cost?: number | null
          workshop_diagnosis_at?: string | null
          workshop_diagnosis_hours?: number | null
          workshop_id?: string | null
          workshop_repair_done_at?: string | null
          workshop_repair_hours?: number | null
        }
        Update: {
          actual_cost?: number | null
          closed_at?: string | null
          closed_by_role?: string | null
          closure_outcome?: string | null
          escalated_to_workshop_at?: string | null
          flight_hours_at_sav?: number | null
          problem_category?: string | null
          referent_school_id?: string | null
          request_type?: string | null
          resolution_days?: number | null
          sav_claim_number?: number | null
          school_acknowledged_at?: string | null
          school_id?: string | null
          school_response_hours?: number | null
          service_type?: string | null
          status?: string | null
          synced_at?: string
          ticket_created_at?: string
          ticket_id?: string
          warranty_covered_by_workshop?: boolean | null
          warranty_override?: boolean
          warranty_tier?: string | null
          wing_age_days_at_ticket?: number | null
          wing_id?: string | null
          wing_model?: string | null
          wing_purchase_date?: string | null
          wing_received_school_at?: string | null
          wing_received_workshop_at?: string | null
          wing_registered_at?: string | null
          wing_returned_at?: string | null
          wing_serial?: string | null
          wing_size?: string | null
          workshop_decision?: string | null
          workshop_decision_cost?: number | null
          workshop_diagnosis_at?: string | null
          workshop_diagnosis_hours?: number | null
          workshop_id?: string | null
          workshop_repair_done_at?: string | null
          workshop_repair_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sav_analytics_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: true
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_interactions: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          interaction_type: string | null
          scheduled_date: string
          scheduled_time: string | null
          school_id: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          interaction_type?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          school_id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          interaction_type?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          school_id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_interactions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "contacts_paragliding_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          actual_cost: number | null
          assigned_workshop_id: string | null
          assigned_workshop_label: string | null
          auto_approved_shipping: boolean
          client_id: string | null
          client_last_read_at: string | null
          client_school_carrier: string | null
          client_school_label_url: string | null
          client_school_tracking: string | null
          client_shipping_address: Json | null
          closed_at: string | null
          closed_by: string | null
          closed_by_role: string | null
          closure_note: string | null
          closure_outcome: string | null
          completion_date: string | null
          created_at: string
          delivery_method: string | null
          description: string
          email: string
          escalated_to_workshop_at: string | null
          estimated_cost: number | null
          first_name: string
          id: string
          images: string[] | null
          is_plume_urgent: boolean | null
          last_name: string
          phone: string | null
          plume_replacement_approved: boolean | null
          plume_replacement_approved_at: string | null
          plume_replacement_decided_by: string | null
          plume_replacement_refusal_reason: string | null
          plume_shipping_approved: boolean | null
          plume_shipping_decided_at: string | null
          plume_shipping_decided_by: string | null
          plume_shipping_refusal_reason: string | null
          pre_check_completed_at: string | null
          pre_check_fee_snapshot: number | null
          pre_check_finished_at: string | null
          pre_check_observations: string | null
          pre_check_started_at: string | null
          product_brand: string | null
          product_model: string | null
          purchase_date: string | null
          referent_school_id: string | null
          request_type: string | null
          revision_report_filename: string | null
          revision_report_path: string | null
          revision_report_uploaded_at: string | null
          revision_report_uploaded_by: string | null
          sav_claim_number: number | null
          school_acknowledged_at: string | null
          school_change_reason_code: string | null
          school_change_reason_note: string | null
          school_checklist: Json | null
          school_id: string | null
          school_last_read_at: string | null
          school_resolution: string | null
          school_resolution_note: string | null
          school_resolved_at: string | null
          school_resolved_by: string | null
          school_workshop_label_url: string | null
          school_workshop_tracking: string | null
          serial_number: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          shipping_approved: boolean | null
          shipping_decided_at: string | null
          shipping_decided_by: string | null
          shipping_refusal_reason: string | null
          status: Database["public"]["Enums"]["request_status"] | null
          technician_notes: string | null
          updated_at: string
          urgency_level: number | null
          user_id: string
          warranty_expires_at: string | null
          warranty_override_at: string | null
          warranty_override_by: string | null
          warranty_override_note: string | null
          warranty_tier: string | null
          wing_received_school_at: string | null
          wing_received_workshop_at: string | null
          wing_returned_at: string | null
          workshop_accepted: boolean | null
          workshop_accepted_at: string | null
          workshop_accepted_by: string | null
          workshop_assigned_at: string | null
          workshop_assigned_by: string | null
          workshop_checklist: Json | null
          workshop_decision: string | null
          workshop_decision_at: string | null
          workshop_decision_by: string | null
          workshop_decision_cost: number | null
          workshop_decision_note: string | null
          workshop_decision_warranty_covered: boolean | null
          workshop_deep_check_at: string | null
          workshop_diagnosis_at: string | null
          workshop_last_read_at: string | null
          workshop_refusal_reason: string | null
          workshop_repair_done_at: string | null
          workshop_repair_estimated_date: string | null
          workshop_return_destination: string | null
          workshop_return_label_url: string | null
          workshop_return_tracking: string | null
          workshop_shipping_prepared_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          assigned_workshop_id?: string | null
          assigned_workshop_label?: string | null
          auto_approved_shipping?: boolean
          client_id?: string | null
          client_last_read_at?: string | null
          client_school_carrier?: string | null
          client_school_label_url?: string | null
          client_school_tracking?: string | null
          client_shipping_address?: Json | null
          closed_at?: string | null
          closed_by?: string | null
          closed_by_role?: string | null
          closure_note?: string | null
          closure_outcome?: string | null
          completion_date?: string | null
          created_at?: string
          delivery_method?: string | null
          description: string
          email: string
          escalated_to_workshop_at?: string | null
          estimated_cost?: number | null
          first_name: string
          id?: string
          images?: string[] | null
          is_plume_urgent?: boolean | null
          last_name: string
          phone?: string | null
          plume_replacement_approved?: boolean | null
          plume_replacement_approved_at?: string | null
          plume_replacement_decided_by?: string | null
          plume_replacement_refusal_reason?: string | null
          plume_shipping_approved?: boolean | null
          plume_shipping_decided_at?: string | null
          plume_shipping_decided_by?: string | null
          plume_shipping_refusal_reason?: string | null
          pre_check_completed_at?: string | null
          pre_check_fee_snapshot?: number | null
          pre_check_finished_at?: string | null
          pre_check_observations?: string | null
          pre_check_started_at?: string | null
          product_brand?: string | null
          product_model?: string | null
          purchase_date?: string | null
          referent_school_id?: string | null
          request_type?: string | null
          revision_report_filename?: string | null
          revision_report_path?: string | null
          revision_report_uploaded_at?: string | null
          revision_report_uploaded_by?: string | null
          sav_claim_number?: number | null
          school_acknowledged_at?: string | null
          school_change_reason_code?: string | null
          school_change_reason_note?: string | null
          school_checklist?: Json | null
          school_id?: string | null
          school_last_read_at?: string | null
          school_resolution?: string | null
          school_resolution_note?: string | null
          school_resolved_at?: string | null
          school_resolved_by?: string | null
          school_workshop_label_url?: string | null
          school_workshop_tracking?: string | null
          serial_number?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          shipping_approved?: boolean | null
          shipping_decided_at?: string | null
          shipping_decided_by?: string | null
          shipping_refusal_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          technician_notes?: string | null
          updated_at?: string
          urgency_level?: number | null
          user_id: string
          warranty_expires_at?: string | null
          warranty_override_at?: string | null
          warranty_override_by?: string | null
          warranty_override_note?: string | null
          warranty_tier?: string | null
          wing_received_school_at?: string | null
          wing_received_workshop_at?: string | null
          wing_returned_at?: string | null
          workshop_accepted?: boolean | null
          workshop_accepted_at?: string | null
          workshop_accepted_by?: string | null
          workshop_assigned_at?: string | null
          workshop_assigned_by?: string | null
          workshop_checklist?: Json | null
          workshop_decision?: string | null
          workshop_decision_at?: string | null
          workshop_decision_by?: string | null
          workshop_decision_cost?: number | null
          workshop_decision_note?: string | null
          workshop_decision_warranty_covered?: boolean | null
          workshop_deep_check_at?: string | null
          workshop_diagnosis_at?: string | null
          workshop_last_read_at?: string | null
          workshop_refusal_reason?: string | null
          workshop_repair_done_at?: string | null
          workshop_repair_estimated_date?: string | null
          workshop_return_destination?: string | null
          workshop_return_label_url?: string | null
          workshop_return_tracking?: string | null
          workshop_shipping_prepared_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          assigned_workshop_id?: string | null
          assigned_workshop_label?: string | null
          auto_approved_shipping?: boolean
          client_id?: string | null
          client_last_read_at?: string | null
          client_school_carrier?: string | null
          client_school_label_url?: string | null
          client_school_tracking?: string | null
          client_shipping_address?: Json | null
          closed_at?: string | null
          closed_by?: string | null
          closed_by_role?: string | null
          closure_note?: string | null
          closure_outcome?: string | null
          completion_date?: string | null
          created_at?: string
          delivery_method?: string | null
          description?: string
          email?: string
          escalated_to_workshop_at?: string | null
          estimated_cost?: number | null
          first_name?: string
          id?: string
          images?: string[] | null
          is_plume_urgent?: boolean | null
          last_name?: string
          phone?: string | null
          plume_replacement_approved?: boolean | null
          plume_replacement_approved_at?: string | null
          plume_replacement_decided_by?: string | null
          plume_replacement_refusal_reason?: string | null
          plume_shipping_approved?: boolean | null
          plume_shipping_decided_at?: string | null
          plume_shipping_decided_by?: string | null
          plume_shipping_refusal_reason?: string | null
          pre_check_completed_at?: string | null
          pre_check_fee_snapshot?: number | null
          pre_check_finished_at?: string | null
          pre_check_observations?: string | null
          pre_check_started_at?: string | null
          product_brand?: string | null
          product_model?: string | null
          purchase_date?: string | null
          referent_school_id?: string | null
          request_type?: string | null
          revision_report_filename?: string | null
          revision_report_path?: string | null
          revision_report_uploaded_at?: string | null
          revision_report_uploaded_by?: string | null
          sav_claim_number?: number | null
          school_acknowledged_at?: string | null
          school_change_reason_code?: string | null
          school_change_reason_note?: string | null
          school_checklist?: Json | null
          school_id?: string | null
          school_last_read_at?: string | null
          school_resolution?: string | null
          school_resolution_note?: string | null
          school_resolved_at?: string | null
          school_resolved_by?: string | null
          school_workshop_label_url?: string | null
          school_workshop_tracking?: string | null
          serial_number?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          shipping_approved?: boolean | null
          shipping_decided_at?: string | null
          shipping_decided_by?: string | null
          shipping_refusal_reason?: string | null
          status?: Database["public"]["Enums"]["request_status"] | null
          technician_notes?: string | null
          updated_at?: string
          urgency_level?: number | null
          user_id?: string
          warranty_expires_at?: string | null
          warranty_override_at?: string | null
          warranty_override_by?: string | null
          warranty_override_note?: string | null
          warranty_tier?: string | null
          wing_received_school_at?: string | null
          wing_received_workshop_at?: string | null
          wing_returned_at?: string | null
          workshop_accepted?: boolean | null
          workshop_accepted_at?: string | null
          workshop_accepted_by?: string | null
          workshop_assigned_at?: string | null
          workshop_assigned_by?: string | null
          workshop_checklist?: Json | null
          workshop_decision?: string | null
          workshop_decision_at?: string | null
          workshop_decision_by?: string | null
          workshop_decision_cost?: number | null
          workshop_decision_note?: string | null
          workshop_decision_warranty_covered?: boolean | null
          workshop_deep_check_at?: string | null
          workshop_diagnosis_at?: string | null
          workshop_last_read_at?: string | null
          workshop_refusal_reason?: string | null
          workshop_repair_done_at?: string | null
          workshop_repair_estimated_date?: string | null
          workshop_return_destination?: string | null
          workshop_return_label_url?: string | null
          workshop_return_tracking?: string | null
          workshop_shipping_prepared_at?: string | null
        }
        Relationships: []
      }
      shipping_config: {
        Row: {
          active: boolean | null
          auto_generate_return_label: boolean | null
          created_at: string
          default_carrier: string | null
          default_service_level: string | null
          enable_admin_alerts: boolean | null
          enable_partner_notifications: boolean | null
          enable_tracking_emails: boolean | null
          id: string
          reminder_days_before_return: number | null
          shipping_lead_days: number | null
          test_mode: boolean | null
          updated_at: string
          warehouse_address: string | null
          warehouse_city: string | null
          warehouse_country: string | null
          warehouse_email: string | null
          warehouse_name: string | null
          warehouse_phone: string | null
          warehouse_postal_code: string | null
        }
        Insert: {
          active?: boolean | null
          auto_generate_return_label?: boolean | null
          created_at?: string
          default_carrier?: string | null
          default_service_level?: string | null
          enable_admin_alerts?: boolean | null
          enable_partner_notifications?: boolean | null
          enable_tracking_emails?: boolean | null
          id?: string
          reminder_days_before_return?: number | null
          shipping_lead_days?: number | null
          test_mode?: boolean | null
          updated_at?: string
          warehouse_address?: string | null
          warehouse_city?: string | null
          warehouse_country?: string | null
          warehouse_email?: string | null
          warehouse_name?: string | null
          warehouse_phone?: string | null
          warehouse_postal_code?: string | null
        }
        Update: {
          active?: boolean | null
          auto_generate_return_label?: boolean | null
          created_at?: string
          default_carrier?: string | null
          default_service_level?: string | null
          enable_admin_alerts?: boolean | null
          enable_partner_notifications?: boolean | null
          enable_tracking_emails?: boolean | null
          id?: string
          reminder_days_before_return?: number | null
          shipping_lead_days?: number | null
          test_mode?: boolean | null
          updated_at?: string
          warehouse_address?: string | null
          warehouse_city?: string | null
          warehouse_country?: string | null
          warehouse_email?: string | null
          warehouse_name?: string | null
          warehouse_phone?: string | null
          warehouse_postal_code?: string | null
        }
        Relationships: []
      }
      shipping_documents: {
        Row: {
          booking_id: string | null
          carrier: string | null
          created_at: string | null
          document_type: string
          document_url: string | null
          file_url: string | null
          id: string
          status: string | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id?: string | null
          carrier?: string | null
          created_at?: string | null
          document_type: string
          document_url?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string | null
          carrier?: string | null
          created_at?: string | null
          document_type?: string
          document_url?: string | null
          file_url?: string | null
          id?: string
          status?: string | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_documents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_events: {
        Row: {
          booking_id: string | null
          carrier: string | null
          created_at: string | null
          event_id: string
          event_type: string
          id: string
          parcel_id: number | null
          processed: boolean | null
          processed_at: string | null
          raw_payload: Json
          status: string | null
          status_message: string | null
          timestamp: string
          tracking_number: string | null
          wing_inventory_id: string | null
        }
        Insert: {
          booking_id?: string | null
          carrier?: string | null
          created_at?: string | null
          event_id: string
          event_type: string
          id?: string
          parcel_id?: number | null
          processed?: boolean | null
          processed_at?: string | null
          raw_payload: Json
          status?: string | null
          status_message?: string | null
          timestamp: string
          tracking_number?: string | null
          wing_inventory_id?: string | null
        }
        Update: {
          booking_id?: string | null
          carrier?: string | null
          created_at?: string | null
          event_id?: string
          event_type?: string
          id?: string
          parcel_id?: number | null
          processed?: boolean | null
          processed_at?: string | null
          raw_payload?: Json
          status?: string | null
          status_message?: string | null
          timestamp?: string
          tracking_number?: string | null
          wing_inventory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_events_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_events_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_events_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_invoices: {
        Row: {
          amount_ht: number
          amount_ttc: number
          amount_tva: number
          booking_id: string
          created_at: string
          customer_address: string | null
          customer_name: string | null
          id: string
          invoice_html: string
          invoice_number: string
          wing_model: string | null
          wing_size: string | null
        }
        Insert: {
          amount_ht?: number
          amount_ttc?: number
          amount_tva?: number
          booking_id: string
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          id?: string
          invoice_html: string
          invoice_number: string
          wing_model?: string | null
          wing_size?: string | null
        }
        Update: {
          amount_ht?: number
          amount_ttc?: number
          amount_tva?: number
          booking_id?: string
          created_at?: string
          customer_address?: string | null
          customer_name?: string | null
          id?: string
          invoice_html?: string
          invoice_number?: string
          wing_model?: string | null
          wing_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_invoices_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_label_queue: {
        Row: {
          attempts: number | null
          booking_id: string
          created_at: string
          error: string | null
          id: string
          processed_at: string | null
          shipment_type: string
          status: string | null
        }
        Insert: {
          attempts?: number | null
          booking_id: string
          created_at?: string
          error?: string | null
          id?: string
          processed_at?: string | null
          shipment_type?: string
          status?: string | null
        }
        Update: {
          attempts?: number | null
          booking_id?: string
          created_at?: string
          error?: string | null
          id?: string
          processed_at?: string | null
          shipment_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_label_queue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_label_queue_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          country_codes: string[]
          created_at: string | null
          express_label: string | null
          express_label_i18n: Json | null
          express_price: number | null
          free_shipping_threshold: number | null
          id: string
          is_active: boolean | null
          max_free_weight_kg: number | null
          sort_order: number | null
          standard_label: string | null
          standard_label_i18n: Json | null
          standard_price: number | null
          updated_at: string | null
          zone_label: string
          zone_label_i18n: Json | null
          zone_name: string
        }
        Insert: {
          country_codes?: string[]
          created_at?: string | null
          express_label?: string | null
          express_label_i18n?: Json | null
          express_price?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          max_free_weight_kg?: number | null
          sort_order?: number | null
          standard_label?: string | null
          standard_label_i18n?: Json | null
          standard_price?: number | null
          updated_at?: string | null
          zone_label: string
          zone_label_i18n?: Json | null
          zone_name: string
        }
        Update: {
          country_codes?: string[]
          created_at?: string | null
          express_label?: string | null
          express_label_i18n?: Json | null
          express_price?: number | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          max_free_weight_kg?: number | null
          sort_order?: number | null
          standard_label?: string | null
          standard_label_i18n?: Json | null
          standard_price?: number | null
          updated_at?: string | null
          zone_label?: string
          zone_label_i18n?: Json | null
          zone_name?: string
        }
        Relationships: []
      }
      shop_orders: {
        Row: {
          billing_address: Json | null
          booking_id: string | null
          bridge_end_to_end_id: string | null
          bridge_payment_link_id: string | null
          bridge_payment_url: string | null
          commission_amount: number | null
          commission_rate: number | null
          conversation_id: string | null
          country_code: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          customer_vat_number: string | null
          delivered_at: string | null
          discount_amount: number | null
          discount_percent: number | null
          gls_track_id: string | null
          has_pilot_license: boolean | null
          id: string
          invoice_id: string | null
          invoice_number: string | null
          invoice_pdf_url: string | null
          invoice_sent_at: string | null
          is_b2b: boolean | null
          is_monitor_order: boolean | null
          items: Json
          metadata: Json | null
          offer_id: string | null
          order_note: string | null
          order_number: string
          order_type: string
          paid_at: string | null
          partner_viewed_at: string | null
          payment_method: string | null
          payment_status: string | null
          referent_id: string | null
          referent_name: string | null
          rejection_reason: string | null
          requires_partner_validation: boolean | null
          serial_numbers: string[] | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_cost: number
          shipping_option: string | null
          shippo_label_url: string | null
          shippo_rate_id: string | null
          shippo_shipment_id: string | null
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal: number
          subtotal_ht: number | null
          total_amount: number
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          user_id: string | null
          validated_at: string | null
          validated_by: string | null
          vat_amount: number | null
          vat_exemption_reason: string | null
          vat_rate: number | null
          warehouse_id: string | null
          wing_inventory_id: string | null
          wing_serial_number: string | null
        }
        Insert: {
          billing_address?: Json | null
          booking_id?: string | null
          bridge_end_to_end_id?: string | null
          bridge_payment_link_id?: string | null
          bridge_payment_url?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          conversation_id?: string | null
          country_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_vat_number?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          gls_track_id?: string | null
          has_pilot_license?: boolean | null
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          invoice_sent_at?: string | null
          is_b2b?: boolean | null
          is_monitor_order?: boolean | null
          items?: Json
          metadata?: Json | null
          offer_id?: string | null
          order_note?: string | null
          order_number: string
          order_type?: string
          paid_at?: string | null
          partner_viewed_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          referent_id?: string | null
          referent_name?: string | null
          rejection_reason?: string | null
          requires_partner_validation?: boolean | null
          serial_numbers?: string[] | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          shipping_option?: string | null
          shippo_label_url?: string | null
          shippo_rate_id?: string | null
          shippo_shipment_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number
          subtotal_ht?: number | null
          total_amount?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
          vat_amount?: number | null
          vat_exemption_reason?: string | null
          vat_rate?: number | null
          warehouse_id?: string | null
          wing_inventory_id?: string | null
          wing_serial_number?: string | null
        }
        Update: {
          billing_address?: Json | null
          booking_id?: string | null
          bridge_end_to_end_id?: string | null
          bridge_payment_link_id?: string | null
          bridge_payment_url?: string | null
          commission_amount?: number | null
          commission_rate?: number | null
          conversation_id?: string | null
          country_code?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          customer_vat_number?: string | null
          delivered_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          gls_track_id?: string | null
          has_pilot_license?: boolean | null
          id?: string
          invoice_id?: string | null
          invoice_number?: string | null
          invoice_pdf_url?: string | null
          invoice_sent_at?: string | null
          is_b2b?: boolean | null
          is_monitor_order?: boolean | null
          items?: Json
          metadata?: Json | null
          offer_id?: string | null
          order_note?: string | null
          order_number?: string
          order_type?: string
          paid_at?: string | null
          partner_viewed_at?: string | null
          payment_method?: string | null
          payment_status?: string | null
          referent_id?: string | null
          referent_name?: string | null
          rejection_reason?: string | null
          requires_partner_validation?: boolean | null
          serial_numbers?: string[] | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_cost?: number
          shipping_option?: string | null
          shippo_label_url?: string | null
          shippo_rate_id?: string | null
          shippo_shipment_id?: string | null
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal?: number
          subtotal_ht?: number | null
          total_amount?: number
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          user_id?: string | null
          validated_at?: string | null
          validated_by?: string | null
          vat_amount?: number | null
          vat_exemption_reason?: string | null
          vat_rate?: number | null
          warehouse_id?: string | null
          wing_inventory_id?: string | null
          wing_serial_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shop_orders_referent_id_fkey"
            columns: ["referent_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "shop_orders_referent_id_fkey"
            columns: ["referent_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_orders_referent_id_fkey"
            columns: ["referent_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      site_config: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      stripe_sync_log: {
        Row: {
          created_at: string | null
          error_details: Json | null
          errors_count: number | null
          id: string
          records_synced: number | null
          status: string
          sync_duration_ms: number | null
          sync_type: string
          synced_by: string | null
        }
        Insert: {
          created_at?: string | null
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          records_synced?: number | null
          status: string
          sync_duration_ms?: number | null
          sync_type: string
          synced_by?: string | null
        }
        Update: {
          created_at?: string | null
          error_details?: Json | null
          errors_count?: number | null
          id?: string
          records_synced?: number | null
          status?: string
          sync_duration_ms?: number | null
          sync_type?: string
          synced_by?: string | null
        }
        Relationships: []
      }
      test_wings_automation_config: {
        Row: {
          active: boolean
          created_at: string
          enable_auto_next_tester: boolean
          enable_inspection_system: boolean | null
          id: string
          inspection_pre_shipment_window_hours: number | null
          inspection_reception_window_hours: number | null
          missing_delivery_alert_days: number | null
          next_tester_buffer_days: number
          overdue_notification_days_after_end: number
          overdue_urgent_reminder_days: number
          purchase_offer_days_after_delivery: number
          purchase_offer_valid_days: number
          require_pre_shipment_photos: boolean | null
          return_label_generation_days_before_end: number
          return_reminder_days_before_end: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          enable_auto_next_tester?: boolean
          enable_inspection_system?: boolean | null
          id?: string
          inspection_pre_shipment_window_hours?: number | null
          inspection_reception_window_hours?: number | null
          missing_delivery_alert_days?: number | null
          next_tester_buffer_days?: number
          overdue_notification_days_after_end?: number
          overdue_urgent_reminder_days?: number
          purchase_offer_days_after_delivery?: number
          purchase_offer_valid_days?: number
          require_pre_shipment_photos?: boolean | null
          return_label_generation_days_before_end?: number
          return_reminder_days_before_end?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          enable_auto_next_tester?: boolean
          enable_inspection_system?: boolean | null
          id?: string
          inspection_pre_shipment_window_hours?: number | null
          inspection_reception_window_hours?: number | null
          missing_delivery_alert_days?: number | null
          next_tester_buffer_days?: number
          overdue_notification_days_after_end?: number
          overdue_urgent_reminder_days?: number
          purchase_offer_days_after_delivery?: number
          purchase_offer_valid_days?: number
          require_pre_shipment_photos?: boolean | null
          return_label_generation_days_before_end?: number
          return_reminder_days_before_end?: number
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          attachment_paths: string[] | null
          channel: Database["public"]["Enums"]["message_channel"] | null
          content: string
          created_at: string
          id: string
          is_internal: boolean
          sender_id: string
          sender_role: string
          ticket_id: string
          visibility_level: string
        }
        Insert: {
          attachment_paths?: string[] | null
          channel?: Database["public"]["Enums"]["message_channel"] | null
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean
          sender_id: string
          sender_role: string
          ticket_id: string
          visibility_level?: string
        }
        Update: {
          attachment_paths?: string[] | null
          channel?: Database["public"]["Enums"]["message_channel"] | null
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean
          sender_id?: string
          sender_role?: string
          ticket_id?: string
          visibility_level?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_photos: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          photo_type: string | null
          sort_order: number
          storage_path: string
          ticket_id: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_type?: string | null
          sort_order?: number
          storage_path: string
          ticket_id: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          photo_type?: string | null
          sort_order?: number
          storage_path?: string
          ticket_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_photos_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          id: string
          new_status: string
          note: string | null
          old_status: string | null
          ticket_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status: string
          note?: string | null
          old_status?: string | null
          ticket_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          id?: string
          new_status?: string
          note?: string | null
          old_status?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          current_page: string | null
          is_online: boolean | null
          last_seen: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_page?: string | null
          is_online?: boolean | null
          last_seen?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_page?: string | null
          is_online?: boolean | null
          last_seen?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          address_name: string
          address_type: string | null
          city: string
          company: string | null
          country: string
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_default: boolean | null
          is_default_billing: boolean | null
          is_default_shipping: boolean | null
          last_name: string | null
          phone: string | null
          postal_code: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          address_name: string
          address_type?: string | null
          city: string
          company?: string | null
          country?: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_default?: boolean | null
          is_default_billing?: boolean | null
          is_default_shipping?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          address_name?: string
          address_type?: string | null
          city?: string
          company?: string | null
          country?: string
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_default?: boolean | null
          is_default_billing?: boolean | null
          is_default_shipping?: boolean | null
          last_name?: string | null
          phone?: string | null
          postal_code?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          created_at: string | null
          document_name: string
          document_type: string
          expires_at: string | null
          file_name: string | null
          file_url: string
          id: string
          mime_type: string | null
          notes: string | null
          updated_at: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          document_name: string
          document_type: string
          expires_at?: string | null
          file_name?: string | null
          file_url: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          document_name?: string
          document_type?: string
          expires_at?: string | null
          file_name?: string | null
          file_url?: string
          id?: string
          mime_type?: string | null
          notes?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          created_at: string | null
          crm_school_id: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          message: string | null
          partner_type: string | null
          role: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          crm_school_id?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          message?: string | null
          partner_type?: string | null
          role: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          crm_school_id?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          message?: string | null
          partner_type?: string | null
          role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_crm_school_id_fkey"
            columns: ["crm_school_id"]
            isOneToOne: false
            referencedRelation: "contacts_paragliding_schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_partner_notes: {
        Row: {
          created_at: string | null
          created_by_user_id: string | null
          id: string
          is_visible_to_all_partners: boolean | null
          note_content: string
          note_type: string
          partner_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          is_visible_to_all_partners?: boolean | null
          note_content: string
          note_type?: string
          partner_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by_user_id?: string | null
          id?: string
          is_visible_to_all_partners?: boolean | null
          note_content?: string
          note_type?: string
          partner_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_partner_notes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "user_partner_notes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_partner_notes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          billing_address: Json | null
          created_at: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          shipping_address: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          shipping_address?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          shipping_address?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_verifications: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          revoked_at: string | null
          revoked_reason: string | null
          stripe_document_country: string | null
          stripe_document_type: string | null
          stripe_document_verified: boolean | null
          stripe_id_number_verified: boolean | null
          stripe_selfie_verified: boolean | null
          stripe_verification_last_error: string | null
          stripe_verification_report: Json | null
          stripe_verification_session_id: string | null
          stripe_verification_status: string | null
          stripe_verified_at: string | null
          updated_at: string | null
          user_id: string
          verification_status: string
          verification_type: string
          verified_at: string | null
          verified_by_partner_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          stripe_document_country?: string | null
          stripe_document_type?: string | null
          stripe_document_verified?: boolean | null
          stripe_id_number_verified?: boolean | null
          stripe_selfie_verified?: boolean | null
          stripe_verification_last_error?: string | null
          stripe_verification_report?: Json | null
          stripe_verification_session_id?: string | null
          stripe_verification_status?: string | null
          stripe_verified_at?: string | null
          updated_at?: string | null
          user_id: string
          verification_status?: string
          verification_type?: string
          verified_at?: string | null
          verified_by_partner_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          revoked_at?: string | null
          revoked_reason?: string | null
          stripe_document_country?: string | null
          stripe_document_type?: string | null
          stripe_document_verified?: boolean | null
          stripe_id_number_verified?: boolean | null
          stripe_selfie_verified?: boolean | null
          stripe_verification_last_error?: string | null
          stripe_verification_report?: Json | null
          stripe_verification_session_id?: string | null
          stripe_verification_status?: string | null
          stripe_verified_at?: string | null
          updated_at?: string | null
          user_id?: string
          verification_status?: string
          verification_type?: string
          verified_at?: string | null
          verified_by_partner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_verifications_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "user_verifications_verified_by_partner_id_fkey"
            columns: ["verified_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "user_verifications_verified_by_partner_id_fkey"
            columns: ["verified_by_partner_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_verifications_verified_by_partner_id_fkey"
            columns: ["verified_by_partner_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      vat_rates: {
        Row: {
          active: boolean | null
          country_code: string
          country_name: string
          created_at: string | null
          id: string
          is_eu: boolean | null
          reduced_rate: number | null
          standard_rate: number
          super_reduced_rate: number | null
        }
        Insert: {
          active?: boolean | null
          country_code: string
          country_name: string
          created_at?: string | null
          id?: string
          is_eu?: boolean | null
          reduced_rate?: number | null
          standard_rate: number
          super_reduced_rate?: number | null
        }
        Update: {
          active?: boolean | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          id?: string
          is_eu?: boolean | null
          reduced_rate?: number | null
          standard_rate?: number
          super_reduced_rate?: number | null
        }
        Relationships: []
      }
      wallet_config: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          active: boolean | null
          address_line1: string
          address_line2: string | null
          city: string
          code: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          country: string
          country_code: string
          created_at: string
          id: string
          is_default: boolean | null
          lat: number | null
          lng: number | null
          name: string
          postal_code: string
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          address_line1: string
          address_line2?: string | null
          city: string
          code: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          country_code?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          postal_code: string
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          address_line1?: string
          address_line2?: string | null
          city?: string
          code?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          country?: string
          country_code?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          postal_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      wing_configurations: {
        Row: {
          accessibility_label: string | null
          accessibility_label_i18n: Json | null
          accessibility_level: number
          color: string | null
          created_at: string | null
          description: string | null
          description_i18n: Json | null
          display_order: number | null
          homologation: string
          id: string
          is_active: boolean | null
          is_teasing: boolean | null
          name: string
          name_i18n: Json | null
          performance: number
          product_url: string | null
          updated_at: string | null
          weight: number
        }
        Insert: {
          accessibility_label?: string | null
          accessibility_label_i18n?: Json | null
          accessibility_level: number
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_i18n?: Json | null
          display_order?: number | null
          homologation: string
          id: string
          is_active?: boolean | null
          is_teasing?: boolean | null
          name: string
          name_i18n?: Json | null
          performance: number
          product_url?: string | null
          updated_at?: string | null
          weight: number
        }
        Update: {
          accessibility_label?: string | null
          accessibility_label_i18n?: Json | null
          accessibility_level?: number
          color?: string | null
          created_at?: string | null
          description?: string | null
          description_i18n?: Json | null
          display_order?: number | null
          homologation?: string
          id?: string
          is_active?: boolean | null
          is_teasing?: boolean | null
          name?: string
          name_i18n?: Json | null
          performance?: number
          product_url?: string | null
          updated_at?: string | null
          weight?: number
        }
        Relationships: []
      }
      wing_control_reports: {
        Row: {
          company_name: string
          control_date: string
          created_at: string | null
          created_by: string | null
          id: string
          notes: string | null
          report_file_name: string | null
          report_file_path: string | null
          updated_at: string | null
          wing_inventory_id: string
        }
        Insert: {
          company_name: string
          control_date: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          report_file_name?: string | null
          report_file_path?: string | null
          updated_at?: string | null
          wing_inventory_id: string
        }
        Update: {
          company_name?: string
          control_date?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          notes?: string | null
          report_file_name?: string | null
          report_file_path?: string | null
          updated_at?: string | null
          wing_inventory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_control_reports_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_control_reports_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_fabric_consumption: {
        Row: {
          area_m2: number
          fabric_type: string
          id: string
          notes: string | null
          size_label: string
          wing_product_id: string
          zone_key: string
        }
        Insert: {
          area_m2: number
          fabric_type: string
          id?: string
          notes?: string | null
          size_label: string
          wing_product_id: string
          zone_key: string
        }
        Update: {
          area_m2?: number
          fabric_type?: string
          id?: string
          notes?: string | null
          size_label?: string
          wing_product_id?: string
          zone_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_fabric_consumption_wing_product_id_fkey"
            columns: ["wing_product_id"]
            isOneToOne: false
            referencedRelation: "wing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_inspections: {
        Row: {
          available_from: string
          available_until: string
          booking_id: string
          created_at: string
          id: string
          incident_detected: boolean
          incident_id: string | null
          inspection_type: string
          inspector_type: string
          no_holes_or_tears: boolean
          no_lines_issues: boolean
          not_wet_or_humid: boolean
          notes: string | null
          parcel_taken_at: string | null
          partner_school_id: string | null
          return_label_sent_at: string | null
          status: string
          submitted_at: string | null
          triggered_by_webhook_event_id: string | null
          updated_at: string
          user_id: string
          wing_inventory_id: string
        }
        Insert: {
          available_from: string
          available_until: string
          booking_id: string
          created_at?: string
          id?: string
          incident_detected?: boolean
          incident_id?: string | null
          inspection_type: string
          inspector_type: string
          no_holes_or_tears?: boolean
          no_lines_issues?: boolean
          not_wet_or_humid?: boolean
          notes?: string | null
          parcel_taken_at?: string | null
          partner_school_id?: string | null
          return_label_sent_at?: string | null
          status?: string
          submitted_at?: string | null
          triggered_by_webhook_event_id?: string | null
          updated_at?: string
          user_id: string
          wing_inventory_id: string
        }
        Update: {
          available_from?: string
          available_until?: string
          booking_id?: string
          created_at?: string
          id?: string
          incident_detected?: boolean
          incident_id?: string | null
          inspection_type?: string
          inspector_type?: string
          no_holes_or_tears?: boolean
          no_lines_issues?: boolean
          not_wet_or_humid?: boolean
          notes?: string | null
          parcel_taken_at?: string | null
          partner_school_id?: string | null
          return_label_sent_at?: string | null
          status?: string
          submitted_at?: string | null
          triggered_by_webhook_event_id?: string | null
          updated_at?: string
          user_id?: string
          wing_inventory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_wing_inspections_incident"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "inspection_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_inspections_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_inspections_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_inspections_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "wing_inspections_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_inspections_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "wing_inspections_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_inspections_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_known_defects: {
        Row: {
          active: boolean
          created_at: string
          defect_category: string
          description: string | null
          detected_in_inspection_id: string | null
          id: string
          photos: Json | null
          resolution_notes: string | null
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
          validation_notes: string | null
          wing_inventory_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          defect_category: string
          description?: string | null
          detected_in_inspection_id?: string | null
          id?: string
          photos?: Json | null
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          wing_inventory_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          defect_category?: string
          description?: string | null
          detected_in_inspection_id?: string | null
          id?: string
          photos?: Json | null
          resolution_notes?: string | null
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
          validation_notes?: string | null
          wing_inventory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_known_defects_detected_in_inspection_id_fkey"
            columns: ["detected_in_inspection_id"]
            isOneToOne: false
            referencedRelation: "wing_inspections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_known_defects_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_known_defects_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_location_tracking: {
        Row: {
          booking_id: string | null
          ended_at: string | null
          id: string
          location_details: Json | null
          location_type: string
          partner_school_id: string | null
          started_at: string | null
          wing_inventory_id: string | null
        }
        Insert: {
          booking_id?: string | null
          ended_at?: string | null
          id?: string
          location_details?: Json | null
          location_type: string
          partner_school_id?: string | null
          started_at?: string | null
          wing_inventory_id?: string | null
        }
        Update: {
          booking_id?: string | null
          ended_at?: string | null
          id?: string
          location_details?: Json | null
          location_type?: string
          partner_school_id?: string | null
          started_at?: string | null
          wing_inventory_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wing_location_tracking_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "demo_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_location_tracking_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "partner_bookings_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_location_tracking_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "wing_location_tracking_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_location_tracking_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      wing_logbook: {
        Row: {
          attachments: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          entry_type: string
          flight_hours: number | null
          id: string
          owner_user_id: string | null
          partner_school_id: string | null
          severity: string | null
          title: string
          wing_inventory_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_type: string
          flight_hours?: number | null
          id?: string
          owner_user_id?: string | null
          partner_school_id?: string | null
          severity?: string | null
          title: string
          wing_inventory_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entry_type?: string
          flight_hours?: number | null
          id?: string
          owner_user_id?: string | null
          partner_school_id?: string | null
          severity?: string | null
          title?: string
          wing_inventory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_logbook_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "wing_logbook_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_logbook_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
        ]
      }
      wing_product_colors: {
        Row: {
          color_code: string
          color_config: Json
          display_order: number
          hex_preview: string | null
          id: string
          is_active: boolean
          shop_display_name: string
          shop_display_name_i18n: Json | null
          wing_product_id: string
        }
        Insert: {
          color_code: string
          color_config?: Json
          display_order?: number
          hex_preview?: string | null
          id?: string
          is_active?: boolean
          shop_display_name: string
          shop_display_name_i18n?: Json | null
          wing_product_id: string
        }
        Update: {
          color_code?: string
          color_config?: Json
          display_order?: number
          hex_preview?: string | null
          id?: string
          is_active?: boolean
          shop_display_name?: string
          shop_display_name_i18n?: Json | null
          wing_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_product_colors_wing_product_id_fkey"
            columns: ["wing_product_id"]
            isOneToOne: false
            referencedRelation: "wing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_product_options: {
        Row: {
          description: string | null
          description_i18n: Json | null
          display_order: number
          id: string
          name: string
          name_i18n: Json | null
          option_key: string
          price_ht: number
          wing_product_id: string
        }
        Insert: {
          description?: string | null
          description_i18n?: Json | null
          display_order?: number
          id?: string
          name: string
          name_i18n?: Json | null
          option_key: string
          price_ht?: number
          wing_product_id: string
        }
        Update: {
          description?: string | null
          description_i18n?: Json | null
          display_order?: number
          id?: string
          name?: string
          name_i18n?: Json | null
          option_key?: string
          price_ht?: number
          wing_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_product_options_wing_product_id_fkey"
            columns: ["wing_product_id"]
            isOneToOne: false
            referencedRelation: "wing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_product_sizes: {
        Row: {
          display_order: number
          id: string
          ptv_max: number | null
          ptv_min: number | null
          size_label: string
          size_numeric: string | null
          surface_m2: string | null
          wing_product_id: string
        }
        Insert: {
          display_order?: number
          id?: string
          ptv_max?: number | null
          ptv_min?: number | null
          size_label: string
          size_numeric?: string | null
          surface_m2?: string | null
          wing_product_id: string
        }
        Update: {
          display_order?: number
          id?: string
          ptv_max?: number | null
          ptv_min?: number | null
          size_label?: string
          size_numeric?: string | null
          surface_m2?: string | null
          wing_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_product_sizes_wing_product_id_fkey"
            columns: ["wing_product_id"]
            isOneToOne: false
            referencedRelation: "wing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_product_skus: {
        Row: {
          color_display_name: string | null
          color_id: string | null
          futurlog_sku: string | null
          height_cm: number | null
          id: string
          is_active: boolean
          length_cm: number | null
          price_ht: number | null
          size_id: string
          weight_kg: number | null
          width_cm: number | null
          wing_product_id: string
        }
        Insert: {
          color_display_name?: string | null
          color_id?: string | null
          futurlog_sku?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean
          length_cm?: number | null
          price_ht?: number | null
          size_id: string
          weight_kg?: number | null
          width_cm?: number | null
          wing_product_id: string
        }
        Update: {
          color_display_name?: string | null
          color_id?: string | null
          futurlog_sku?: string | null
          height_cm?: number | null
          id?: string
          is_active?: boolean
          length_cm?: number | null
          price_ht?: number | null
          size_id?: string
          weight_kg?: number | null
          width_cm?: number | null
          wing_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_product_skus_color_id_fkey"
            columns: ["color_id"]
            isOneToOne: false
            referencedRelation: "wing_product_colors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_product_skus_size_id_fkey"
            columns: ["size_id"]
            isOneToOne: false
            referencedRelation: "wing_product_sizes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_product_skus_wing_product_id_fkey"
            columns: ["wing_product_id"]
            isOneToOne: false
            referencedRelation: "wing_products"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_products: {
        Row: {
          accessibility_label: string
          accessibility_label_i18n: Json | null
          accessibility_level: number
          base_price_ht: number
          chart_color: string
          chart_weight: number
          color_mode: string
          created_at: string
          custom_color_enabled: boolean
          custom_color_surcharge: number
          delivery_time: string | null
          description: string | null
          description_i18n: Json | null
          display_order: number
          homologation: string | null
          hs_code: string | null
          id: string
          is_active: boolean
          is_teasing: boolean
          model_path: string | null
          model_position: Json
          model_scale: number
          name: string
          name_i18n: Json | null
          origin_country_code: string
          performance: number
          product_page_enabled: boolean
          product_page_slug: string | null
          product_range: string | null
          serial_model_code: string
          serial_version: number
          snapshot_url: string | null
          subtitle: string | null
          subtitle_i18n: Json | null
          updated_at: string
          wing_configuration_id: string | null
          zone_fabric_mapping: Json | null
        }
        Insert: {
          accessibility_label?: string
          accessibility_label_i18n?: Json | null
          accessibility_level?: number
          base_price_ht?: number
          chart_color?: string
          chart_weight?: number
          color_mode?: string
          created_at?: string
          custom_color_enabled?: boolean
          custom_color_surcharge?: number
          delivery_time?: string | null
          description?: string | null
          description_i18n?: Json | null
          display_order?: number
          homologation?: string | null
          hs_code?: string | null
          id: string
          is_active?: boolean
          is_teasing?: boolean
          model_path?: string | null
          model_position?: Json
          model_scale?: number
          name: string
          name_i18n?: Json | null
          origin_country_code?: string
          performance?: number
          product_page_enabled?: boolean
          product_page_slug?: string | null
          product_range?: string | null
          serial_model_code?: string
          serial_version?: number
          snapshot_url?: string | null
          subtitle?: string | null
          subtitle_i18n?: Json | null
          updated_at?: string
          wing_configuration_id?: string | null
          zone_fabric_mapping?: Json | null
        }
        Update: {
          accessibility_label?: string
          accessibility_label_i18n?: Json | null
          accessibility_level?: number
          base_price_ht?: number
          chart_color?: string
          chart_weight?: number
          color_mode?: string
          created_at?: string
          custom_color_enabled?: boolean
          custom_color_surcharge?: number
          delivery_time?: string | null
          description?: string | null
          description_i18n?: Json | null
          display_order?: number
          homologation?: string | null
          hs_code?: string | null
          id?: string
          is_active?: boolean
          is_teasing?: boolean
          model_path?: string | null
          model_position?: Json
          model_scale?: number
          name?: string
          name_i18n?: Json | null
          origin_country_code?: string
          performance?: number
          product_page_enabled?: boolean
          product_page_slug?: string | null
          product_range?: string | null
          serial_model_code?: string
          serial_version?: number
          snapshot_url?: string | null
          subtitle?: string | null
          subtitle_i18n?: Json | null
          updated_at?: string
          wing_configuration_id?: string | null
          zone_fabric_mapping?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "wing_products_wing_configuration_id_fkey"
            columns: ["wing_configuration_id"]
            isOneToOne: false
            referencedRelation: "wing_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_repair_conversations: {
        Row: {
          created_at: string | null
          id: string
          partner_school_id: string | null
          status: string | null
          subject: string | null
          updated_at: string | null
          wing_inventory_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          partner_school_id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          wing_inventory_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          partner_school_id?: string | null
          status?: string | null
          subject?: string | null
          updated_at?: string | null
          wing_inventory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_repair_conversations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "wing_repair_conversations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_repair_conversations_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "wing_repair_conversations_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_repair_conversations_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_repair_messages: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          message: string
          read: boolean | null
          sender_id: string
          sender_type: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          message: string
          read?: boolean | null
          sender_id: string
          sender_type: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          message?: string
          read?: boolean | null
          sender_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_repair_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "wing_repair_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_serial_numbers: {
        Row: {
          color_config: Json | null
          color_name: string | null
          created_at: string
          futurlog_sku: string
          generated_at: string
          generated_by: string | null
          id: string
          product_label: string
          product_model: string
          registered_at: string | null
          registered_by: string | null
          serial_number: string
          size: string | null
        }
        Insert: {
          color_config?: Json | null
          color_name?: string | null
          created_at?: string
          futurlog_sku: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          product_label: string
          product_model: string
          registered_at?: string | null
          registered_by?: string | null
          serial_number: string
          size?: string | null
        }
        Update: {
          color_config?: Json | null
          color_name?: string | null
          created_at?: string
          futurlog_sku?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          product_label?: string
          product_model?: string
          registered_at?: string | null
          registered_by?: string | null
          serial_number?: string
          size?: string | null
        }
        Relationships: []
      }
      wing_sizes: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          ptv: string
          size_label: string
          surface: string
          wing_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          ptv: string
          size_label: string
          surface: string
          wing_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          ptv?: string
          size_label?: string
          surface?: string
          wing_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_sizes_wing_id_fkey"
            columns: ["wing_id"]
            isOneToOne: false
            referencedRelation: "wing_configurations"
            referencedColumns: ["id"]
          },
        ]
      }
      wing_transits: {
        Row: {
          cancelled_at: string | null
          carrier: string | null
          created_at: string | null
          created_by: string | null
          delivered_at: string | null
          delivery_method: string | null
          from_address: Json | null
          from_partner_school_id: string | null
          from_type: string
          gls_track_id: string | null
          id: string
          label_url: string | null
          notes: string | null
          previous_wing_state: Json | null
          relay_point_address: Json | null
          relay_point_id: string | null
          relay_point_name: string | null
          shipped_at: string | null
          shippo_transaction_id: string | null
          status: string | null
          to_address: Json | null
          to_partner_school_id: string | null
          to_type: string
          tracking_number: string | null
          wing_inventory_id: string
        }
        Insert: {
          cancelled_at?: string | null
          carrier?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          from_address?: Json | null
          from_partner_school_id?: string | null
          from_type: string
          gls_track_id?: string | null
          id?: string
          label_url?: string | null
          notes?: string | null
          previous_wing_state?: Json | null
          relay_point_address?: Json | null
          relay_point_id?: string | null
          relay_point_name?: string | null
          shipped_at?: string | null
          shippo_transaction_id?: string | null
          status?: string | null
          to_address?: Json | null
          to_partner_school_id?: string | null
          to_type: string
          tracking_number?: string | null
          wing_inventory_id: string
        }
        Update: {
          cancelled_at?: string | null
          carrier?: string | null
          created_at?: string | null
          created_by?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          from_address?: Json | null
          from_partner_school_id?: string | null
          from_type?: string
          gls_track_id?: string | null
          id?: string
          label_url?: string | null
          notes?: string | null
          previous_wing_state?: Json | null
          relay_point_address?: Json | null
          relay_point_id?: string | null
          relay_point_name?: string | null
          shipped_at?: string | null
          shippo_transaction_id?: string | null
          status?: string | null
          to_address?: Json | null
          to_partner_school_id?: string | null
          to_type?: string
          tracking_number?: string | null
          wing_inventory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wing_transits_from_partner_school_id_fkey"
            columns: ["from_partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "wing_transits_from_partner_school_id_fkey"
            columns: ["from_partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_transits_from_partner_school_id_fkey"
            columns: ["from_partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "wing_transits_to_partner_school_id_fkey"
            columns: ["to_partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "wing_transits_to_partner_school_id_fkey"
            columns: ["to_partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_transits_to_partner_school_id_fkey"
            columns: ["to_partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "wing_transits_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wing_transits_wing_inventory_id_fkey"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_doc_file_acl: {
        Row: {
          created_at: string
          file_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          file_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          file_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_doc_file_acl_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "workshop_doc_files"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_doc_file_acl_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "partner_workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_doc_files: {
        Row: {
          created_at: string
          created_by: string | null
          folder_id: string
          id: string
          mime_type: string | null
          name: string
          size_bytes: number | null
          storage_path: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          folder_id: string
          id?: string
          mime_type?: string | null
          name: string
          size_bytes?: number | null
          storage_path: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          folder_id?: string
          id?: string
          mime_type?: string | null
          name?: string
          size_bytes?: number | null
          storage_path?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_doc_files_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "workshop_doc_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_doc_folder_acl: {
        Row: {
          created_at: string
          folder_id: string
          workshop_id: string
        }
        Insert: {
          created_at?: string
          folder_id: string
          workshop_id: string
        }
        Update: {
          created_at?: string
          folder_id?: string
          workshop_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_doc_folder_acl_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "workshop_doc_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_doc_folder_acl_workshop_id_fkey"
            columns: ["workshop_id"]
            isOneToOne: false
            referencedRelation: "partner_workshops"
            referencedColumns: ["id"]
          },
        ]
      }
      workshop_doc_folders: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_doc_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "workshop_doc_folders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      accounting_dashboard_stats: {
        Row: {
          active_partners_count: number | null
          approved_invoices_amount: number | null
          approved_invoices_count: number | null
          paid_invoices_amount: number | null
          paid_invoices_count: number | null
          paid_this_month_amount: number | null
          paid_this_month_count: number | null
          partners_with_balance_count: number | null
          pending_invoices_amount: number | null
          pending_invoices_count: number | null
          pending_transfers_amount: number | null
          pending_transfers_count: number | null
          rejected_invoices_amount: number | null
          rejected_invoices_count: number | null
          total_available_balance: number | null
          total_pending_balance: number | null
          total_withdrawn: number | null
        }
        Relationships: []
      }
      jb_todos_enriched: {
        Row: {
          completed_at: string | null
          context: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          eisenhower: string | null
          id: string | null
          importance: string | null
          notes: string | null
          priority: string | null
          status: string | null
          status_changed_at: string | null
          task_number: number | null
          title: string | null
          updated_at: string | null
          urgency: string | null
          urgency_override: string | null
        }
        Insert: {
          completed_at?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          eisenhower?: never
          id?: string | null
          importance?: string | null
          notes?: string | null
          priority?: string | null
          status?: string | null
          status_changed_at?: string | null
          task_number?: number | null
          title?: string | null
          updated_at?: string | null
          urgency?: never
          urgency_override?: string | null
        }
        Update: {
          completed_at?: string | null
          context?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          eisenhower?: never
          id?: string | null
          importance?: string | null
          notes?: string | null
          priority?: string | null
          status?: string | null
          status_changed_at?: string | null
          task_number?: number | null
          title?: string | null
          updated_at?: string | null
          urgency?: never
          urgency_override?: string | null
        }
        Relationships: []
      }
      partner_accounting_summary: {
        Row: {
          active: boolean | null
          available_balance: number | null
          email: string | null
          invoices_count: number | null
          last_payout_date: string | null
          partner_name: string | null
          partner_school_id: string | null
          pending_balance: number | null
          pending_invoices_amount: number | null
          pending_invoices_count: number | null
          siret: string | null
          total_commissions: number | null
          total_transferred: number | null
          total_withdrawn: number | null
          transfers_count: number | null
          vat_number: string | null
        }
        Relationships: []
      }
      partner_bookings_view: {
        Row: {
          actual_test_end_date: string | null
          actual_test_start_date: string | null
          approval_deadline: string | null
          auto_cancel_reason: string | null
          auto_cancelled_at: string | null
          bank_validation_amount: number | null
          bank_validation_at: string | null
          billing_address: Json | null
          block_end_date: string | null
          block_start_date: string | null
          created_at: string | null
          delivery_address_full: string | null
          delivery_address_lat: number | null
          delivery_address_lng: number | null
          delivery_over_75km_check_passed: boolean | null
          expires_at: string | null
          home_delivery: boolean | null
          id: string | null
          location_city: string | null
          location_lat: number | null
          location_lng: number | null
          migration_history: Json | null
          model: string | null
          original_test_start_date: string | null
          partner_distance_km: number | null
          partner_school: string | null
          partner_school_id: string | null
          partner_validated_at: string | null
          partner_validated_by: string | null
          payment_validated_at: string | null
          payment_validation_data: Json | null
          pending_at: string | null
          pending_notes: string | null
          purchase_date: string | null
          purchase_decision: boolean | null
          return_tracking_number: string | null
          school_email: string | null
          school_name: string | null
          shipping_address: Json | null
          shipping_carrier: string | null
          shipping_lead_days_used: number | null
          shipping_tracking_number: string | null
          size: string | null
          soft_hold_id: string | null
          status: string | null
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
          test_end_date: string | null
          test_start_date: string | null
          updated_at: string | null
          user_id: string | null
          wing_condition_after: string | null
          wing_condition_before: string | null
          wing_inventory_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demo_bookings_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_accounting_summary"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "demo_bookings_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "partner_schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demo_bookings_partner_school_id_fkey"
            columns: ["partner_school_id"]
            isOneToOne: false
            referencedRelation: "v_partner_dashboard"
            referencedColumns: ["partner_school_id"]
          },
          {
            foreignKeyName: "fk_demo_bookings_wing_inventory"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "demo_wing_inventory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_demo_bookings_wing_inventory"
            columns: ["wing_inventory_id"]
            isOneToOne: false
            referencedRelation: "wing_locations_overview"
            referencedColumns: ["id"]
          },
        ]
      }
      v_active_subscriptions: {
        Row: {
          accounting_account: string | null
          amount_ttc: number | null
          annual_cost_ttc: number | null
          billing_cycle: string | null
          billing_date_status: string | null
          category: string | null
          id: string | null
          next_billing_date: string | null
          service_name: string | null
          status: string | null
        }
        Insert: {
          accounting_account?: string | null
          amount_ttc?: number | null
          annual_cost_ttc?: never
          billing_cycle?: string | null
          billing_date_status?: string | null
          category?: string | null
          id?: string | null
          next_billing_date?: string | null
          service_name?: string | null
          status?: string | null
        }
        Update: {
          accounting_account?: string | null
          amount_ttc?: number | null
          annual_cost_ttc?: never
          billing_cycle?: string | null
          billing_date_status?: string | null
          category?: string | null
          id?: string | null
          next_billing_date?: string | null
          service_name?: string | null
          status?: string | null
        }
        Relationships: []
      }
      v_all_justifications: {
        Row: {
          accounting_account: string | null
          amount_eur: number | null
          business_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          flow_type: string | null
          id: string | null
          image_url: string | null
          source_table: string | null
          submitted_by_name: string | null
          submitted_by_telegram_id: number | null
          total_incl_tax: number | null
          transaction_date: string | null
        }
        Relationships: []
      }
      v_all_pending: {
        Row: {
          amount_eur: number | null
          business_name: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          flow_type: string | null
          id: string | null
          message_type: string | null
          original_message: string | null
          source_table: string | null
          submitted_by_name: string | null
          submitted_by_telegram_id: number | null
          total_incl_tax: number | null
          transaction_date: string | null
        }
        Relationships: []
      }
      v_cash_book_summary: {
        Row: {
          matched_count: number | null
          orphan_count: number | null
          pending_count: number | null
          validated_count: number | null
        }
        Relationships: []
      }
      v_monthly_subscription_summary: {
        Row: {
          category: string | null
          estimated_date_count: number | null
          monthly_total_ttc: number | null
          subscription_count: number | null
          validated_date_count: number | null
        }
        Relationships: []
      }
      v_partner_dashboard: {
        Row: {
          name: string | null
          partner_school_id: string | null
          school_email: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Relationships: []
      }
      v_submitted_by_user: {
        Row: {
          amount: number | null
          business_name: string | null
          created_at: string | null
          id: string | null
          submitted_by_name: string | null
          submitted_by_telegram_id: number | null
          submitted_by_username: string | null
          type: string | null
        }
        Relationships: []
      }
      v_subscriptions_to_validate: {
        Row: {
          amount_ttc: number | null
          billing_cycle: string | null
          category: string | null
          created_at: string | null
          id: string | null
          next_billing_date: string | null
          service_name: string | null
          website_url: string | null
        }
        Insert: {
          amount_ttc?: number | null
          billing_cycle?: string | null
          category?: string | null
          created_at?: string | null
          id?: string | null
          next_billing_date?: string | null
          service_name?: string | null
          website_url?: string | null
        }
        Update: {
          amount_ttc?: number | null
          billing_cycle?: string | null
          category?: string | null
          created_at?: string | null
          id?: string | null
          next_billing_date?: string | null
          service_name?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      v_total_monthly_subscriptions: {
        Row: {
          annual_total_ttc: number | null
          dates_to_validate: number | null
          dates_validated: number | null
          monthly_total_ttc: number | null
          total_subscriptions: number | null
        }
        Relationships: []
      }
      wing_flight_hours_total: {
        Row: {
          last_entry_date: string | null
          total_flight_hours: number | null
          total_flights: number | null
          total_incidents: number | null
          total_maintenance: number | null
          wing_inventory_id: string | null
        }
        Relationships: []
      }
      wing_locations_overview: {
        Row: {
          active: boolean | null
          base_price: number | null
          calculated_price: number | null
          color: string | null
          current_booking: Json | null
          current_location_details: Json | null
          current_location_type: string | null
          id: string | null
          last_location_update: string | null
          model: string | null
          size: string | null
          test_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      advance_to_next_billing: {
        Args: { subscription_id: string }
        Returns: {
          accounting_account: string | null
          amount_eur_estimated: number | null
          amount_ht: number | null
          amount_ttc: number
          billing_cycle: string | null
          billing_date_status: string | null
          billing_day: number | null
          cancellation_date: string | null
          cancellation_reason: string | null
          card_last_digits: string | null
          category: string | null
          cost_center: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          duration_months: number | null
          end_date: string | null
          exchange_rate_used: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_deductible: boolean | null
          is_eurozone: boolean | null
          last_billed_date: string | null
          next_billing_date: string | null
          notes: string | null
          origin_country: string | null
          original_amount_ttc: number | null
          payment_method: string | null
          raw_message: string | null
          service_name: string
          source: string | null
          start_date: string
          status: string | null
          submitted_by_name: string | null
          submitted_by_telegram_id: number | null
          submitted_by_username: string | null
          telegram_chat_id: number | null
          updated_at: string | null
          vat_amount: number | null
          vat_rate: number | null
          website_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "accounting_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      affiliate_partner_mixte: {
        Args: { p_crm_id: string; p_user_id: string }
        Returns: Json
      }
      affiliate_partner_workshop: {
        Args: { p_crm_id: string; p_user_id: string }
        Returns: Json
      }
      atelier_active_workshop_id: {
        Args: { p_user_id: string }
        Returns: string
      }
      atelier_can_resolve_serial: {
        Args: { p_serial: string }
        Returns: boolean
      }
      atelier_can_write_to_wing: {
        Args: { p_wing_inventory_id: string }
        Returns: boolean
      }
      auto_cancel_expired_pending_bookings: { Args: never; Returns: number }
      calculate_demo_price: {
        Args: { p_base_price: number; p_test_count: number }
        Returns: number
      }
      calculate_distance_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      calculate_shipping_lead_days: {
        Args: { p_start: string }
        Returns: number
      }
      check_inspection_required: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      check_product_availability: {
        Args: {
          p_fulfillment_location_id: string
          p_product_id?: string
          p_quantity?: number
          p_wing_inventory_id?: string
        }
        Returns: boolean
      }
      check_pseudo_available: { Args: { pseudo: string }; Returns: boolean }
      check_user_exists_by_email: {
        Args: { p_email: string }
        Returns: boolean
      }
      check_wing_availability: {
        Args: {
          p_block_end_date: string
          p_block_start_date: string
          p_test_start_date: string
          p_wing_inventory_id: string
        }
        Returns: boolean
      }
      cleanup_expired_soft_holds: { Args: never; Returns: number }
      cleanup_inactive_users: { Args: never; Returns: undefined }
      cleanup_old_todos: { Args: never; Returns: number }
      confirm_demo_booking: { Args: { p_booking_id: string }; Returns: Json }
      confirm_shipment: {
        Args: {
          p_product_id: string
          p_product_type: string
          p_quantity: number
          p_size: string
          p_warehouse_id: string
        }
        Returns: undefined
      }
      count_available_wings_for_period: {
        Args: {
          p_block_end_date: string
          p_block_start_date: string
          p_model: string
          p_size: string
        }
        Returns: number
      }
      current_user_partner_school_ids: {
        Args: never
        Returns: {
          school_id: string
        }[]
      }
      decrement_likes: { Args: { row_id: string }; Returns: undefined }
      decrement_stock: {
        Args: {
          p_product_id: string
          p_product_type: string
          p_quantity: number
          p_size: string
          p_warehouse_id: string
        }
        Returns: undefined
      }
      demo_bookings_availability: {
        Args: never
        Returns: {
          block_end_date: string
          block_start_date: string
          home_delivery: boolean
          id: string
          model: string
          size: string
          status: string
          test_end_date: string
          test_start_date: string
          wing_inventory_id: string
        }[]
      }
      demo_wing_inventory_public: {
        Args: never
        Returns: {
          active: boolean
          base_price: number
          blocked: boolean
          calculated_price: number
          color: string
          created_at: string
          current_location_type: string
          current_partner_school_id: string
          enabled_for_test: boolean
          id: string
          location_summary: Json
          model: string
          serial_number: string
          size: string
          standby_partner_school_id: string
          standby_status: string
          test_count: number
          wing_type: string
        }[]
      }
      dissociate_partner_workshop: { Args: { p_crm_id: string }; Returns: Json }
      finalize_atelier_invitation: {
        Args: { p_invitation_id: string }
        Returns: Json
      }
      find_next_booking_for_return: {
        Args: {
          p_current_booking_id: string
          p_test_end_date: string
          p_wing_inventory_id: string
        }
        Returns: {
          home_delivery: boolean
          id: string
          partner_school_id: string
          shipping_address: Json
          status: string
          test_end_date: string
          test_start_date: string
          user_id: string
        }[]
      }
      find_optimal_fulfillment_location: {
        Args: {
          p_destination_lat: number
          p_destination_lon: number
          p_is_test_wing?: boolean
        }
        Returns: {
          distance_km: number
          location_id: string
          location_name: string
          processing_days: number
        }[]
      }
      find_optimal_fulfillment_location_with_stock: {
        Args: {
          p_destination_lat: number
          p_destination_lon: number
          p_is_test_wing?: boolean
          p_product_id?: string
          p_quantity?: number
          p_wing_inventory_id?: string
        }
        Returns: {
          distance_km: number
          has_stock: boolean
          location_id: string
          location_name: string
          processing_days: number
        }[]
      }
      fn_calculate_match_score: {
        Args: {
          p_amount_1: number
          p_amount_2: number
          p_date_1: string
          p_date_2: string
          p_name_1: string
          p_name_2: string
        }
        Returns: {
          amount_diff_pct: number
          amount_score: number
          date_score: number
          days_diff: number
          name_score: number
          reasons: Json
          total_score: number
        }[]
      }
      fn_generate_subscription_entries: { Args: never; Returns: Json }
      fn_reject_match: { Args: { p_cash_book_id: number }; Returns: undefined }
      fn_reset_cash_book: { Args: never; Returns: string }
      fn_run_ai_matching: {
        Args: never
        Returns: {
          message: string
          status: string
        }[]
      }
      fn_run_full_matching: {
        Args: never
        Returns: {
          details: string
          status: string
          step: string
        }[]
      }
      fn_run_matching: {
        Args: { p_score_auto?: number; p_score_min?: number }
        Returns: {
          action: string
          etape: string
          nombre: number
        }[]
      }
      fn_upsert_download: {
        Args: { p_file_id: string; p_user_id: string }
        Returns: undefined
      }
      fn_validate_match: {
        Args: { p_cash_book_id: number }
        Returns: undefined
      }
      futurlog_cron_batch_auto_fulfill: { Args: never; Returns: undefined }
      futurlog_cron_check_errors: { Args: never; Returns: undefined }
      futurlog_cron_cleanup_custom_skus: { Args: never; Returns: undefined }
      futurlog_cron_sync_shipments: { Args: never; Returns: undefined }
      futurlog_cron_sync_stocks: { Args: never; Returns: undefined }
      futurlog_purge_old_logs: { Args: never; Returns: undefined }
      generate_customer_invoice_number: { Args: never; Returns: string }
      generate_futurlog_order_number: { Args: never; Returns: string }
      generate_futurlog_receipt_number: { Args: never; Returns: string }
      generate_invoice_number: { Args: never; Returns: string }
      generate_order_number: { Args: never; Returns: string }
      generate_shipping_documents: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      generate_transfer_reference: { Args: never; Returns: string }
      get_accounting_summary: {
        Args: { p_end_date: string; p_start_date: string }
        Returns: {
          invoices_amount: number
          invoices_count: number
          total_commissions: number
          total_payouts: number
          total_pending: number
          transfers_amount: number
          transfers_count: number
        }[]
      }
      get_active_automation_config: {
        Args: never
        Returns: {
          active: boolean
          created_at: string
          enable_auto_next_tester: boolean
          enable_inspection_system: boolean | null
          id: string
          inspection_pre_shipment_window_hours: number | null
          inspection_reception_window_hours: number | null
          missing_delivery_alert_days: number | null
          next_tester_buffer_days: number
          overdue_notification_days_after_end: number
          overdue_urgent_reminder_days: number
          purchase_offer_days_after_delivery: number
          purchase_offer_valid_days: number
          require_pre_shipment_photos: boolean | null
          return_label_generation_days_before_end: number
          return_reminder_days_before_end: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "test_wings_automation_config"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_active_shipping_config: {
        Args: never
        Returns: {
          auto_generate_return_label: boolean
          default_carrier: string
          default_service_level: string
          enable_admin_alerts: boolean
          enable_partner_notifications: boolean
          enable_tracking_emails: boolean
          reminder_days_before_return: number
          shipping_lead_days: number
          test_mode: boolean
          warehouse_address_json: Json
        }[]
      }
      get_all_bookings: {
        Args: never
        Returns: {
          actual_test_end_date: string | null
          actual_test_start_date: string | null
          approval_deadline: string | null
          auto_cancel_reason: string | null
          auto_cancelled_at: string | null
          bank_validation_amount: number | null
          bank_validation_at: string | null
          billing_address: Json | null
          block_end_date: string | null
          block_start_date: string | null
          conversation_lock_reason: string | null
          conversation_locked: boolean | null
          conversation_locked_at: string | null
          conversation_locked_by: string | null
          created_at: string
          delivery_address_full: string | null
          delivery_address_lat: number | null
          delivery_address_lng: number | null
          delivery_method: string | null
          delivery_over_75km_check_passed: boolean | null
          estimated_shipping_cost: number | null
          expires_at: string | null
          fulfillment_location_id: string | null
          gls_track_id: string | null
          home_delivery: boolean | null
          id: string
          inspection_outgoing_id: string | null
          inspection_outgoing_missed: boolean | null
          inspection_outgoing_out_of_window: boolean | null
          inspection_outgoing_required: boolean | null
          inspection_reception_id: string | null
          inspection_reception_missed: boolean | null
          inspection_reception_required: boolean | null
          loan_terms_accepted_at: string | null
          loan_terms_version: string | null
          location_city: string
          location_lat: number | null
          location_lng: number | null
          migration_history: Json | null
          model: string
          order_id: string | null
          original_test_start_date: string | null
          partner_approval_date: string | null
          partner_approval_status: string | null
          partner_distance_km: number | null
          partner_rejection_reason: string | null
          partner_school: string | null
          partner_school_id: string | null
          partner_validated_at: string | null
          partner_validated_by: string | null
          partner_workshop_id: string | null
          payment_link_created_at: string | null
          payment_link_expires_at: string | null
          payment_link_token: string | null
          payment_validated_at: string | null
          payment_validation_data: Json | null
          pending_at: string | null
          pending_notes: string | null
          purchase_completed: boolean | null
          purchase_date: string | null
          purchase_decision: boolean | null
          purchase_invoice_id: string | null
          purchase_offer_discount_percent: number | null
          purchase_offer_sent_at: string | null
          purchase_offer_token: string | null
          relay_point_address: Json | null
          relay_point_id: string | null
          relay_point_name: string | null
          return_label_generated_at: string | null
          return_reminder_sent_at: string | null
          return_sendcloud_label_url: string | null
          return_sendcloud_parcel_id: number | null
          return_tracking_number: string | null
          sendcloud_label_url: string | null
          sendcloud_parcel_id: number | null
          sendcloud_shipment_id: number | null
          sendcloud_tracking_url: string | null
          shipping_address: Json | null
          shipping_carrier: string | null
          shipping_cost: number | null
          shipping_cost_estimated: number | null
          shipping_invoice_number: string | null
          shipping_invoice_url: string | null
          shipping_lead_days_used: number | null
          shipping_paid_by_customer: boolean | null
          shipping_payment_date: string | null
          shipping_rate_id: string | null
          shipping_tracking_number: string | null
          shippo_shipment_id: string | null
          shippo_transaction_id: string | null
          size: string
          soft_hold_id: string | null
          status: string | null
          stripe_identity_required: boolean | null
          stripe_identity_session_id: string | null
          stripe_identity_verified: boolean | null
          stripe_payment_intent_id: string | null
          stripe_payment_status: string | null
          stripe_shipping_payment_id: string | null
          stripe_shipping_payment_status: string | null
          test_end_date: string | null
          test_start_date: string | null
          updated_at: string
          user_id: string
          wing_condition_after: string | null
          wing_condition_before: string | null
          wing_inventory_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "demo_bookings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_available_wings: {
        Args: {
          p_block_end_date: string
          p_block_start_date: string
          p_model: string
          p_size: string
          p_test_start_date: string
        }
        Returns: {
          active: boolean
          base_price: number
          calculated_price: number
          color: string
          id: string
          model: string
          size: string
          test_count: number
          wing_type: string
        }[]
      }
      get_blocked_ranges: {
        Args: { p_model: string; p_size: string }
        Returns: {
          block_end: string
          block_start: string
        }[]
      }
      get_colors_with_stock_check: {
        Args: { p_size_label: string; p_wing_id: string }
        Returns: {
          color_group: string
          color_group_label: string
          has_sufficient_stock: boolean
          hex_color: string
          is_available: boolean
          zone_type: string
        }[]
      }
      get_config_value: { Args: { config_key: string }; Returns: Json }
      get_email_template: {
        Args: { p_language?: string; p_template_type: string }
        Returns: {
          active: boolean | null
          body_html: string
          body_text: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          language: string
          preview_text: string | null
          subject: string
          template_type: string
          updated_at: string | null
          variables: Json | null
        }
        SetofOptions: {
          from: "*"
          to: "email_templates"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_fully_blocked_ranges: {
        Args: { p_model: string; p_size: string }
        Returns: {
          available_wings: number
          block_end: string
          block_start: string
        }[]
      }
      get_gls_shipping_rate:
        | {
            Args: { p_country_code: string; p_weight_kg: number }
            Returns: {
              estimated_days_max: number
              estimated_days_min: number
              price_ht: number
              price_ttc: number
              rate_id: string
              service_name: string
              service_type: string
              zone_name: string
            }[]
          }
        | {
            Args: {
              p_country_code: string
              p_delivery_method?: string
              p_weight_kg: number
            }
            Returns: {
              estimated_days_max: number
              estimated_days_min: number
              price_ht: number
              price_ttc: number
              rate_id: string
              service_name: string
              service_type: string
              zone_name: string
            }[]
          }
      get_partner_accounting_details: {
        Args: {
          p_end_date?: string
          p_partner_school_id: string
          p_start_date?: string
        }
        Returns: {
          available_balance: number
          last_payout_date: string
          partner_name: string
          pending_balance: number
          total_commissions: number
          total_withdrawn: number
          transactions_count: number
        }[]
      }
      get_partner_bookings: {
        Args: { partner_user_id: string }
        Returns: {
          approval_deadline: string
          created_at: string
          id: string
          location_city: string
          model: string
          partner_school: string
          partner_school_id: string
          pending_notes: string
          size: string
          status: string
          test_end_date: string
          test_start_date: string
          unread_messages: number
          user_email: string
          user_id: string
        }[]
      }
      get_partner_dashboard_context: {
        Args: never
        Returns: {
          partner_bookings: Json
          partner_school: Json
        }[]
      }
      get_partner_notifications: {
        Args: { p_school_id: string }
        Returns: {
          booking_id: string | null
          created_at: string | null
          id: string
          message: string
          notification_type: string | null
          partner_school_id: string | null
          priority: string | null
          read: boolean | null
          read_at: string | null
          read_by: string | null
          title: string
          viewed_at: string | null
          viewed_by: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "partner_notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_partner_school: { Args: never; Returns: Json }
      get_pending_email_notifications: {
        Args: never
        Returns: {
          body: string
          booking_id: string | null
          created_at: string
          email_type: string
          error: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          sent_at: string | null
          subject: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "email_notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_product_shipping_specs: {
        Args: { p_model: string; p_size?: string }
        Returns: {
          height_cm: number
          insurance_value_eur: number
          length_cm: number
          packing_notes: string
          preferred_carrier: string
          preferred_service_level: string
          weight_kg: number
          width_cm: number
        }[]
      }
      get_purchase_offer_by_token: {
        Args: { p_token: string }
        Returns: {
          id: string
          purchase_completed: boolean
          purchase_offer_discount_percent: number
          purchase_offer_sent_at: string
          return_tracking_number: string
          status: string
          test_end_date: string
          test_start_date: string
          wing_base_price: number
          wing_calculated_price: number
          wing_color: string
          wing_inventory_id: string
          wing_model: string
          wing_serial_number: string
          wing_size: string
          wing_test_count: number
        }[]
      }
      get_shipping_payment_by_token: {
        Args: { p_token: string }
        Returns: {
          delivery_address_full: string
          estimated_shipping_cost: number
          id: string
          payment_link_expires_at: string
          shipping_address: Json
          shipping_cost_estimated: number
          status: string
          stripe_shipping_payment_status: string
          test_end_date: string
          test_start_date: string
          wing_inventory_id: string
          wing_model: string
          wing_size: string
        }[]
      }
      get_standby_wing_by_token: {
        Args: { p_token: string }
        Returns: {
          color: string
          id: string
          model: string
          partner_city: string
          partner_name: string
          serial_number: string
          size: string
          standby_partner_school_id: string
          standby_status: string
        }[]
      }
      get_upcoming_subscriptions: {
        Args: { days_ahead?: number }
        Returns: {
          amount_ttc: number
          billing_date_status: string
          days_until_billing: number
          id: string
          next_billing_date: string
          service_name: string
        }[]
      }
      get_user_email: { Args: { p_user_id: string }; Returns: string }
      get_wallet_config: { Args: never; Returns: Json }
      has_any_role: { Args: { target_roles: string[] }; Returns: boolean }
      has_available_wings_for_period: {
        Args: {
          p_block_end_date: string
          p_block_start_date: string
          p_model: string
          p_size: string
          p_test_start_date: string
        }
        Returns: boolean
      }
      has_role: { Args: { target_role: string }; Returns: boolean }
      i18n_t: { Args: { field: Json; lang: string }; Returns: string }
      increment_likes: { Args: { row_id: string }; Returns: undefined }
      increment_wing_test_count: {
        Args: { p_wing_inventory_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_user: { Args: never; Returns: boolean }
      is_internal_user: { Args: never; Returns: boolean }
      is_partner_of: { Args: { p_school_id: string }; Returns: boolean }
      is_service_role: { Args: never; Returns: boolean }
      manual_cleanup_old_inspection_photos: {
        Args: never
        Returns: {
          deleted_inspection_id: string
          deleted_photo_count: number
        }[]
      }
      map_sendcloud_status: {
        Args: { sendcloud_status: string }
        Returns: string
      }
      mark_email_sent: {
        Args: { p_error?: string; p_notification_id: string }
        Returns: undefined
      }
      mark_ticket_read_by_client: {
        Args: { p_ticket_id: string }
        Returns: undefined
      }
      mark_ticket_read_by_plume: {
        Args: { p_ticket_id: string }
        Returns: undefined
      }
      mark_ticket_read_by_school: {
        Args: { p_ticket_id: string }
        Returns: undefined
      }
      mark_ticket_read_by_workshop: {
        Args: { p_ticket_id: string }
        Returns: undefined
      }
      mark_user_online: {
        Args: { p_page?: string; p_user_id: string }
        Returns: undefined
      }
      match_jbot_knowledge: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          content: string
          context: string
          id: string
          metadata: Json
          similarity: number
          source: string
        }[]
      }
      migrate_bookings_for_new_shipping_days: {
        Args: { p_new_shipping_days: number }
        Returns: {
          booking_id: string
          model: string
          new_delivery_start: string
          old_delivery_start: string
          size: string
          test_start: string
          user_email: string
        }[]
      }
      process_sendcloud_webhook: {
        Args: {
          p_carrier: string
          p_event_id: string
          p_parcel_id: number
          p_payload: Json
          p_status: string
          p_tracking_number: string
        }
        Returns: Json
      }
      public_partner_account_index: {
        Args: never
        Returns: {
          city: string
          kind: string
          name: string
        }[]
      }
      reassign_partner_school: {
        Args: { p_crm_id: string; p_new_user_id: string }
        Returns: Json
      }
      recalculate_all_demo_prices: { Args: never; Returns: number }
      recalculate_booking_dates: {
        Args: { p_booking_id: string; p_new_shipping_days: number }
        Returns: {
          new_block_end: string
          new_block_start: string
          old_block_end: string
          old_block_start: string
          test_end: string
          test_start: string
        }[]
      }
      release_pending_commissions: {
        Args: never
        Returns: {
          released_amount: number
          released_count: number
        }[]
      }
      release_stock: {
        Args: {
          p_product_id: string
          p_product_type: string
          p_quantity: number
          p_size: string
          p_warehouse_id: string
        }
        Returns: undefined
      }
      replace_soft_hold: {
        Args: {
          p_location_city: string
          p_location_lat: number
          p_location_lng: number
          p_model: string
          p_partner_distance_km: number
          p_partner_school: string
          p_size: string
          p_week_start: string
        }
        Returns: {
          booking_id: string
          expires_at: string
          soft_hold_id: string
          week_end: string
          week_start: string
        }[]
      }
      restore_partner_balance: {
        Args: { p_amount: number; p_partner_id: string }
        Returns: undefined
      }
      retry_pending_shop_invoices: {
        Args: never
        Returns: {
          order_id: string
          reason: string
          triggered: boolean
        }[]
      }
      search_valid_profiles: {
        Args: { result_limit?: number; search_term: string }
        Returns: {
          email: string
          user_id: string
        }[]
      }
      send_partner_message: {
        Args: { p_booking_id: string; p_message: string }
        Returns: Json
      }
      update_multiple_site_configs: { Args: { p_configs: Json }; Returns: Json }
      update_partner_balance_after_payout: {
        Args: { p_amount: number; p_partner_school_id: string }
        Returns: undefined
      }
      update_site_config: {
        Args: {
          p_category?: string
          p_description?: string
          p_key: string
          p_value: Json
        }
        Returns: Json
      }
      update_wing_location: {
        Args: { p_details?: Json; p_location_type: string; p_wing_id: string }
        Returns: undefined
      }
      user_can_access_ticket: {
        Args: { ticket_uuid: string }
        Returns: boolean
      }
      user_has_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: boolean
      }
      user_primary_role: { Args: { p_user_id: string }; Returns: string }
      validate_subscription_date: {
        Args: {
          real_billing_day?: number
          real_start_date?: string
          subscription_id: string
        }
        Returns: {
          accounting_account: string | null
          amount_eur_estimated: number | null
          amount_ht: number | null
          amount_ttc: number
          billing_cycle: string | null
          billing_date_status: string | null
          billing_day: number | null
          cancellation_date: string | null
          cancellation_reason: string | null
          card_last_digits: string | null
          category: string | null
          cost_center: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          duration_months: number | null
          end_date: string | null
          exchange_rate_used: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_deductible: boolean | null
          is_eurozone: boolean | null
          last_billed_date: string | null
          next_billing_date: string | null
          notes: string | null
          origin_country: string | null
          original_amount_ttc: number | null
          payment_method: string | null
          raw_message: string | null
          service_name: string
          source: string | null
          start_date: string
          status: string | null
          submitted_by_name: string | null
          submitted_by_telegram_id: number | null
          submitted_by_username: string | null
          telegram_chat_id: number | null
          updated_at: string | null
          vat_amount: number | null
          vat_rate: number | null
          website_url: string | null
        }
        SetofOptions: {
          from: "*"
          to: "accounting_subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      action_type:
        | "file_uploaded"
        | "file_downloaded"
        | "qc_checked"
        | "qc_photo_added"
        | "order_status_changed"
        | "order_created"
        | "comment_added"
        | "order_deleted"
        | "order_field_changed"
        | "finishing_assigned"
      athlete_application_status:
        | "pending"
        | "manual_review"
        | "accepted"
        | "rejected"
      booking_status:
        | "soft_hold"
        | "pending"
        | "confirmed"
        | "cancelled"
        | "expired"
        | "awaiting_verification"
        | "pending_payment"
      company_type: "plume" | "anc_thai"
      experience_level: "beginner" | "intermediate" | "advanced" | "expert"
      file_category:
        | "dxf"
        | "colors"
        | "3d_view"
        | "rigidfoil_length"
        | "attachment_point"
        | "piece_list"
        | "canopy_length"
        | "print"
        | "bridle"
        | "riser_dxf"
        | "riser_specs"
        | "riser_bom"
        | "control_dxf"
        | "control_specs"
        | "accessory_dxf"
        | "accessory_specs"
        | "accessory_bom"
        | "parachute_dxf"
        | "parachute_specs"
        | "parachute_bridle"
        | "parachute_bom"
        | "harness_dxf"
        | "harness_specs"
        | "harness_bom"
      media_type: "photo" | "video"
      message_channel:
        | "school_client"
        | "client_workshop"
        | "workshop_school"
        | "group"
        | "workshop_plume"
      order_status:
        | "draft"
        | "validated"
        | "sent"
        | "cutting"
        | "sewing"
        | "qc"
        | "shipping"
        | "received"
      partner_application_status:
        | "pending"
        | "auto_rejected"
        | "manual_review"
        | "accepted"
        | "rejected"
      partner_application_type: "ecole" | "atelier"
      product_category:
        | "paraglider"
        | "harness"
        | "reserve_parachute"
        | "accessory"
      product_condition: "new" | "used" | "demo"
      project_type:
        | "wing"
        | "riser"
        | "control"
        | "harness"
        | "parachute"
        | "accessory"
      qc_status: "pending" | "ok" | "warning" | "problem"
      request_status:
        | "pending"
        | "processing"
        | "approved"
        | "rejected"
        | "completed"
        | "cancelled"
        | "school_acknowledged"
        | "wing_received_school"
        | "school_checking"
        | "school_resolved"
        | "pending_workshop"
        | "escalated_to_workshop"
        | "wing_received_workshop"
        | "workshop_pre_checking"
        | "workshop_diagnosing"
        | "workshop_repairing"
        | "workshop_done"
        | "wing_returned"
      return_severity: "info" | "warning" | "problem"
      return_status: "todo" | "in_progress" | "resolved" | "wontfix"
      service_type: "sav" | "revision" | "repair" | "information"
      user_role:
        | "plume_admin"
        | "plume_member"
        | "factory_admin"
        | "factory_worker"
      wing_size: "xs" | "s" | "m" | "l" | "xl"
      wing_type: "school" | "performance" | "competition" | "mountain"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      action_type: [
        "file_uploaded",
        "file_downloaded",
        "qc_checked",
        "qc_photo_added",
        "order_status_changed",
        "order_created",
        "comment_added",
        "order_deleted",
        "order_field_changed",
        "finishing_assigned",
      ],
      athlete_application_status: [
        "pending",
        "manual_review",
        "accepted",
        "rejected",
      ],
      booking_status: [
        "soft_hold",
        "pending",
        "confirmed",
        "cancelled",
        "expired",
        "awaiting_verification",
        "pending_payment",
      ],
      company_type: ["plume", "anc_thai"],
      experience_level: ["beginner", "intermediate", "advanced", "expert"],
      file_category: [
        "dxf",
        "colors",
        "3d_view",
        "rigidfoil_length",
        "attachment_point",
        "piece_list",
        "canopy_length",
        "print",
        "bridle",
        "riser_dxf",
        "riser_specs",
        "riser_bom",
        "control_dxf",
        "control_specs",
        "accessory_dxf",
        "accessory_specs",
        "accessory_bom",
        "parachute_dxf",
        "parachute_specs",
        "parachute_bridle",
        "parachute_bom",
        "harness_dxf",
        "harness_specs",
        "harness_bom",
      ],
      media_type: ["photo", "video"],
      message_channel: [
        "school_client",
        "client_workshop",
        "workshop_school",
        "group",
        "workshop_plume",
      ],
      order_status: [
        "draft",
        "validated",
        "sent",
        "cutting",
        "sewing",
        "qc",
        "shipping",
        "received",
      ],
      partner_application_status: [
        "pending",
        "auto_rejected",
        "manual_review",
        "accepted",
        "rejected",
      ],
      partner_application_type: ["ecole", "atelier"],
      product_category: [
        "paraglider",
        "harness",
        "reserve_parachute",
        "accessory",
      ],
      product_condition: ["new", "used", "demo"],
      project_type: [
        "wing",
        "riser",
        "control",
        "harness",
        "parachute",
        "accessory",
      ],
      qc_status: ["pending", "ok", "warning", "problem"],
      request_status: [
        "pending",
        "processing",
        "approved",
        "rejected",
        "completed",
        "cancelled",
        "school_acknowledged",
        "wing_received_school",
        "school_checking",
        "school_resolved",
        "pending_workshop",
        "escalated_to_workshop",
        "wing_received_workshop",
        "workshop_pre_checking",
        "workshop_diagnosing",
        "workshop_repairing",
        "workshop_done",
        "wing_returned",
      ],
      return_severity: ["info", "warning", "problem"],
      return_status: ["todo", "in_progress", "resolved", "wontfix"],
      service_type: ["sav", "revision", "repair", "information"],
      user_role: [
        "plume_admin",
        "plume_member",
        "factory_admin",
        "factory_worker",
      ],
      wing_size: ["xs", "s", "m", "l", "xl"],
      wing_type: ["school", "performance", "competition", "mountain"],
    },
  },
} as const
