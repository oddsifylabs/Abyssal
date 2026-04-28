import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import type { Request, Response, NextFunction } from 'express';

export const requireAuth = ClerkExpressRequireAuth();

export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
  };
}
