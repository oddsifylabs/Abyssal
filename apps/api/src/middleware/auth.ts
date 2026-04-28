import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import type { Request } from 'express';

export const requireAuth: ReturnType<typeof ClerkExpressRequireAuth> = ClerkExpressRequireAuth();

export interface AuthRequest extends Request {
  auth?: {
    userId: string;
    sessionId: string;
  };
}
