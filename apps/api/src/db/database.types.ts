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
        Insert: {
          user_id: string;
          username: string;
          avatar_url?: string | null;
          score: number;
          depth: number;
          level: number;
          creatures_eaten: number;
          traits: string[];
          duration_seconds: number;
          zone_reached: number;
          is_daily_challenge: boolean;
          replay_hash: string;
          seed?: string | null;
        };
        Update: {
          user_id?: string;
          username?: string;
          avatar_url?: string | null;
          score?: number;
          depth?: number;
          level?: number;
          creatures_eaten?: number;
          traits?: string[];
          duration_seconds?: number;
          zone_reached?: number;
          is_daily_challenge?: boolean;
          replay_hash?: string;
          seed?: string | null;
        };
      };
      daily_challenge_seeds: {
        Row: {
          date: string;
          seed: string;
          zone: number;
          created_at: string;
        };
        Insert: {
          date: string;
          seed: string;
          zone: number;
        };
        Update: {
          date?: string;
          seed?: string;
          zone?: number;
        };
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
        Insert: {
          id: string;
          name: string;
          description: string;
          icon: string;
          condition: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          condition?: string;
        };
      };
      user_badges: {
        Row: {
          user_id: string;
          badge_id: string;
          awarded_at: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          badge_id: string;
          awarded_at?: string;
        };
        Update: {
          user_id?: string;
          badge_id?: string;
          awarded_at?: string;
        };
      };
    };
    Views: {
      daily_leaderboard: {
        Row: {
          user_id: string;
          username: string;
          avatar_url: string | null;
          score: number;
          depth: number;
          level: number;
          duration_seconds: number;
          rank: number;
        };
      };
    };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
