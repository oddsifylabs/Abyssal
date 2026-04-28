export interface Vec2 {
  x: number;
  y: number;
}

export interface PlayerState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  maxHp: number;
  hunger: number;
  xp: number;
  xpNext: number;
  level: number;
  traits: string[];
  eaten: number;
  score: number;
  iframes: number;
  dashCD: number;
  angle: number;
  luminous: boolean;
}

export interface CreatureTemplate {
  name: string;
  r: number;
  spd: number;
  col: [number, number, number];
  pts: number;
  danger: number;
  tier: number;
  trait: string | null;
}

export interface Creature {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  tmpl: CreatureTemplate;
  angle: number;
  wobble: number;
  pulse: number;
  wander: number;
  wanderT: number;
  alive: boolean;
}

export interface Boss {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hp: number;
  maxHp: number;
  phase: number;
  chargeCD: number;
  charging: boolean;
  chargeVx: number;
  chargeVy: number;
  wobble: number;
  pulse: number;
  alive: boolean;
  tentacles: Array<{ angle: number; len: number; wobble: number }>;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  col: [number, number, number];
  life: number;
  maxLife: number;
  r: number;
  ring?: boolean;
}

export interface Lure {
  x: number;
  y: number;
  worldY: number;
  life: number;
}

export interface InkCloud {
  x: number;
  y: number;
  r: number;
  maxR: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface ZoneConfig {
  name: string;
  accent: [number, number, number];
  bg0: [number, number, number];
  bg1: [number, number, number];
  fog: number;
}

export interface RunSubmission {
  userId: string;
  username: string;
  score: number;
  depth: number;
  level: number;
  creaturesEaten: number;
  traits: string[];
  durationSeconds: number;
  zoneReached: number;
  isDailyChallenge: boolean;
  replayHash: string;
  seed?: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  score: number;
  depth: number;
  level: number;
  traits: string[];
  durationSeconds: number;
  createdAt: string;
}

export interface DailyChallenge {
  date: string;
  seed: string;
  zone: number;
  expiresAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
}

export interface UserBadge {
  badgeId: string;
  awardedAt: string;
}

export interface GameRoom {
  id: string;
  players: Map<string, PlayerState>;
  creatures: Creature[];
  boss: Boss | null;
  state: 'waiting' | 'playing' | 'finished';
  seed: string;
  createdAt: number;
}

export type GameScreen = 'title' | 'playing' | 'dead' | 'win' | 'paused' | 'leaderboard' | 'daily';
