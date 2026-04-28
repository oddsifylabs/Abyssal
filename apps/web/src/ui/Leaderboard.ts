import { api } from '../net/api.js';
import type { LeaderboardEntry } from '@abyssal/types';

export class LeaderboardUI {
  private container: HTMLElement;
  private isOpen = false;

  constructor(container: HTMLElement) {
    this.container = container;
    this.renderButton();
  }

  private renderButton() {
    const btn = document.createElement('button');
    btn.id = 'lbBtn';
    btn.textContent = '🏆';
    btn.style.cssText = `position:fixed;top:14px;left:50%;transform:translateX(-50%);z-index:30;background:rgba(0,15,40,0.85);border:1px solid rgba(80,180,255,0.3);color:rgba(140,220,255,0.9);font-family:'Orbitron',monospace;font-size:14px;padding:8px 20px;border-radius:20px;cursor:pointer;letter-spacing:2px;pointer-events:auto;`;
    btn.addEventListener('click', () => this.toggle());
    document.body.appendChild(btn);
  }

  async toggle() {
    if (this.isOpen) {
      this.close();
      return;
    }
    this.isOpen = true;
    const overlay = document.createElement('div');
    overlay.id = 'lbOverlay';
    overlay.style.cssText = `position:fixed;inset:0;z-index:50;background:rgba(0,5,15,0.92);backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;padding:40px 20px;overflow-y:auto;font-family:'Share Tech Mono',monospace;color:rgba(140,220,255,0.9);pointer-events:auto;`;

    overlay.innerHTML = `
      <h2 style="font-family:'Orbitron',monospace;font-size:28px;letter-spacing:8px;margin-bottom:8px;text-shadow:0 0 30px rgba(80,180,255,0.5);">LEADERBOARD</h2>
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <button id="tabDaily" style="background:rgba(0,20,50,0.6);border:1px solid rgba(80,180,255,0.3);color:rgba(140,220,255,0.9);padding:8px 16px;font-family:'Orbitron',monospace;cursor:pointer;">DAILY</button>
        <button id="tabWeekly" style="background:rgba(0,20,50,0.6);border:1px solid rgba(80,180,255,0.3);color:rgba(140,220,255,0.9);padding:8px 16px;font-family:'Orbitron',monospace;cursor:pointer;">WEEKLY</button>
        <button id="tabAllTime" style="background:rgba(0,20,50,0.6);border:1px solid rgba(80,180,255,0.3);color:rgba(140,220,255,0.9);padding:8px 16px;font-family:'Orbitron',monospace;cursor:pointer;">ALL TIME</button>
      </div>
      <div id="lbContent" style="width:100%;max-width:600px;"></div>
      <button id="lbClose" style="margin-top:24px;background:rgba(0,20,50,0.6);border:1px solid rgba(80,180,255,0.3);color:rgba(140,220,255,0.9);padding:10px 32px;font-family:'Orbitron',monospace;cursor:pointer;letter-spacing:3px;">— CLOSE —</button>
    `;

    document.body.appendChild(overlay);
    document.getElementById('lbClose')?.addEventListener('click', () => this.close());
    document.getElementById('tabDaily')?.addEventListener('click', () => this.loadDaily());
    document.getElementById('tabWeekly')?.addEventListener('click', () => this.loadWeekly());
    document.getElementById('tabAllTime')?.addEventListener('click', () => this.loadAllTime());

    await this.loadDaily();
  }

  private close() {
    this.isOpen = false;
    document.getElementById('lbOverlay')?.remove();
  }

  private async loadDaily() {
    const content = document.getElementById('lbContent');
    if (!content) return;
    content.innerHTML = '<div style="text-align:center;color:rgba(80,140,180,0.5);">Loading...</div>';
    try {
      const data = await api.getDailyLeaderboard();
      this.renderTable(content, data.leaderboard, data.date);
    } catch (e) {
      content.innerHTML = '<div style="text-align:center;color:rgba(255,80,80,0.7);">Failed to load</div>';
    }
  }

  private async loadWeekly() {
    const content = document.getElementById('lbContent');
    if (!content) return;
    content.innerHTML = '<div style="text-align:center;color:rgba(80,140,180,0.5);">Loading...</div>';
    try {
      const data = await api.getWeeklyLeaderboard();
      this.renderTable(content, data.leaderboard, 'Weekly');
    } catch (e) {
      content.innerHTML = '<div style="text-align:center;color:rgba(255,80,80,0.7);">Failed to load</div>';
    }
  }

  private async loadAllTime() {
    const content = document.getElementById('lbContent');
    if (!content) return;
    content.innerHTML = '<div style="text-align:center;color:rgba(80,140,180,0.5);">Loading...</div>';
    try {
      const data = await api.getAllTimeLeaderboard();
      this.renderTable(content, data.leaderboard, 'All Time');
    } catch (e) {
      content.innerHTML = '<div style="text-align:center;color:rgba(255,80,80,0.7);">Failed to load</div>';
    }
  }

  private renderTable(container: HTMLElement, entries: LeaderboardEntry[], title: string) {
    if (entries.length === 0) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:rgba(80,140,180,0.5);">No entries yet. Be the first to descend.</div>';
      return;
    }

    let html = `<div style="font-size:10px;letter-spacing:3px;color:rgba(80,140,180,0.5);text-align:center;margin-bottom:12px;">${title}</div>`;
    html += '<div style="display:flex;flex-direction:column;gap:8px;">';

    entries.slice(0, 50).forEach((entry, i) => {
      const isTop3 = i < 3;
      const rankColor = i === 0 ? 'rgba(255,215,0,0.9)' : i === 1 ? 'rgba(192,192,192,0.9)' : i === 2 ? 'rgba(205,127,50,0.9)' : 'rgba(80,140,180,0.6)';
      html += `
        <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:${isTop3 ? 'rgba(80,180,255,0.08)' : 'rgba(0,10,25,0.5)'};border:1px solid ${isTop3 ? 'rgba(80,180,255,0.2)' : 'rgba(80,180,255,0.06)'};border-radius:6px;">
          <div style="width:28px;text-align:center;font-family:'Orbitron',monospace;font-size:14px;color:${rankColor};">${entry.rank}</div>
          <div style="flex:1;font-size:12px;color:rgba(140,220,255,0.9);">${entry.username}</div>
          <div style="text-align:right;font-size:11px;color:rgba(140,220,255,0.7);">
            <div>${entry.score.toLocaleString()} pts</div>
            <div style="font-size:9px;color:rgba(80,140,180,0.5);">${entry.depth}m · L${entry.level}</div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }
}
