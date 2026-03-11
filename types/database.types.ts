export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4";
  };
  public: {
    Tables: {
      anomalies: {
        Row: {
          bounding_box: Json | null;
          confidence_score: number | null;
          created_at: string | null;
          defect_type: string | null;
          description: string | null;
          id: string;
          inspection_id: string | null;
          location: string | null;
        };
        Insert: {
          bounding_box?: Json | null;
          confidence_score?: number | null;
          created_at?: string | null;
          defect_type?: string | null;
          description?: string | null;
          id?: string;
          inspection_id?: string | null;
          location?: string | null;
        };
        Update: {
          bounding_box?: Json | null;
          confidence_score?: number | null;
          created_at?: string | null;
          defect_type?: string | null;
          description?: string | null;
          id?: string;
          inspection_id?: string | null;
          location?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "anomalies_inspection_id_fkey";
            columns: ["inspection_id"];
            isOneToOne: false;
            referencedRelation: "inspections";
            referencedColumns: ["id"];
          },
        ];
      };
      divisions: {
        Row: {
          color_code: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
        };
        Insert: {
          color_code?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          color_code?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [];
      };
      inspections: {
        Row: {
          ai_confidence_score: number | null;
          ai_result_status: string | null;
          created_at: string | null;
          division_id: string | null;
          id: string;
          image_url: string | null;
          inspection_date: string | null;
          inspector_id: string | null;
          main_defect: string | null;
          part_id: string;
          resolution_note: string | null;
          updated_at: string | null;
          validation_status: string | null;
        };
        Insert: {
          ai_confidence_score?: number | null;
          ai_result_status?: string | null;
          created_at?: string | null;
          division_id?: string | null;
          id?: string;
          image_url?: string | null;
          inspection_date?: string | null;
          inspector_id?: string | null;
          main_defect?: string | null;
          part_id: string;
          resolution_note?: string | null;
          updated_at?: string | null;
          validation_status?: string | null;
        };
        Update: {
          ai_confidence_score?: number | null;
          ai_result_status?: string | null;
          created_at?: string | null;
          division_id?: string | null;
          id?: string;
          image_url?: string | null;
          inspection_date?: string | null;
          inspector_id?: string | null;
          main_defect?: string | null;
          part_id?: string;
          resolution_note?: string | null;
          updated_at?: string | null;
          validation_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "inspections_division_id_fkey";
            columns: ["division_id"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inspections_inspector_id_fkey";
            columns: ["inspector_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          avatar_url: string | null;
          created_at: string | null;
          division_id: string | null;
          employee_id: string | null;
          full_name: string | null;
          id: string;
          last_login: string | null;
          role: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string | null;
          division_id?: string | null;
          employee_id?: string | null;
          full_name?: string | null;
          id: string;
          last_login?: string | null;
          role?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string | null;
          division_id?: string | null;
          employee_id?: string | null;
          full_name?: string | null;
          id?: string;
          last_login?: string | null;
          role?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_division_id_fkey";
            columns: ["division_id"];
            isOneToOne: false;
            referencedRelation: "divisions";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      get_dashboard_stats: {
        Args: never;
        Returns: {
          accuracy_percentage: number;
          active_hours: number;
          pending_tasks: number;
          total_inspections: number;
        }[];
      };
      get_monthly_inspection_stats: {
        Args: {
          months_back: number;
        };
        Returns: {
          month_label: string;
          year_num: number;
          month_num: number;
          okay_count: number;
          not_okay_count: number;
        }[];
      };
      get_monthly_division_stats: {
        Args: {
          months_back: number;
        };
        Returns: {
          month_label: string;
          year_num: number;
          month_num: number;
          division_name: string;
          total_count: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
