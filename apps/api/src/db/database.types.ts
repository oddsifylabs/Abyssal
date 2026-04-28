export interface Database {
  public: {
    Tables: {
      runs: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          avatar_url: string | null;
          score: number;
          depth: number;
          level: number;
          creatures_eaten: number;
          traits: string[];
          duration_seconds: number;
          zone_reached: number;
          is_daily_challenge: boolean;
          replay_hash: string;
          seed: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['runs']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['runs']['Row']>;
      };
      daily_challenge_seeds: {
        Row: {
          date: string;
          seed: string;
          zone: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['daily_challenge_seeds']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['daily_challenge_seeds']['Row']>;
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          condition: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['badges']['Row'], 'created_at'>;
        Update: Partial<Database['public']['Tables']['badges']['Row']>;
      };
      user_badges: {
        Row: {
          user_id: string;
          badge_id: string;
          awarded_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_badges']['Row'], 'awarded_at'>;
        Update: Partial<Database['public']['Tables']['user_badges']['Row']>;
      };
    };
    Views: {
      daily_leaderboard: {
        Row: {
          rank: number;
          user_id: string;
          username: string;
          avatar_url: string | null;
          score: number;
          depth: number;
          level: number;
          traits: string[];
          duration_seconds: number;
          created_at: string;
        };
      };
    };
    Functions: {
      refresh_daily_leaderboard: {
        Args: Record<string, never>;
        Returns: void;
      };
    };
  };
}
