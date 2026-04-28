-- Abyssal Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Runs table: every game submission
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  username TEXT NOT NULL DEFAULT 'Unknown',
  avatar_url TEXT,
  score INTEGER NOT NULL CHECK (score >= 0),
  depth INTEGER NOT NULL CHECK (depth >= 0 AND depth <= 5000),
  level INTEGER NOT NULL CHECK (level >= 0),
  creatures_eaten INTEGER NOT NULL DEFAULT 0,
  traits TEXT[] DEFAULT '{}',
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
  zone_reached INTEGER NOT NULL DEFAULT 0 CHECK (zone_reached >= 0 AND zone_reached <= 4),
  is_daily_challenge BOOLEAN NOT NULL DEFAULT false,
  replay_hash TEXT NOT NULL,
  seed TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast leaderboard queries
CREATE INDEX IF NOT EXISTS idx_runs_score ON runs(score DESC);
CREATE INDEX IF NOT EXISTS idx_runs_daily ON runs(is_daily_challenge, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_runs_user ON runs(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_runs_created ON runs(created_at DESC);

-- Daily challenge seeds
CREATE TABLE IF NOT EXISTS daily_challenge_seeds (
  date DATE PRIMARY KEY,
  seed TEXT NOT NULL,
  zone INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Badges table
CREATE TABLE IF NOT EXISTS badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  condition TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges (many-to-many)
CREATE TABLE IF NOT EXISTS user_badges (
  user_id TEXT NOT NULL,
  badge_id TEXT NOT NULL REFERENCES badges(id),
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Insert default badges
INSERT INTO badges (id, name, description, icon, condition) VALUES
('first_k', 'First Thousand', 'Score 1,000+ points in a single run', '🏆', 'score >= 1000'),
('apex_5k', 'Apex Predator', 'Score 5,000+ points in a single run', '🐉', 'score >= 5000'),
('leviathan_10k', 'Leviathan', 'Score 10,000+ points in a single run', '🐠', 'score >= 10000'),
('hadal_diver', 'Hadal Diver', 'Reach the Hadal Zone (4000m+)', '🦯', 'depth >= 4000'),
('feeder_50', 'Feeder', 'Consume 50+ creatures in a single run', '🍔', 'creatures_eaten >= 50'),
('trait_master', 'Trait Master', 'Absorb Swift, Armored, and Ink in one run', '✨', 'traits contains swift+armored+ink'),
('daily_winner', 'Daily Champion', 'Place #1 on the daily leaderboard', '👑', 'daily_rank = 1'),
('speed_demon', 'Speed Demon', 'Complete a run in under 60 seconds', '⚡', 'duration <= 60 AND score >= 500')
ON CONFLICT (id) DO NOTHING;

-- Row Level Security policies
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read leaderboard data
CREATE POLICY "Public read runs" ON runs FOR SELECT USING (true);

-- Allow authenticated users to insert their own runs
CREATE POLICY "Users insert own runs" ON runs FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Allow users to read their own badges
CREATE POLICY "Users read own badges" ON user_badges FOR SELECT USING (auth.uid()::text = user_id);

-- Materialized view for daily leaderboard (refresh every 5 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_leaderboard AS
SELECT
  ROW_NUMBER() OVER (ORDER BY score DESC) as rank,
  user_id,
  username,
  avatar_url,
  score,
  depth,
  level,
  traits,
  duration_seconds,
  created_at
FROM runs
WHERE is_daily_challenge = true
  AND created_at >= CURRENT_DATE
ORDER BY score DESC
LIMIT 100;

CREATE UNIQUE INDEX idx_daily_leaderboard_rank ON daily_leaderboard(rank);

-- Function to refresh leaderboard
CREATE OR REPLACE FUNCTION refresh_daily_leaderboard()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY daily_leaderboard;
END;
$$ LANGUAGE plpgsql;
