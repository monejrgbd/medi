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
          id: string
          used_at: string | null
          used_by_org_id: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: string
          used_at?: string | null
          used_by_org_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: string
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
      locations: {
        Row: {
          address: string | null
          ai_model: string | null
          created_at: string | null
          display_format: string | null
          id: string
          logo_url: string | null
          name: string
          operating_hours: Json | null
          org_id: string
          qr_code_url: string | null
          referral_email: string | null
          specialty: string | null
          tablet_count: number | null
          timezone: string | null
        }
        Insert: {
          address?: string | null
          ai_model?: string | null
          created_at?: string | null
          display_format?: string | null
          id?: string
          logo_url?: string | null
          name: string
          operating_hours?: Json | null
          org_id: string
          qr_code_url?: string | null
          referral_email?: string | null
          specialty?: string | null
          tablet_count?: number | null
          timezone?: string | null
        }
        Update: {
          address?: string | null
          ai_model?: string | null
          created_at?: string | null
          display_format?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          operating_hours?: Json | null
          org_id?: string
          qr_code_url?: string | null
          referral_email?: string | null
          specialty?: string | null
          tablet_count?: number | null
          timezone?: string | null
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
      organizations: {
        Row: {
          billing_cycle_start: string | null
          created_at: string | null
          credits_total: number | null
          credits_used: number | null
          followup_sms_addon: boolean | null
          id: string
          name: string
          owner_id: string
          paypal_subscription_id: string | null
          review_sms_addon: boolean | null
          slug: string
          subscription_plan: string | null
          trial_end_date: string | null
        }
        Insert: {
          billing_cycle_start?: string | null
          created_at?: string | null
          credits_total?: number | null
          credits_used?: number | null
          followup_sms_addon?: boolean | null
          id?: string
          name: string
          owner_id: string
          paypal_subscription_id?: string | null
          review_sms_addon?: boolean | null
          slug: string
          subscription_plan?: string | null
          trial_end_date?: string | null
        }
        Update: {
          billing_cycle_start?: string | null
          created_at?: string | null
          credits_total?: number | null
          credits_used?: number | null
          followup_sms_addon?: boolean | null
          id?: string
          name?: string
          owner_id?: string
          paypal_subscription_id?: string | null
          review_sms_addon?: boolean | null
          slug?: string
          subscription_plan?: string | null
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
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          patient_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          patient_id?: string
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
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          patient_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          patient_id?: string
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
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name: string
          patient_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          id?: string
          name?: string
          patient_id?: string
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
      patients: {
        Row: {
          birthday: string
          collision_flag: boolean | null
          consent_given: boolean | null
          consent_given_at: string | null
          created_at: string | null
          first_name: string
          id: string
          language: string | null
          last_name: string
          org_id: string
          phone: string | null
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
          language?: string | null
          last_name: string
          org_id: string
          phone?: string | null
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
          language?: string | null
          last_name?: string
          org_id?: string
          phone?: string | null
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
      staff_checkins: {
        Row: {
          checked_in_at: string | null
          checked_out_at: string | null
          id: string
          location_id: string
          role: string
          shift_duration: string | null
          staff_user_id: string
        }
        Insert: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          id?: string
          location_id: string
          role: string
          shift_duration?: string | null
          staff_user_id: string
        }
        Update: {
          checked_in_at?: string | null
          checked_out_at?: string | null
          id?: string
          location_id?: string
          role?: string
          shift_duration?: string | null
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
      visits: {
        Row: {
          ai_completed_at: string | null
          ai_diagnostic: Json | null
          ai_started_at: string | null
          claimed_at: string | null
          claimed_by: string | null
          completed_at: string | null
          created_at: string | null
          entered_queue_at: string | null
          gave_tablet: boolean | null
          handled: boolean | null
          has_previous_visits: boolean | null
          id: string
          location_id: string
          org_id: string
          patient_id: string
          priority: number | null
          session_token: string
          status: string
        }
        Insert: {
          ai_completed_at?: string | null
          ai_diagnostic?: Json | null
          ai_started_at?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          entered_queue_at?: string | null
          gave_tablet?: boolean | null
          handled?: boolean | null
          has_previous_visits?: boolean | null
          id?: string
          location_id: string
          org_id: string
          patient_id: string
          priority?: number | null
          session_token?: string
          status?: string
        }
        Update: {
          ai_completed_at?: string | null
          ai_diagnostic?: Json | null
          ai_started_at?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          entered_queue_at?: string | null
          gave_tablet?: boolean | null
          handled?: boolean | null
          has_previous_visits?: boolean | null
          id?: string
          location_id?: string
          org_id?: string
          patient_id?: string
          priority?: number | null
          session_token?: string
          status?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_patient: { Args: { p_visit_id: string }; Returns: Json }
      assign_role: {
        Args: { p_location_id: string; p_role: string; p_staff_user_id: string }
        Returns: Json
      }
      check_location_active: { Args: { p_location_id: string }; Returns: Json }
      checkin_patient: {
        Args: {
          p_birthday: string
          p_first_name: string
          p_last_name: string
          p_location_id: string
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
      deactivate_staff: { Args: { p_staff_user_id: string }; Returns: Json }
      delete_staff: { Args: { p_staff_user_id: string }; Returns: Json }
      deny_patient: { Args: { p_visit_id: string }; Returns: Json }
      get_location_detail: { Args: { p_location_id: string }; Returns: Json }
      get_locations: { Args: never; Returns: Json }
      get_my_org: { Args: never; Returns: Json }
      get_my_roles: { Args: never; Returns: Json }
      get_organization_overview: { Args: never; Returns: Json }
      get_patient_session: { Args: { p_session_token: string }; Returns: Json }
      get_pending_approvals: { Args: { p_location_id: string }; Returns: Json }
      get_receptionist_counts: {
        Args: { p_location_id: string }
        Returns: Json
      }
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
      get_waitlist_count: { Args: never; Returns: number }
      give_patient_consent: {
        Args: { p_language: string; p_session_token: string }
        Returns: Json
      }
      handle_patient: { Args: { p_visit_id: string }; Returns: Json }
      mark_patient_left: { Args: { p_visit_id: string }; Returns: Json }
      remove_role: {
        Args: { p_location_id: string; p_role: string; p_staff_user_id: string }
        Returns: Json
      }
      requesting_org_id: { Args: never; Returns: string }
      reset_staff_password: {
        Args: { p_new_password: string; p_staff_user_id: string }
        Returns: Json
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      staff_check_in: {
        Args: {
          p_location_id: string
          p_role: string
          p_shift_duration?: string
        }
        Returns: Json
      }
      staff_check_out:
        | { Args: { p_staff_user_id?: string }; Returns: Json }
        | {
            Args: { p_force?: boolean; p_staff_user_id?: string }
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
      toggle_gave_tablet: { Args: { p_visit_id: string }; Returns: Json }
      update_location:
        | {
            Args: {
              p_address?: string
              p_ai_model?: string
              p_display_format?: string
              p_location_id: string
              p_name?: string
              p_operating_hours?: Json
              p_referral_email?: string
              p_specialty?: string
              p_tablet_count?: number
              p_timezone?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_address?: string
              p_ai_model?: string
              p_display_format?: string
              p_location_id: string
              p_logo_url?: string
              p_name?: string
              p_operating_hours?: Json
              p_referral_email?: string
              p_specialty?: string
              p_tablet_count?: number
              p_timezone?: string
            }
            Returns: Json
          }
      update_organization: { Args: { p_name: string }; Returns: Json }
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
