import { GAME_CONFIG, TRAITS } from '../config.js';
import type { PlayerState } from '@abyssal/types';

export function createPlayer(canvasWidth: number): PlayerState {
  return {
    x: canvasWidth / 2,
    y: 300,
    vx: 0,
    vy: 0,
    r: GAME_CONFIG.PLAYER_START_R,
    hp: GAME_CONFIG.PLAYER_START_HP,
    maxHp: GAME_CONFIG.PLAYER_START_HP,
    hunger: GAME_CONFIG.PLAYER_START_HUNGER,
    xp: 0,
    xpNext: 80,
    level: 0,
    traits: [],
    eaten: 0,
    score: 0,
    iframes: 0,
    dashCD: 0,
    angle: 0,
    luminous: false,
  };
}

export function updatePlayer(
  p: PlayerState,
  keys: Record<string, boolean>,
  joystickDx: number,
  joystickDy: number,
  canvasWidth: number,
  dt: number
): { camY: number; trail: Array<{ x: number; y: number }> } {
  const spd = GAME_CONFIG.BASE_SPEED * (p.traits.includes('swift') ? 1.35 : 1);
  const jx = joystickDx;
  const jy = joystickDy;

  if (keys['a'] || keys['A'] || keys['ArrowLeft'] || jx < -0.2) p.vx -= 0.38;
  if (keys['d'] || keys['D'] || keys['ArrowRight'] || jx > 0.2) p.vx += 0.38;
  if (keys['w'] || keys['W'] || keys['ArrowUp'] || jy < -0.2) p.vy -= 0.38;
  if (keys['s'] || keys['S'] || keys['ArrowDown'] || jy > 0.2) p.vy += 0.38;

  if ((keys[' '] || keys['Space']) && p.dashCD <= 0) {
    const len = Math.sqrt(p.vx * p.vx + p.vy * p.vy) || 1;
    p.vx += (p.vx / len) * GAME_CONFIG.DASH_FORCE;
    p.vy += (p.vy / len) * GAME_CONFIG.DASH_FORCE;
    p.dashCD = GAME_CONFIG.DASH_COOLDOWN;
  }

  if (p.dashCD > 0) p.dashCD--;
  p.vx *= 0.85;
  p.vy *= 0.85;

  const vel = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
  if (vel > spd) {
    p.vx = (p.vx / vel) * spd;
    p.vy = (p.vy / vel) * spd;
  }

  p.x += p.vx;
  p.y += p.vy;
  if (p.x < 0) p.x = canvasWidth;
  if (p.x > canvasWidth) p.x = 0;
  p.y = Math.max(10, Math.min(GAME_CONFIG.WORLD_DEPTH, p.y));

  if (vel > 0.1) p.angle = Math.atan2(p.vy, p.vx);

  // Hunger & HP
  p.hunger -= GAME_CONFIG.HUNGER_DECAY;
  if (p.hunger < 0) {
    p.hunger = 0;
    p.hp -= GAME_CONFIG.STARVE_DAMAGE;
  }
  if (p.traits.includes('regen')) {
    p.hp = Math.min(p.maxHp, p.hp + GAME_CONFIG.REGEN_RATE);
  }
  if (p.iframes > 0) p.iframes--;

  const trail = [];
  for (let i = 0; i < Math.min(16, Math.floor(vel * 3) + 4); i++) {
    trail.push({ x: p.x - p.vx * i * 0.5, y: p.y - p.vy * i * 0.5 - 0 });
  }

  const camY = Math.max(0, Math.min(GAME_CONFIG.WORLD_DEPTH - window.innerHeight, p.y - window.innerHeight * 0.4));

  return { camY, trail };
}

export function gainTrait(p: PlayerState, name: string): boolean {
  if (p.traits.includes(name)) return false;
  p.traits.push(name);
  if (name === 'luminous') p.luminous = true;
  return true;
}

export function levelUp(p: PlayerState): void {
  p.level++;
  p.maxHp = GAME_CONFIG.PLAYER_START_HP + p.level * GAME_CONFIG.HP_PER_LEVEL;
  p.hp = Math.min(p.hp + GAME_CONFIG.HP_LEVELUP_HEAL, p.maxHp);
  p.xp = 0;
  p.xpNext = Math.floor(p.xpNext * GAME_CONFIG.XP_MULTIPLIER);
  p.r = Math.min(GAME_CONFIG.MAX_PLAYER_SIZE, GAME_CONFIG.PLAYER_START_R + p.level * GAME_CONFIG.SIZE_PER_LEVEL + p.eaten * GAME_CONFIG.SIZE_PER_EAT);
}
