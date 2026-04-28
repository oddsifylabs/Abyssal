import { z } from 'zod';
import crypto from 'crypto';

export const runSubmissionSchema = z.object({
  score: z.number().int().min(0).max(999999),
  depth: z.number().int().min(0).max(5000),
  level: z.number().int().min(0).max(100),
  creaturesEaten: z.number().int().min(0),
  traits: z.array(z.string()),
  durationSeconds: z.number().int().min(1).max(3600),
  zoneReached: z.number().int().min(0).max(4),
  isDailyChallenge: z.boolean().default(false),
  replayHash: z.string().length(64),
  seed: z.string().optional(),
});

export function verifyScoreHash(score: number, depth: number, level: number, hash: string): boolean {
  const secret = process.env.SCORE_SECRET || 'abyssal-client-hash';
  const payload = `${score}:${depth}:${level}:${secret}`;
  const expected = crypto.createHash('sha256').update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expected));
}

export function isPlausibleRun(run: z.infer<typeof runSubmissionSchema>): boolean {
  // Max ~3 points per second on average for realistic play
  const maxRate = 5;
  if (run.score / run.durationSeconds > maxRate) return false;
  // Depth should correlate with duration (max ~50m/s with dash spam)
  if (run.depth / run.durationSeconds > 60) return false;
  // Level scaling check
  if (run.level > 0 && run.score < run.level * 50) return false;
  return true;
}
