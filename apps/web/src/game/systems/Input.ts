export class InputSystem {
  keys: Record<string, boolean> = {};
  joystickActive = false;
  joystickDx = 0;
  joystickDy = 0;

  private canvas: HTMLCanvasElement;
  private onClickCb: (x: number, y: number) => void;
  private onPauseCb: () => void;

  constructor(canvas: HTMLCanvasElement, onClick: (x: number, y: number) => void, onPause: () => void) {
    this.canvas = canvas;
    this.onClickCb = onClick;
    this.onPauseCb = onPause;
    this.bindEvents();
  }

  private bindEvents() {
    document.addEventListener('keydown', (e) => {
      this.keys[e.key] = true;
      if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
      if ((e.key === 'Escape' || e.key === 'p' || e.key === 'P')) this.onPauseCb();
    });
    document.addEventListener('keyup', (e) => this.keys[e.key] = false);

    this.canvas.addEventListener('click', (e) => this.onClickCb(e.clientX, e.clientY));
    this.canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      if (t) this.onClickCb(t.clientX, t.clientY);
    }, { passive: false });

    // Touch drag
    let ltp: { x: number; y: number } | null = null;
    this.canvas.addEventListener('touchstart', (e) => { e.preventDefault(); }, { passive: false });
    this.canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!e.touches[0]) return;
      const t = e.touches[0];
      if (ltp) {
        this.keys['touch_dx'] = true;
        this.keys['touch_dy'] = true;
        (this.keys as any)['_touch_dx'] = (t.clientX - ltp.x) * 0.18;
        (this.keys as any)['_touch_dy'] = (t.clientY - ltp.y) * 0.18;
      }
      ltp = { x: t.clientX, y: t.clientY };
    }, { passive: false });
    this.canvas.addEventListener('touchend', () => { ltp = null; }, { passive: true });

    // Joystick
    const joystickEl = document.getElementById('joystick');
    const joystickBase = document.getElementById('joystickBase');
    const joystickKnob = document.getElementById('joystickKnob');
    if (!joystickEl || !joystickBase || !joystickKnob) return;

    let joystickId: number | null = null;
    let joystickOrigin = { x: 0, y: 0 };

    joystickEl.addEventListener('touchstart', (e) => {
      e.stopPropagation(); e.preventDefault();
      const t = e.changedTouches[0];
      joystickId = t.identifier;
      this.joystickActive = true;
      const rect = joystickBase.getBoundingClientRect();
      joystickOrigin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }, { passive: false });

    joystickEl.addEventListener('touchmove', (e) => {
      e.stopPropagation(); e.preventDefault();
      if (!this.joystickActive) return;
      const t = Array.from(e.changedTouches).find(t => t.identifier === joystickId);
      if (!t) return;
      const dx = t.clientX - joystickOrigin.x;
      const dy = t.clientY - joystickOrigin.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      const maxR = 30;
      const clampedLen = Math.min(len, maxR);
      this.joystickDx = dx / len;
      this.joystickDy = dy / len;
      joystickKnob.style.transform = `translate(calc(-50% + ${this.joystickDx * clampedLen}px), calc(-50% + ${this.joystickDy * clampedLen}px))`;
    }, { passive: false });

    joystickEl.addEventListener('touchend', () => {
      this.joystickActive = false;
      this.joystickDx = 0;
      this.joystickDy = 0;
      joystickKnob.style.transform = 'translate(-50%, -50%)';
    }, { passive: false });
  }

  getTouchVel(): { x: number; y: number } {
    return {
      x: (this.keys as any)['_touch_dx'] || 0,
      y: (this.keys as any)['_touch_dy'] || 0,
    };
  }

  resetTouch() {
    (this.keys as any)['_touch_dx'] = 0;
    (this.keys as any)['_touch_dy'] = 0;
  }
}
