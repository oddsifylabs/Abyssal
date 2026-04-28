import { Router } from 'express';
import { supabase } from '../db/supabase.js';

const router = Router();

router.get('/daily', async (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('runs')
    .select('user_id, username, avatar_url, score, depth, level, traits, duration_seconds, created_at')
    .eq('is_daily_challenge', true)
    .gte('created_at', `${today}T00:00:00Z`)
    .order('score', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });

  const ranked = (data || []).map((r, i) => ({
    rank: i + 1,
    userId: r.user_id,
    username: r.username,
    avatarUrl: r.avatar_url,
    score: r.score,
    depth: r.depth,
    level: r.level,
    traits: r.traits,
    durationSeconds: r.duration_seconds,
    createdAt: r.created_at,
  }));

  return res.json({ leaderboard: ranked, date: today });
});

router.get('/weekly', async (_req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('runs')
    .select('user_id, username, avatar_url, score, depth, level, traits, duration_seconds, created_at')
    .gte('created_at', weekAgo)
    .order('score', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });

  const ranked = (data || []).map((r, i) => ({
    rank: i + 1,
    userId: r.user_id,
    username: r.username,
    avatarUrl: r.avatar_url,
    score: r.score,
    depth: r.depth,
    level: r.level,
    traits: r.traits,
    durationSeconds: r.duration_seconds,
    createdAt: r.created_at,
  }));

  return res.json({ leaderboard: ranked });
});

router.get('/alltime', async (_req, res) => {
  const { data, error } = await supabase
    .from('runs')
    .select('user_id, username, avatar_url, score, depth, level, traits, duration_seconds, created_at')
    .order('score', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });

  const ranked = (data || []).map((r, i) => ({
    rank: i + 1,
    userId: r.user_id,
    username: r.username,
    avatarUrl: r.avatar_url,
    score: r.score,
    depth: r.depth,
    level: r.level,
    traits: r.traits,
    durationSeconds: r.duration_seconds,
    createdAt: r.created_at,
  }));

  return res.json({ leaderboard: ranked });
});

router.get('/user/:userId/best', async (req, res) => {
  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('score', { ascending: false })
    .limit(1)
    .single();

  if (error) return res.status(404).json({ error: 'No runs found' });
  return res.json({ bestRun: data });
});

export { router as leaderboardRouter };
