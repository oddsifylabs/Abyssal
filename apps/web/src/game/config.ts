import type { ZoneConfig, CreatureTemplate } from '../types.js';

export const GAME_CONFIG = {
  WORLD_DEPTH: 5000,
  MAX_CREATURES: 55,
  PLAYER_START_R: 14,
  PLAYER_START_HP: 100,
  PLAYER_START_HUNGER: 100,
  DASH_COOLDOWN: 85,
  DASH_FORCE: 11,
  BASE_SPEED: 2.8,
  HUNGER_DECAY: 0.015,
  STARVE_DAMAGE: 0.04,
  REGEN_RATE: 0.018,
  IFRAMES_DAMAGE: 60,
  IFRAMES_CREATURE: 50,
  BOSS_SPAWN_DEPTH: 4000,
  BOSS_HP: 1200,
  BOSS_CHARGE_SPEED_PHASE1: 13,
  BOSS_CHARGE_SPEED_PHASE2: 13,
  BOSS_CHARGE_CD_PHASE1: 210,
  BOSS_CHARGE_CD_PHASE2: 130,
  XP_MULTIPLIER: 1.7,
  TRAIT_DROP_CHANCE: 0.35,
  MAX_PLAYER_SIZE: 70,
  SIZE_PER_LEVEL: 6,
  SIZE_PER_EAT: 0.035,
  HP_PER_LEVEL: 25,
  HP_LEVELUP_HEAL: 40,
} as const;

export const ZONES: ZoneConfig[] = [
  { name: 'SUNLIT ZONE', accent: [80, 200, 255], bg0: [0, 12, 32], bg1: [0, 8, 22], fog: 0 },
  { name: 'TWILIGHT ZONE', accent: [60, 130, 220], bg0: [0, 6, 22], bg1: [0, 4, 16], fog: 0.1 },
  { name: 'MIDNIGHT ZONE', accent: [40, 60, 150], bg0: [0, 3, 14], bg1: [0, 2, 10], fog: 0.2 },
  { name: 'HADAL ZONE', accent: [100, 30, 160], bg0: [4, 0, 12], bg1: [2, 0, 8], fog: 0.3 },
];

export const ZONE_DEPTHS = [0, 1000, 2000, 3000];

export const CREATURE_TEMPLATES: CreatureTemplate[] = [
  { name: 'plankton', r: 4, spd: 0.5, col: [60, 220, 160], pts: 5, danger: 0, tier: 0, trait: null },
  { name: 'mote', r: 7, spd: 0.7, col: [100, 230, 200], pts: 8, danger: 0, tier: 0, trait: null },
  { name: 'shrimp', r: 11, spd: 1.4, col: [220, 150, 70], pts: 14, danger: 0.3, tier: 1, trait: 'swift' },
  { name: 'jellyfish', r: 15, spd: 0.5, col: [180, 90, 255], pts: 20, danger: 0.1, tier: 1, trait: 'luminous' },
  { name: 'seahorse', r: 10, spd: 0.6, col: [200, 160, 40], pts: 12, danger: 0, tier: 1, trait: null },
  { name: 'anglerfish', r: 20, spd: 1.0, col: [60, 80, 200], pts: 28, danger: 0.9, tier: 2, trait: 'lure' },
  { name: 'eel', r: 18, spd: 1.5, col: [40, 180, 80], pts: 32, danger: 1.0, tier: 2, trait: 'regen' },
  { name: 'manta', r: 24, spd: 1.2, col: [30, 120, 180], pts: 38, danger: 0.6, tier: 2, trait: null },
  { name: 'viperfish', r: 19, spd: 1.8, col: [60, 180, 120], pts: 35, danger: 1.2, tier: 2, trait: 'swift' },
  { name: 'squid', r: 26, spd: 1.2, col: [160, 40, 120], pts: 45, danger: 1.5, tier: 3, trait: 'ink' },
  { name: 'dragonfish', r: 22, spd: 1.6, col: [180, 40, 40], pts: 42, danger: 1.6, tier: 3, trait: null },
  { name: 'coelacanth', r: 30, spd: 0.9, col: [40, 80, 160], pts: 55, danger: 1.3, tier: 3, trait: 'armored' },
  { name: 'leviathan', r: 48, spd: 0.8, col: [20, 50, 120], pts: 80, danger: 2.5, tier: 4, trait: 'armored' },
];

export const TRAITS: Record<string, string> = {
  swift: '⚡ SWIFT',
  luminous: '✦ LUMINOUS',
  lure: '◉ LURE',
  regen: '↻ REGEN',
  ink: '◈ INK',
  armored: '⬡ ARMORED',
};

export function getMaxTier(depth: number): number {
  return Math.min(4, Math.floor(depth / 700));
}

export function getCurrentZone(y: number): number {
  return Math.min(3, Math.floor(y / 1000));
}

export function seededRandom(seed: string): () => number {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface CreatureVisual {
  body: 'ellipse' | 'bell' | 'worm' | 'diamond' | 'serpent' | 'mantle' | 'round' | 'spiky';
  fins: 'tail' | 'dorsal' | 'side' | 'wing' | 'lobe' | 'tentacle' | 'none';
  eyeSize: number;
  glowSpots: number;
  tailLen: number;
  spots: boolean;
  whiskers: boolean;
}

export const CREATURE_VISUALS: Record<string, CreatureVisual> = {
  plankton: { body: 'round', fins: 'none', eyeSize: 0, glowSpots: 2, tailLen: 0, spots: false, whiskers: false },
  mote: { body: 'round', fins: 'none', eyeSize: 0.4, glowSpots: 3, tailLen: 0, spots: false, whiskers: false },
  shrimp: { body: 'worm', fins: 'tail', eyeSize: 0.5, glowSpots: 0, tailLen: 0.6, spots: false, whiskers: true },
  jellyfish: { body: 'bell', fins: 'tentacle', eyeSize: 0.3, glowSpots: 4, tailLen: 0.8, spots: true, whiskers: false },
  seahorse: { body: 'serpent', fins: 'dorsal', eyeSize: 0.5, glowSpots: 0, tailLen: 0.3, spots: false, whiskers: false },
  anglerfish: { body: 'spiky', fins: 'side', eyeSize: 0.7, glowSpots: 1, tailLen: 0.2, spots: false, whiskers: false },
  eel: { body: 'worm', fins: 'dorsal', eyeSize: 0.5, glowSpots: 0, tailLen: 0.9, spots: false, whiskers: false },
  manta: { body: 'diamond', fins: 'wing', eyeSize: 0.4, glowSpots: 0, tailLen: 0.3, spots: false, whiskers: false },
  viperfish: { body: 'worm', fins: 'side', eyeSize: 0.6, glowSpots: 2, tailLen: 0.5, spots: false, whiskers: true },
  squid: { body: 'mantle', fins: 'tentacle', eyeSize: 0.55, glowSpots: 0, tailLen: 0.7, spots: false, whiskers: false },
  dragonfish: { body: 'spiky', fins: 'side', eyeSize: 0.6, glowSpots: 3, tailLen: 0.4, spots: true, whiskers: true },
  coelacanth: { body: 'ellipse', fins: 'lobe', eyeSize: 0.5, glowSpots: 0, tailLen: 0.3, spots: true, whiskers: false },
  leviathan: { body: 'serpent', fins: 'dorsal', eyeSize: 0.8, glowSpots: 5, tailLen: 1.2, spots: true, whiskers: false },
};

export const TRAIT_ICONS: Record<string, string> = {
  swift: '⚡',
  luminous: '✦',
  lure: '◉',
  regen: '↻',
  ink: '◈',
  armored: '⬡',
};
