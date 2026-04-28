import { GameState } from './game/state/GameState.js';
import { Renderer } from './game/renderer/Renderer.js';
import { InputSystem } from './game/systems/Input.js';
import { SpriteLoader } from './game/renderer/SpriteLoader.js';
import { LeaderboardUI } from './ui/Leaderboard.js';
import { AuthUI } from './ui/Auth.js';
import { api } from './net/api.js';
import type { GamePhase, RunStats } from './game/state/GameState.js';

export interface AppState {
  screen: 'game' | 'leaderboard' | 'daily';
  user: { id: string; name: string; token: string } | null;
}

class App {
  private canvas: HTMLCanvasElement;
  private renderer: Renderer;
  private input: InputSystem;
  private game: GameState | null = null;
  private appState: AppState = { screen: 'game', user: null };
  private lastTime = 0;
  private warnFlash = 0;
  private leaderboardUI: LeaderboardUI;
  private authUI: AuthUI;
  private spriteLoader: SpriteLoader;

  constructor() {
    const app = document.getElementById('app')!;
    app.innerHTML = `
      <canvas id="gameCanvas" style="display:block;position:fixed;top:0;left:0;width:100%;height:100%;background:#000;cursor:crosshair;"></canvas>
      <div id="uiOverlay" style="position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;"></div>
      <div id="pauseScreen" style="display:none;position:fixed;inset:0;z-index:20;background:rgba(0,5,20,0.85);backdrop-filter:blur(4px);justify-content:center;align-items:center;flex-direction:column;gap:16px;font-family:'Orbitron',monospace;color:rgba(80,180,255,0.9);">
        <h1 style="font-size:32px;letter-spacing:12px;text-shadow:0 0 30px rgba(80,180,255,0.7);">PAUSED</h1>
        <div style="font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:3px;color:rgba(80,140,180,0.55);">ESC or P to resume</div>
        <button id="resumeBtn" style="border:1px solid rgba(80,180,255,0.4);background:rgba(0,20,50,0.6);color:rgba(100,200,255,0.9);font-family:'Orbitron',monospace;font-size:12px;letter-spacing:4px;padding:12px 32px;cursor:pointer;border-radius:2px;">— RESUME —</button>
        <button id="menuBtn" style="border:1px solid rgba(80,180,255,0.4);background:rgba(0,20,50,0.6);color:rgba(100,200,255,0.9);font-family:'Orbitron',monospace;font-size:12px;letter-spacing:4px;padding:12px 32px;cursor:pointer;border-radius:2px;margin-top:8px;">— MAIN MENU —</button>
        <div style="font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;color:rgba(80,120,160,0.5);margin-top:16px;line-height:1.8;text-align:center;">
          WASD / ARROWS · move<br>
          SPACE · dash<br>
          CLICK · place lure<br>
          ESC / P · pause
        </div>
      </div>
      <div id="joystick" style="display:none;position:fixed;bottom:100px;left:40px;z-index:15;pointer-events:none;">
        <div id="joystickBase" style="width:80px;height:80px;border-radius:50%;border:2px solid rgba(80,180,255,0.3);background:rgba(0,20,50,0.4);position:relative;">
          <div id="joystickKnob" style="width:32px;height:32px;border-radius:50%;background:rgba(80,180,255,0.5);border:1px solid rgba(80,180,255,0.7);position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);transition:transform 0.05s;"></div>
        </div>
      </div>
    `;

    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.renderer = new Renderer(this.canvas);
    this.renderer.resize();
    window.addEventListener('resize', () => this.renderer.resize());

    this.input = new InputSystem(
      this.canvas,
      (x, y) => this.game?.handleClick(x, y),
      () => this.togglePause()
    );

    this.spriteLoader = new SpriteLoader();
    this.spriteLoader.loadAll().catch(() => {});

    this.leaderboardUI = new LeaderboardUI(document.getElementById('uiOverlay')!);
    this.authUI = new AuthUI(document.getElementById('uiOverlay')!, (user) => {
      this.appState.user = user;
      if (user) this.showToast(`Welcome, ${user.name}`);
    });

    document.getElementById('resumeBtn')?.addEventListener('click', () => this.togglePause());
    document.getElementById('menuBtn')?.addEventListener('click', () => this.showTitle());

    this.showTitle();
    requestAnimationFrame((ts) => this.loop(ts));
  }

