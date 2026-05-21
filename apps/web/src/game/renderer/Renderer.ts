import type { PlayerState, Creature, Boss, Particle, Lure, InkCloud, FloatingText } from '../../types.js';
import { ZONES, ZONE_DEPTHS, TRAITS, GAME_CONFIG, CREATURE_VISUALS, TRAIT_ICONS } from '../config.js';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private titleBubbles: Array<{ x: number; y: number; r: number; spd: number; w: number }> = [];
  private winParticles: Array<{ x: number; y: number; vx: number; vy: number; col: [number, number, number]; life: number }> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    for (let i = 0; i < 30; i++) {
      this.titleBubbles.push({
        x: Math.random() * (canvas.width || 800),
        y: Math.random() * (canvas.height || 600),
        r: 2 + Math.random() * 6,
        spd: 0.3 + Math.random() * 1.2,
        w: Math.random() * Math.PI * 2,
      });
    }
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  render(
    phase: string,
    camY: number,
    currentZone: number,
    player: PlayerState | null,
    creatures: Creature[],
    boss: Boss | null,
    particles: Particle[],
    lures: Lure[],
    inkClouds: InkCloud[],
    warnFlash: number,
    floatingTexts: FloatingText[] = [],
    screenShake = 0,
    zoneFlash = 0,
    zoneFlashName = '',
  ) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const ctx = this.ctx;
    const zone = ZONES[currentZone] || ZONES[0];

    ctx.save();
    if (screenShake > 0) {
      const sx = (Math.random() - 0.5) * screenShake;
      const sy = (Math.random() - 0.5) * screenShake;
      ctx.translate(sx, sy);
    }

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, `rgb(${zone.bg0.join(',')})`);
    bg.addColorStop(1, `rgb(${zone.bg1.join(',')})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (phase === 'title') {
      this.drawTitle(W, H);
      ctx.restore();
      return;
    }

    // Zone-specific background effects
    if (currentZone <= 1) {
      const op = (1 - currentZone * 0.5) * 0.045;
      const t = Date.now() * 0.0004;
      for (let i = 0; i < 7; i++) {
        const rx = (W / 7) * i + 50 + Math.sin(t + i) * 20;
        const rw = 40 + Math.sin(t * 0.7 + i * 1.3) * 15;
        ctx.beginPath();
        ctx.moveTo(rx - rw, 0);
        ctx.lineTo(rx + rw, 0);
        ctx.lineTo(rx + rw * 2.5, H);
        ctx.lineTo(rx - rw * 2.5, H);
        ctx.closePath();
        ctx.fillStyle = `rgba(100,180,255,${op})`;
        ctx.fill();
      }
    }

    if (zone.fog > 0) {
      const fg = ctx.createLinearGradient(0, 0, 0, H);
      fg.addColorStop(0, `rgba(0,0,8,${zone.fog * 0.5})`);
      fg.addColorStop(1, `rgba(0,0,8,${zone.fog})`);
      ctx.fillStyle = fg;
      ctx.fillRect(0, 0, W, H);
    }

    if (currentZone === 3) {
      const t2 = Date.now() * 0.0003;
      for (let i = 0; i < 40; i++) {
        const ex = ((i * 211 + Math.sin(t2 * 1.5 + i) * 30) % W + W) % W;
        const ey = ((i * 173 + camY * 0.2 + Math.sin(t2 + i * 0.7) * 20) % H + H) % H;
        const ea = 0.05 + (Math.sin(t2 * 3 + i) * 0.5 + 0.5) * 0.2;
        ctx.beginPath();
        ctx.arc(ex, ey, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,60,220,${ea})`;
        ctx.fill();
      }
    }

    // Ambient particles
    const t3 = Date.now() * 0.0003;
    const mc = currentZone >= 2 ? 80 : 60;
    for (let i = 0; i < mc; i++) {
      const mx = ((i * 137.5 + Math.sin(t3 + i) * 22) % W + W) % W;
      const my = ((i * 97.3 + camY * 0.15 + Math.cos(t3 * 0.7 + i) * 18) % H + H) % H;
      const ma = 0.04 + (Math.sin(t3 * 2 + i) * 0.5 + 0.5) * 0.1;
      ctx.beginPath();
      ctx.arc(mx, my, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${zone.accent.join(',')},${ma})`;
      ctx.fill();
    }

    // Ink clouds
    inkClouds.forEach(ik => {
      const sy = ik.y - camY;
      if (sy < -200 || sy > H + 200) return;
      const ig = ctx.createRadialGradient(ik.x, sy, 0, ik.x, sy, ik.r);
      ig.addColorStop(0, `rgba(10,0,30,${ik.alpha})`);
      ig.addColorStop(1, 'rgba(10,0,30,0)');
      ctx.beginPath();
      ctx.arc(ik.x, sy, ik.r, 0, Math.PI * 2);
      ctx.fillStyle = ig;
      ctx.fill();
    });

    // Lures
    lures.forEach(l => {
      const sy = l.worldY - camY;
      const a = l.life / 130;
      const lg = ctx.createRadialGradient(l.x, sy, 0, l.x, sy, 65);
      lg.addColorStop(0, `rgba(80,200,255,${a * 0.5})`);
      lg.addColorStop(1, 'rgba(80,200,255,0)');
      ctx.beginPath();
      ctx.arc(l.x, sy, 65, 0, Math.PI * 2);
      ctx.fillStyle = lg;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(l.x, sy, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(80,200,255,${a})`;
      ctx.fill();
      // Lure pulse ring
      ctx.beginPath();
      ctx.arc(l.x, sy, 12 + Math.sin(Date.now() * 0.01) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(80,200,255,${a * 0.4})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Creatures
    creatures.forEach(c => this.drawCreature(c, camY, player?.r || 14));
    if (boss && boss.alive) this.drawBoss(boss, camY);

    // Particles
    particles.forEach(q => {
      if (!q.col) return;
      const a = q.life / q.maxLife;
      const [r, g, b] = q.col;
      if (q.ring) {
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r * (1 - a), 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r},${g},${b},${a * 0.6})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r * a, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${a * 0.85})`;
        ctx.fill();
      }
    });

    // Player
    if (player && phase === 'playing') this.drawPlayer(player, camY);

    // Floating texts
    floatingTexts.forEach(ft => {
      const a = ft.life / ft.maxLife;
      ctx.font = `bold ${ft.size}px 'Share Tech Mono',monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(${ft.color[0]},${ft.color[1]},${ft.color[2]},${a})`;
      ctx.shadowColor = `rgba(${ft.color[0]},${ft.color[1]},${ft.color[2]},${a * 0.6})`;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    });

    // HUD
    if (player) this.drawHUD(player, W, H, camY, boss, creatures);

    // Zone flash overlay
    if (zoneFlash > 0) {
      const za = ZONES[currentZone]?.accent || [80, 200, 255];
      ctx.fillStyle = `rgba(${za[0]},${za[1]},${za[2]},${zoneFlash * 0.25})`;
      ctx.fillRect(0, 0, W, H);
      ctx.font = "900 42px 'Orbitron',monospace";
      ctx.textAlign = 'center';
      ctx.fillStyle = `rgba(255,255,255,${zoneFlash * 0.9})`;
      ctx.shadowColor = `rgba(${za[0]},${za[1]},${za[2]},${zoneFlash})`;
      ctx.shadowBlur = 40;
      ctx.fillText(zoneFlashName, W / 2, H / 2);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }

    // Phase screens
    if (phase === 'dead') this.drawDead(W, H, player);
    if (phase === 'win') this.drawWin(W, H, player);

    // Hunger vignette
    if (warnFlash > 0 && player) {
      const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.85);
      vg.addColorStop(0, 'rgba(0,0,0,0)');
      vg.addColorStop(1, `rgba(160,60,0,${warnFlash * 0.25})`);
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  // CREATURE RENDERING
  // ═══════════════════════════════════════════════════════════════

  private drawCreature(c: Creature, camY: number, playerR: number = 14) {
    const sx = c.x;
    const sy = c.y - camY;
    if (sy < -120 || sy > this.canvas.height + 120) return;
    const [r, g, b] = c.tmpl.col;
    const pulse = 0.7 + Math.sin(c.pulse) * 0.3;
    const ctx = this.ctx;
    const vis = CREATURE_VISUALS[c.tmpl.name] || CREATURE_VISUALS.mote;

    const isDangerous = c.r > playerR * 1.1 && c.tmpl.danger > 0.4;
    if (isDangerous) {
      const dr = ctx.createRadialGradient(sx, sy, c.r * 0.5, sx, sy, c.r * 3.5);
      dr.addColorStop(0, 'rgba(255,40,40,0.12)');
      dr.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.beginPath();
      ctx.arc(sx, sy, c.r * 3.5, 0, Math.PI * 2);
      ctx.fillStyle = dr;
      ctx.fill();
      // Danger ring pulse
      const dp = 0.5 + Math.sin(Date.now() * 0.006) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, c.r * 2.2 + dp * 4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,40,40,${dp * 0.25})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(c.angle);

    // Bioluminescent glow spots
    if (vis.glowSpots > 0 || c.tmpl.trait === 'luminous') {
      const spots = vis.glowSpots + (c.tmpl.trait === 'luminous' ? 3 : 0);
      for (let i = 0; i < spots; i++) {
        const ga = (i / spots) * Math.PI * 2 + c.pulse * 0.5;
        const gr = c.r * 0.55;
        const gx = Math.cos(ga) * gr;
        const gy = Math.sin(ga) * gr * 0.5;
        const glow = ctx.createRadialGradient(gx, gy, 0, gx, gy, c.r * 0.35);
        glow.addColorStop(0, `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},${Math.min(255, b + 80)},${0.6 * pulse})`);
        glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(gx, gy, c.r * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Fins / Tail
    if (vis.fins !== 'none') {
      this.drawFins(ctx, vis.fins, c.r, c.wobble, pulse);
    }

    // Whiskers
    if (vis.whiskers) {
      ctx.beginPath();
      ctx.moveTo(c.r * 0.6, -c.r * 0.3);
      ctx.quadraticCurveTo(c.r * 1.4, -c.r * 0.6, c.r * 1.2, -c.r * 0.1);
      ctx.moveTo(c.r * 0.6, c.r * 0.3);
      ctx.quadraticCurveTo(c.r * 1.4, c.r * 0.6, c.r * 1.2, c.r * 0.1);
      ctx.strokeStyle = `rgba(${r},${g},${b},0.5)`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Body
    this.drawBodyShape(ctx, vis.body, c.r, pulse, r, g, b);

    // Spots
    if (vis.spots) {
      for (let i = 0; i < 4; i++) {
        const sa = (i / 4) * Math.PI * 2 + 0.5;
        const sr = c.r * 0.35 + Math.sin(i * 3) * c.r * 0.1;
        ctx.beginPath();
        ctx.arc(Math.cos(sa) * sr, Math.sin(sa) * sr * 0.5, c.r * 0.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,0.25)`;
        ctx.fill();
      }
    }

    // Eye
    if (vis.eyeSize > 0) {
      const ex = c.r * 0.35;
      const ey = -c.r * 0.15;
      const er = c.r * vis.eyeSize * 0.35;
      // Sclera
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fill();
      // Pupil
      ctx.beginPath();
      ctx.arc(ex + er * 0.25, ey, er * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(10,10,30,0.95)';
      ctx.fill();
      // Eye shine
      ctx.beginPath();
      ctx.arc(ex + er * 0.35, ey - er * 0.25, er * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.fill();
    }

    // Anglerfish lure light
    if (c.tmpl.name === 'anglerfish') {
      const lx = -c.r * 1.4;
      const ly = -c.r * 1.2;
      ctx.beginPath();
      ctx.moveTo(c.r * 0.3, -c.r * 0.4);
      ctx.quadraticCurveTo(c.r * 0.1, -c.r * 0.9, lx, ly);
      ctx.strokeStyle = `rgba(60,80,200,0.5)`;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 18);
      lg.addColorStop(0, `rgba(100,220,255,${0.6 * pulse})`);
      lg.addColorStop(1, 'rgba(80,200,255,0)');
      ctx.fillStyle = lg;
      ctx.beginPath();
      ctx.arc(lx, ly, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180,250,255,${0.9 * pulse})`;
      ctx.fill();
    }

    ctx.restore();
  }

  private drawBodyShape(ctx: CanvasRenderingContext2D, body: string, r: number, pulse: number, cr: number, cg: number, cb: number) {
    const grad = ctx.createRadialGradient(-r * 0.2, -r * 0.15, 0, 0, 0, r * 1.2);
    grad.addColorStop(0, `rgba(${Math.min(255, cr + 40)},${Math.min(255, cg + 40)},${Math.min(255, cb + 40)},0.92)`);
    grad.addColorStop(0.6, `rgba(${cr},${cg},${cb},0.85)`);
    grad.addColorStop(1, `rgba(${Math.max(0, cr - 40)},${Math.max(0, cg - 40)},${Math.max(0, cb - 40)},0.7)`);
    ctx.fillStyle = grad;

    switch (body) {
      case 'round':
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'ellipse':
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'bell': {
        ctx.beginPath();
        ctx.moveTo(-r, r * 0.3);
        ctx.bezierCurveTo(-r * 1.2, -r * 0.8, -r * 0.4, -r * 1.2, 0, -r * 1.1);
        ctx.bezierCurveTo(r * 0.4, -r * 1.2, r * 1.2, -r * 0.8, r, r * 0.3);
        ctx.quadraticCurveTo(0, r * 0.6, -r, r * 0.3);
        ctx.fill();
        break;
      }
      case 'worm':
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.3, r * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'diamond': {
        ctx.beginPath();
        ctx.moveTo(r * 1.3, 0);
        ctx.lineTo(0, -r * 0.8);
        ctx.lineTo(-r * 1.3, 0);
        ctx.lineTo(0, r * 0.8);
        ctx.closePath();
        ctx.fill();
        break;
      }
      case 'serpent': {
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.bezierCurveTo(r * 0.8, -r * 0.7, -r * 0.5, -r * 0.8, -r * 0.8, 0);
        ctx.bezierCurveTo(-r * 0.5, r * 0.8, r * 0.8, r * 0.7, r, 0);
        ctx.fill();
        break;
      }
      case 'mantle': {
        ctx.beginPath();
        ctx.moveTo(r * 0.9, -r * 0.5);
        ctx.quadraticCurveTo(r * 0.3, -r * 1.1, -r * 0.3, -r * 0.9);
        ctx.quadraticCurveTo(-r * 0.9, -r * 0.4, -r * 0.6, r * 0.3);
        ctx.quadraticCurveTo(0, r * 0.6, r * 0.6, r * 0.3);
        ctx.quadraticCurveTo(r * 0.9, 0, r * 0.9, -r * 0.5);
        ctx.fill();
        break;
      }
      case 'spiky': {
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.85, 0, Math.PI * 2);
        ctx.fill();
        const spikes = 7;
        for (let i = 0; i < spikes; i++) {
          const a = (i / spikes) * Math.PI * 2;
          const sr = r * (0.85 + Math.sin(i * 5 + pulse * 2) * 0.2);
          ctx.beginPath();
          ctx.moveTo(Math.cos(a - 0.15) * r * 0.7, Math.sin(a - 0.15) * r * 0.7);
          ctx.lineTo(Math.cos(a) * sr, Math.sin(a) * sr);
          ctx.lineTo(Math.cos(a + 0.15) * r * 0.7, Math.sin(a + 0.15) * r * 0.7);
          ctx.fillStyle = `rgba(${cr},${cg},${cb},0.8)`;
          ctx.fill();
        }
        break;
      }
      default:
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
        ctx.fill();
    }
  }

  private drawFins(ctx: CanvasRenderingContext2D, finType: string, r: number, wobble: number, pulse: number) {
    const w = Math.sin(wobble) * 0.15;
    ctx.save();
    switch (finType) {
      case 'tail': {
        const tw = r * (0.4 + w * 0.3);
        ctx.beginPath();
        ctx.moveTo(-r * 0.7, 0);
        ctx.quadraticCurveTo(-r * 1.6, -tw, -r * 2.0, -tw * 0.3);
        ctx.quadraticCurveTo(-r * 1.8, 0, -r * 2.0, tw * 0.3);
        ctx.quadraticCurveTo(-r * 1.6, tw, -r * 0.7, 0);
        ctx.fillStyle = ctx.fillStyle;
        ctx.globalAlpha = 0.7;
        ctx.fill();
        break;
      }
      case 'dorsal': {
        const dw = r * (0.3 + w * 0.2);
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, -r * 0.5);
        ctx.quadraticCurveTo(r * 0.3, -r * 1.3 - dw, r * 0.6, -r * 0.6);
        ctx.fill();
        break;
      }
      case 'side': {
        const sw = r * (0.25 + Math.sin(wobble + 1) * 0.15);
        ctx.beginPath();
        ctx.moveTo(r * 0.1, -r * 0.4);
        ctx.quadraticCurveTo(-r * 0.4, -r * 1.1 - sw, -r * 0.8, -r * 0.3);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.1, r * 0.4);
        ctx.quadraticCurveTo(-r * 0.4, r * 1.1 + sw, -r * 0.8, r * 0.3);
        ctx.fill();
        break;
      }
      case 'wing': {
        const ww = r * (0.5 + w * 0.3);
        ctx.beginPath();
        ctx.moveTo(r * 0.4, -r * 0.3);
        ctx.quadraticCurveTo(-r * 0.8, -r * 1.8 - ww, -r * 1.6, -r * 0.1);
        ctx.quadraticCurveTo(-r * 0.6, -r * 0.2, r * 0.4, -r * 0.3);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.4, r * 0.3);
        ctx.quadraticCurveTo(-r * 0.8, r * 1.8 + ww, -r * 1.6, r * 0.1);
        ctx.quadraticCurveTo(-r * 0.6, r * 0.2, r * 0.4, r * 0.3);
        ctx.fill();
        break;
      }
      case 'lobe': {
        ctx.beginPath();
        ctx.moveTo(r * 0.5, -r * 0.5);
        ctx.quadraticCurveTo(-r * 0.2, -r * 1.3, -r * 0.8, -r * 0.4);
        ctx.quadraticCurveTo(-r * 0.2, -r * 0.3, r * 0.5, -r * 0.5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(r * 0.5, r * 0.5);
        ctx.quadraticCurveTo(-r * 0.2, r * 1.3, -r * 0.8, r * 0.4);
        ctx.quadraticCurveTo(-r * 0.2, r * 0.3, r * 0.5, r * 0.5);
        ctx.fill();
        break;
      }
      case 'tentacle': {
        const tc = ctx.fillStyle;
        for (let i = -2; i <= 2; i++) {
          const ta = (i / 2.5) * 0.5 + w * 0.4;
          const tl = r * (0.6 + Math.abs(i) * 0.15 + Math.sin(wobble + i) * 0.1);
          ctx.beginPath();
          ctx.moveTo(-r * 0.4, i * r * 0.25);
          ctx.quadraticCurveTo(-r * 0.9, i * r * 0.35 + ta * r, -r * 1.4, i * r * 0.2 + ta * r * 0.5);
          ctx.strokeStyle = tc as string;
          ctx.globalAlpha = 0.5 + pulse * 0.2;
          ctx.lineWidth = r * 0.12;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        break;
      }
    }
    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  // BOSS RENDERING
  // ═══════════════════════════════════════════════════════════════

  private drawBoss(boss: Boss, camY: number) {
    const sx = boss.x;
    const sy = boss.y - camY;
    if (sy < -250 || sy > this.canvas.height + 250) return;
    const ctx = this.ctx;
    const pulse = 0.6 + Math.sin(boss.pulse) * 0.4;
    const isEnraged = boss.phase >= 2;

    // Massive aura
    const og = ctx.createRadialGradient(sx, sy, boss.r * 0.5, sx, sy, boss.r * 5);
    const ac = isEnraged ? [220, 30, 60] : [140, 30, 200];
    og.addColorStop(0, `rgba(${ac[0]},${ac[1]},${ac[2]},${0.18 + pulse * 0.08})`);
    og.addColorStop(0.5, `rgba(${ac[0] * 0.6},${ac[1] * 0.3},${ac[2] * 0.5},${0.08})`);
    og.addColorStop(1, 'rgba(60,0,100,0)');
    ctx.beginPath();
    ctx.arc(sx, sy, boss.r * 5, 0, Math.PI * 2);
    ctx.fillStyle = og;
    ctx.fill();

    // Tentacles
    if (boss.tentacles) {
      boss.tentacles.forEach((t, i) => {
        const ta = t.angle + Math.sin(boss.pulse + i) * 0.15;
        const tl = t.len * (0.9 + Math.sin(boss.pulse * 1.3 + i * 2) * 0.1);
        ctx.beginPath();
        ctx.moveTo(sx + Math.cos(ta) * boss.r * 0.8, sy + Math.sin(ta) * boss.r * 0.8);
        const cp1x = sx + Math.cos(ta + 0.3) * tl * 0.5;
        const cp1y = sy + Math.sin(ta + 0.3) * tl * 0.5;
        const endx = sx + Math.cos(ta - 0.1) * tl;
        const endy = sy + Math.sin(ta - 0.1) * tl;
        ctx.quadraticCurveTo(cp1x, cp1y, endx, endy);
        ctx.strokeStyle = `rgba(${ac[0]},${ac[1] * 0.5},${ac[2]},${0.4 + pulse * 0.15})`;
        ctx.lineWidth = 6 + Math.sin(i * 3) * 2;
        ctx.lineCap = 'round';
        ctx.stroke();
        // Tentacle tip glow
        const tg = ctx.createRadialGradient(endx, endy, 0, endx, endy, 12);
        tg.addColorStop(0, `rgba(${ac[0]},${ac[1]},${ac[2]},${0.5 * pulse})`);
        tg.addColorStop(1, `rgba(${ac[0]},${ac[1]},${ac[2]},0)`);
        ctx.fillStyle = tg;
        ctx.beginPath();
        ctx.arc(endx, endy, 12, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    ctx.save();
    ctx.translate(sx, sy);

    // Body
    ctx.beginPath();
    ctx.arc(0, 0, boss.r, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(-boss.r * 0.2, -boss.r * 0.2, 0, 0, 0, boss.r);
    if (isEnraged) {
      bg.addColorStop(0, 'rgba(220,50,60,0.95)');
      bg.addColorStop(0.6, 'rgba(140,10,30,0.9)');
      bg.addColorStop(1, 'rgba(80,0,15,0.75)');
    } else {
      bg.addColorStop(0, 'rgba(140,30,220,0.95)');
      bg.addColorStop(0.6, 'rgba(70,0,120,0.9)');
      bg.addColorStop(1, 'rgba(40,0,70,0.75)');
    }
    ctx.fillStyle = bg;
    ctx.fill();

    // Eye
    const eyeR = boss.r * 0.22;
    ctx.beginPath();
    ctx.arc(boss.r * 0.25, -boss.r * 0.15, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,200,200,0.95)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(boss.r * 0.3, -boss.r * 0.15, eyeR * 0.5, 0, Math.PI * 2);
    ctx.fillStyle = isEnraged ? 'rgba(255,30,30,0.95)' : 'rgba(30,10,60,0.95)';
    ctx.fill();
    // Eye glow
    const eg = ctx.createRadialGradient(boss.r * 0.25, -boss.r * 0.15, 0, boss.r * 0.25, -boss.r * 0.15, eyeR * 2);
    eg.addColorStop(0, `rgba(255,${isEnraged ? '50' : '100'},${isEnraged ? '50' : '200'},${0.4 * pulse})`);
    eg.addColorStop(1, 'rgba(255,100,200,0)');
    ctx.fillStyle = eg;
    ctx.beginPath();
    ctx.arc(boss.r * 0.25, -boss.r * 0.15, eyeR * 2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.beginPath();
    ctx.arc(-boss.r * 0.15, boss.r * 0.1, boss.r * 0.35, 0.1, Math.PI - 0.1);
    ctx.strokeStyle = `rgba(0,0,0,${0.5 + pulse * 0.2})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Spikes when enraged
    if (isEnraged) {
      const spikes = 10;
      for (let i = 0; i < spikes; i++) {
        const a = (i / spikes) * Math.PI * 2;
        const sr = boss.r * (1 + Math.sin(i * 7 + boss.pulse * 2) * 0.15);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a - 0.1) * boss.r * 0.8, Math.sin(a - 0.1) * boss.r * 0.8);
        ctx.lineTo(Math.cos(a) * sr, Math.sin(a) * sr);
        ctx.lineTo(Math.cos(a + 0.1) * boss.r * 0.8, Math.sin(a + 0.1) * boss.r * 0.8);
        ctx.fillStyle = `rgba(220,40,60,${0.6 + pulse * 0.2})`;
        ctx.fill();
      }
    }

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  // PLAYER RENDERING
  // ═══════════════════════════════════════════════════════════════

  private drawPlayer(p: PlayerState, camY: number) {
    if (p.iframes > 0 && Math.floor(p.iframes / 4) % 2 === 1) return;
    const sx = p.x;
    const sy = p.y - camY;
    const ctx = this.ctx;
    const [r, g, b] = [80, 200, 255];

    // Outer aura
    const og = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.r * 6);
    og.addColorStop(0, `rgba(${r},${g},${b},0.08)`);
    og.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(sx, sy, p.r * 6, 0, Math.PI * 2);
    ctx.fillStyle = og;
    ctx.fill();

    // Core glow
    const cg = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.r * 2.5);
    cg.addColorStop(0, `rgba(${r + 60},${g + 40},255,0.35)`);
    cg.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(sx, sy, p.r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = cg;
    ctx.fill();

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(p.angle);

    // Fins
    const finW = Math.sin(Date.now() * 0.008) * 0.2;
    ctx.beginPath();
    ctx.moveTo(-p.r * 0.4, -p.r * 0.5);
    ctx.quadraticCurveTo(-p.r * 1.2, -p.r * 1.1 - finW * p.r, -p.r * 0.8, -p.r * 0.2);
    ctx.fillStyle = `rgba(${r},${g},${b},0.35)`;
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-p.r * 0.4, p.r * 0.5);
    ctx.quadraticCurveTo(-p.r * 1.2, p.r * 1.1 + finW * p.r, -p.r * 0.8, p.r * 0.2);
    ctx.fill();

    // Tail
    ctx.beginPath();
    ctx.moveTo(-p.r * 0.7, 0);
    ctx.quadraticCurveTo(-p.r * 1.5, -p.r * 0.4 + finW * p.r, -p.r * 1.9, -p.r * 0.1);
    ctx.quadraticCurveTo(-p.r * 1.7, 0, -p.r * 1.9, p.r * 0.1);
    ctx.quadraticCurveTo(-p.r * 1.5, p.r * 0.4 - finW * p.r, -p.r * 0.7, 0);
    ctx.fillStyle = `rgba(${r},${g},${b},0.45)`;
    ctx.fill();

    // Body
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r, p.r * 0.68, 0, 0, Math.PI * 2);
    const bg2 = ctx.createRadialGradient(-p.r * 0.2, -p.r * 0.2, 0, 0, 0, p.r * 1.4);
    bg2.addColorStop(0, `rgba(${Math.min(255, r + 100)},${Math.min(255, g + 80)},255,0.95)`);
    bg2.addColorStop(0.5, `rgba(${r + 40},${g + 40},255,0.85)`);
    bg2.addColorStop(1, `rgba(${r},${g},${b},0.55)`);
    ctx.fillStyle = bg2;
    ctx.fill();

    // Cockpit window
    ctx.beginPath();
    ctx.ellipse(p.r * 0.3, -p.r * 0.1, p.r * 0.35, p.r * 0.22, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(200,240,255,0.7)';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(p.r * 0.38, -p.r * 0.18, p.r * 0.12, p.r * 0.08, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();

    // Thruster
    const thrust = 0.6 + Math.sin(Date.now() * 0.02) * 0.3;
    const tg = ctx.createRadialGradient(-p.r * 0.9, 0, 0, -p.r * 0.9, 0, p.r * 0.8);
    tg.addColorStop(0, `rgba(100,220,255,${0.8 * thrust})`);
    tg.addColorStop(1, `rgba(40,120,200,0)`);
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.ellipse(-p.r * 0.9, 0, p.r * 0.3, p.r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ═══════════════════════════════════════════════════════════════
  // HUD
  // ═══════════════════════════════════════════════════════════════

  private drawHUD(p: PlayerState, W: number, H: number, camY: number, boss: Boss | null, creatures: Creature[]) {
    const ctx = this.ctx;
    ctx.save();

    // Glassmorphism Stats panel
    const lx = 16, ly = 16, lw = 164, lh = 148;
    ctx.fillStyle = 'rgba(4,12,28,0.55)';
    this.roundRect(lx, ly, lw, lh, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,180,255,0.18)';
    ctx.lineWidth = 1;
    this.roundRect(lx, ly, lw, lh, 14);
    ctx.stroke();

    // Panel shine
    const shine = ctx.createLinearGradient(lx, ly, lx + lw, ly);
    shine.addColorStop(0, 'rgba(255,255,255,0.03)');
    shine.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    shine.addColorStop(1, 'rgba(255,255,255,0.03)');
    ctx.fillStyle = shine;
    this.roundRect(lx, ly, lw, 28, 14);
    ctx.fill();

    this.hudLabel('SIZE', lx + 12, ly + 24, 0.5, 10);
    this.hudLabel((p.r / 14).toFixed(1) + '×', lx + 68, ly + 24, 0.95, 12);
    this.hudLabel('DEPTH', lx + 12, ly + 42, 0.5, 10);
    this.hudLabel(Math.floor(p.y) + 'm', lx + 68, ly + 42, 0.95, 12);
    this.hudLabel('LEVEL', lx + 12, ly + 60, 0.5, 10);
    this.hudLabel(String(p.level), lx + 68, ly + 60, 0.95, 12);
    this.hudLabel('EATEN', lx + 12, ly + 78, 0.5, 10);
    this.hudLabel(String(p.eaten), lx + 68, ly + 78, 0.95, 12);
    this.hudLabel('SCORE', lx + 12, ly + 96, 0.5, 10);
    this.hudLabel(String(p.score), lx + 68, ly + 96, 0.95, 12);

    // Zone badge
    const za = ZONES[this.getCurrentZone(p.y)].accent;
    ctx.fillStyle = `rgba(${za[0]},${za[1]},${za[2]},0.1)`;
    this.roundRect(lx + 6, ly + 112, lw - 12, 26, 8);
    ctx.fill();
    ctx.strokeStyle = `rgba(${za[0]},${za[1]},${za[2]},0.25)`;
    this.roundRect(lx + 6, ly + 112, lw - 12, 26, 8);
    ctx.stroke();
    ctx.font = "10px 'Share Tech Mono',monospace";
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(${za[0] + 40},${za[1] + 40},${za[2] + 40},0.92)`;
    ctx.fillText('◇ ' + ZONES[this.getCurrentZone(p.y)].name, lx + lw / 2, ly + 129);
    ctx.textAlign = 'left';

    // Glassmorphism Bars panel
    const rx = W - 178, ry = 16, rw = 162, rh = 108;
    ctx.fillStyle = 'rgba(4,12,28,0.55)';
    this.roundRect(rx, ry, rw, rh, 14);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,180,255,0.18)';
    this.roundRect(rx, ry, rw, rh, 14);
    ctx.stroke();

    const bx = rx + 12, bw = rw - 24;
    const hPct = p.hp / p.maxHp;
    const hCol1 = hPct < 0.3 ? '#c02020' : '#0a8';
    const hCol2 = hPct < 0.3 ? '#ff4444' : '#2ff';
    this.hudLabel('HP  ' + Math.ceil(p.hp) + '/' + p.maxHp, bx, ry + 26, 0.6, 10);
    this.bar(bx, ry + 30, bw, 7, hPct, hCol1, hCol2);

    const huPct = p.hunger / 100;
    const huCol1 = huPct < 0.25 ? '#b04010' : '#c07000';
    const huCol2 = huPct < 0.25 ? '#ff8844' : '#ffcc22';
    this.hudLabel('HUNGER', bx, ry + 54, 0.6, 10);
    this.bar(bx, ry + 58, bw, 7, huPct, huCol1, huCol2);

    this.hudLabel('EVOLVE ' + Math.round((p.xp / p.xpNext) * 100) + '%', bx, ry + 82, 0.6, 10);
    this.bar(bx, ry + 86, bw, 7, p.xp / p.xpNext, '#60a', '#d2f');

    // Depth progress bar
    const dpx = W - 14, dpy = H * 0.12, dph = H * 0.76;
    ctx.fillStyle = 'rgba(4,12,28,0.45)';
    this.roundRect(dpx - 5, dpy, 10, dph, 5);
    ctx.fill();
    const depthPct = Math.min(1, p.y / GAME_CONFIG.WORLD_DEPTH);
    const fillH = dph * depthPct;
    const dg = ctx.createLinearGradient(0, dpy, 0, dpy + dph);
    dg.addColorStop(0, 'rgba(80,220,255,0.75)');
    dg.addColorStop(0.5, 'rgba(60,100,220,0.75)');
    dg.addColorStop(1, 'rgba(180,40,220,0.75)');
    ctx.fillStyle = dg;
    this.roundRect(dpx - 4, dpy + dph - fillH, 8, fillH, 4);
    ctx.fill();
    // Depth markers for zones
    for (let i = 1; i <= 3; i++) {
      const my = dpy + dph - dph * (i * 1000 / GAME_CONFIG.WORLD_DEPTH);
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(dpx - 8, my - 1, 16, 2);
    }

    // Minimap
    this.drawMinimap(p, W, H, creatures, boss, camY);

    // Boss bar
    if (boss && boss.alive) {
      const bw2 = Math.min(400, W * 0.5);
      const bx2 = (W - bw2) / 2;
      // Glass panel
      ctx.fillStyle = 'rgba(4,0,12,0.72)';
      this.roundRect(bx2 - 10, H - 64, bw2 + 20, 54, 12);
      ctx.fill();
      const isEnraged = boss.phase >= 2;
      ctx.strokeStyle = isEnraged ? 'rgba(255,60,60,0.25)' : 'rgba(160,40,220,0.25)';
      this.roundRect(bx2 - 10, H - 64, bw2 + 20, 54, 12);
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = "11px 'Orbitron',monospace";
      ctx.fillStyle = isEnraged ? 'rgba(255,80,80,0.92)' : 'rgba(200,80,255,0.9)';
      ctx.shadowColor = isEnraged ? 'rgba(255,0,0,0.5)' : 'rgba(160,0,255,0.4)';
      ctx.shadowBlur = 10;
      ctx.fillText('☠  ABYSSAL COLOSSUS' + (isEnraged ? ' — ENRAGED' : ''), W / 2, H - 48);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
      this.bar(bx2, H - 42, bw2, 10, boss.hp / boss.maxHp, isEnraged ? 'rgba(140,0,20,0.9)' : 'rgba(100,0,60,0.9)', isEnraged ? 'rgba(255,40,60,0.9)' : 'rgba(220,60,200,0.9)', 5);
      // Phase indicators
      const segW = bw2 / 4;
      for (let i = 1; i < 4; i++) {
        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.fillRect(bx2 + segW * i - 1, H - 42, 2, 10);
      }
    }

    // Trait icons
    if (p.traits.length > 0) {
      let tx = 16;
      p.traits.forEach(t => {
        const icon = TRAIT_ICONS[t] || '◇';
        const lbl = (TRAITS[t] || t).replace(/^.+?\s/, '');
        ctx.font = "bold 10px 'Share Tech Mono',monospace";
        const tw = ctx.measureText(icon + ' ' + lbl).width + 18;
        ctx.fillStyle = 'rgba(4,16,40,0.75)';
        this.roundRect(tx, H - 48, tw, 26, 13);
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,180,255,0.2)';
        this.roundRect(tx, H - 48, tw, 26, 13);
        ctx.stroke();
        ctx.fillStyle = 'rgba(160,230,255,0.95)';
        ctx.fillText(icon + ' ' + lbl, tx + 9, H - 30);
        tx += tw + 8;
      });
    }

    ctx.restore();
  }

  private drawMinimap(p: PlayerState, W: number, H: number, creatures: Creature[], boss: Boss | null, camY: number) {
    const ctx = this.ctx;
    const mw = 140, mh = 90;
    const mx = W - mw - 16, my = H - mh - 62;
    const range = 500;

    ctx.fillStyle = 'rgba(4,12,28,0.6)';
    this.roundRect(mx, my, mw, mh, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,180,255,0.15)';
    this.roundRect(mx, my, mw, mh, 10);
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    this.roundRect(mx, my, mw, mh, 10);
    ctx.clip();

    // Player dot
    const px = mx + mw / 2;
    const py = my + mh / 2;
    ctx.beginPath();
    ctx.arc(px, py, 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(80,220,255,1)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(80,220,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Creatures
    creatures.forEach(c => {
      const dx = c.x - p.x;
      const dy = c.y - p.y;
      if (Math.abs(dx) > range || Math.abs(dy) > range) return;
      const cx = px + (dx / range) * (mw / 2);
      const cy = py + (dy / range) * (mh / 2);
      const isDanger = c.r > p.r * 1.1 && c.tmpl.danger > 0.4;
      ctx.beginPath();
      ctx.arc(cx, cy, isDanger ? 2.5 : 1.5, 0, Math.PI * 2);
      ctx.fillStyle = isDanger ? 'rgba(255,60,60,0.8)' : `rgba(${c.tmpl.col.join(',')},0.7)`;
      ctx.fill();
    });

    // Boss
    if (boss && boss.alive) {
      const dx = boss.x - p.x;
      const dy = boss.y - p.y;
      if (Math.abs(dx) <= range && Math.abs(dy) <= range) {
        const cx = px + (dx / range) * (mw / 2);
        const cy = py + (dy / range) * (mh / 2);
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(220,40,255,0.9)';
        ctx.fill();
      }
    }

    ctx.restore();
  }

  private getCurrentZone(y: number): number {
    return Math.min(3, Math.floor(y / 1000));
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, w, h, r);
  }

  private bar(x: number, y: number, w: number, h: number, pct: number, col1: string, col2: string, r = 3) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,8,24,0.7)';
    this.roundRect(x, y, w, h, r);
    ctx.fill();
    const fw = w * Math.max(0, pct);
    const grd = ctx.createLinearGradient(x, y, x + fw, y);
    grd.addColorStop(0, col1);
    grd.addColorStop(1, col2);
    ctx.fillStyle = grd;
    this.roundRect(x, y, fw, h, r);
    ctx.fill();
    // Shine stripe
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(x + 2, y + 1, fw - 4, h * 0.35);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    this.roundRect(x, y, w, h, r);
    ctx.stroke();
  }

  private hudLabel(txt: string, x: number, y: number, alpha = 0.55, size = 10) {
    const ctx = this.ctx;
    ctx.font = `${size}px 'Share Tech Mono',monospace`;
    ctx.fillStyle = `rgba(120,210,255,${alpha})`;
    ctx.fillText(txt, x, y);
  }

  // ═══════════════════════════════════════════════════════════════
  // SCREENS
  // ═══════════════════════════════════════════════════════════════

  private drawTitle(W: number, H: number) {
    const ctx = this.ctx;
    const t = performance.now() * 0.0008;
    ctx.fillStyle = 'rgba(0,4,12,0.92)';
    ctx.fillRect(0, 0, W, H);

    // Caustic light rays
    const op = 0.04 + Math.sin(t * 0.5) * 0.015;
    for (let i = 0; i < 9; i++) {
      const rx = (W / 9) * i + 60 + Math.sin(t * 0.6 + i * 1.1) * 30;
      const rw = 50 + Math.sin(t * 0.4 + i * 2) * 20;
      ctx.beginPath();
      ctx.moveTo(rx - rw, 0);
      ctx.lineTo(rx + rw, 0);
      ctx.lineTo(rx + rw * 2.8, H);
      ctx.lineTo(rx - rw * 2.8, H);
      ctx.closePath();
      ctx.fillStyle = `rgba(80,180,255,${op})`;
      ctx.fill();
    }

    // Rising bubbles
    this.titleBubbles.forEach(b => {
      b.y -= b.spd;
      b.x += Math.sin(t + b.w) * 0.3;
      if (b.y < -20) { b.y = H + 20; b.x = Math.random() * W; }
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(120,200,255,${0.08 + Math.sin(t * 2 + b.w) * 0.04})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.25, b.y - b.r * 0.25, b.r * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.15 + Math.sin(t + b.w) * 0.08})`;
      ctx.fill();
    });

    const pulse = 0.8 + Math.sin(t) * 0.2;
    ctx.save();
    ctx.textAlign = 'center';

    // Title with caustic shimmer
    ctx.font = "900 76px 'Orbitron',monospace";
    ctx.shadowColor = 'rgba(60,160,255,0.6)';
    ctx.shadowBlur = 55 * pulse;
    ctx.fillStyle = `rgba(100,200,255,${0.9 + Math.sin(t) * 0.06})`;
    ctx.fillText('ABYSSAL', W / 2, H / 2 - 80);
    ctx.shadowBlur = 0;

    // Subtitle
    ctx.font = "12px 'Share Tech Mono',monospace";
    ctx.fillStyle = 'rgba(80,150,190,0.55)';
    ctx.fillText('you are small  ·  the deep is vast  ·  become everything', W / 2, H / 2 - 32);

    // CTA
    ctx.font = "13px 'Orbitron',monospace";
    ctx.fillStyle = `rgba(120,220,255,${0.85 + Math.sin(t * 2.2) * 0.12})`;
    ctx.fillText('— CLICK TO DESCEND —', W / 2, H / 2 + 55);

    // Bottom tips
    ctx.font = "10px 'Share Tech Mono',monospace";
    ctx.fillStyle = 'rgba(80,130,170,0.4)';
    ctx.fillText('WASD · MOVE    SPACE · DASH    CLICK · LURE', W / 2, H - 40);

    ctx.restore();
  }

  private drawDead(W: number, H: number, p: PlayerState | null) {
    if (!p) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6,0,2,0.88)';
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.textAlign = 'center';

    // Skull icon
    ctx.font = "64px serif";
    ctx.fillStyle = 'rgba(220,60,60,0.25)';
    ctx.fillText('☠', W / 2, H / 2 - 95);

    ctx.font = "900 48px 'Orbitron',monospace";
    ctx.fillStyle = 'rgba(220,60,60,0.92)';
    ctx.shadowColor = 'rgba(255,0,0,0.4)';
    ctx.shadowBlur = 20;
    ctx.fillText('CONSUMED', W / 2, H / 2 - 35);
    ctx.shadowBlur = 0;

    // Divider line
    ctx.strokeStyle = 'rgba(180,60,60,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 80, H / 2 - 12);
    ctx.lineTo(W / 2 + 80, H / 2 - 12);
    ctx.stroke();

    // Stats as log entries
    ctx.font = "11px 'Share Tech Mono',monospace";
    ctx.fillStyle = 'rgba(140,170,190,0.7)';
    const lines = [
      '> depth reached .......... ' + Math.floor(p.y) + 'm',
      '> creatures consumed ..... ' + p.eaten,
      '> max level .............. ' + p.level,
      '> score .................. ' + p.score,
    ];
    lines.forEach((l, i) => ctx.fillText(l, W / 2, H / 2 + 16 + i * 22));

    ctx.font = "11px 'Orbitron',monospace";
    ctx.fillStyle = 'rgba(140,180,200,0.45)';
    ctx.fillText('CLICK TO RESURFACE', W / 2, H / 2 + 125);
    ctx.restore();
  }

  private drawWin(W: number, H: number, p: PlayerState | null) {
    if (!p) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,8,4,0.88)';
    ctx.fillRect(0, 0, W, H);

    // Celebration particles
    if (this.winParticles.length < 80) {
      this.winParticles.push({
        x: Math.random() * W,
        y: H + 10,
        vx: (Math.random() - 0.5) * 3,
        vy: -1 - Math.random() * 3,
        col: [60 + Math.random() * 200, 200 + Math.random() * 55, 120 + Math.random() * 135] as [number, number, number],
        life: 60 + Math.random() * 100,
      });
    }
    for (let i = this.winParticles.length - 1; i >= 0; i--) {
      const wp = this.winParticles[i];
      wp.x += wp.vx;
      wp.y += wp.vy;
      wp.vy += 0.02;
      wp.life--;
      const a = Math.min(1, wp.life / 40);
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, 2 + a * 3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${wp.col[0]},${wp.col[1]},${wp.col[2]},${a})`;
      ctx.fill();
      if (wp.life <= 0) this.winParticles.splice(i, 1);
    }

    ctx.save();
    ctx.textAlign = 'center';

    // Crown icon
    ctx.font = "48px serif";
    ctx.fillStyle = 'rgba(60,255,160,0.2)';
    ctx.fillText('♔', W / 2, H / 2 - 95);

    ctx.font = "900 44px 'Orbitron',monospace";
    ctx.fillStyle = 'rgba(60,255,160,0.92)';
    ctx.shadowColor = 'rgba(40,255,120,0.4)';
    ctx.shadowBlur = 25;
    ctx.fillText('APEX PREDATOR', W / 2, H / 2 - 35);
    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(60,220,140,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 90, H / 2 - 12);
    ctx.lineTo(W / 2 + 90, H / 2 - 12);
    ctx.stroke();

    ctx.font = "11px 'Share Tech Mono',monospace";
    ctx.fillStyle = 'rgba(100,200,160,0.7)';
    const lines = [
      'the abyss bows to you',
      '',
      'level .................. ' + p.level,
      'creatures consumed ..... ' + p.eaten,
      'score .................. ' + p.score,
    ];
    lines.forEach((l, i) => ctx.fillText(l, W / 2, H / 2 + 16 + i * 22));

    ctx.font = "11px 'Orbitron',monospace";
    ctx.fillStyle = 'rgba(120,200,160,0.5)';
    ctx.fillText('CLICK TO RETURN', W / 2, H / 2 + 130);
    ctx.restore();
  }
}
