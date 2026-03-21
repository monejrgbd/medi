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
      approval_codes: {
        Row: {
          code: string
          created_at: string | null
          domain: string | null
          email: string | null
          email_sent: boolean | null
          expires_at: string | null
          id: string
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
          phone?: string | null
          send_after?: string | null
          used_at?: string | null
          used_by_org_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "approval_codes_used_by_org_id_fkey"
            columns: ["used_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      contact_submissions: {
        Row: {
          city: string | null
          clinic_name: string
          contact_name: string
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
          id?: string
          org_id?: string
          visit_id?: string | null
        }
        Relationships: [
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
        }
        Insert: {
          access_count?: number
          created_at?: string
          email: string
          id?: string
          otp_expires_at?: string | null
          otp_hash?: string | null
        }
        Update: {
          access_count?: number
          created_at?: string
          email?: string
          id?: string
          otp_expires_at?: string | null
          otp_hash?: string | null
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
      followup_sms_config: {
        Row: {
          created_at: string | null
          first_reminder_days: number | null
          max_reminders: number | null
          org_id: string
          reminder_template: string | null
          second_reminder_days: number | null
        }
        Insert: {
          created_at?: string | null
          first_reminder_days?: number | null
          max_reminders?: number | null
          org_id: string
          reminder_template?: string | null
          second_reminder_days?: number | null
        }
        Update: {
          created_at?: string | null
          first_reminder_days?: number | null
          max_reminders?: number | null
          org_id?: string
          reminder_template?: string | null
          second_reminder_days?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "followup_sms_config_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
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
          created_at: string | null
          diagnostic_enabled: boolean | null
          display_format: string | null
          estimated_wait_minutes: number | null
          followup_sms_enabled: boolean | null
          id: string
          logo_url: string | null
          name: string
          nurse_enabled: boolean | null
          operating_hours: Json | null
          org_id: string
          qr_code_url: string | null
          referral_email: string | null
          review_sms_enabled: boolean | null
          specialty: string | null
          tablet_count: number | null
          timezone: string | null
          vaccines_enabled: boolean | null
          vitals_enabled: boolean | null
        }
        Insert: {
          address?: string | null
          ai_custom_instructions?: string | null
          ai_message_limit?: number | null
          ai_model?: string | null
          created_at?: string | null
          diagnostic_enabled?: boolean | null
          display_format?: string | null
          estimated_wait_minutes?: number | null
          followup_sms_enabled?: boolean | null
          id?: string
          logo_url?: string | null
          name: string
          nurse_enabled?: boolean | null
          operating_hours?: Json | null
          org_id: string
          qr_code_url?: string | null
          referral_email?: string | null
          review_sms_enabled?: boolean | null
          specialty?: string | null
          tablet_count?: number | null
          timezone?: string | null
          vaccines_enabled?: boolean | null
          vitals_enabled?: boolean | null
        }
        Update: {
          address?: string | null
          ai_custom_instructions?: string | null
          ai_message_limit?: number | null
          ai_model?: string | null
          created_at?: string | null
          diagnostic_enabled?: boolean | null
          display_format?: string | null
          estimated_wait_minutes?: number | null
          followup_sms_enabled?: boolean | null
          id?: string
          logo_url?: string | null
          name?: string
          nurse_enabled?: boolean | null
          operating_hours?: Json | null
          org_id?: string
          qr_code_url?: string | null
          referral_email?: string | null
          review_sms_enabled?: boolean | null
          specialty?: string | null
          tablet_count?: number | null
          timezone?: string | null
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
          billing_cycle_start: string | null
          cancel_at_period_end: string | null
          cancelled_at: string | null
          created_at: string | null
          credits_total: number | null
          credits_used: number | null
          data_retention_until: string | null
          diagnostic_addon: boolean | null
          followup_sms_addon: boolean | null
          id: string
          last_credit_alert_at: string | null
          marketing_sms_addon: boolean | null
          name: string
          onboarding_completed_at: string | null
          owner_id: string
          payment_failure_count: number | null
          payment_first_failed_at: string | null
          paypal_subscription_id: string | null
          purged: boolean | null
          recharge_limit: number | null
          recharge_used: number | null
          review_sms_addon: boolean | null
          slug: string
          subscription_plan: string | null
          trial_alert_sent: boolean | null
          trial_end_date: string | null
        }
        Insert: {
          billing_cycle_start?: string | null
          cancel_at_period_end?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          credits_total?: number | null
          credits_used?: number | null
          data_retention_until?: string | null
          diagnostic_addon?: boolean | null
          followup_sms_addon?: boolean | null
          id?: string
          last_credit_alert_at?: string | null
          marketing_sms_addon?: boolean | null
          name: string
          onboarding_completed_at?: string | null
          owner_id: string
          payment_failure_count?: number | null
          payment_first_failed_at?: string | null
          paypal_subscription_id?: string | null
          purged?: boolean | null
          recharge_limit?: number | null
          recharge_used?: number | null
          review_sms_addon?: boolean | null
          slug: string
          subscription_plan?: string | null
          trial_alert_sent?: boolean | null
          trial_end_date?: string | null
        }
        Update: {
          billing_cycle_start?: string | null
          cancel_at_period_end?: string | null
          cancelled_at?: string | null
          created_at?: string | null
          credits_total?: number | null
          credits_used?: number | null
          data_retention_until?: string | null
          diagnostic_addon?: boolean | null
          followup_sms_addon?: boolean | null
          id?: string
          last_credit_alert_at?: string | null
          marketing_sms_addon?: boolean | null
          name?: string
          onboarding_completed_at?: string | null
          owner_id?: string
          payment_failure_count?: number | null
          payment_first_failed_at?: string | null
          paypal_subscription_id?: string | null
          purged?: boolean | null
          recharge_limit?: number | null
          recharge_used?: number | null
          review_sms_addon?: boolean | null
          slug?: string
          subscription_plan?: string | null
          trial_alert_sent?: boolean | null
          trial_end_date?: string | null
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
          collision_flag: boolean | null
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
          collision_flag?: boolean | null
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
          collision_flag?: boolean | null
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
          from_doctor_id: string
          from_location_id: string
          from_org_id: string
          id: string
          included_attachment_ids: string[] | null
          included_visit_ids: string[]
          linked_visit_id: string | null
          patient_birthday: string
          patient_id: string
          patient_name: string
          pdf_url: string | null
          referral_note: string
          specialty: string
          status: string
          to_email: string | null
          to_location_id: string | null
          to_org_id: string | null
        }
        Insert: {
          created_at?: string | null
          expired_at?: string | null
          from_doctor_id: string
          from_location_id: string
          from_org_id: string
          id?: string
          included_attachment_ids?: string[] | null
          included_visit_ids: string[]
          linked_visit_id?: string | null
          patient_birthday: string
          patient_id: string
          patient_name: string
          pdf_url?: string | null
          referral_note: string
          specialty: string
          status?: string
          to_email?: string | null
          to_location_id?: string | null
          to_org_id?: string | null
        }
        Update: {
          created_at?: string | null
          expired_at?: string | null
          from_doctor_id?: string
          from_location_id?: string
          from_org_id?: string
          id?: string
          included_attachment_ids?: string[] | null
          included_visit_ids?: string[]
          linked_visit_id?: string | null
          patient_birthday?: string
          patient_id?: string
          patient_name?: string
          pdf_url?: string | null
          referral_note?: string
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
          id: string
          location_id: string
          role: string
          staff_user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          id?: string
          location_id: string
          role: string
          staff_user_id: string
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
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
          ai_model_used: string | null
          ai_started_at: string | null
          ai_structured_card: Json | null
          ai_summary: string | null
          ai_summary_translated: string | null
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          created_at: string | null
          credits_charged: number | null
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
          nurse_notes: string | null
          nurse_reviewed: boolean | null
          org_id: string
          patient_approved: boolean | null
          patient_approved_at: string | null
          patient_denied: boolean | null
          patient_id: string
          phone_verification_pending: boolean | null
          priority: number | null
          review_sms_sent: boolean | null
          review_token: string | null
          session_token: string
          status: string
          summary_show_diagnosis: boolean | null
          summary_sms_sent: boolean | null
          summary_token: string | null
          timeout_flagged: boolean | null
          updated_at: string | null
        }
        Insert: {
          ai_completed_at?: string | null
          ai_diagnostic?: string | null
          ai_model_used?: string | null
          ai_started_at?: string | null
          ai_structured_card?: Json | null
          ai_summary?: string | null
          ai_summary_translated?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_charged?: number | null
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
          nurse_notes?: string | null
          nurse_reviewed?: boolean | null
          org_id: string
          patient_approved?: boolean | null
          patient_approved_at?: string | null
          patient_denied?: boolean | null
          patient_id: string
          phone_verification_pending?: boolean | null
          priority?: number | null
          review_sms_sent?: boolean | null
          review_token?: string | null
          session_token?: string
          status?: string
          summary_show_diagnosis?: boolean | null
          summary_sms_sent?: boolean | null
          summary_token?: string | null
          timeout_flagged?: boolean | null
          updated_at?: string | null
        }
        Update: {
          ai_completed_at?: string | null
          ai_diagnostic?: string | null
          ai_model_used?: string | null
          ai_started_at?: string | null
          ai_structured_card?: Json | null
          ai_summary?: string | null
          ai_summary_translated?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          credits_charged?: number | null
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
          nurse_notes?: string | null
          nurse_reviewed?: boolean | null
          org_id?: string
          patient_approved?: boolean | null
          patient_approved_at?: string | null
          patient_denied?: boolean | null
          patient_id?: string
          phone_verification_pending?: boolean | null
          priority?: number | null
          review_sms_sent?: boolean | null
          review_token?: string | null
          session_token?: string
          status?: string
          summary_show_diagnosis?: boolean | null
          summary_sms_sent?: boolean | null
          summary_token?: string | null
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
      add_patient_note: {
        Args: {
          p_content: string
          p_is_private?: boolean
          p_patient_id: string
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
      admin_create_premium_code: {
        Args: {
          p_domain?: string
          p_email?: string
          p_phone?: string
          p_send_email?: boolean
        }
        Returns: Json
      }
      admin_list_premium_codes: { Args: never; Returns: Json }
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
      cancel_subscription: { Args: never; Returns: Json }
      change_subscription_plan: { Args: { p_new_plan: string }; Returns: Json }
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
      checkin_patient:
        | {
            Args: {
              p_birthday: string
              p_first_name: string
              p_last_name: string
              p_location_id: string
              p_phone?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_birthday: string
              p_first_name: string
              p_last_name: string
              p_location_id: string
              p_phone?: string
              p_sex?: string
            }
            Returns: Json
          }
      claim_patient: { Args: { p_visit_id: string }; Returns: Json }
      cleanup_demo_data: { Args: never; Returns: undefined }
      collect_phone_post_ai: {
        Args: { p_phone: string; p_session_token: string; p_visit_id: string }
        Returns: Json
      }
      complete_campaign_sending: {
        Args: { p_campaign_id: string }
        Returns: Json
      }
      complete_onboarding: { Args: never; Returns: Json }
      complete_referral: { Args: { p_referral_id: string }; Returns: Json }
      complete_visit:
        | {
            Args: {
              p_diagnosis: string
              p_follow_up?: Json
              p_visit_id: string
            }
            Returns: Json
          }
        | {
            Args: {
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
      create_follow_up: {
        Args: {
          p_ai_instructions?: string
          p_timeframe_days: number
          p_visit_id: string
        }
        Returns: Json
      }
      create_location: {
        Args: {
          p_address?: string
          p_name: string
          p_operating_hours?: Json
          p_org_id: string
          p_specialty?: string
        }
        Returns: Json
      }
      create_organization: {
        Args: {
          p_approval_code?: string
          p_name: string
          p_owner_auth_uid: string
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
      decline_phone_verification: {
        Args: { p_session_token: string; p_visit_id: string }
        Returns: Json
      }
      deduct_credits: {
        Args: { p_ai_model: string; p_org_id: string; p_visit_id: string }
        Returns: Json
      }
      deduct_diagnostic_credits: {
        Args: { p_org_id: string; p_visit_id: string }
        Returns: Json
      }
      delete_staff: { Args: { p_staff_user_id: string }; Returns: Json }
      deny_patient: { Args: { p_visit_id: string }; Returns: Json }
      edit_patient_record:
        | {
            Args: {
              p_birthday?: string
              p_first_name?: string
              p_last_name?: string
              p_patient_id: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_birthday?: string
              p_first_name?: string
              p_last_name?: string
              p_patient_id: string
              p_sex?: string
            }
            Returns: Json
          }
      exclude_campaign_recipient: {
        Args: {
          p_campaign_id: string
          p_excluded: boolean
          p_recipient_id: string
        }
        Returns: Json
      }
      finalize_campaign_scan: {
        Args: { p_campaign_id: string; p_total_scanned: number }
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
      get_campaign_patients: {
        Args: { p_campaign_id: string; p_limit?: number; p_offset?: number }
        Returns: Json
      }
      get_checked_in_doctors: { Args: { p_location_id: string }; Returns: Json }
      get_claimed_patients: { Args: { p_location_id: string }; Returns: Json }
      get_collision_state: { Args: { p_visit_id: string }; Returns: Json }
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
      get_organization_overview: { Args: never; Returns: Json }
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
      handle_collision_result: {
        Args: {
          p_phone_matches_existing: boolean
          p_shared_phone?: boolean
          p_visit_id: string
        }
        Returns: Json
      }
      handle_collision_returning: {
        Args: { p_visit_id: string }
        Returns: Json
      }
      handle_collision_verify: { Args: { p_visit_id: string }; Returns: Json }
      handle_no_phone_existing: { Args: { p_visit_id: string }; Returns: Json }
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
      log_phi_access: {
        Args: { p_entity_id: string; p_entity_type: string }
        Returns: undefined
      }
      mark_follow_up_completed: {
        Args: { p_follow_up_id: string }
        Returns: Json
      }
      mark_patient_left: { Args: { p_visit_id: string }; Returns: Json }
      move_to_queue_on_error: {
        Args: { p_session_token: string; p_visit_id: string }
        Returns: Json
      }
      nurse_release_to_doctor: {
        Args: { p_nurse_notes: string; p_visit_id: string }
        Returns: Json
      }
      purchase_overage_credits: { Args: { p_amount: number }; Returns: Json }
      purge_expired_orgs: { Args: never; Returns: Json }
      reactivate_referral: { Args: { p_referral_id: string }; Returns: Json }
      record_vaccine: {
        Args: {
          p_dose_number?: number
          p_lot_number?: string
          p_manufacturer?: string
          p_notes?: string
          p_patient_id: string
          p_refusal_reason?: string
          p_refused?: boolean
          p_site?: string
          p_vaccine_id: string
          p_visit_id: string
        }
        Returns: Json
      }
      record_vitals: {
        Args: { p_patient_id: string; p_readings: Json; p_visit_id: string }
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
      request_demo_otp: { Args: { p_email: string }; Returns: Json }
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
      reset_monthly_credits: { Args: { p_org_id: string }; Returns: Json }
      reset_staff_password: {
        Args: { p_new_password: string; p_staff_user_id: string }
        Returns: Json
      }
      rotate_review_platforms: { Args: never; Returns: undefined }
      save_campaign_matches: {
        Args: { p_campaign_id: string; p_matches: Json }
        Returns: Json
      }
      save_followup_sms_config: {
        Args: {
          p_first_reminder_days: number
          p_location_id: string
          p_max_reminders: number
          p_org_id: string
          p_second_reminder_days: number
          p_template?: string
        }
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
      schedule_follow_up: {
        Args: { p_due_at: string; p_follow_up_id: string }
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
      set_recharge_limit: { Args: { p_limit: number }; Returns: Json }
      set_review_cycle:
        | {
            Args: { p_cycle_days: number; p_location_id: string }
            Returns: Json
          }
        | {
            Args: {
              p_cycle_days: number
              p_location_id: string
              p_redirect_min_rating?: number
            }
            Returns: Json
          }
      set_sensitive_flag: { Args: { p_visit_id: string }; Returns: Json }
      setup_onboarding_demo: { Args: { p_location_id: string }; Returns: Json }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      staff_check_in: {
        Args: { p_location_id: string; p_role: string }
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
      store_ai_message: {
        Args: {
          p_content: string
          p_content_original?: string
          p_visit_id: string
        }
        Returns: Json
      }
      submit_contact: {
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
          p_display_format?: string
          p_location_id: string
          p_logo_url?: string
          p_name?: string
          p_nurse_enabled?: boolean
          p_operating_hours?: Json
          p_referral_email?: string
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
      update_pets: {
        Args: { p_patient_id: string; p_pets: string[] }
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
      verify_demo_otp: {
        Args: { p_code: string; p_email: string }
        Returns: Json
      }
      verify_phone_and_link: {
        Args: { p_phone: string; p_session_token: string; p_visit_id: string }
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