  private showTitle() {
    if (this.game) { this.game.destroy(); this.game = null; }
    this.appState.screen = 'game';
    this.game = new GameState(this.canvas, {
      onPhaseChange: (phase) => this.onPhaseChange(phase),
      onScoreUpdate: (score, depth, level) => this.onScoreUpdate(score, depth, level),
      onGameOver: (stats) => this.onGameOver(stats),
    });
    this.canvas.addEventListener('click', this.handleTitleClick);
  }

  private handleTitleClick = (e: MouseEvent) => {
    if (this.game?.phase === 'title') {
      this.canvas.removeEventListener('click', this.handleTitleClick);
      this.startGame();
    }
  };

  private startGame() {
    this.game?.start();
  }

  private togglePause() {
    this.game?.pause();
    const pauseScreen = document.getElementById('pauseScreen');
    if (pauseScreen) {
      pauseScreen.style.display = this.game?.phase === 'paused' ? 'flex' : 'none';
    }
  }

  private onPhaseChange(phase: GamePhase) {
    const ps = document.getElementById('pauseScreen');
    if (phase === 'paused') {
      if (ps) ps.style.display = 'flex';
    } else {
      if (ps) ps.style.display = 'none';
    }
  }

  private onScoreUpdate(score: number, depth: number, level: number) {
    // Real-time updates can go here
  }

  private async onGameOver(stats: RunStats) {
    console.log('Game over stats:', stats);

    if (this.appState.user && this.appState.user.token) {
      try {
        const hash = await this.generateScoreHash(stats.score, stats.depth, stats.level);
        await api.submitRun(this.appState.user.token, {
          userId: this.appState.user.id,
          username: this.appState.user.name,
          score: stats.score,
          depth: stats.depth,
          level: stats.level,
          creaturesEaten: stats.creaturesEaten,
          traits: stats.traits,
          durationSeconds: stats.durationSeconds,
          zoneReached: stats.zoneReached,
          isDailyChallenge: false,
          replayHash: hash,
        });
        this.showToast('Score submitted to leaderboard!');
      } catch (e) {
        console.error('Failed to submit run:', e);
        this.showToast('Score saved locally');
      }
    } else {
      this.showToast('Sign in to save your score to the leaderboard');
    }
  }

  private async generateScoreHash(score: number, depth: number, level: number): Promise<string> {
    const secret = 'abyssal-client-hash';
    const msg = `${score}:${depth}:${level}:${secret}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(msg);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private showToast(msg: string) {
    const el = document.createElement('div');
    el.textContent = msg;
    el.style.cssText = `position:fixed;bottom:40px;left:50%;transform:translateX(-50%);background:rgba(0,20,50,0.9);border:1px solid rgba(80,180,255,0.4);color:rgba(140,220,255,1);padding:10px 24px;font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:2px;border-radius:20px;z-index:100;`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  private loop(ts: number) {
    const dt = Math.min((ts - this.lastTime) / 16.67, 3);
    this.lastTime = ts;

    if (this.game) {
      if (this.game.player) {
        if (this.game.player.hunger < 20) this.warnFlash = Math.min(1, this.warnFlash + 0.02);
        else this.warnFlash = Math.max(0, this.warnFlash - 0.04);
      }

      if (this.game.phase === 'playing') {
        this.game.update(this.input.keys, this.input.joystickDx, this.input.joystickDy, dt);
      }

      this.renderer.render(
        this.game.phase,
        this.game.camY,
        this.game.currentZone,
        this.game.player,
        this.game.creatures,
        this.game.boss,
        this.game.particles,
        this.game.lures,
        this.game.inkClouds,
        this.warnFlash
      );
    }

    requestAnimationFrame((t) => this.loop(t));
  }
}

new App();
