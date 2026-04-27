export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          dni: string;
          role: "admin" | "user" | "data_entry";
          company_code: string | null;
          created_at: string;
          is_active: boolean;
        };
        Insert: {
          id: string;
          name: string;
          dni: string;
          role?: "admin" | "user" | "data_entry";
          company_code?: string | null;
          created_at?: string;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          dni?: string;
          role?: "admin" | "user" | "data_entry";
          company_code?: string | null;
          is_active?: boolean;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: number;
          home_team: string;
          away_team: string;
          home_team_flag: string;
          away_team_flag: string;
          group_name: string;
          scheduled_date: string;
          result_deadline: string;
          home_score: number | null;
          away_score: number | null;
          is_finished: boolean;
          phase: string | null;
        };
        Insert: {
          id: number;
          home_team: string;
          away_team: string;
          home_team_flag: string;
          away_team_flag: string;
          group_name: string;
          scheduled_date: string;
          result_deadline: string;
          home_score?: number | null;
          away_score?: number | null;
          is_finished?: boolean;
          phase?: string | null;
        };
        Update: {
          home_team?: string;
          away_team?: string;
          home_team_flag?: string;
          away_team_flag?: string;
          group_name?: string;
          scheduled_date?: string;
          result_deadline?: string;
          home_score?: number | null;
          away_score?: number | null;
          is_finished?: boolean;
          phase?: string | null;
        };
        Relationships: [];
      };
      predictions: {
        Row: {
          id: string;
          match_id: number;
          user_id: string;
          home_score: number;
          away_score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: number;
          user_id: string;
          home_score: number;
          away_score: number;
          created_at?: string;
        };
        Update: {
          home_score?: number;
          away_score?: number;
        };
        Relationships: [];
      };
      prizes: {
        Row: {
          id: string;
          name: string;
          description: string;
          photo_url: string | null;
          criteria: "most_points_date" | "most_points_phase" | "most_points_tournament";
          assignment_type: "automatic" | "manual";
          tie_resolution: "all" | "draw" | "first";
          phase: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          photo_url?: string | null;
          criteria: "most_points_date" | "most_points_phase" | "most_points_tournament";
          assignment_type: "automatic" | "manual";
          tie_resolution?: "all" | "draw" | "first";
          phase?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          name?: string;
          description?: string;
          photo_url?: string | null;
          criteria?: "most_points_date" | "most_points_phase" | "most_points_tournament";
          assignment_type?: "automatic" | "manual";
          tie_resolution?: "all" | "draw" | "first";
          phase?: string | null;
        };
        Relationships: [];
      };
      prize_assignments: {
        Row: {
          id: string;
          prize_id: string;
          user_id: string;
          user_name: string | null;
          assignment_date: string;
          criteria: string;
          phase: string | null;
          assigned_by: string | null;
        };
        Insert: {
          id?: string;
          prize_id: string;
          user_id: string;
          user_name?: string | null;
          assignment_date?: string;
          criteria: string;
          phase?: string | null;
          assigned_by?: string | null;
        };
        Update: {
          user_name?: string | null;
        };
        Relationships: [];
      };
      app_config: {
        Row: {
          key: string;
          value: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          value?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          value?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_rankings: {
        Args: Record<string, never>;
        Returns: Array<{
          user_id: string;
          user_name: string;
          total_points: number;
          exact_scores: number;
          correct_winners: number;
        }>;
      };
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      get_users_with_email: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          name: string;
          dni: string;
          role: "admin" | "user" | "data_entry";
          created_at: string;
          email: string;
          is_active: boolean;
        }>;
      };
      admin_delete_user: {
        Args: { target_id: string };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
