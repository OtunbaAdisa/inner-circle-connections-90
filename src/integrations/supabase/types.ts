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
      age_band_logos: {
        Row: {
          band_name: Database["public"]["Enums"]["age_band"]
          created_at: string
          event_id: string
          id: string
          logo_url: string
        }
        Insert: {
          band_name: Database["public"]["Enums"]["age_band"]
          created_at?: string
          event_id: string
          id?: string
          logo_url: string
        }
        Update: {
          band_name?: Database["public"]["Enums"]["age_band"]
          created_at?: string
          event_id?: string
          id?: string
          logo_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "age_band_logos_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      circle_promotions: {
        Row: {
          created_at: string
          event_id: string
          id: string
          promoted_to: Database["public"]["Enums"]["circle_level"]
          promoter_id: string
          target_participant_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          promoted_to: Database["public"]["Enums"]["circle_level"]
          promoter_id: string
          target_participant_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          promoted_to?: Database["public"]["Enums"]["circle_level"]
          promoter_id?: string
          target_participant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "circle_promotions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "circle_promotions_target_participant_id_fkey"
            columns: ["target_participant_id"]
            isOneToOne: false
            referencedRelation: "participant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connections: {
        Row: {
          created_at: string
          event_id: string
          id: string
          message: string | null
          requester_id: string
          status: Database["public"]["Enums"]["connection_status"] | null
          target_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          message?: string | null
          requester_id: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          target_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          message?: string | null
          requester_id?: string
          status?: Database["public"]["Enums"]["connection_status"] | null
          target_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "connections_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      diary_entries: {
        Row: {
          content: string
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diary_entries_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string
          event_date: string
          id: string
          name: string
          qr_code_url: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time: string
          event_date: string
          id?: string
          name: string
          qr_code_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string
          event_date?: string
          id?: string
          name?: string
          qr_code_url?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      participant_notes: {
        Row: {
          author_id: string
          created_at: string
          event_id: string
          id: string
          note: string
          target_participant_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          event_id: string
          id?: string
          note: string
          target_participant_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          event_id?: string
          id?: string
          note?: string
          target_participant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_notes_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_notes_target_participant_id_fkey"
            columns: ["target_participant_id"]
            isOneToOne: false
            referencedRelation: "participant_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_profiles: {
        Row: {
          age: number
          age_band: Database["public"]["Enums"]["age_band"]
          birthday: string
          checked_in_at: string | null
          circle_level: Database["public"]["Enums"]["circle_level"] | null
          created_at: string
          event_id: string
          full_name: string
          id: string
          physical_seat_number: number | null
          physical_table_id: string | null
          selfie_url: string | null
          updated_at: string
          user_id: string
          virtual_seat_index: number | null
        }
        Insert: {
          age: number
          age_band: Database["public"]["Enums"]["age_band"]
          birthday: string
          checked_in_at?: string | null
          circle_level?: Database["public"]["Enums"]["circle_level"] | null
          created_at?: string
          event_id: string
          full_name: string
          id?: string
          physical_seat_number?: number | null
          physical_table_id?: string | null
          selfie_url?: string | null
          updated_at?: string
          user_id: string
          virtual_seat_index?: number | null
        }
        Update: {
          age?: number
          age_band?: Database["public"]["Enums"]["age_band"]
          birthday?: string
          checked_in_at?: string | null
          circle_level?: Database["public"]["Enums"]["circle_level"] | null
          created_at?: string
          event_id?: string
          full_name?: string
          id?: string
          physical_seat_number?: number | null
          physical_table_id?: string | null
          selfie_url?: string | null
          updated_at?: string
          user_id?: string
          virtual_seat_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "participant_profiles_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "participant_profiles_physical_table_id_fkey"
            columns: ["physical_table_id"]
            isOneToOne: false
            referencedRelation: "physical_tables"
            referencedColumns: ["id"]
          },
        ]
      }
      physical_tables: {
        Row: {
          created_at: string
          event_id: string
          id: string
          number_of_seats: number | null
          table_name: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          number_of_seats?: number | null
          table_name: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          number_of_seats?: number | null
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "physical_tables_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          force_password_change: boolean | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          force_password_change?: boolean | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          force_password_change?: boolean | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_age: { Args: { birthday: string }; Returns: number }
      get_age_band: {
        Args: { age_value: number }
        Returns: Database["public"]["Enums"]["age_band"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_participant_in_event: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      age_band:
        | "trailblazers"
        | "creatives"
        | "luminaries"
        | "pillars"
        | "icons"
      app_role: "super_admin" | "admin" | "participant"
      circle_level: "outer" | "middle" | "inner"
      connection_status: "pending" | "accepted" | "rejected"
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
      age_band: ["trailblazers", "creatives", "luminaries", "pillars", "icons"],
      app_role: ["super_admin", "admin", "participant"],
      circle_level: ["outer", "middle", "inner"],
      connection_status: ["pending", "accepted", "rejected"],
    },
  },
} as const
