import { GAME_CONFIG, CREATURE_TEMPLATES, getMaxTier } from '../config.js';
import type { Creature, CreatureTemplate } from '@abyssal/types';

let creatureId = 0;

export function spawnCreature(canvasWidth: number, camY: number, canvasHeight: number, seed?: () => number): Creature {
  const rand = seed || Math.random;
  const maxTier = getMaxTier(camY + canvasHeight / 2);
  const pool = CREATURE_TEMPLATES.filter(t => t.tier <= maxTier);
  const weights = pool.map(t => Math.pow(2.5, maxTier - t.tier));
  const total = weights.reduce((a, b) => a + b, 0);
  let rnd = rand() * total;
  let tmpl = pool[0];
  for (let i = 0; i < pool.length; i++) {
    rnd -= weights[i];
    if (rnd <= 0) { tmpl = pool[i]; break; }
  }

  return {
    id: `c-${creatureId++}`,
    x: rand() * canvasWidth,
    y: camY + rand() * canvasHeight,
    vx: (rand() - 0.5) * tmpl.spd,
    vy: (rand() - 0.5) * tmpl.spd,
    r: tmpl.r * (0.8 + rand() * 0.5),
    tmpl,
    angle: 0,
    wobble: rand() * Math.PI * 2,
    pulse: rand() * Math.PI * 2,
    wander: rand() * Math.PI * 2,
    wanderT: 0,
    alive: true,
  };
}

export function updateCreature(c: Creature, p: { x: number; y: number; r: number; traits: string[] }, lures: Array<{ x: number; worldY: number }>, inkClouds: Array<{ x: number; y: number; r: number }>, canvasWidth: number, canvasHeight: number): void {
  c.wobble += 0.05;
  c.pulse += 0.04;
  c.wanderT--;
  if (c.wanderT <= 0) {
    c.wander += (Math.random() - 0.5) * 1.8;
    c.wanderT = 60 + Math.random() * 100;
  }

  const sx = p.x - c.x;
  const sy = p.y - c.y;
  const dist = Math.sqrt(sx * sx + sy * sy) || 1;

  // Lure attraction
  if (c.tmpl.danger < 0.5) {
    lures.forEach(l => {
      const lx = l.x - c.x;
      const ly = l.worldY - c.y;
      const ld = Math.sqrt(lx * lx + ly * ly) || 1;
      if (ld < 160) {
        c.vx += (lx / ld) * 0.09;
        c.vy += (ly / ld) * 0.09;
      }
    });
  }

  // Ink repulsion
  inkClouds.forEach(ik => {
    const ix = ik.x - c.x;
    const iy = ik.y - c.y;
    const id = Math.sqrt(ix * ix + iy * iy) || 1;
    if (id < ik.r + 20) {
      c.vx -= (ix / id) * 0.3;
      c.vy -= (iy / id) * 0.3;
    }
  });

  // Player interaction
  if (dist < 200 + c.r * 4) {
    if (c.r > p.r * 1.2) {
      c.vx += (sx / dist) * c.tmpl.spd * 0.18;
      c.vy += (sy / dist) * c.tmpl.spd * 0.18;
    } else if (c.r < p.r * 0.9) {
      c.vx -= (sx / dist) * c.tmpl.spd * 0.24;
      c.vy -= (sy / dist) * c.tmpl.spd * 0.24;
    }
  } else {
    c.vx += Math.cos(c.wander) * c.tmpl.spd * 0.06;
    c.vy += Math.sin(c.wander) * c.tmpl.spd * 0.06;
  }

  const cv = Math.sqrt(c.vx * c.vx + c.vy * c.vy) || 1;
  if (cv > c.tmpl.spd * 1.6) {
    c.vx = (c.vx / cv) * c.tmpl.spd * 1.6;
    c.vy = (c.vy / cv) * c.tmpl.spd * 1.6;
  }
  c.vx *= 0.9;
  c.vy *= 0.9;
  c.x += c.vx;
  c.y += c.vy;

  if (c.x < 0) c.x = canvasWidth;
  if (c.x > canvasWidth) c.x = 0;
  c.y = Math.max(0, Math.min(GAME_CONFIG.WORLD_DEPTH, c.y));

  if (cv > 0.05) c.angle = Math.atan2(c.vy, c.vx);
}
