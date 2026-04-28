import type { PlayerState, Creature, Boss, Particle, Lure, InkCloud } from '@abyssal/types';
import { GAME_CONFIG, ZONES, ZONE_DEPTHS, getCurrentZone, TRAITS, seededRandom } from '../config.js';
import { createPlayer, updatePlayer, gainTrait, levelUp } from '../entities/Player.js';
import { spawnCreature, updateCreature } from '../entities/Creature.js';
import { spawnBoss, updateBoss } from '../entities/Boss.js';
import { AudioSystem } from '../systems/Audio.js';

export type GamePhase = 'title' | 'playing' | 'dead' | 'win' | 'paused';

export interface GameCallbacks {
  onPhaseChange: (phase: GamePhase) => void;
  onScoreUpdate: (score: number, depth: number, level: number) => void;
  onGameOver: (stats: RunStats) => void;
}

export interface RunStats {
  score: number;
  depth: number;
  level: number;
  creaturesEaten: number;
  traits: string[];
  durationSeconds: number;
  zoneReached: number;
}

export class GameState {
  phase: GamePhase = 'title';
  player: PlayerState | null = null;
  creatures: Creature[] = [];
  particles: Particle[] = [];
  lures: Lure[] = [];
  inkClouds: InkCloud[] = [];
  boss: Boss | null = null;
  camY = 0;
  currentZone = 0;
  bossSpawned = false;
  zoneName = 'SUNLIT ZONE';
  zoneAccent: [number, number, number] = [80, 200, 255];
  startTime = 0;
  audio = new AudioSystem();
  seed: string = Math.random().toString(36).slice(2);
  rng: () => number = Math.random;
  
