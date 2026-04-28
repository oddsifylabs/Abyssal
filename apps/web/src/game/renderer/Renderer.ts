import type { PlayerState, Creature, Boss, Particle, Lure, InkCloud } from '../types.js';
import { ZONES, ZONE_DEPTHS, TRAITS, GAME_CONFIG } from '../config.js';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
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
    warnFlash: number
  ) {
    const W = this.canvas.width;
    const H = this.canvas.height;
    const ctx = this.ctx;
    const zone = ZONES[currentZone] || ZONES[0];

    // Background
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, `rgb(${zone.bg0.join(',')})`);
    bg.addColorStop(1, `rgb(${zone.bg1.join(',')})`);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    if (phase === 'title') {
      this.drawTitle(W, H);
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

    // HUD
    if (player) this.drawHUD(player, W, H, camY, boss);

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
  }

  private drawCreature(c: Creature, camY: number, playerR: number = 14) {
    const sx = c.x;
    const sy = c.y - camY;
    if (sy < -100 || sy > this.canvas.height + 100) return;
    const [r, g, b] = c.tmpl.col;
    const pulse = 0.7 + Math.sin(c.pulse) * 0.3;
    const ctx = this.ctx;

    const isDangerous = c.r > playerR * 1.1 && c.tmpl.danger > 0.4;
    if (isDangerous) {
      const dr = ctx.createRadialGradient(sx, sy, c.r * 0.5, sx, sy, c.r * 3);
      dr.addColorStop(0, 'rgba(255,40,40,0.15)');
      dr.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.beginPath();
      ctx.arc(sx, sy, c.r * 3, 0, Math.PI * 2);
      ctx.fillStyle = dr;
      ctx.fill();
    }

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(c.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, c.r, c.r * 0.62, 0, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${r},${g},${b},0.82)`;
    ctx.fill();
    ctx.restore();
  }

  private drawBoss(boss: Boss, camY: number) {
    const sx = boss.x;
    const sy = boss.y - camY;
    if (sy < -200 || sy > this.canvas.height + 200) return;
    const ctx = this.ctx;
    const pulse = 0.6 + Math.sin(boss.pulse) * 0.4;

    const og = ctx.createRadialGradient(sx, sy, 0, sx, sy, boss.r * 3.5);
    og.addColorStop(0, `rgba(120,20,180,${0.22 + pulse * 0.1})`);
    og.addColorStop(1, 'rgba(60,0,100,0)');
    ctx.beginPath();
    ctx.arc(sx, sy, boss.r * 3.5, 0, Math.PI * 2);
    ctx.fillStyle = og;
    ctx.fill();

    ctx.save();
    ctx.translate(sx, sy);
    ctx.beginPath();
    ctx.arc(0, 0, boss.r, 0, Math.PI * 2);
    const bg = ctx.createRadialGradient(-boss.r * 0.2, -boss.r * 0.2, 0, 0, 0, boss.r);
    bg.addColorStop(0, 'rgba(120,20,200,0.9)');
    bg.addColorStop(0.6, 'rgba(60,0,100,0.85)');
    bg.addColorStop(1, 'rgba(40,0,70,0.7)');
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.restore();
  }

  private drawPlayer(p: PlayerState, camY: number) {
    if (p.iframes > 0 && Math.floor(p.iframes / 4) % 2 === 1) return;
    const sx = p.x;
    const sy = p.y - camY;
    const ctx = this.ctx;
    const [r, g, b] = [80, 200, 255];

    const og = ctx.createRadialGradient(sx, sy, 0, sx, sy, p.r * 5);
    og.addColorStop(0, `rgba(${r},${g},${b},0.1)`);
    og.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.beginPath();
    ctx.arc(sx, sy, p.r * 5, 0, Math.PI * 2);
    ctx.fillStyle = og;
    ctx.fill();

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(p.angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, p.r, p.r * 0.64, 0, 0, Math.PI * 2);
    const bg2 = ctx.createRadialGradient(-p.r * 0.2, -p.r * 0.2, 0, 0, 0, p.r * 1.3);
    bg2.addColorStop(0, `rgba(${Math.min(255, r + 80)},${Math.min(255, g + 80)},255,0.92)`);
    bg2.addColorStop(1, `rgba(${r},${g},${b},0.65)`);
    ctx.fillStyle = bg2;
    ctx.fill();
    ctx.restore();
  }

  private drawHUD(p: PlayerState, W: number, H: number, camY: number, boss: Boss | null) {
    const ctx = this.ctx;
    ctx.save();

    // Stats panel
    const lx = 14, ly = 14, lw = 150, lh = 130;
    ctx.fillStyle = 'rgba(0,10,25,0.72)';
    this.roundRect(lx, ly, lw, lh, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,180,255,0.12)';
    ctx.lineWidth = 1;
    this.roundRect(lx, ly, lw, lh, 8);
    ctx.stroke();

    this.hudLabel('SIZE', lx + 10, ly + 22, 0.45, 9);
    this.hudLabel((p.r / 14).toFixed(1) + '×', lx + 60, ly + 22, 0.9, 11);
    this.hudLabel('DEPTH', lx + 10, ly + 38, 0.45, 9);
    this.hudLabel(Math.floor(p.y) + 'm', lx + 60, ly + 38, 0.9, 11);
    this.hudLabel('LEVEL', lx + 10, ly + 54, 0.45, 9);
    this.hudLabel(String(p.level), lx + 60, ly + 54, 0.9, 11);
    this.hudLabel('EATEN', lx + 10, ly + 70, 0.45, 9);
    this.hudLabel(String(p.eaten), lx + 60, ly + 70, 0.9, 11);
    this.hudLabel('SCORE', lx + 10, ly + 86, 0.45, 9);
    this.hudLabel(String(p.score), lx + 60, ly + 86, 0.9, 11);

    // Zone badge
    const za = ZONES[this.getCurrentZone(p.y)].accent;
    ctx.fillStyle = `rgba(${za[0]},${za[1]},${za[2]},0.12)`;
    this.roundRect(lx + 4, ly + 97, lw - 8, 22, 5);
    ctx.fill();
    ctx.strokeStyle = `rgba(${za[0]},${za[1]},${za[2]},0.25)`;
    this.roundRect(lx + 4, ly + 97, lw - 8, 22, 5);
    ctx.stroke();
    ctx.font = "9px 'Share Tech Mono',monospace";
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(${za[0] + 40},${za[1] + 40},${za[2] + 40},0.9)`;
    ctx.fillText('◈ ' + ZONES[this.getCurrentZone(p.y)].name, lx + lw / 2, ly + 112);
    ctx.textAlign = 'left';

    // Bars panel
    const rx = W - 166, ry = 14, rw = 152, rh = 88;
    ctx.fillStyle = 'rgba(0,10,25,0.72)';
    this.roundRect(rx, ry, rw, rh, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,180,255,0.12)';
    this.roundRect(rx, ry, rw, rh, 8);
    ctx.stroke();

    const bx = rx + 10, bw = rw - 20;
    const hPct = p.hp / p.maxHp;
    const hCol1 = hPct < 0.3 ? '#a00' : '#0a5';
    const hCol2 = hPct < 0.3 ? '#f44' : '#2fa';
    this.hudLabel('HP  ' + Math.ceil(p.hp) + '/' + p.maxHp, bx, ry + 22, 0.55, 9);
    this.bar(bx, ry + 25, bw, 6, hPct, hCol1, hCol2);

    const huPct = p.hunger / 100;
    const huCol1 = huPct < 0.25 ? '#963' : '#a50';
    const huCol2 = huPct < 0.25 ? '#f96' : '#fa2';
    this.hudLabel('HUNGER', bx, ry + 46, 0.55, 9);
    this.bar(bx, ry + 49, bw, 6, huPct, huCol1, huCol2);

    this.hudLabel('EVOLVE ' + Math.round((p.xp / p.xpNext) * 100) + '%', bx, ry + 70, 0.55, 9);
    this.bar(bx, ry + 73, bw, 6, p.xp / p.xpNext, '#50a', '#a2f');

    // Depth progress bar
    const dpx = W - 12, dpy = H * 0.12, dph = H * 0.76;
    ctx.fillStyle = 'rgba(0,10,25,0.6)';
    this.roundRect(dpx - 4, dpy, 8, dph, 4);
    ctx.fill();
    const depthPct = Math.min(1, p.y / GAME_CONFIG.WORLD_DEPTH);
    const fillH = dph * depthPct;
    const dg = ctx.createLinearGradient(0, dpy, 0, dpy + dph);
    dg.addColorStop(0, 'rgba(80,200,255,0.7)');
    dg.addColorStop(0.5, 'rgba(60,80,200,0.7)');
    dg.addColorStop(1, 'rgba(140,30,200,0.7)');
    ctx.fillStyle = dg;
    this.roundRect(dpx - 3, dpy, 6, fillH, 3);
    ctx.fill();

    // Boss bar
    if (boss && boss.alive) {
      const bw2 = Math.min(360, W * 0.45);
      const bx2 = (W - bw2) / 2;
      ctx.fillStyle = 'rgba(0,0,10,0.85)';
      this.roundRect(bx2 - 8, H - 58, bw2 + 16, 48, 8);
      ctx.fill();
      ctx.textAlign = 'center';
      ctx.font = "10px 'Share Tech Mono',monospace";
      ctx.fillStyle = boss.phase >= 2 ? 'rgba(255,80,80,0.9)' : 'rgba(180,60,255,0.85)';
      ctx.fillText('☠  ABYSSAL COLOSSUS' + (boss.phase >= 2 ? ' — ENRAGED' : ''), W / 2, H - 44);
      ctx.textAlign = 'left';
      this.bar(bx2, H - 38, bw2, 9, boss.hp / boss.maxHp, 'rgba(100,0,40,0.9)', 'rgba(220,40,80,0.9)', 4);
    }

    // Traits
    if (p.traits.length > 0) {
      let tx = 14;
      p.traits.forEach(t => {
        const lbl = TRAITS[t] || t;
        ctx.font = "10px 'Share Tech Mono',monospace";
        const tw = ctx.measureText(lbl).width + 18;
        ctx.fillStyle = 'rgba(0,15,40,0.88)';
        this.roundRect(tx, H - 40, tw, 22, 11);
        ctx.fill();
        ctx.strokeStyle = 'rgba(80,180,255,0.22)';
        this.roundRect(tx, H - 40, tw, 22, 11);
        ctx.stroke();
        ctx.fillStyle = 'rgba(140,220,255,0.9)';
        ctx.fillText(lbl, tx + 9, H - 25);
        tx += tw + 6;
      });
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
    ctx.fillStyle = 'rgba(0,10,30,0.75)';
    this.roundRect(x, y, w, h, r);
    ctx.fill();
    const grd = ctx.createLinearGradient(x, 0, x + w * Math.max(0, pct), 0);
    grd.addColorStop(0, col1);
    grd.addColorStop(1, col2);
    ctx.fillStyle = grd;
    this.roundRect(x, y, w * Math.max(0, pct), h, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    this.roundRect(x, y, w, h, r);
    ctx.stroke();
  }

  private hudLabel(txt: string, x: number, y: number, alpha = 0.55, size = 10) {
    const ctx = this.ctx;
    ctx.font = `${size}px 'Share Tech Mono',monospace`;
    ctx.fillStyle = `rgba(100,200,255,${alpha})`;
    ctx.fillText(txt, x, y);
  }

  private drawTitle(W: number, H: number) {
    const ctx = this.ctx;
    const t = performance.now() * 0.0008;
    ctx.fillStyle = 'rgba(0,5,15,0.90)';
    ctx.fillRect(0, 0, W, H);

    const pulse = 0.8 + Math.sin(t) * 0.2;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = "900 72px 'Orbitron',monospace";
    ctx.shadowColor = 'rgba(60,160,255,0.7)';
    ctx.shadowBlur = 50 * pulse;
    ctx.fillStyle = `rgba(100,190,255,${0.88 + Math.sin(t) * 0.08})`;
    ctx.fillText('ABYSSAL', W / 2, H / 2 - 70);
    ctx.shadowBlur = 0;

    ctx.font = "11px 'Share Tech Mono',monospace";
    ctx.fillStyle = 'rgba(70,130,170,0.55)';
    ctx.fillText('you are small  ·  the deep is vast  ·  become everything', W / 2, H / 2 - 26);

    ctx.font = "12px 'Orbitron',monospace";
    ctx.fillStyle = `rgba(120,210,255,${0.85 + Math.sin(t * 2) * 0.12})`;
    ctx.fillText('— DESCEND —', W / 2, H / 2 + 50);
    ctx.restore();
  }

  private drawDead(W: number, H: number, p: PlayerState | null) {
    if (!p) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(6,0,0,0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = "900 48px 'Orbitron',monospace";
    ctx.fillStyle = 'rgba(220,60,60,0.92)';
    ctx.fillText('CONSUMED', W / 2, H / 2 - 80);

    ctx.font = "10px 'Share Tech Mono',monospace";
    ctx.fillStyle = 'rgba(140,170,190,0.65)';
    const lines = [
      'depth reached  ·  ' + Math.floor(p.y) + 'm',
      'creatures consumed  ·  ' + p.eaten,
      'max level  ·  ' + p.level,
      'score  ·  ' + p.score,
    ];
    lines.forEach((l, i) => ctx.fillText(l, W / 2, H / 2 - 34 + i * 18));
    ctx.restore();
  }

  private drawWin(W: number, H: number, p: PlayerState | null) {
    if (!p) return;
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(0,8,4,0.9)';
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = "900 44px 'Orbitron',monospace";
    ctx.fillStyle = 'rgba(60,255,160,0.92)';
    ctx.fillText('APEX PREDATOR', W / 2, H / 2 - 80);

    ctx.font = "10px 'Share Tech Mono',monospace";
    ctx.fillStyle = 'rgba(100,200,160,0.65)';
    const lines = [
      'the abyss bows to you',
      '',
      'level  ·  ' + p.level,
      'creatures  ·  ' + p.eaten,
      'score  ·  ' + p.score,
    ];
    lines.forEach((l, i) => ctx.fillText(l, W / 2, H / 2 - 30 + i * 18));
    ctx.restore();
  }
}
