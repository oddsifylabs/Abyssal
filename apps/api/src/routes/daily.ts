import { Router } from 'express';
import { supabase } from '../db/supabase.js';
import crypto from 'crypto';

const router = Router();

function getDailySeed(date: string): string {
  const secret = process.env.DAILY_SEED_SECRET || 'abyssal-daily-dev';
  return crypto.createHmac('sha256', secret).update(date).digest('hex').slice(0, 16);
}

router.get('/', async (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const seed = getDailySeed(today);

  // Ensure seed exists in DB
  await supabase.from('daily_challenge_seeds').upsert(
    { date: today, seed, zone: 4 },
    { onConflict: 'date' }
  );

  const expiresAt = new Date();
  expiresAt.setUTCDate(expiresAt.getUTCDate() + 1);
  expiresAt.setUTCHours(0, 0, 0, 0);

  return res.json({
    date: today,
    seed,
    zone: 4,
    expiresAt: expiresAt.toISOString(),
  });
});

export { router as dailyRouter };
