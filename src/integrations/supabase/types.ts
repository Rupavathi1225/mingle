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
      blogs: {
        Row: {
          author: string | null
          category: string | null
          content: string | null
          created_at: string
          featured_image: string | null
          id: string
          related_search_id: string | null
          slug: string
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          featured_image?: string | null
          id?: string
          related_search_id?: string | null
          slug: string
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string | null
          created_at?: string
          featured_image?: string | null
          id?: string
          related_search_id?: string | null
          slug?: string
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blogs_related_search_id_fkey"
            columns: ["related_search_id"]
            isOneToOne: false
            referencedRelation: "related_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      click_tracking: {
        Row: {
          click_type: string
          country: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          link_id: string | null
          related_search_id: string | null
          session_id: string
          timestamp: string | null
        }
        Insert: {
          click_type: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          related_search_id?: string | null
          session_id: string
          timestamp?: string | null
        }
        Update: {
          click_type?: string
          country?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          link_id?: string | null
          related_search_id?: string | null
          session_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "click_tracking_link_id_fkey"
            columns: ["link_id"]
            isOneToOne: false
            referencedRelation: "web_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "click_tracking_related_search_id_fkey"
            columns: ["related_search_id"]
            isOneToOne: false
            referencedRelation: "related_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      email_captures: {
        Row: {
          created_at: string | null
          email: string
          id: string
          prelanding_key: string
          web_result_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          prelanding_key: string
          web_result_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          prelanding_key?: string
          web_result_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_captures_web_result_id_fkey"
            columns: ["web_result_id"]
            isOneToOne: false
            referencedRelation: "web_results"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_content: {
        Row: {
          created_at: string | null
          description: string
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      link_clicks: {
        Row: {
          id: string
          total_clicks: number | null
          unique_clicks: number | null
          updated_at: string | null
          web_result_id: string | null
        }
        Insert: {
          id?: string
          total_clicks?: number | null
          unique_clicks?: number | null
          updated_at?: string | null
          web_result_id?: string | null
        }
        Update: {
          id?: string
          total_clicks?: number | null
          unique_clicks?: number | null
          updated_at?: string | null
          web_result_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "link_clicks_web_result_id_fkey"
            columns: ["web_result_id"]
            isOneToOne: false
            referencedRelation: "web_results"
            referencedColumns: ["id"]
          },
        ]
      }
      prelandings: {
        Row: {
          created_at: string | null
          description: string | null
          headline: string
          id: string
          is_active: boolean | null
          key: string
          logo_url: string | null
          main_image_url: string | null
          redirect_description: string | null
          subtitle: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          headline: string
          id?: string
          is_active?: boolean | null
          key: string
          logo_url?: string | null
          main_image_url?: string | null
          redirect_description?: string | null
          subtitle?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          headline?: string
          id?: string
          is_active?: boolean | null
          key?: string
          logo_url?: string | null
          main_image_url?: string | null
          redirect_description?: string | null
          subtitle?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      related_searches: {
        Row: {
          blog_id: string | null
          created_at: string | null
          display_order: number
          id: string
          is_active: boolean | null
          position: number
          search_text: string
          title: string | null
          updated_at: string | null
          web_result_page: number
        }
        Insert: {
          blog_id?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          position?: number
          search_text: string
          title?: string | null
          updated_at?: string | null
          web_result_page?: number
        }
        Update: {
          blog_id?: string | null
          created_at?: string | null
          display_order?: number
          id?: string
          is_active?: boolean | null
          position?: number
          search_text?: string
          title?: string | null
          updated_at?: string | null
          web_result_page?: number
        }
        Relationships: [
          {
            foreignKeyName: "related_searches_blog_id_fkey"
            columns: ["blog_id"]
            isOneToOne: false
            referencedRelation: "blogs"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          country: string | null
          created_at: string | null
          device_type: string | null
          id: string
          ip_address: string | null
          last_activity: string | null
          session_id: string
          source: string | null
          user_agent: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          session_id: string
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string | null
          device_type?: string | null
          id?: string
          ip_address?: string | null
          last_activity?: string | null
          session_id?: string
          source?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      web_results: {
        Row: {
          backlink: string | null
          country_codes: string[] | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_sponsored: boolean | null
          logo_url: string | null
          original_link: string
          position: number
          prelanding_key: string | null
          title: string
          updated_at: string | null
          web_result_page: number
          worldwide: boolean | null
        }
        Insert: {
          backlink?: string | null
          country_codes?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_sponsored?: boolean | null
          logo_url?: string | null
          original_link: string
          position?: number
          prelanding_key?: string | null
          title: string
          updated_at?: string | null
          web_result_page?: number
          worldwide?: boolean | null
        }
        Update: {
          backlink?: string | null
          country_codes?: string[] | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_sponsored?: boolean | null
          logo_url?: string | null
          original_link?: string
          position?: number
          prelanding_key?: string | null
          title?: string
          updated_at?: string | null
          web_result_page?: number
          worldwide?: boolean | null
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
