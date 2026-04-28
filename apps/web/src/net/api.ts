import type { LeaderboardEntry, DailyChallenge, RunSubmission } from '@abyssal/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  getDailyChallenge: () => fetchJson<DailyChallenge>('/api/daily'),

  getDailyLeaderboard: () => fetchJson<{ leaderboard: LeaderboardEntry[]; date: string }>('/api/leaderboard/daily'),
  getWeeklyLeaderboard: () => fetchJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard/weekly'),
  getAllTimeLeaderboard: () => fetchJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard/alltime'),

  submitRun: (token: string, run: RunSubmission) => fetchJson<{ run: any }>('/api/runs', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(run),
  }),
};
