import type { Boss } from './types.js';

export function spawnBoss(canvasWidth: number, camY: number, canvasHeight: number): Boss {
  return {
    x: canvasWidth / 2,
    y: camY + canvasHeight * 0.3,
    vx: 0,
    vy: 0,
    r: 80,
    hp: 1200,
    maxHp: 1200,
    phase: 1,
    chargeCD: 200,
    charging: false,
    chargeVx: 0,
    chargeVy: 0,
    wobble: 0,
    pulse: 0,
    alive: true,
    tentacles: Array.from({ length: 8 }, (_, i) => ({
      angle: (i / 8) * Math.PI * 2,
      len: 60 + Math.random() * 40,
      wobble: Math.random() * Math.PI * 2,
    })),
  };
}

export function updateBoss(boss: Boss, p: { x: number; y: number; r: number; traits: string[]; iframes: number }, onPlayerHit: (dmg: number) => void): void {
  boss.wobble += 0.03;
  boss.pulse += 0.025;
  boss.tentacles.forEach(t => t.wobble += 0.04);

  const bsx = p.x - boss.x;
  const bsy = p.y - boss.y;
  const bd = Math.sqrt(bsx * bsx + bsy * bsy) || 1;

  boss.chargeCD--;

  if (boss.charging) {
    boss.x += boss.chargeVx;
    boss.y += boss.chargeVy;
    boss.chargeVx *= 0.97;
    boss.chargeVy *= 0.97;
    if (Math.sqrt(boss.chargeVx ** 2 + boss.chargeVy ** 2) < 0.5) boss.charging = false;
  } else {
    const bs = boss.phase >= 2 ? 0.9 : 0.6;
    boss.vx += (bsx / bd) * bs * 0.08;
    boss.vy += (bsy / bd) * bs * 0.08;
    boss.vx *= 0.94;
    boss.vy *= 0.94;
    boss.x += boss.vx;
    boss.y += boss.vy;

    if (boss.chargeCD <= 0 && bd < 450) {
      boss.charging = true;
      boss.chargeVx = (bsx / bd) * 13;
      boss.chargeVy = (bsy / bd) * 13;
      boss.chargeCD = boss.phase >= 2 ? 130 : 210;
    }
  }

  if (boss.hp / boss.maxHp < 0.5 && boss.phase === 1) {
    boss.phase = 2;
  }

  if (bd < boss.r + p.r && p.iframes <= 0) {
    let dmg = 20;
    if (p.traits.includes('armored')) dmg *= 0.5;
    onPlayerHit(dmg);
  }
}