  private canvas: HTMLCanvasElement;
  private callbacks: GameCallbacks;
  private animFrame: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: GameCallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
  }

  setDailySeed(seed: string) {
    this.seed = seed;
    this.rng = seededRandom(seed);
  }

  start() {
    this.phase = 'playing';
    this.player = createPlayer(this.canvas.width);
    this.creatures = [];
    this.particles = [];
    this.lures = [];
    this.inkClouds = [];
    this.boss = null;
    this.camY = 0;
    this.currentZone = 0;
    this.bossSpawned = false;
    this.zoneName = ZONES[0].name;
    this.zoneAccent = ZONES[0].accent;
    this.startTime = performance.now();
    
    for (let i = 0; i < GAME_CONFIG.MAX_CREATURES; i++) {
      this.creatures.push(spawnCreature(this.canvas.width, 0, this.canvas.height, this.rng));
    }
    
    this.audio.startAmbient(0);
    this.callbacks.onPhaseChange('playing');
    this.loop();
  }

  pause() {
    if (this.phase === 'playing') {
      this.phase = 'paused';
      this.callbacks.onPhaseChange('paused');
    } else if (this.phase === 'paused') {
      this.phase = 'playing';
      this.callbacks.onPhaseChange('playing');
      this.loop();
    }
  }

  handleClick(cx: number, cy: number) {
    if (this.phase !== 'playing' || !this.player) return;
    
    this.lures.push({ x: cx, y: cy, worldY: cy + this.camY, life: 130 });
    this.burst(cx, cy, [80, 200, 255], 12, 2.5, 35);
    this.particles.push({ x: cx, y: cy, vx: 0, vy: 0, col: [80, 200, 255], life: 40, maxLife: 40, r: 30, ring: true });

    if (this.boss && this.boss.alive) {
      const bsx = cx - this.boss.x;
      const bsy = cy - (this.boss.y - this.camY);
      if (Math.sqrt(bsx * bsx + bsy * bsy) < this.boss.r + 10) {
        this.boss.hp -= 8;
        this.audio.sfxBoss();
        this.burst(this.boss.x, this.boss.y - this.camY, [180, 50, 255], 8, 4, 30);
        if (this.boss.hp <= 0) this.boss.alive = false;
      }
    }
  }

  update(keys: Record<string, boolean>, joystickDx: number, joystickDy: number, dt: number) {
    if (this.phase !== 'playing' || !this.player) return;

    const p = this.player;
    const W = this.canvas.width;
    const H = this.canvas.height;

    // Update player
    const { camY } = updatePlayer(p, keys, joystickDx, joystickDy, W, dt);
    this.camY = camY;

    // Update lures
    this.lures = this.lures.filter(l => { l.life--; return l.life > 0; });

    // Update ink
    this.inkClouds.forEach(c => {
      c.r = Math.min(c.maxR, c.r + 1.2);
      c.life--;
      c.alpha = 0.5 * (c.life / c.maxLife);
    });
    this.inkClouds = this.inkClouds.filter(c => c.life > 0);

    // Zone transition
    const nz = getCurrentZone(p.y);
    if (nz !== this.currentZone) {
      this.currentZone = nz;
      this.zoneAccent = ZONES[nz].accent;
      this.zoneName = ZONES[nz].name;
      this.audio.sfxZone();
      this.audio.startAmbient(nz);
      this.burst(p.x, p.y - this.camY, ZONES[nz].accent, 20, 4, 50);
    }

    // Spawn boss
    if (p.y > GAME_CONFIG.BOSS_SPAWN_DEPTH && !this.bossSpawned) {
      this.bossSpawned = true;
      this.boss = spawnBoss(W, this.camY, H);
      this.audio.sfxBoss();
    }

    // Update boss
    if (this.boss && this.boss.alive) {
      updateBoss(this.boss, p, (dmg) => {
        let actualDmg = dmg;
        if (p.traits.includes('armored')) actualDmg *= 0.5;
        p.hp -= actualDmg;
        p.iframes = GAME_CONFIG.IFRAMES_DAMAGE;
        this.audio.sfxDamage();
        this.burst(p.x, p.y - this.camY, [255, 60, 60], 14, 3, 35);
      });
    }

    // Update creatures & collisions
    for (let i = this.creatures.length - 1; i >= 0; i--) {
      const c = this.creatures[i];
      updateCreature(c, p, this.lures, this.inkClouds, W, H);

      const sx = p.x - c.x;
      const sy = p.y - c.y;
      const dist = Math.sqrt(sx * sx + sy * sy);

      if (dist < c.r + p.r - 4) {
        if (c.r > p.r * 1.15) {
          if (p.iframes <= 0) {
            let dmg = c.tmpl.danger * 11;
            if (p.traits.includes('armored')) dmg *= 0.5;
            p.hp -= dmg;
            p.iframes = GAME_CONFIG.IFRAMES_CREATURE;
            this.audio.sfxDamage();
            this.burst(p.x, p.y - this.camY, [255, 60, 60], 10, 2.5, 30);

            if (p.traits.includes('ink')) {
              this.inkClouds.push({ x: p.x, y: p.y, r: 10, maxR: 80, life: 180, maxLife: 180, alpha: 0.6 });
              c.vx -= (sx / dist) * 7;
              c.vy -= (sy / dist) * 7;
            }
          }
        } else if (c.r <= p.r + 2) {
          c.alive = false;
          this.audio.sfxEat();
          p.hunger = Math.min(100, p.hunger + c.tmpl.pts * 0.4);
          p.xp += c.tmpl.pts;
          p.eaten++;
          p.score += c.tmpl.pts;
          this.burst(c.x, c.y - this.camY, c.tmpl.col, 12, 2, 35);

          if (c.tmpl.trait && !p.traits.includes(c.tmpl.trait) && Math.random() < GAME_CONFIG.TRAIT_DROP_CHANCE) {
            gainTrait(p, c.tmpl.trait);
          }

          if (p.xp >= p.xpNext) {
            levelUp(p);
            this.audio.sfxEvolve();
            for (let j = 0; j < 4; j++) this.creatures.push(spawnCreature(W, this.camY, H, this.rng));
          }

          p.r = Math.min(GAME_CONFIG.MAX_PLAYER_SIZE, GAME_CONFIG.PLAYER_START_R + p.level * GAME_CONFIG.SIZE_PER_LEVEL + p.eaten * GAME_CONFIG.SIZE_PER_EAT);
        }
      }
    }

    // Cleanup creatures
    this.creatures = this.creatures.filter(c => c.alive && c.y - this.camY > -500 && c.y - this.camY < H + 500);
    while (this.creatures.length < GAME_CONFIG.MAX_CREATURES) {
      this.creatures.push(spawnCreature(W, this.camY, H, this.rng));
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const q = this.particles[i];
      q.x += q.vx;
      q.y += q.vy;
      q.vx *= 0.92;
      q.vy *= 0.92;
      q.life--;
      if (q.life <= 0) this.particles.splice(i, 1);
    }

    // Score callback
    this.callbacks.onScoreUpdate(p.score, Math.floor(p.y), p.level);

    // Check death
    if (p.hp <= 0) {
      p.hp = 0;
      this.endGame();
    }

    // Check win
    if (this.boss && !this.boss.alive) {
      this.winGame();
    }
  }

  private endGame() {
    this.phase = 'dead';
    this.audio.stopAmbient();
    this.callbacks.onPhaseChange('dead');
    this.sendStats();
  }

  private winGame() {
    this.phase = 'win';
    this.audio.stopAmbient();
    this.callbacks.onPhaseChange('win');
    if (this.player) this.player.score += 5000; // Boss bonus
    this.sendStats();
  }

  private sendStats() {
    if (!this.player) return;
    const duration = Math.floor((performance.now() - this.startTime) / 1000);
    this.callbacks.onGameOver({
      score: this.player.score,
      depth: Math.floor(this.player.y),
      level: this.player.level,
      creaturesEaten: this.player.eaten,
      traits: this.player.traits,
      durationSeconds: duration,
      zoneReached: this.currentZone,
    });
  }

  burst(x: number, y: number, col: [number, number, number], n: number, spd: number, life: number) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * spd;
      this.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, col, life, maxLife: life, r: 1.5 + Math.random() * 2.5 });
    }
  }

  private loop = () => {
    if (this.phase !== 'playing') return;
    this.animFrame = requestAnimationFrame(this.loop);
  };

  destroy() {
    cancelAnimationFrame(this.animFrame);
    this.audio.stopAmbient();
  }
}
