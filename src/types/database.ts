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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body_en: string | null
          body_id: string
          created_at: string
          group_id: string
          id: string
          image_path: string | null
          published_at: string | null
          status: Database["public"]["Enums"]["content_status"]
          title_en: string | null
          title_id: string
          updated_at: string
        }
        Insert: {
          body_en?: string | null
          body_id: string
          created_at?: string
          group_id: string
          id?: string
          image_path?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_en?: string | null
          title_id: string
          updated_at?: string
        }
        Update: {
          body_en?: string | null
          body_id?: string
          created_at?: string
          group_id?: string
          id?: string
          image_path?: string | null
          published_at?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_en?: string | null
          title_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_bread: {
        Row: {
          audio_path: string | null
          body_en: string | null
          body_id: string
          created_at: string
          entry_date: string
          id: string
          scripture_ref: string | null
          status: Database["public"]["Enums"]["content_status"]
          title_en: string | null
          title_id: string
          updated_at: string
        }
        Insert: {
          audio_path?: string | null
          body_en?: string | null
          body_id: string
          created_at?: string
          entry_date: string
          id?: string
          scripture_ref?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_en?: string | null
          title_id: string
          updated_at?: string
        }
        Update: {
          audio_path?: string | null
          body_en?: string | null
          body_id?: string
          created_at?: string
          entry_date?: string
          id?: string
          scripture_ref?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          title_en?: string | null
          title_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      duty_assignments: {
        Row: {
          created_at: string
          id: string
          names: string
          role_id: string
          service: Database["public"]["Enums"]["duty_service"]
          updated_at: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          names: string
          role_id: string
          service: Database["public"]["Enums"]["duty_service"]
          updated_at?: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          names?: string
          role_id?: string
          service?: Database["public"]["Enums"]["duty_service"]
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "duty_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "duty_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      duty_roles: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name_en: string | null
          name_id: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name_en?: string | null
          name_id: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name_en?: string | null
          name_id?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      form_submissions: {
        Row: {
          consented_at: string
          created_at: string
          email: string | null
          extra: Json
          full_name: string
          handled_by: string | null
          id: string
          message: string | null
          phone: string | null
          staff_notes: string | null
          status: Database["public"]["Enums"]["submission_status"]
          type: Database["public"]["Enums"]["form_type"]
          updated_at: string
        }
        Insert: {
          consented_at?: string
          created_at?: string
          email?: string | null
          extra?: Json
          full_name: string
          handled_by?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          type: Database["public"]["Enums"]["form_type"]
          updated_at?: string
        }
        Update: {
          consented_at?: string
          created_at?: string
          email?: string | null
          extra?: Json
          full_name?: string
          handled_by?: string | null
          id?: string
          message?: string | null
          phone?: string | null
          staff_notes?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          type?: Database["public"]["Enums"]["form_type"]
          updated_at?: string
        }
        Relationships: []
      }
      groups: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      sermons: {
        Row: {
          created_at: string
          id: string
          preached_on: string
          preacher: string | null
          scripture_ref: string | null
          slides_path: string | null
          status: Database["public"]["Enums"]["content_status"]
          summary_en: string | null
          summary_id: string | null
          title_en: string | null
          title_id: string
          updated_at: string
          youtube_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          preached_on: string
          preacher?: string | null
          scripture_ref?: string | null
          slides_path?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary_en?: string | null
          summary_id?: string | null
          title_en?: string | null
          title_id: string
          updated_at?: string
          youtube_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          preached_on?: string
          preacher?: string | null
          scripture_ref?: string | null
          slides_path?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          summary_en?: string | null
          summary_id?: string | null
          title_en?: string | null
          title_id?: string
          updated_at?: string
          youtube_id?: string | null
        }
        Relationships: []
      }
      staff_users: {
        Row: {
          created_at: string
          full_name: string
          id: string
          role: Database["public"]["Enums"]["staff_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          role?: Database["public"]["Enums"]["staff_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_items: {
        Row: {
          body_en: string | null
          body_id: string | null
          created_at: string
          file_path: string | null
          id: string
          kind: Database["public"]["Enums"]["weekly_kind"]
          service_date: string
          status: Database["public"]["Enums"]["content_status"]
          title_en: string | null
          title_id: string
          updated_at: string
        }
        Insert: {
          body_en?: string | null
          body_id?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          kind: Database["public"]["Enums"]["weekly_kind"]
          service_date: string
          status?: Database["public"]["Enums"]["content_status"]
          title_en?: string | null
          title_id: string
          updated_at?: string
        }
        Update: {
          body_en?: string | null
          body_id?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["weekly_kind"]
          service_date?: string
          status?: Database["public"]["Enums"]["content_status"]
          title_en?: string | null
          title_id?: string
          updated_at?: string
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
      content_status: "draft" | "published"
      duty_service: "sun_am" | "sun_pm" | "wed"
      form_type: "new_member" | "prayer" | "choir" | "baptism" | "contact"
      staff_role: "admin" | "editor"
      submission_status: "new" | "contacted" | "done"
      weekly_kind: "sunday_material" | "prayer_list"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      content_status: ["draft", "published"],
      duty_service: ["sun_am", "sun_pm", "wed"],
      form_type: ["new_member", "prayer", "choir", "baptism", "contact"],
      staff_role: ["admin", "editor"],
      submission_status: ["new", "contacted", "done"],
      weekly_kind: ["sunday_material", "prayer_list"],
    },
  },
} as const
