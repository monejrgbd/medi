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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      affiliate_codes: {
        Row: {
          code: string
          created_at: string
          deactivated_at: string | null
          id: string
          is_active: boolean
          partner_id: string
          uses_count: number
        }
        Insert: {
          code: string
          created_at?: string
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          partner_id: string
          uses_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          deactivated_at?: string | null
          id?: string
          is_active?: boolean
          partner_id?: string
          uses_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_codes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_model_config: {
        Row: {
          credit_cost: number
          diagnostic_max_tokens: number
          diagnostic_model: string
          diagnostic_model_display: string
          diagnostic_provider: string
          diagnostic_temperature: number
          display_name: string
          intake_max_tokens: number
          intake_model: string
          intake_model_display: string
          intake_provider: string
          intake_temperature: number
          notes: string | null
          scribe_max_tokens: number | null
          scribe_model: string | null
          scribe_model_display: string | null
          scribe_provider: string | null
          scribe_temperature: number | null
          summary_max_tokens: number
          summary_model: string
          summary_model_display: string
          summary_provider: string
          summary_temperature: number
          tier: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          credit_cost?: number
          diagnostic_max_tokens?: number
          diagnostic_model: string
          diagnostic_model_display: string
          diagnostic_provider: string
          diagnostic_temperature?: number
          display_name: string
          intake_max_tokens?: number
          intake_model: string
          intake_model_display: string
          intake_provider: string
          intake_temperature?: number
          notes?: string | null
          scribe_max_tokens?: number | null
          scribe_model?: string | null
          scribe_model_display?: string | null
          scribe_provider?: string | null
          scribe_temperature?: number | null
          summary_max_tokens?: number
          summary_model: string
          summary_model_display: string
          summary_provider: string
          summary_temperature?: number
          tier: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          credit_cost?: number
          diagnostic_max_tokens?: number
          diagnostic_model?: string
          diagnostic_model_display?: string
          diagnostic_provider?: string
          diagnostic_temperature?: number
          display_name?: string
          intake_max_tokens?: number
          intake_model?: string
          intake_model_display?: string
          intake_provider?: string
          intake_temperature?: number
          notes?: string | null
          scribe_max_tokens?: number | null
          scribe_model?: string | null
          scribe_model_display?: string | null
          scribe_provider?: string | null
          scribe_temperature?: number | null
          summary_max_tokens?: number
          summary_model?: string
          summary_model_display?: string
          summary_provider?: string
          summary_temperature?: number
          tier?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      ai_plan_config: {
        Row: {
          document_max_tokens: number
          document_model: string
          document_model_display: string
          document_provider: string
          document_temperature: number
          plan: string
          scan_max_tokens: number
          scan_model: string
          scan_model_display: string
          scan_provider: string
          scan_temperature: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          document_max_tokens?: number
          document_model?: string
          document_model_display?: string
          document_provider?: string
          document_temperature?: number
          plan: string
          scan_max_tokens?: number
          scan_model?: string
          scan_model_display?: string
          scan_provider?: string
          scan_temperature?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          document_max_tokens?: number
          document_model?: string
          document_model_display?: string
          document_provider?: string
          document_temperature?: number
          plan?: string
          scan_max_tokens?: number
          scan_model?: string
          scan_model_display?: string
          scan_provider?: string
          scan_temperature?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      approval_codes: {
        Row: {
          code: string
          created_at: string | null
          domain: string | null
          email: string | null
          email_sent: boolean | null
          expires_at: string | null
          id: string
          partner_id: string | null
          phone: string | null
          send_after: string | null
          used_at: string | null
          used_by_org_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          domain?: string | null
          email?: string | null
          email_sent?: boolean | null
          expires_at?: string | null
          id?: string
          partner_id?: string | null
          phone?: string | null
          send_after?: string | null
          used_at?: string | null
          used_by_org_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          domain?: string | null
          email?: string | null
          email_sent?: boolean | null
          expires_at?: string | null
          id?: string
          partner_id?: string | null
          phone?: string | null
          send_after?: string | null
          used_at?: string | null
          used_by_org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_codes_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_codes_used_by_org_id_fkey"
            columns: ["used_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attestation_versions: {
        Row: {
          created_at: string
          drafted_by: string | null
          effective_from: string
          effective_until: string | null
          text: string
          version_key: string
        }
        Insert: {
          created_at?: string
          drafted_by?: string | null
          effective_from?: string
          effective_until?: string | null
          text: string
          version_key: string
        }
        Update: {
          created_at?: string
          drafted_by?: string | null
          effective_from?: string
          effective_until?: string | null
          text?: string
          version_key?: string
        }
        Relationships: []
      }
      audit_trail: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string | null
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          location_id: string | null
          org_id: string
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          location_id?: string | null
          org_id: string
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string | null
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          location_id?: string | null
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_trail_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_trail_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_topups: {
        Row: {
          created_at: string | null
          credits: number
          feature: string
          id: string
          org_id: string
          used: number | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          feature: string
          id?: string
          org_id: string
          used?: number | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          feature?: string
          id?: string
          org_id?: string
          used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_topups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_prospects: {
        Row: {
          address: string | null
          business_email: string | null
          city: string | null
          clinic_name: string
          contact_name: string | null
          created_at: string | null
          email: string | null
          follow_up_date: string | null
          google_rating: number | null
          google_review_count: number | null
          id: number
          interest: string | null
          linkedin_url: string | null
          notes: string | null
          num_doctors: number | null
          outreach_step: string | null
          phone: string | null
          priority: string | null
          province: string | null
          status: string | null
          type: string | null
          wait_complaints: boolean | null
          website: string | null
          working_hours: string | null
        }
        Insert: {
          address?: string | null
          business_email?: string | null
          city?: string | null
          clinic_name: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          follow_up_date?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          id?: never
          interest?: string | null
          linkedin_url?: string | null
          notes?: string | null
          num_doctors?: number | null
          outreach_step?: string | null
          phone?: string | null
          priority?: string | null
          province?: string | null
          status?: string | null
          type?: string | null
          wait_complaints?: boolean | null
          website?: string | null
          working_hours?: string | null
        }
        Update: {
          address?: string | null
          business_email?: string | null
          city?: string | null
          clinic_name?: string
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          follow_up_date?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          id?: never
          interest?: string | null
          linkedin_url?: string | null
          notes?: string | null
          num_doctors?: number | null
          outreach_step?: string | null
          phone?: string | null
          priority?: string | null
          province?: string | null
          status?: string | null
          type?: string | null
          wait_complaints?: boolean | null
          website?: string | null
          working_hours?: string | null
        }
        Relationships: []
      }
      clinical_documents: {
        Row: {
          ai_draft: Json | null
          ai_input_tokens: number | null
          ai_model: string | null
          ai_output_tokens: number | null
          attestation_version_key: string | null
          content_body: string
          content_language: string
          created_at: string
          created_by: string
          delivered_via: string[]
          document_category: string
          document_type: string
          id: string
          input_fields: Json
          location_id: string
          org_id: string
          patient_id: string
          pdf_bucket_path: string | null
          pdf_url: string | null
          physical_exam_mode: string | null
          physical_exam_raw: string | null
          public_token: string | null
          public_token_expires_at: string | null
          public_token_revoked: boolean
          requires_pin: boolean
          scribe_transcript: string | null
          scribe_transcript_raw: string | null
          sent_at: string | null
          signed_at: string | null
          signed_by: string | null
          status: string
          template_key: string
          updated_at: string
          visit_id: string | null
          void_reason: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          ai_draft?: Json | null
          ai_input_tokens?: number | null
          ai_model?: string | null
          ai_output_tokens?: number | null
          attestation_version_key?: string | null
          content_body?: string
          content_language?: string
          created_at?: string
          created_by: string
          delivered_via?: string[]
          document_category: string
          document_type: string
          id?: string
          input_fields?: Json
          location_id: string
          org_id: string
          patient_id: string
          pdf_bucket_path?: string | null
          pdf_url?: string | null
          physical_exam_mode?: string | null
          physical_exam_raw?: string | null
          public_token?: string | null
          public_token_expires_at?: string | null
          public_token_revoked?: boolean
          requires_pin?: boolean
          scribe_transcript?: string | null
          scribe_transcript_raw?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          template_key: string
          updated_at?: string
          visit_id?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          ai_draft?: Json | null
          ai_input_tokens?: number | null
          ai_model?: string | null
          ai_output_tokens?: number | null
          attestation_version_key?: string | null
          content_body?: string
          content_language?: string
          created_at?: string
          created_by?: string
          delivered_via?: string[]
          document_category?: string
          document_type?: string
          id?: string
          input_fields?: Json
          location_id?: string
          org_id?: string
          patient_id?: string
          pdf_bucket_path?: string | null
          pdf_url?: string | null
          physical_exam_mode?: string | null
          physical_exam_raw?: string | null
          public_token?: string | null
          public_token_expires_at?: string | null
          public_token_revoked?: boolean
          requires_pin?: boolean
          scribe_transcript?: string | null
          scribe_transcript_raw?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signed_by?: string | null
          status?: string
          template_key?: string
          updated_at?: string
          visit_id?: string | null
          void_reason?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinical_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_signed_by_fkey"
            columns: ["signed_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinical_documents_voided_by_fkey"
            columns: ["voided_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          city: string | null
          clinic_name: string
          contact_name: string
          country: string | null
          created_at: string | null
          email: string
          id: number
          interest: string | null
          notes: string | null
          phone: string | null
        }
        Insert: {
          city?: string | null
          clinic_name: string
          contact_name: string
          country?: string | null
          created_at?: string | null
          email: string
          id?: never
          interest?: string | null
          notes?: string | null
          phone?: string | null
        }
        Update: {
          city?: string | null
          clinic_name?: string
          contact_name?: string
          country?: string | null
          created_at?: string | null
          email?: string
          id?: never
          interest?: string | null
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      credits_log: {
        Row: {
          ai_model: string | null
          created_at: string | null
          credit_type: string | null
          credits_amount: number
          description: string | null
          document_id: string | null
          id: string
          org_id: string
          visit_id: string | null
        }
        Insert: {
          ai_model?: string | null
          created_at?: string | null
          credit_type?: string | null
          credits_amount: number
          description?: string | null
          document_id?: string | null
          id?: string
          org_id: string
          visit_id?: string | null
        }
        Update: {
          ai_model?: string | null
          created_at?: string | null
          credit_type?: string | null
          credits_amount?: number
          description?: string | null
          document_id?: string | null
          id?: string
          org_id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credits_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credits_log_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_access: {
        Row: {
          access_count: number
          created_at: string
          email: string
          id: string
          otp_expires_at: string | null
          otp_hash: string | null
          prelog_daily_count: number
          prelog_daily_date: string | null
          team_code: string | null
        }
        Insert: {
          access_count?: number
          created_at?: string
          email: string
          id?: string
          otp_expires_at?: string | null
          otp_hash?: string | null
          prelog_daily_count?: number
          prelog_daily_date?: string | null
          team_code?: string | null
        }
        Update: {
          access_count?: number
          created_at?: string
          email?: string
          id?: string
          otp_expires_at?: string | null
          otp_hash?: string | null
          prelog_daily_count?: number
          prelog_daily_date?: string | null
          team_code?: string | null
        }
        Relationships: []
      }
      doctor_note_preferences: {
        Row: {
          default_private: boolean | null
          doctor_id: string
          patient_id: string
        }
        Insert: {
          default_private?: boolean | null
          doctor_id: string
          patient_id: string
        }
        Update: {
          default_private?: boolean | null
          doctor_id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_note_preferences_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_note_preferences_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      document_access_log: {
        Row: {
          accessed_at: string
          document_id: string
          id: string
          ip_hash: string | null
          pin_verified: boolean
          result: string
          user_agent: string | null
        }
        Insert: {
          accessed_at?: string
          document_id: string
          id?: string
          ip_hash?: string | null
          pin_verified?: boolean
          result: string
          user_agent?: string | null
        }
        Update: {
          accessed_at?: string
          document_id?: string
          id?: string
          ip_hash?: string | null
          pin_verified?: boolean
          result?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_access_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_delivery_log: {
        Row: {
          attempt_number: number
          channel: string
          created_at: string
          document_id: string
          error_message: string | null
          id: string
          provider_sid: string | null
          recipient: string | null
          status: string
        }
        Insert: {
          attempt_number?: number
          channel: string
          created_at?: string
          document_id: string
          error_message?: string | null
          id?: string
          provider_sid?: string | null
          recipient?: string | null
          status?: string
        }
        Update: {
          attempt_number?: number
          channel?: string
          created_at?: string
          document_id?: string
          error_message?: string | null
          id?: string
          provider_sid?: string | null
          recipient?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_delivery_log_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          active: boolean
          ai_model_override: string | null
          ai_output_schema: Json
          created_at: string
          default_disclaimer: string | null
          default_requires_pin: boolean
          default_token_lifetime_hours: number
          description: string
          display_name: string
          document_category: string
          icon: string
          input_schema: Json
          key: string
          prompt_template: string
          render_template: string
          requires_attestation: boolean
          requires_verified_org: boolean
          sanity_bounds: Json
          updated_at: string
        }
        Insert: {
          active?: boolean
          ai_model_override?: string | null
          ai_output_schema: Json
          created_at?: string
          default_disclaimer?: string | null
          default_requires_pin?: boolean
          default_token_lifetime_hours?: number
          description: string
          display_name: string
          document_category: string
          icon: string
          input_schema: Json
          key: string
          prompt_template: string
          render_template: string
          requires_attestation?: boolean
          requires_verified_org?: boolean
          sanity_bounds?: Json
          updated_at?: string
        }
        Update: {
          active?: boolean
          ai_model_override?: string | null
          ai_output_schema?: Json
          created_at?: string
          default_disclaimer?: string | null
          default_requires_pin?: boolean
          default_token_lifetime_hours?: number
          description?: string
          display_name?: string
          document_category?: string
          icon?: string
          input_schema?: Json
          key?: string
          prompt_template?: string
          render_template?: string
          requires_attestation?: boolean
          requires_verified_org?: boolean
          sanity_bounds?: Json
          updated_at?: string
        }
        Relationships: []
      }
      email_captures: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
        }
        Relationships: []
      }
      feature_requests: {
        Row: {
          content: string
          created_at: string | null
          id: string
          org_id: string | null
          staff_user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          org_id?: string | null
          staff_user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          org_id?: string | null
          staff_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feature_requests_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_requests_staff_user_id_fkey"
            columns: ["staff_user_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          ai_instructions: string | null
          created_at: string | null
          doctor_id: string
          due_at: string | null
          id: string
          location_id: string
          org_id: string
          patient_id: string
          reminders_sent: number | null
          sms_charged: boolean | null
          status: string
          timeframe_days: number
          visit_id: string
        }
        Insert: {
          ai_instructions?: string | null
          created_at?: string | null
          doctor_id: string
          due_at?: string | null
          id?: string
          location_id: string
          org_id: string
          patient_id: string
          reminders_sent?: number | null
          sms_charged?: boolean | null
          status?: string
          timeframe_days: number
          visit_id: string
        }
        Update: {
          ai_instructions?: string | null
          created_at?: string | null
          doctor_id?: string
          due_at?: string | null
          id?: string
          location_id?: string
          org_id?: string
          patient_id?: string
          reminders_sent?: number | null
          sms_charged?: boolean | null
          status?: string
          timeframe_days?: number
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      location_videos: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          id: string
          location_id: string
          mime_type: string
          org_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          id?: string
          location_id: string
          mime_type: string
          org_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          id?: string
          location_id?: string
          mime_type?: string
          org_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "location_videos_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "location_videos_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string | null
          ai_custom_instructions: string | null
          ai_message_limit: number | null
          ai_model: string | null
          always_accepting_checkins: boolean | null
          ask_discovery_source: boolean | null
          ask_referral_source: boolean | null
          checkin_mode: string
          created_at: string | null
          diagnostic_enabled: boolean | null
          display_format: string | null
          estimated_wait_minutes: number | null
          forms_before_queue: boolean
          id: string
          logo_url: string | null
          name: string
          nurse_enabled: boolean | null
          nurse_first_workflow: boolean | null
          operating_hours: Json | null
          org_id: string
          prescreening_config: Json | null
          preset_rooms: string[]
          qr_code_url: string | null
          queue_display_enabled: boolean | null
          queue_type: string
          raven_api_key: string | null
          referral_email: string | null
          review_sms_enabled: boolean | null
          show_doctor_room_to_patients: boolean
          skip_ai: boolean | null
          specialty: string | null
          tablet_count: number | null
          timezone: string | null
          tv_audio_muted: boolean
          tv_display_mode: string
          tv_overlay_position: string
          tv_overlay_visible: boolean
          tv_queue_duration_seconds: number
          vaccines_enabled: boolean | null
          vitals_enabled: boolean | null
        }
        Insert: {
          address?: string | null
          ai_custom_instructions?: string | null
          ai_message_limit?: number | null
          ai_model?: string | null
          always_accepting_checkins?: boolean | null
          ask_discovery_source?: boolean | null
          ask_referral_source?: boolean | null
          checkin_mode?: string
          created_at?: string | null
          diagnostic_enabled?: boolean | null
          display_format?: string | null
          estimated_wait_minutes?: number | null
          forms_before_queue?: boolean
          id?: string
          logo_url?: string | null
          name: string
          nurse_enabled?: boolean | null
          nurse_first_workflow?: boolean | null
          operating_hours?: Json | null
          org_id: string
          prescreening_config?: Json | null
          preset_rooms?: string[]
          qr_code_url?: string | null
          queue_display_enabled?: boolean | null
          queue_type?: string
          raven_api_key?: string | null
          referral_email?: string | null
          review_sms_enabled?: boolean | null
          show_doctor_room_to_patients?: boolean
          skip_ai?: boolean | null
          specialty?: string | null
          tablet_count?: number | null
          timezone?: string | null
          tv_audio_muted?: boolean
          tv_display_mode?: string
          tv_overlay_position?: string
          tv_overlay_visible?: boolean
          tv_queue_duration_seconds?: number
          vaccines_enabled?: boolean | null
          vitals_enabled?: boolean | null
        }
        Update: {
          address?: string | null
          ai_custom_instructions?: string | null
          ai_message_limit?: number | null
          ai_model?: string | null
          always_accepting_checkins?: boolean | null
          ask_discovery_source?: boolean | null
          ask_referral_source?: boolean | null
          checkin_mode?: string
          created_at?: string | null
          diagnostic_enabled?: boolean | null
          display_format?: string | null
          estimated_wait_minutes?: number | null
          forms_before_queue?: boolean
          id?: string
          logo_url?: string | null
          name?: string
          nurse_enabled?: boolean | null
          nurse_first_workflow?: boolean | null
          operating_hours?: Json | null
          org_id?: string
          prescreening_config?: Json | null
          preset_rooms?: string[]
          qr_code_url?: string | null
          queue_display_enabled?: boolean | null
          queue_type?: string
          raven_api_key?: string | null
          referral_email?: string | null
          review_sms_enabled?: boolean | null
          show_doctor_room_to_patients?: boolean
          skip_ai?: boolean | null
          specialty?: string | null
          tablet_count?: number | null
          timezone?: string | null
          tv_audio_muted?: boolean
          tv_display_mode?: string
          tv_overlay_position?: string
          tv_overlay_visible?: boolean
          tv_queue_duration_seconds?: number
          vaccines_enabled?: boolean | null
          vitals_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email: string
          email_credit_alerts: boolean | null
          email_daily_digest: boolean | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_credit_alerts?: boolean | null
          email_daily_digest?: boolean | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_credit_alerts?: boolean | null
          email_daily_digest?: boolean | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      org_vital_configs: {
        Row: {
          created_at: string | null
          custom_max: number | null
          custom_min: number | null
          custom_name: string | null
          custom_step: number | null
          custom_unit: string | null
          display_order: number | null
          enabled: boolean | null
          id: string
          org_id: string
          vital_type_id: string | null
        }
        Insert: {
          created_at?: string | null
          custom_max?: number | null
          custom_min?: number | null
          custom_name?: string | null
          custom_step?: number | null
          custom_unit?: string | null
          display_order?: number | null
          enabled?: boolean | null
          id?: string
          org_id: string
          vital_type_id?: string | null
        }
        Update: {
          created_at?: string | null
          custom_max?: number | null
          custom_min?: number | null
          custom_name?: string | null
          custom_step?: number | null
          custom_unit?: string | null
          display_order?: number | null
          enabled?: boolean | null
          id?: string
          org_id?: string
          vital_type_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_vital_configs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_vital_configs_vital_type_id_fkey"
            columns: ["vital_type_id"]
            isOneToOne: false
            referencedRelation: "vital_types"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          anthropic_baa_verified: boolean
          billing_cycle_start: string | null
          billing_interval: string | null
          cancel_at_period_end: string | null
          cancelled_at: string | null
          clinician_credentials: string | null
          clinician_license_number: string | null
          clinician_npi: string | null
          clinician_signature_url: string | null
          country: string | null
          created_at: string | null
          credits_total: number | null
          credits_used: number | null
          current_period_end: string | null
          data_retention_until: string | null
          gbraid: string | null
          gclid: string | null
          id: string
          last_credit_alert_at: string | null
          letterhead_disclaimer: string | null
          letterhead_logo_url: string | null
          marketing_sms_addon: boolean | null
          name: string
          onboarding_completed_at: string | null
          owner_id: string
          payment_failure_count: number | null
          payment_first_failed_at: string | null
          paypal_subscription_id: string | null
          purged: boolean | null
          quick_doc_shortcuts: Json
          recharge_limit: number | null
          recharge_used: number | null
          signup_ip_hash: string | null
          slug: string
          subscription_plan: string | null
          trial_alert_sent: boolean | null
          trial_end_date: string | null
          updated_at: string
          verified: boolean | null
          wbraid: string | null
        }
        Insert: {
          anthropic_baa_verified?: boolean
          billing_cycle_start?: string | null
          billing_interval?: string | null
          cancel_at_period_end?: string | null
          cancelled_at?: string | null
          clinician_credentials?: string | null
          clinician_license_number?: string | null
          clinician_npi?: string | null
          clinician_signature_url?: string | null
          country?: string | null
          created_at?: string | null
          credits_total?: number | null
          credits_used?: number | null
          current_period_end?: string | null
          data_retention_until?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          last_credit_alert_at?: string | null
          letterhead_disclaimer?: string | null
          letterhead_logo_url?: string | null
          marketing_sms_addon?: boolean | null
          name: string
          onboarding_completed_at?: string | null
          owner_id: string
          payment_failure_count?: number | null
          payment_first_failed_at?: string | null
          paypal_subscription_id?: string | null
          purged?: boolean | null
          quick_doc_shortcuts?: Json
          recharge_limit?: number | null
          recharge_used?: number | null
          signup_ip_hash?: string | null
          slug: string
          subscription_plan?: string | null
          trial_alert_sent?: boolean | null
          trial_end_date?: string | null
          updated_at?: string
          verified?: boolean | null
          wbraid?: string | null
        }
        Update: {
          anthropic_baa_verified?: boolean
          billing_cycle_start?: string | null
          billing_interval?: string | null
          cancel_at_period_end?: string | null
          cancelled_at?: string | null
          clinician_credentials?: string | null
          clinician_license_number?: string | null
          clinician_npi?: string | null
          clinician_signature_url?: string | null
          country?: string | null
          created_at?: string | null
          credits_total?: number | null
          credits_used?: number | null
          current_period_end?: string | null
          data_retention_until?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          last_credit_alert_at?: string | null
          letterhead_disclaimer?: string | null
          letterhead_logo_url?: string | null
          marketing_sms_addon?: boolean | null
          name?: string
          onboarding_completed_at?: string | null
          owner_id?: string
          payment_failure_count?: number | null
          payment_first_failed_at?: string | null
          paypal_subscription_id?: string | null
          purged?: boolean | null
          quick_doc_shortcuts?: Json
          recharge_limit?: number | null
          recharge_used?: number | null
          signup_ip_hash?: string | null
          slug?: string
          subscription_plan?: string | null
          trial_alert_sent?: boolean | null
          trial_end_date?: string | null
          updated_at?: string
          verified?: boolean | null
          wbraid?: string | null
        }
        Relationships: []
      }
      partner_commissions: {
        Row: {
          commission_amount_cents: number
          commission_rate: number
          created_at: string
          eligible_for_payout_at: string
          id: string
          org_id: string
          parent_commission_id: string | null
          partner_id: string
          payment_amount_cents: number
          payment_date: string
          payment_event_id: string
          payout_id: string | null
          referral_id: string
          status: string
        }
        Insert: {
          commission_amount_cents: number
          commission_rate: number
          created_at?: string
          eligible_for_payout_at: string
          id?: string
          org_id: string
          parent_commission_id?: string | null
          partner_id: string
          payment_amount_cents: number
          payment_date: string
          payment_event_id: string
          payout_id?: string | null
          referral_id: string
          status?: string
        }
        Update: {
          commission_amount_cents?: number
          commission_rate?: number
          created_at?: string
          eligible_for_payout_at?: string
          id?: string
          org_id?: string
          parent_commission_id?: string | null
          partner_id?: string
          payment_amount_cents?: number
          payment_date?: string
          payment_event_id?: string
          payout_id?: string | null
          referral_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_commissions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_parent_commission_id_fkey"
            columns: ["parent_commission_id"]
            isOneToOne: false
            referencedRelation: "partner_commissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_payout_fk"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "partner_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "partner_referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payouts: {
        Row: {
          amount_cents: number
          created_at: string
          created_by: string | null
          currency: string
          id: string
          method: string
          notes: string | null
          partner_id: string
          reference: string | null
          status: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          method?: string
          notes?: string | null
          partner_id: string
          reference?: string | null
          status?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          created_by?: string | null
          currency?: string
          id?: string
          method?: string
          notes?: string | null
          partner_id?: string
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_payouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_referrals: {
        Row: {
          affiliate_code_id: string | null
          approval_code_id: string | null
          attributed_at: string
          code_type: string
          code_used: string
          first_payment_at: string | null
          id: string
          org_id: string
          partner_id: string
          signup_ip_hash: string | null
        }
        Insert: {
          affiliate_code_id?: string | null
          approval_code_id?: string | null
          attributed_at?: string
          code_type: string
          code_used: string
          first_payment_at?: string | null
          id?: string
          org_id: string
          partner_id: string
          signup_ip_hash?: string | null
        }
        Update: {
          affiliate_code_id?: string | null
          approval_code_id?: string | null
          attributed_at?: string
          code_type?: string
          code_used?: string
          first_payment_at?: string | null
          id?: string
          org_id?: string
          partner_id?: string
          signup_ip_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_referrals_affiliate_code_id_fkey"
            columns: ["affiliate_code_id"]
            isOneToOne: false
            referencedRelation: "affiliate_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_referrals_approval_code_id_fkey"
            columns: ["approval_code_id"]
            isOneToOne: false
            referencedRelation: "approval_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_referrals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_tos_versions: {
        Row: {
          body_md: string
          published_at: string
          version: string
        }
        Insert: {
          body_md: string
          published_at?: string
          version: string
        }
        Update: {
          body_md?: string
          published_at?: string
          version?: string
        }
        Relationships: []
      }
      partners: {
        Row: {
          auth_uid: string
          commission_rate: number
          country: string
          created_at: string
          display_name: string
          email: string
          first_commission_at: string | null
          hold_days_override: number | null
          id: string
          payout_email: string | null
          payout_method: string
          phone: string | null
          status: string
          tax_form_status: string
          tax_form_url: string | null
          tos_accepted_at: string
          tos_version: string
          total_clawed_back_cents: number
          total_earned_cents: number
          total_paid_out_cents: number
          updated_at: string
        }
        Insert: {
          auth_uid: string
          commission_rate?: number
          country: string
          created_at?: string
          display_name: string
          email: string
          first_commission_at?: string | null
          hold_days_override?: number | null
          id?: string
          payout_email?: string | null
          payout_method?: string
          phone?: string | null
          status?: string
          tax_form_status?: string
          tax_form_url?: string | null
          tos_accepted_at: string
          tos_version: string
          total_clawed_back_cents?: number
          total_earned_cents?: number
          total_paid_out_cents?: number
          updated_at?: string
        }
        Update: {
          auth_uid?: string
          commission_rate?: number
          country?: string
          created_at?: string
          display_name?: string
          email?: string
          first_commission_at?: string | null
          hold_days_override?: number | null
          id?: string
          payout_email?: string | null
          payout_method?: string
          phone?: string | null
          status?: string
          tax_form_status?: string
          tax_form_url?: string | null
          tos_accepted_at?: string
          tos_version?: string
          total_clawed_back_cents?: number
          total_earned_cents?: number
          total_paid_out_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      patient_allergies: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_allergies_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_chronic_conditions: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_chronic_conditions_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_custom_fields: {
        Row: {
          active: boolean
          created_at: string
          field_id: string
          id: string
          org_id: string
          patient_id: string
          updated_at: string
          value: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          field_id: string
          id?: string
          org_id: string
          patient_id: string
          updated_at?: string
          value: string
        }
        Update: {
          active?: boolean
          created_at?: string
          field_id?: string
          id?: string
          org_id?: string
          patient_id?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_custom_fields_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_custom_fields_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_medications: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_medications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_notes: {
        Row: {
          content: string
          created_at: string | null
          doctor_id: string
          id: string
          is_private: boolean | null
          org_id: string
          patient_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          doctor_id: string
          id?: string
          is_private?: boolean | null
          org_id: string
          patient_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          doctor_id?: string
          id?: string
          is_private?: boolean | null
          org_id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_notes_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_pets: {
        Row: {
          active: boolean | null
          created_at: string | null
          id: string
          name: string
          patient_id: string
          updated_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          patient_id: string
          updated_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          patient_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_pets_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_vaccines: {
        Row: {
          administered_at: string
          administered_by: string
          created_at: string | null
          dose_number: number | null
          id: string
          lot_number: string | null
          manufacturer: string | null
          notes: string | null
          org_id: string
          patient_id: string
          refusal_reason: string | null
          refused: boolean | null
          site: string | null
          vaccine_id: string
          visit_id: string | null
        }
        Insert: {
          administered_at?: string
          administered_by: string
          created_at?: string | null
          dose_number?: number | null
          id?: string
          lot_number?: string | null
          manufacturer?: string | null
          notes?: string | null
          org_id: string
          patient_id: string
          refusal_reason?: string | null
          refused?: boolean | null
          site?: string | null
          vaccine_id: string
          visit_id?: string | null
        }
        Update: {
          administered_at?: string
          administered_by?: string
          created_at?: string | null
          dose_number?: number | null
          id?: string
          lot_number?: string | null
          manufacturer?: string | null
          notes?: string | null
          org_id?: string
          patient_id?: string
          refusal_reason?: string | null
          refused?: boolean | null
          site?: string | null
          vaccine_id?: string
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_vaccines_administered_by_fkey"
            columns: ["administered_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vaccines_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vaccines_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vaccines_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vaccines_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_vitals: {
        Row: {
          created_at: string | null
          id: string
          measured_at: string
          notes: string | null
          org_id: string
          patient_id: string
          recorded_by: string
          value: number
          visit_id: string | null
          vital_config_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          measured_at?: string
          notes?: string | null
          org_id: string
          patient_id: string
          recorded_by: string
          value: number
          visit_id?: string | null
          vital_config_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          measured_at?: string
          notes?: string | null
          org_id?: string
          patient_id?: string
          recorded_by?: string
          value?: number
          visit_id?: string | null
          vital_config_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_vitals_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vitals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vitals_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vitals_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_vitals_vital_config_id_fkey"
            columns: ["vital_config_id"]
            isOneToOne: false
            referencedRelation: "org_vital_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      patients: {
        Row: {
          birthday: string
          consent_given: boolean | null
          consent_given_at: string | null
          created_at: string | null
          first_name: string
          id: string
          is_demo_patient: boolean | null
          is_orphaned: boolean | null
          language: string | null
          last_name: string
          marketing_sms_opted_out: boolean | null
          org_id: string
          phone: string | null
          phone_verified: boolean | null
          sex: string | null
          updated_at: string | null
        }
        Insert: {
          birthday: string
          consent_given?: boolean | null
          consent_given_at?: string | null
          created_at?: string | null
          first_name: string
          id?: string
          is_demo_patient?: boolean | null
          is_orphaned?: boolean | null
          language?: string | null
          last_name: string
          marketing_sms_opted_out?: boolean | null
          org_id: string
          phone?: string | null
          phone_verified?: boolean | null
          sex?: string | null
          updated_at?: string | null
        }
        Update: {
          birthday?: string
          consent_given?: boolean | null
          consent_given_at?: string | null
          created_at?: string | null
          first_name?: string
          id?: string
          is_demo_patient?: boolean | null
          is_orphaned?: boolean | null
          language?: string | null
          last_name?: string
          marketing_sms_opted_out?: boolean | null
          org_id?: string
          phone?: string | null
          phone_verified?: boolean | null
          sex?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_ad_conversions: {
        Row: {
          attempt_count: number
          conversion_action: string
          conversion_time: string
          created_at: string
          currency: string | null
          error_message: string | null
          gbraid: string | null
          gclid: string | null
          id: string
          last_attempt_at: string | null
          metadata: Json | null
          order_id: string | null
          org_id: string
          status: string
          user_data: Json | null
          value: number | null
          wbraid: string | null
        }
        Insert: {
          attempt_count?: number
          conversion_action: string
          conversion_time?: string
          created_at?: string
          currency?: string | null
          error_message?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          last_attempt_at?: string | null
          metadata?: Json | null
          order_id?: string | null
          org_id: string
          status?: string
          user_data?: Json | null
          value?: number | null
          wbraid?: string | null
        }
        Update: {
          attempt_count?: number
          conversion_action?: string
          conversion_time?: string
          created_at?: string
          currency?: string | null
          error_message?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          last_attempt_at?: string | null
          metadata?: Json | null
          order_id?: string | null
          org_id?: string
          status?: string
          user_data?: Json | null
          value?: number | null
          wbraid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_ad_conversions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_emails: {
        Row: {
          attachments: Json | null
          attempt_count: number
          created_at: string
          error_message: string | null
          from_name: string | null
          html_body: string
          id: string
          last_attempt_at: string | null
          metadata: Json | null
          priority: number
          reply_to: string | null
          status: string
          subject: string
          text_body: string | null
          to_email: string
        }
        Insert: {
          attachments?: Json | null
          attempt_count?: number
          created_at?: string
          error_message?: string | null
          from_name?: string | null
          html_body: string
          id?: string
          last_attempt_at?: string | null
          metadata?: Json | null
          priority?: number
          reply_to?: string | null
          status?: string
          subject: string
          text_body?: string | null
          to_email: string
        }
        Update: {
          attachments?: Json | null
          attempt_count?: number
          created_at?: string
          error_message?: string | null
          from_name?: string | null
          html_body?: string
          id?: string
          last_attempt_at?: string | null
          metadata?: Json | null
          priority?: number
          reply_to?: string | null
          status?: string
          subject?: string
          text_body?: string | null
          to_email?: string
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          attempts: number | null
          code_hash: string
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          location_id: string | null
          patient_id: string | null
          phone: string
          verified_at: string | null
          visit_id: string | null
        }
        Insert: {
          attempts?: number | null
          code_hash: string
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          location_id?: string | null
          patient_id?: string | null
          phone: string
          verified_at?: string | null
          visit_id?: string | null
        }
        Update: {
          attempts?: number | null
          code_hash?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          location_id?: string | null
          patient_id?: string | null
          phone?: string
          verified_at?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "phone_verifications_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_verifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "phone_verifications_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_checkin_tokens: {
        Row: {
          ai_model_override: string | null
          ai_session_instructions: string | null
          checkin_mode_override: string | null
          created_at: string
          created_by: string
          expires_at: string
          first_name: string | null
          id: string
          last_name: string | null
          location_id: string
          name_match_mode: string
          org_id: string
          session_token: string | null
          skip_ai: boolean
          token: string
          used: boolean
          visit_id: string | null
        }
        Insert: {
          ai_model_override?: string | null
          ai_session_instructions?: string | null
          checkin_mode_override?: string | null
          created_at?: string
          created_by: string
          expires_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          location_id: string
          name_match_mode?: string
          org_id: string
          session_token?: string | null
          skip_ai?: boolean
          token?: string
          used?: boolean
          visit_id?: string | null
        }
        Update: {
          ai_model_override?: string | null
          ai_session_instructions?: string | null
          checkin_mode_override?: string | null
          created_at?: string
          created_by?: string
          expires_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          location_id?: string
          name_match_mode?: string
          org_id?: string
          session_token?: string | null
          skip_ai?: boolean
          token?: string
          used?: boolean
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pre_checkin_tokens_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_checkin_tokens_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_checkin_tokens_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_checkin_tokens_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_webhook_events: {
        Row: {
          event_id: string
          event_type: string
          id: string
          org_id: string | null
          payload: Json | null
          processed_at: string | null
        }
        Insert: {
          event_id: string
          event_type: string
          id?: string
          org_id?: string | null
          payload?: Json | null
          processed_at?: string | null
        }
        Update: {
          event_id?: string
          event_type?: string
          id?: string
          org_id?: string | null
          payload?: Json | null
          processed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processed_webhook_events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          expired_at: string | null
          from_doctor_id: string | null
          from_location_id: string | null
          from_org_id: string | null
          id: string
          included_attachment_ids: string[] | null
          included_visit_ids: string[]
          linked_visit_id: string | null
          patient_birthday: string
          patient_id: string
          patient_name: string
          pdf_url: string | null
          referral_note: string
          source: string
          specialty: string
          status: string
          to_email: string | null
          to_location_id: string | null
          to_org_id: string | null
        }
        Insert: {
          created_at?: string | null
          expired_at?: string | null
          from_doctor_id?: string | null
          from_location_id?: string | null
          from_org_id?: string | null
          id?: string
          included_attachment_ids?: string[] | null
          included_visit_ids: string[]
          linked_visit_id?: string | null
          patient_birthday: string
          patient_id: string
          patient_name: string
          pdf_url?: string | null
          referral_note: string
          source?: string
          specialty: string
          status?: string
          to_email?: string | null
          to_location_id?: string | null
          to_org_id?: string | null
        }
        Update: {
          created_at?: string | null
          expired_at?: string | null
          from_doctor_id?: string | null
          from_location_id?: string | null
          from_org_id?: string | null
          id?: string
          included_attachment_ids?: string[] | null
          included_visit_ids?: string[]
          linked_visit_id?: string | null
          patient_birthday?: string
          patient_id?: string
          patient_name?: string
          pdf_url?: string | null
          referral_note?: string
          source?: string
          specialty?: string
          status?: string
          to_email?: string | null
          to_location_id?: string | null
          to_org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_from_doctor_id_fkey"
            columns: ["from_doctor_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_from_location_id_fkey"
            columns: ["from_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_from_org_id_fkey"
            columns: ["from_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_linked_visit_id_fkey"
            columns: ["linked_visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_to_location_id_fkey"
            columns: ["to_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_to_org_id_fkey"
            columns: ["to_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      review_platforms: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          location_id: string
          org_id: string
          platform_name: string
          platform_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id: string
          org_id: string
          platform_name: string
          platform_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location_id?: string
          org_id?: string
          platform_name?: string
          platform_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_platforms_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_platforms_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      review_rotation: {
        Row: {
          created_at: string | null
          current_platform_id: string | null
          cycle_days: number | null
          id: string
          last_rotated_at: string | null
          location_id: string
          org_id: string
          redirect_min_rating: number | null
        }
        Insert: {
          created_at?: string | null
          current_platform_id?: string | null
          cycle_days?: number | null
          id?: string
          last_rotated_at?: string | null
          location_id: string
          org_id: string
          redirect_min_rating?: number | null
        }
        Update: {
          created_at?: string | null
          current_platform_id?: string | null
          cycle_days?: number | null
          id?: string
          last_rotated_at?: string | null
          location_id?: string
          org_id?: string
          redirect_min_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "review_rotation_current_platform_id_fkey"
            columns: ["current_platform_id"]
            isOneToOne: false
            referencedRelation: "review_platforms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_rotation_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: true
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_rotation_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string | null
          doctor_id: string | null
          external_platform: string | null
          feedback_text: string | null
          id: string
          location_id: string
          org_id: string
          patient_id: string
          rating: number | null
          review_token: string
          sent_to_external: boolean | null
          submitted_at: string | null
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          doctor_id?: string | null
          external_platform?: string | null
          feedback_text?: string | null
          id?: string
          location_id: string
          org_id: string
          patient_id: string
          rating?: number | null
          review_token: string
          sent_to_external?: boolean | null
          submitted_at?: string | null
          visit_id: string
        }
        Update: {
          created_at?: string | null
          doctor_id?: string | null
          external_platform?: string | null
          feedback_text?: string | null
          id?: string
          location_id?: string
          org_id?: string
          patient_id?: string
          rating?: number | null
          review_token?: string
          sent_to_external?: boolean | null
          submitted_at?: string | null
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      scribe_recordings: {
        Row: {
          audio_prefix: string
          consent_attested_at: string
          created_at: string
          created_by: string
          document_id: string | null
          duration_ms: number | null
          error: string | null
          id: string
          language: string
          location_id: string
          org_id: string
          patient_id: string
          segment_count: number
          status: string
          stt_minutes: number | null
          transcribed_segments: number
          updated_at: string
          visit_id: string
        }
        Insert: {
          audio_prefix: string
          consent_attested_at?: string
          created_at?: string
          created_by: string
          document_id?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          language?: string
          location_id: string
          org_id: string
          patient_id: string
          segment_count?: number
          status?: string
          stt_minutes?: number | null
          transcribed_segments?: number
          updated_at?: string
          visit_id: string
        }
        Update: {
          audio_prefix?: string
          consent_attested_at?: string
          created_at?: string
          created_by?: string
          document_id?: string | null
          duration_ms?: number | null
          error?: string | null
          id?: string
          language?: string
          location_id?: string
          org_id?: string
          patient_id?: string
          segment_count?: number
          status?: string
          stt_minutes?: number | null
          transcribed_segments?: number
          updated_at?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scribe_recordings_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scribe_recordings_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "clinical_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scribe_recordings_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scribe_recordings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scribe_recordings_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scribe_recordings_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_campaign_recipients: {
        Row: {
          campaign_id: string
          created_at: string | null
          excluded: boolean | null
          id: string
          match_reason: string | null
          patient_id: string
          phone: string
          sms_log_id: string | null
          status: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          excluded?: boolean | null
          id?: string
          match_reason?: string | null
          patient_id: string
          phone: string
          sms_log_id?: string | null
          status?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          excluded?: boolean | null
          id?: string
          match_reason?: string | null
          patient_id?: string
          phone?: string
          sms_log_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "sms_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_campaign_recipients_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_campaign_recipients_sms_log_id_fkey"
            columns: ["sms_log_id"]
            isOneToOne: false
            referencedRelation: "sms_log"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_campaigns: {
        Row: {
          ai_criteria: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string
          credits_charged: number | null
          failed_count: number | null
          id: string
          location_id: string | null
          matched_count: number | null
          message_body: string | null
          org_id: string
          scan_completed_at: string | null
          scan_started_at: string | null
          send_started_at: string | null
          sent_count: number | null
          status: string | null
          structured_filters: Json | null
          total_scanned: number | null
        }
        Insert: {
          ai_criteria?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by: string
          credits_charged?: number | null
          failed_count?: number | null
          id?: string
          location_id?: string | null
          matched_count?: number | null
          message_body?: string | null
          org_id: string
          scan_completed_at?: string | null
          scan_started_at?: string | null
          send_started_at?: string | null
          sent_count?: number | null
          status?: string | null
          structured_filters?: Json | null
          total_scanned?: number | null
        }
        Update: {
          ai_criteria?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string
          credits_charged?: number | null
          failed_count?: number | null
          id?: string
          location_id?: string | null
          matched_count?: number | null
          message_body?: string | null
          org_id?: string
          scan_completed_at?: string | null
          scan_started_at?: string | null
          send_started_at?: string | null
          sent_count?: number | null
          status?: string | null
          structured_filters?: Json | null
          total_scanned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_campaigns_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_campaigns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_log: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          location_id: string | null
          message_body: string | null
          org_id: string
          patient_id: string | null
          phone: string
          provider_sid: string | null
          sms_type: string
          status: string | null
          visit_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          location_id?: string | null
          message_body?: string | null
          org_id: string
          patient_id?: string | null
          phone: string
          provider_sid?: string | null
          sms_type: string
          status?: string | null
          visit_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          location_id?: string | null
          message_body?: string | null
          org_id?: string
          patient_id?: string | null
          phone?: string
          provider_sid?: string | null
          sms_type?: string
          status?: string | null
          visit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_log_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_log_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sms_log_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_checkins: {
        Row: {
          checked_in_at: string | null
          checked_out_at: string | null
          current_room: string | null
          id: string
          location_id: string
          role: string
          staff_user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          current_room?: string | null
          id?: string
          location_id: string
          role: string
          staff_user_id: string
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          current_room?: string | null
          id?: string
          location_id?: string
          role?: string
          staff_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_checkins_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_checkins_staff_user_id_fkey"
            columns: ["staff_user_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_preferences: {
        Row: {
          created_at: string | null
          notification_sound: boolean | null
          staff_user_id: string
        }
        Insert: {
          created_at?: string | null
          notification_sound?: boolean | null
          staff_user_id: string
        }
        Update: {
          created_at?: string | null
          notification_sound?: boolean | null
          staff_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_preferences_staff_user_id_fkey"
            columns: ["staff_user_id"]
            isOneToOne: true
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          id: string
          location_id: string
          role: string
          staff_user_id: string
          working_hours: number | null
        }
        Insert: {
          id?: string
          location_id: string
          role: string
          staff_user_id: string
          working_hours?: number | null
        }
        Update: {
          id?: string
          location_id?: string
          role?: string
          staff_user_id?: string
          working_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_roles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_roles_staff_user_id_fkey"
            columns: ["staff_user_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_users: {
        Row: {
          auth_uid: string | null
          created_at: string | null
          deleted_at: string | null
          full_name: string
          id: string
          is_active: boolean | null
          is_deleted: boolean | null
          org_id: string
          username: string
        }
        Insert: {
          auth_uid?: string | null
          created_at?: string | null
          deleted_at?: string | null
          full_name: string
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          org_id: string
          username: string
        }
        Update: {
          auth_uid?: string | null
          created_at?: string | null
          deleted_at?: string | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_deleted?: boolean | null
          org_id?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_users_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccine_schedule: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string | null
          dose_number: number
          due_date: string
          id: string
          org_id: string
          patient_id: string
          skipped: boolean | null
          vaccine_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          dose_number?: number
          due_date: string
          id?: string
          org_id: string
          patient_id: string
          skipped?: boolean | null
          vaccine_id: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string | null
          dose_number?: number
          due_date?: string
          id?: string
          org_id?: string
          patient_id?: string
          skipped?: boolean | null
          vaccine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vaccine_schedule_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "patient_vaccines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccine_schedule_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccine_schedule_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vaccine_schedule_vaccine_id_fkey"
            columns: ["vaccine_id"]
            isOneToOne: false
            referencedRelation: "vaccines"
            referencedColumns: ["id"]
          },
        ]
      }
      vaccines: {
        Row: {
          code: string | null
          created_at: string | null
          dose_series: number | null
          id: string
          name: string
          notes: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          dose_series?: number | null
          id?: string
          name: string
          notes?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          dose_series?: number | null
          id?: string
          name?: string
          notes?: string | null
        }
        Relationships: []
      }
      visit_addendums: {
        Row: {
          content: string
          created_at: string | null
          id: string
          visit_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          visit_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_addendums_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_attachments: {
        Row: {
          created_at: string | null
          doctor_id: string
          file_name: string
          file_size: number
          file_url: string
          id: string
          mime_type: string
          org_id: string
          visit_id: string
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          file_name: string
          file_size: number
          file_url: string
          id?: string
          mime_type: string
          org_id: string
          visit_id: string
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          file_name?: string
          file_size?: number
          file_url?: string
          id?: string
          mime_type?: string
          org_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_attachments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_attachments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_attachments_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_messages: {
        Row: {
          content: string
          content_original: string | null
          created_at: string | null
          id: string
          role: string
          visit_id: string
        }
        Insert: {
          content: string
          content_original?: string | null
          created_at?: string | null
          id?: string
          role: string
          visit_id: string
        }
        Update: {
          content?: string
          content_original?: string | null
          created_at?: string | null
          id?: string
          role?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_messages_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_notes: {
        Row: {
          content: string
          created_at: string | null
          doctor_id: string
          id: string
          is_private: boolean | null
          org_id: string
          visit_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          doctor_id: string
          id?: string
          is_private?: boolean | null
          org_id: string
          visit_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          doctor_id?: string
          id?: string
          is_private?: boolean | null
          org_id?: string
          visit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_notes_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_notes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visit_notes_visit_id_fkey"
            columns: ["visit_id"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          ai_completed_at: string | null
          ai_diagnostic: string | null
          ai_model_override: string | null
          ai_model_used: string | null
          ai_session_instructions: string | null
          ai_skipped: boolean | null
          ai_started_at: string | null
          ai_structured_card: Json | null
          ai_summary: string | null
          ai_summary_translated: string | null
          arrived_at: string | null
          care_instructions: string | null
          checkin_mode: string
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          created_at: string | null
          credits_charged: number | null
          demo_features: Json | null
          discovery_source: string | null
          doctor_diagnosis: string | null
          entered_queue_at: string | null
          follow_up_of: string | null
          gave_tablet: boolean | null
          handled: boolean | null
          has_previous_visits: boolean | null
          has_referral: boolean | null
          id: string
          is_follow_up: boolean | null
          is_return_visit: boolean | null
          is_sensitive: boolean | null
          location_id: string
          manually_added: boolean | null
          nurse_notes: string | null
          nurse_reviewed: boolean | null
          org_id: string
          patient_approved: boolean | null
          patient_approved_at: string | null
          patient_denied: boolean | null
          patient_id: string
          pending_phone: string | null
          phone_verification_pending: boolean | null
          prescreening_data: Json | null
          priority: number | null
          queue_number: number | null
          review_sms_sent: boolean | null
          review_token: string | null
          self_reported_referral: boolean | null
          self_reported_referrer: string | null
          session_token: string
          staff_room: string | null
          status: string
          summary_show_diagnosis: boolean | null
          summary_sms_sent: boolean | null
          summary_token: string | null
          team_code: string | null
          timeout_flagged: boolean | null
          updated_at: string | null
        }
        Insert: {
          ai_completed_at?: string | null
          ai_diagnostic?: string | null
          ai_model_override?: string | null
          ai_model_used?: string | null
          ai_session_instructions?: string | null
          ai_skipped?: boolean | null
          ai_started_at?: string | null
          ai_structured_card?: Json | null
          ai_summary?: string | null
          ai_summary_translated?: string | null
          arrived_at?: string | null
          care_instructions?: string | null
          checkin_mode?: string
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_charged?: number | null
          demo_features?: Json | null
          discovery_source?: string | null
          doctor_diagnosis?: string | null
          entered_queue_at?: string | null
          follow_up_of?: string | null
          gave_tablet?: boolean | null
          handled?: boolean | null
          has_previous_visits?: boolean | null
          has_referral?: boolean | null
          id?: string
          is_follow_up?: boolean | null
          is_return_visit?: boolean | null
          is_sensitive?: boolean | null
          location_id: string
          manually_added?: boolean | null
          nurse_notes?: string | null
          nurse_reviewed?: boolean | null
          org_id: string
          patient_approved?: boolean | null
          patient_approved_at?: string | null
          patient_denied?: boolean | null
          patient_id: string
          pending_phone?: string | null
          phone_verification_pending?: boolean | null
          prescreening_data?: Json | null
          priority?: number | null
          queue_number?: number | null
          review_sms_sent?: boolean | null
          review_token?: string | null
          self_reported_referral?: boolean | null
          self_reported_referrer?: string | null
          session_token?: string
          staff_room?: string | null
          status?: string
          summary_show_diagnosis?: boolean | null
          summary_sms_sent?: boolean | null
          summary_token?: string | null
          team_code?: string | null
          timeout_flagged?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ai_completed_at?: string | null
          ai_diagnostic?: string | null
          ai_model_override?: string | null
          ai_model_used?: string | null
          ai_session_instructions?: string | null
          ai_skipped?: boolean | null
          ai_started_at?: string | null
          ai_structured_card?: Json | null
          ai_summary?: string | null
          ai_summary_translated?: string | null
          arrived_at?: string | null
          care_instructions?: string | null
          checkin_mode?: string
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_charged?: number | null
          demo_features?: Json | null
          discovery_source?: string | null
          doctor_diagnosis?: string | null
          entered_queue_at?: string | null
          follow_up_of?: string | null
          gave_tablet?: boolean | null
          handled?: boolean | null
          has_previous_visits?: boolean | null
          has_referral?: boolean | null
          id?: string
          is_follow_up?: boolean | null
          is_return_visit?: boolean | null
          is_sensitive?: boolean | null
          location_id?: string
          manually_added?: boolean | null
          nurse_notes?: string | null
          nurse_reviewed?: boolean | null
          org_id?: string
          patient_approved?: boolean | null
          patient_approved_at?: string | null
          patient_denied?: boolean | null
          patient_id?: string
          pending_phone?: string | null
          phone_verification_pending?: boolean | null
          prescreening_data?: Json | null
          priority?: number | null
          queue_number?: number | null
          review_sms_sent?: boolean | null
          review_token?: string | null
          self_reported_referral?: boolean | null
          self_reported_referrer?: string | null
          session_token?: string
          staff_room?: string | null
          status?: string
          summary_show_diagnosis?: boolean | null
          summary_sms_sent?: boolean | null
          summary_token?: string | null
          team_code?: string | null
          timeout_flagged?: boolean | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_claimed_by_fkey"
            columns: ["claimed_by"]
            isOneToOne: false
            referencedRelation: "staff_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_follow_up_of_fkey"
            columns: ["follow_up_of"]
            isOneToOne: false
            referencedRelation: "visits"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      vital_types: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          max_value: number | null
          min_value: number | null
          name: string
          step_value: number | null
          unit: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          name: string
          step_value?: number | null
          unit: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          max_value?: number | null
          min_value?: number | null
          name?: string
          step_value?: number | null
          unit?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_subscription: {
        Args: {
          p_billing_interval?: string
          p_org_id: string
          p_paypal_subscription_id: string
          p_plan: string
        }
        Returns: Json
      }
      add_addendum: {
        Args: { p_content: string; p_session_token: string; p_visit_id: string }
        Returns: Json
      }
      add_location_video: {
        Args: {
          p_file_name: string
          p_file_size: number
          p_location_id: string
          p_mime_type: string
          p_storage_path: string
        }
        Returns: Json
      }
      add_patient_note: {
        Args: {
          p_content: string
          p_is_private?: boolean
          p_patient_id: string
        }
        Returns: Json
      }
      add_patient_to_queue: {
        Args: {
          p_birthday?: string
          p_claim?: boolean
          p_first_name?: string
          p_force_new?: boolean
          p_language?: string
          p_last_name?: string
          p_location_id: string
          p_patient_id?: string
          p_phone?: string
          p_sex?: string
        }
        Returns: Json
      }
      add_vaccine_schedule_entry: {
        Args: {
          p_dose_number?: number
          p_due_date?: string
          p_patient_id: string
          p_vaccine_id: string
        }
        Returns: Json
      }
      add_visit_note: {
        Args: { p_content: string; p_is_private?: boolean; p_visit_id: string }
        Returns: Json
      }
      admin_adjust_partner_status: {
        Args: { p_partner_id: string; p_reason?: string; p_status: string }
        Returns: Json
      }
      admin_attach_tax_form: {
        Args: { p_form_url: string; p_partner_id: string }
        Returns: Json
      }
      admin_create_payout: {
        Args: { p_notes?: string; p_partner_id: string; p_reference?: string }
        Returns: Json
      }
      admin_create_premium_code: {
        Args: {
          p_domain?: string
          p_email?: string
          p_phone?: string
          p_send_email?: boolean
        }
        Returns: Json
      }
      admin_get_pending_payouts: { Args: never; Returns: Json }
      admin_list_organizations: { Args: { p_search?: string }; Returns: Json }
      admin_list_partners: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_status?: string
        }
        Returns: Json
      }
      admin_list_premium_codes: { Args: never; Returns: Json }
      admin_set_enterprise_plan: {
        Args: {
          p_action?: string
          p_credits_total?: number
          p_org_id: string
          p_paypal_subscription_id?: string
        }
        Returns: Json
      }
      advance_after_prescreening: {
        Args: { p_session_token: string }
        Returns: Json
      }
      apply_premium_code: { Args: { p_code: string }; Returns: Json }
      approve_patient: {
        Args: {
          p_follow_up_id?: string
          p_follow_up_of_visit_id?: string
          p_is_follow_up?: boolean
          p_visit_id: string
        }
        Returns: Json
      }
      approve_summary: {
        Args: { p_session_token: string; p_visit_id: string }
        Returns: Json
      }
      assign_role: {
        Args: { p_location_id: string; p_role: string; p_staff_user_id: string }
        Returns: Json
      }
      cancel_campaign: { Args: { p_campaign_id: string }; Returns: Json }
      cancel_claim: { Args: { p_visit_id: string }; Returns: Json }
      cancel_patient_checkin: {
        Args: { p_session_token: string; p_visit_id: string }
        Returns: Json
      }
      cancel_scribe_recording: {
        Args: { p_reason?: string; p_recording_id: string }
        Returns: Json
      }
      cancel_subscription: { Args: never; Returns: Json }
      capture_email: {
        Args: { p_email: string; p_source?: string }
        Returns: undefined
      }
      change_subscription_plan: { Args: { p_new_plan: string }; Returns: Json }
      check_and_deduct_feature_budget: {
        Args: {
          p_amount: number
          p_description?: string
          p_document_id?: string
          p_feature: string
          p_org_id: string
          p_visit_id?: string
        }
        Returns: Json
      }
      check_credits: { Args: { p_org_id: string }; Returns: number }
      check_incoming_referral: {
        Args: {
          p_birthday: string
          p_first_name: string
          p_last_name: string
          p_location_id: string
        }
        Returns: Json
      }
      check_location_active: { Args: { p_location_id: string }; Returns: Json }
      checkin_patient: {
        Args: {
          p_birthday: string
          p_first_name: string
          p_last_name: string
          p_location_id: string
          p_phone?: string
          p_referred_by?: string
          p_sex?: string
          p_team_code?: string
          p_was_referred?: boolean
        }
        Returns: Json
      }
      checkin_with_token: {
        Args: {
          p_birthday: string
          p_first_name: string
          p_last_name: string
          p_phone?: string
          p_sex?: string
          p_token: string
        }
        Returns: Json
      }
      claim_patient: { Args: { p_visit_id: string }; Returns: Json }
      cleanup_demo_data: { Args: never; Returns: undefined }
      complete_campaign_sending: {
        Args: { p_campaign_id: string }
        Returns: Json
      }
      complete_onboarding: { Args: never; Returns: Json }
      complete_referral: { Args: { p_referral_id: string }; Returns: Json }
      complete_visit: {
        Args: {
          p_care_instructions?: string
          p_diagnosis: string
          p_follow_up?: Json
          p_show_diagnosis?: boolean
          p_visit_id: string
        }
        Returns: Json
      }
      configure_org_vitals: { Args: { p_configs: Json }; Returns: Json }
      configure_review_platforms: {
        Args: { p_location_id: string; p_platforms: Json }
        Returns: Json
      }
      confirm_arrival: {
        Args: { p_session_token: string; p_visit_id: string }
        Returns: Json
      }
      count_active_providers: { Args: { p_org_id: string }; Returns: number }
      create_document: {
        Args: {
          p_input_fields?: Json
          p_location_id: string
          p_patient_id: string
          p_template_key: string
          p_visit_id: string
        }
        Returns: Json
      }
      create_follow_up: {
        Args: { p_ai_instructions?: string; p_visit_id: string }
        Returns: Json
      }
      create_location: {
        Args: {
          p_address?: string
          p_diagnostic_enabled?: boolean
          p_name: string
          p_nurse_enabled?: boolean
          p_operating_hours?: Json
          p_org_id: string
          p_preset_rooms?: string[]
          p_queue_type?: string
          p_raven_api_key?: string
          p_review_sms_enabled?: boolean
          p_skip_ai?: boolean
          p_specialty?: string
          p_vaccines_enabled?: boolean
          p_vitals_enabled?: boolean
        }
        Returns: Json
      }
      create_organization:
        | {
            Args: {
              p_approval_code?: string
              p_name: string
              p_owner_auth_uid: string
              p_signup_ip?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_approval_code?: string
              p_gbraid?: string
              p_gclid?: string
              p_name: string
              p_owner_auth_uid: string
              p_signup_ip?: string
              p_wbraid?: string
            }
            Returns: Json
          }
      create_pre_checkin_token: {
        Args: {
          p_ai_model?: string
          p_ai_session_instructions?: string
          p_checkin_mode_override?: string
          p_first_name: string
          p_last_name: string
          p_location_id: string
          p_name_match_mode?: string
          p_skip_ai?: boolean
        }
        Returns: Json
      }
      create_referral: {
        Args: {
          p_included_attachment_ids?: string[]
          p_included_visit_ids: string[]
          p_patient_id: string
          p_referral_note: string
          p_specialty: string
          p_to_email?: string
          p_to_location_id?: string
        }
        Returns: Json
      }
      create_self_reported_referral: {
        Args: { p_referred_by?: string; p_visit_id: string }
        Returns: Json
      }
      create_sms_campaign: {
        Args: {
          p_ai_criteria?: string
          p_location_id?: string
          p_structured_filters: Json
        }
        Returns: Json
      }
      create_staff_user: {
        Args: {
          p_full_name: string
          p_location_id: string
          p_org_id: string
          p_password: string
          p_roles: string[]
          p_username: string
        }
        Returns: Json
      }
      deactivate_account: { Args: never; Returns: Json }
      deactivate_staff: { Args: { p_staff_user_id: string }; Returns: Json }
      deduct_credits: {
        Args: { p_ai_model: string; p_org_id: string; p_visit_id: string }
        Returns: Json
      }
      deduct_document_credits: {
        Args: { p_document_id: string; p_org_id: string; p_tier: string }
        Returns: Json
      }
      deduct_scribe_credits: {
        Args: {
          p_audio_minutes: number
          p_org_id: string
          p_tier: string
          p_visit_id: string
        }
        Returns: Json
      }
      delete_location_video: { Args: { p_video_id: string }; Returns: Json }
      delete_staff: { Args: { p_staff_user_id: string }; Returns: Json }
      deny_patient: { Args: { p_visit_id: string }; Returns: Json }
      draft_document_content: { Args: { p_document_id: string }; Returns: Json }
      edit_patient_record: {
        Args: {
          p_birthday?: string
          p_first_name?: string
          p_last_name?: string
          p_patient_id: string
          p_phone?: string
          p_sex?: string
        }
        Returns: Json
      }
      enqueue_ad_conversion: {
        Args: {
          p_currency: string
          p_order_id: string
          p_org_id: string
          p_value: number
        }
        Returns: undefined
      }
      exclude_campaign_recipient: {
        Args: {
          p_campaign_id: string
          p_excluded: boolean
          p_recipient_id: string
        }
        Returns: Json
      }
      extend_commission_dispute_hold: {
        Args: { p_payment_event_id: string }
        Returns: Json
      }
      extend_document_token: { Args: { p_document_id: string }; Returns: Json }
      finalize_campaign_scan: {
        Args: { p_campaign_id: string; p_total_scanned: number }
        Returns: Json
      }
      finalize_scribe_recording: {
        Args: {
          p_duration_ms: number
          p_recording_id: string
          p_segment_count: number
        }
        Returns: Json
      }
      generate_summary_token: { Args: { p_visit_id: string }; Returns: Json }
      get_active_follow_ups: { Args: { p_patient_id: string }; Returns: Json }
      get_audit_trail: {
        Args: {
          p_actor_id?: string
          p_cursor_created_at?: string
          p_cursor_id?: string
          p_end_date?: string
          p_entity_id?: string
          p_entity_type?: string
          p_limit?: number
          p_org_id: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_campaign_detail: { Args: { p_campaign_id: string }; Returns: Json }
      get_campaign_list: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_campaign_patient_count: {
        Args: { p_location_id?: string; p_structured_filters?: Json }
        Returns: Json
      }
      get_campaign_patients: {
        Args: { p_campaign_id: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_checked_in_doctors: { Args: { p_location_id: string }; Returns: Json }
      get_claimed_patients: { Args: { p_location_id: string }; Returns: Json }
      get_completed_and_left_visits: {
        Args: {
          p_cursor_completed?: string
          p_cursor_left?: string
          p_date?: string
          p_location_id: string
          p_page_size?: number
        }
        Returns: Json
      }
      get_conversation: {
        Args: { p_session_token?: string; p_visit_id: string }
        Returns: Json
      }
      get_credit_dashboard: { Args: never; Returns: Json }
      get_current_review_platform: {
        Args: { p_location_id: string }
        Returns: Json
      }
      get_demo_tracker: { Args: { p_team_code: string }; Returns: Json }
      get_discovery_stats: {
        Args: {
          p_end_date?: string
          p_location_id?: string
          p_org_id?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_document_for_staff: { Args: { p_document_id: string }; Returns: Json }
      get_document_public: {
        Args: {
          p_ip_hash?: string
          p_pin?: string
          p_token: string
          p_user_agent?: string
        }
        Returns: Json
      }
      get_employee_stats: {
        Args: {
          p_end_date?: string
          p_location_id: string
          p_staff_user_id?: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_followup_compliance: {
        Args: {
          p_end_date: string
          p_location_id: string
          p_start_date: string
        }
        Returns: Json
      }
      get_location_detail: { Args: { p_location_id: string }; Returns: Json }
      get_locations: { Args: never; Returns: Json }
      get_my_org: { Args: never; Returns: Json }
      get_my_roles: { Args: never; Returns: Json }
      get_my_staff_user: { Args: never; Returns: Json }
      get_notes_for_patient: {
        Args: { p_cursor?: string; p_limit?: number; p_patient_id: string }
        Returns: Json
      }
      get_notes_for_visit: { Args: { p_visit_id: string }; Returns: Json }
      get_org_vital_configs: { Args: never; Returns: Json }
      get_org_vital_configs_all: { Args: never; Returns: Json }
      get_organization_overview: { Args: never; Returns: Json }
      get_partner_commissions: {
        Args: { p_limit?: number; p_offset?: number; p_status?: string }
        Returns: Json
      }
      get_partner_dashboard: { Args: never; Returns: Json }
      get_partner_payouts: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_partner_referrals: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_past_visit_summaries: {
        Args: { p_limit?: number; p_patient_id: string }
        Returns: Json
      }
      get_patient_full_profile: {
        Args: { p_patient_id: string }
        Returns: Json
      }
      get_patient_medical_records: {
        Args: { p_patient_id: string }
        Returns: Json
      }
      get_patient_profile: { Args: { p_patient_id: string }; Returns: Json }
      get_patient_return_rate: {
        Args: { p_end_date: string; p_org_id: string; p_start_date: string }
        Returns: Json
      }
      get_patient_session: { Args: { p_session_token: string }; Returns: Json }
      get_patient_stats: {
        Args: {
          p_end_date?: string
          p_location_id: string
          p_start_date?: string
        }
        Returns: Json
      }
      get_patient_visit_history: {
        Args: { p_cursor?: string; p_limit?: number; p_patient_id: string }
        Returns: Json
      }
      get_pending_approvals: { Args: { p_location_id: string }; Returns: Json }
      get_queue: { Args: { p_location_id: string }; Returns: Json }
      get_queue_display: { Args: { p_location_id: string }; Returns: Json }
      get_recent_staff_rooms: { Args: never; Returns: Json }
      get_receptionist_counts: {
        Args: { p_location_id: string }
        Returns: Json
      }
      get_referral_analytics: {
        Args: { p_end_date: string; p_org_id: string; p_start_date: string }
        Returns: Json
      }
      get_referral_detail: { Args: { p_referral_id: string }; Returns: Json }
      get_referral_history: {
        Args: { p_cursor?: string; p_doctor_id: string; p_limit?: number }
        Returns: Json
      }
      get_referral_inbox: {
        Args: { p_cursor?: string; p_limit?: number; p_location_id: string }
        Returns: Json
      }
      get_review_hub: {
        Args: {
          p_cursor_id?: string
          p_cursor_ts?: string
          p_date_end?: string
          p_date_start?: string
          p_doctor_id?: string
          p_limit?: number
          p_location_id: string
          p_rating?: number
        }
        Returns: Json
      }
      get_review_page: { Args: { p_token: string }; Returns: Json }
      get_review_platforms: { Args: { p_location_id: string }; Returns: Json }
      get_scribe_recording: { Args: { p_recording_id: string }; Returns: Json }
      get_similar_patients: {
        Args: {
          p_birthday: string
          p_first_name: string
          p_last_name: string
          p_org_id: string
        }
        Returns: Json
      }
      get_staff_list: {
        Args: { p_location_id?: string; p_org_id: string }
        Returns: Json
      }
      get_stale_session_count: {
        Args: { p_location_id: string }
        Returns: Json
      }
      get_vaccine_history: { Args: { p_patient_id: string }; Returns: Json }
      get_vaccine_schedule: { Args: { p_patient_id: string }; Returns: Json }
      get_vaccines_master_list: { Args: never; Returns: Json }
      get_visit_attachments: { Args: { p_visit_id: string }; Returns: Json }
      get_visit_detail: { Args: { p_visit_id: string }; Returns: Json }
      get_visit_status: { Args: { p_visit_id: string }; Returns: Json }
      get_visit_summary_public: { Args: { p_token: string }; Returns: Json }
      get_visit_vitals_text: {
        Args: { p_visit_id: string }
        Returns: {
          name: string
          unit: string
          value: number
        }[]
      }
      get_vital_types_master_list: { Args: never; Returns: Json }
      get_vitals_history: { Args: { p_patient_id: string }; Returns: Json }
      get_wait_time_heatmap: {
        Args: {
          p_end_date: string
          p_location_id: string
          p_start_date: string
        }
        Returns: Json
      }
      get_waitlist_count: { Args: never; Returns: number }
      give_patient_consent: {
        Args: { p_language: string; p_session_token: string }
        Returns: Json
      }
      handle_patient: { Args: { p_visit_id: string }; Returns: Json }
      handle_payment_failure: { Args: { p_org_id: string }; Returns: Json }
      increment_verification_attempt: {
        Args: { p_verification_id: string }
        Returns: number
      }
      initialize_org_default_vitals: { Args: never; Returns: Json }
      link_referral_to_visit: {
        Args: { p_referral_id: string; p_visit_id: string }
        Returns: Json
      }
      list_documents_for_patient: {
        Args: { p_patient_id: string }
        Returns: Json
      }
      list_documents_for_visit: { Args: { p_visit_id: string }; Returns: Json }
      list_location_videos: { Args: { p_location_id: string }; Returns: Json }
      list_pending_document_approvals: { Args: never; Returns: Json }
      log_phi_access: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: undefined
      }
      lookup_partner_by_code: { Args: { p_code: string }; Returns: Json }
      mark_follow_up_completed: {
        Args: { p_follow_up_id: string }
        Returns: Json
      }
      mark_patient_left: { Args: { p_visit_id: string }; Returns: Json }
      merge_visit_to_patient: {
        Args: { p_target_patient_id: string; p_visit_id: string }
        Returns: Json
      }
      move_to_queue_on_error: {
        Args: { p_session_token: string; p_visit_id: string }
        Returns: Json
      }
      nurse_release_to_doctor: {
        Args: { p_nurse_notes: string; p_visit_id: string }
        Returns: Json
      }
      partner_create_affiliate_code: {
        Args: { p_force_replace?: boolean }
        Returns: Json
      }
      partner_create_premium_trial_code: {
        Args: {
          p_consent_to_email?: boolean
          p_target_domain?: string
          p_target_email?: string
          p_target_phone?: string
        }
        Returns: Json
      }
      private_get_vault_secret: { Args: { p_name: string }; Returns: string }
      purchase_feature_topup: {
        Args: { p_credits: number; p_feature: string }
        Returns: Json
      }
      purchase_overage_credits: { Args: { p_amount: number }; Returns: Json }
      purge_expired_orgs: { Args: never; Returns: Json }
      reactivate_referral: { Args: { p_referral_id: string }; Returns: Json }
      reactivate_staff: { Args: { p_staff_user_id: string }; Returns: Json }
      record_partner_clawback: {
        Args: {
          p_payment_event_id: string
          p_refund_amount_cents: number
          p_refund_event_id: string
        }
        Returns: Json
      }
      record_partner_commission: {
        Args: {
          p_org_id: string
          p_payment_amount_cents: number
          p_payment_date: string
          p_payment_event_id: string
        }
        Returns: Json
      }
      record_vaccine: {
        Args: {
          p_custom_vaccine_name?: string
          p_dose_number?: number
          p_lot_number?: string
          p_manufacturer?: string
          p_notes?: string
          p_patient_id: string
          p_refusal_reason?: string
          p_refused?: boolean
          p_site?: string
          p_vaccine_id?: string
          p_visit_id: string
        }
        Returns: Json
      }
      record_vitals: {
        Args: { p_patient_id: string; p_readings: Json; p_visit_id: string }
        Returns: Json
      }
      register_partner: {
        Args: {
          p_auth_uid: string
          p_country: string
          p_display_name: string
          p_email: string
          p_payout_email: string
          p_phone: string
          p_tos_version: string
        }
        Returns: Json
      }
      register_partner_for_existing_user: {
        Args: {
          p_country: string
          p_display_name: string
          p_payout_email: string
          p_phone: string
          p_tos_version: string
        }
        Returns: Json
      }
      reject_summary: {
        Args: { p_session_token: string; p_visit_id: string }
        Returns: Json
      }
      remove_role: {
        Args: { p_location_id: string; p_role: string; p_staff_user_id: string }
        Returns: Json
      }
      reorder_location_videos: {
        Args: { p_location_id: string; p_video_ids: string[] }
        Returns: Json
      }
      request_demo_otp: {
        Args: { p_email: string; p_team_code?: string }
        Returns: Json
      }
      request_document_as_receptionist: {
        Args: {
          p_input_fields?: Json
          p_location_id: string
          p_patient_id: string
          p_template_key: string
          p_visit_id: string
        }
        Returns: Json
      }
      request_prelog_demo: { Args: { p_email: string }; Returns: Json }
      request_premium_code: {
        Args: {
          p_domain?: string
          p_email?: string
          p_phone?: string
          p_send_email?: boolean
        }
        Returns: Json
      }
      requesting_org_id: { Args: never; Returns: string }
      requesting_partner_id: { Args: never; Returns: string }
      reset_commission_hold: {
        Args: { p_payment_event_id: string }
        Returns: Json
      }
      reset_monthly_credits: { Args: { p_org_id: string }; Returns: Json }
      reset_staff_password: {
        Args: { p_new_password: string; p_staff_user_id: string }
        Returns: Json
      }
      resolve_potential_match: {
        Args: {
          p_action?: string
          p_birthday: string
          p_first_name: string
          p_last_name: string
          p_location_id: string
          p_old_phone?: string
          p_phone?: string
          p_referred_by?: string
          p_sex?: string
          p_was_referred?: boolean
        }
        Returns: Json
      }
      rotate_review_platforms: { Args: never; Returns: undefined }
      save_campaign_matches: {
        Args: { p_campaign_id: string; p_matches: Json }
        Returns: Json
      }
      save_document_edit: {
        Args: { p_content_body: string; p_document_id: string }
        Returns: Json
      }
      save_physical_exam: {
        Args: {
          p_document_id: string
          p_physical_exam_mode: string
          p_physical_exam_raw: string
        }
        Returns: Json
      }
      save_prescreening_data: {
        Args: { p_data: Json; p_session_token: string }
        Returns: Json
      }
      save_summary: {
        Args: {
          p_diagnostic?: string
          p_structured_card?: Json
          p_summary: string
          p_visit_id: string
        }
        Returns: Json
      }
      search_locations_public: {
        Args: { p_exclude_org_id: string; p_query: string }
        Returns: Json
      }
      search_patients: {
        Args: { p_birthday?: string; p_limit?: number; p_query: string }
        Returns: Json
      }
      search_referral_inbox: {
        Args: { p_location_id: string; p_query: string }
        Returns: Json
      }
      seed_demo_batch: {
        Args: { p_data: Json; p_location_id: string; p_org_id: string }
        Returns: number
      }
      send_campaign: { Args: { p_campaign_id: string }; Returns: Json }
      send_patient_message: {
        Args: {
          p_content: string
          p_content_original?: string
          p_session_token: string
          p_visit_id: string
        }
        Returns: Json
      }
      set_discovery_source: {
        Args: { p_source: string; p_visit_id: string }
        Returns: Json
      }
      set_recharge_limit: { Args: { p_limit: number }; Returns: Json }
      set_review_cycle: {
        Args: {
          p_cycle_days: number
          p_location_id: string
          p_redirect_min_rating?: number
        }
        Returns: Json
      }
      set_sensitive_flag: { Args: { p_visit_id: string }; Returns: Json }
      set_staff_room: { Args: { p_room: string }; Returns: Json }
      set_visit_ai_override: {
        Args: { p_ai_model?: string; p_visit_id: string }
        Returns: Json
      }
      set_visit_ai_session_instructions: {
        Args: { p_instructions?: string; p_visit_id: string }
        Returns: Json
      }
      set_visit_demo_features: {
        Args: { p_features: Json; p_visit_id: string }
        Returns: Json
      }
      setup_onboarding_demo: { Args: { p_location_id: string }; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sign_document: {
        Args: {
          p_content_body: string
          p_delivery_channels?: string[]
          p_document_id: string
        }
        Returns: Json
      }
      skip_ai_to_queue: { Args: { p_visit_id: string }; Returns: Json }
      staff_check_in: {
        Args: { p_location_id: string; p_role: string; p_room?: string }
        Returns: Json
      }
      staff_check_out: {
        Args: { p_force?: boolean; p_staff_user_id?: string }
        Returns: Json
      }
      start_ai_conversation: {
        Args: { p_session_token: string; p_visit_id: string }
        Returns: Json
      }
      start_scribe_recording: {
        Args: { p_language?: string; p_visit_id: string }
        Returns: Json
      }
      store_ai_message: {
        Args: {
          p_content: string
          p_content_original?: string
          p_visit_id: string
        }
        Returns: Json
      }
      submit_contact:
        | {
            Args: {
              p_city?: string
              p_clinic_name: string
              p_contact_name: string
              p_email: string
              p_interest?: string
              p_notes?: string
              p_phone?: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_city?: string
              p_clinic_name: string
              p_contact_name: string
              p_country?: string
              p_email: string
              p_interest?: string
              p_notes?: string
              p_phone?: string
            }
            Returns: undefined
          }
      submit_feature_request: { Args: { p_content: string }; Returns: Json }
      submit_prospect: {
        Args: {
          p_city?: string
          p_clinic_name: string
          p_contact_name: string
          p_email: string
          p_interest?: string
          p_notes?: string
          p_phone?: string
        }
        Returns: undefined
      }
      submit_review: {
        Args: { p_feedback_text?: string; p_rating: number; p_token: string }
        Returns: Json
      }
      sync_demo_location_features: {
        Args: {
          p_location_id: string
          p_nurse_enabled: boolean
          p_review_sms_enabled: boolean
          p_vaccines_enabled: boolean
          p_vitals_enabled: boolean
        }
        Returns: Json
      }
      toggle_addon: {
        Args: { p_addon_type: string; p_enabled: boolean }
        Returns: Json
      }
      toggle_gave_tablet: { Args: { p_visit_id: string }; Returns: Json }
      toggle_location_addon: {
        Args: {
          p_addon_type: string
          p_enabled: boolean
          p_location_id: string
        }
        Returns: Json
      }
      trigger_review_sms: { Args: { p_visit_id: string }; Returns: Json }
      trigger_visit_summary_sms: { Args: { p_visit_id: string }; Returns: Json }
      update_ai_model_config: {
        Args: { p_combo: Json; p_tier: string }
        Returns: Json
      }
      update_ai_plan_config: {
        Args: { p_combo: Json; p_plan: string }
        Returns: Json
      }
      update_allergies: {
        Args: { p_allergies: string[]; p_patient_id: string }
        Returns: Json
      }
      update_campaign_message: {
        Args: { p_campaign_id: string; p_message_body: string }
        Returns: Json
      }
      update_chronic_conditions: {
        Args: { p_conditions: string[]; p_patient_id: string }
        Returns: Json
      }
      update_location: {
        Args: {
          p_address?: string
          p_ai_custom_instructions?: string
          p_ai_message_limit?: number
          p_ai_model?: string
          p_ask_discovery_source?: boolean
          p_ask_referral_source?: boolean
          p_checkin_mode?: string
          p_diagnostic_enabled?: boolean
          p_display_format?: string
          p_location_id: string
          p_logo_url?: string
          p_name?: string
          p_nurse_enabled?: boolean
          p_nurse_first_workflow?: boolean
          p_operating_hours?: Json
          p_prescreening_config?: Json
          p_preset_rooms?: string[]
          p_queue_display_enabled?: boolean
          p_queue_type?: string
          p_raven_api_key?: string
          p_referral_email?: string
          p_review_sms_enabled?: boolean
          p_show_doctor_room_to_patients?: boolean
          p_skip_ai?: boolean
          p_specialty?: string
          p_tablet_count?: number
          p_timezone?: string
          p_vaccines_enabled?: boolean
          p_vitals_enabled?: boolean
        }
        Returns: Json
      }
      update_medications: {
        Args: { p_medications: string[]; p_patient_id: string }
        Returns: Json
      }
      update_note_preference: {
        Args: { p_default_private: boolean; p_patient_id: string }
        Returns: Json
      }
      update_organization: { Args: { p_name: string }; Returns: Json }
      update_organization_country: {
        Args: { p_country: string }
        Returns: undefined
      }
      update_organization_name: { Args: { p_name: string }; Returns: undefined }
      update_partner_profile: {
        Args: {
          p_country?: string
          p_display_name?: string
          p_payout_email?: string
          p_payout_method?: string
          p_phone?: string
        }
        Returns: Json
      }
      update_patient_custom_field: {
        Args: {
          p_field_id: string
          p_org_id: string
          p_patient_id: string
          p_values: string[]
        }
        Returns: Json
      }
      update_pets: {
        Args: { p_patient_id: string; p_pets: string[] }
        Returns: Json
      }
      update_tv_display_config: {
        Args: {
          p_audio_muted: boolean
          p_location_id: string
          p_mode: string
          p_overlay_visible: boolean
          p_position: string
          p_queue_duration_seconds: number
        }
        Returns: Json
      }
      update_visit_priority: {
        Args: { p_priority: number; p_visit_id: string }
        Returns: Json
      }
      update_visit_status_system: {
        Args: {
          p_action?: string
          p_new_status: string
          p_timeout_flagged?: boolean
          p_visit_id: string
        }
        Returns: Json
      }
      upload_attachment: {
        Args: {
          p_file_name: string
          p_file_size: number
          p_file_url: string
          p_mime_type: string
          p_visit_id: string
        }
        Returns: Json
      }
      validate_approval_code: { Args: { p_code: string }; Returns: Json }
      validate_pre_checkin_token: { Args: { p_token: string }; Returns: Json }
      verify_demo_otp: {
        Args: { p_code: string; p_email: string }
        Returns: Json
      }
      verify_phone_and_link: {
        Args: { p_phone: string; p_session_token: string; p_visit_id: string }
        Returns: Json
      }
      void_document: {
        Args: { p_document_id: string; p_reason: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
