export class AudioSystem {
  private ctx: AudioContext | null = null;
  private ambOsc: OscillatorNode | null = null;
  private ambGain: GainNode | null = null;

  private getCtx(): AudioContext {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  startAmbient(zone: number) {
    try {
      const ac = this.getCtx();
      this.stopAmbient();
      const freq = [55, 48, 42, 36][zone] || 55;
      const o = ac.createOscillator();
      const g = ac.createGain();
      const f = ac.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = 220;
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0, ac.currentTime);
      g.gain.linearRampToValueAtTime(0.07, ac.currentTime + 2);
      o.connect(f);
      f.connect(g);
      g.connect(ac.destination);
      o.start();
      this.ambOsc = o;
      this.ambGain = g;
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  stopAmbient() {
    if (this.ambOsc) {
      try { this.ambOsc.stop(); } catch (e) {}
      this.ambOsc = null;
    }
  }

  sfxEat() {
    try {
      const ac = this.getCtx();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(300, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(80, ac.currentTime + 0.12);
      g.gain.setValueAtTime(0.15, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.15);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.15);
    } catch (e) {}
  }

  sfxEvolve() {
    try {
      const ac = this.getCtx();
      [220, 330, 440, 550, 660].forEach((f, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'sine';
        o.frequency.value = f;
        g.gain.setValueAtTime(0, ac.currentTime + i * 0.08);
        g.gain.linearRampToValueAtTime(0.1, ac.currentTime + i * 0.08 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.08 + 0.4);
        o.connect(g);
        g.connect(ac.destination);
        o.start(ac.currentTime + i * 0.08);
        o.stop(ac.currentTime + i * 0.08 + 0.4);
      });
    } catch (e) {}
  }

  sfxDamage() {
    try {
      const ac = this.getCtx();
      const b = ac.createBuffer(1, ac.sampleRate * 0.1, ac.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
      const s = ac.createBufferSource();
      const g = ac.createGain();
      g.gain.value = 0.25;
      s.buffer = b;
      s.connect(g);
      g.connect(ac.destination);
      s.start();
    } catch (e) {}
  }

  sfxBoss() {
    try {
      const ac = this.getCtx();
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(100, ac.currentTime);
      o.frequency.exponentialRampToValueAtTime(30, ac.currentTime + 0.4);
      g.gain.setValueAtTime(0.2, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.4);
      o.connect(g);
      g.connect(ac.destination);
      o.start();
      o.stop(ac.currentTime + 0.4);
    } catch (e) {}
  }

  sfxZone() {
    try {
      const ac = this.getCtx();
      [110, 138, 165].forEach((f, i) => {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'triangle';
        o.frequency.value = f;
        g.gain.setValueAtTime(0, ac.currentTime + i * 0.12);
        g.gain.linearRampToValueAtTime(0.06, ac.currentTime + i * 0.12 + 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + i * 0.12 + 0.8);
        o.connect(g);
        g.connect(ac.destination);
        o.start(ac.currentTime + i * 0.12);
        o.stop(ac.currentTime + i * 0.12 + 0.9);
      });
    } catch (e) {}
  }
}
