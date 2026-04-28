import rateLimit from 'express-rate-limit';
import Redis from 'ioredis';

// In-memory for now; swap to Redis when scaling
const memoryStore = new Map<string, { count: number; resetTime: number }>();

export const runLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 submissions per minute
  message: { error: 'Too many run submissions. Slow down, predator.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.auth?.userId || req.ip,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { error: 'Rate limit exceeded' },
});
