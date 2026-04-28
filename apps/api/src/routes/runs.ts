import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import { runSubmissionSchema, verifyScoreHash, isPlausibleRun } from '../utils/validation.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/', async (req: AuthRequest, res) => {
  const userId = req.auth?.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });

  const parse = runSubmissionSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid submission', details: parse.error.flatten() });
  }

  const run = parse.data;

  // Anti-cheat checks
  if (!verifyScoreHash(run.score, run.depth, run.level, run.replayHash)) {
    return res.status(403).json({ error: 'Invalid score hash' });
  }

  if (!isPlausibleRun(run)) {
    return res.status(403).json({ error: 'Run failed validation checks' });
  }

  // Get user info from Clerk (passed via middleware or fetch)
  const username = req.headers['x-username'] as string || 'Unknown';
  const avatarUrl = req.headers['x-avatar-url'] as string || null;

  const { data, error } = await supabase.from('runs').insert({
    user_id: userId,
    username,
    avatar_url: avatarUrl,
    score: run.score,
    depth: run.depth,
    level: run.level,
    creatures_eaten: run.creaturesEaten,
    traits: run.traits,
    duration_seconds: run.durationSeconds,
    zone_reached: run.zoneReached,
    is_daily_challenge: run.isDailyChallenge,
    replay_hash: run.replayHash,
    seed: run.seed || null,
  }).select().single();

  if (error) return res.status(500).json({ error: error.message });

  // Check and award badges
  await awardBadges(userId, run);

  res.status(201).json({ run: data });
});

async function awardBadges(userId: string, run: any) {
  const badgesToAward = [];

  if (run.score >= 1000) badgesToAward.push('first_k');
  if (run.score >= 5000) badgesToAward.push('apex_5k');
  if (run.score >= 10000) badgesToAward.push('leviathan_10k');
  if (run.depth >= 4000) badgesToAward.push('hadal_diver');
  if (run.creaturesEaten >= 50) badgesToAward.push('feeder_50');
  if (run.traits.includes('swift') && run.traits.includes('armored') && run.traits.includes('ink')) {
    badgesToAward.push('trait_master');
  }

  for (const badgeId of badgesToAward) {
    await supabase.from('user_badges').upsert(
      { user_id: userId, badge_id: badgeId, awarded_at: new Date().toISOString() },
      { onConflict: 'user_id,badge_id' }
    );
  }
}

export { router as runsRouter };
