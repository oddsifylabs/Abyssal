import type { AppState } from '../main.js';

export class AuthUI {
  private container: HTMLElement;
  private onAuthChange: (user: AppState['user']) => void;
  private clerkLoaded = false;

  constructor(container: HTMLElement, onAuthChange: (user: AppState['user']) => void) {
    this.container = container;
    this.onAuthChange = onAuthChange;
    this.initClerk();
  }

  private async initClerk() {
    const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
    if (!key || key === 'pk_test_...') {
      console.warn('Clerk key not configured');
      this.renderGuestButton();
      return;
    }

    try {
      const Clerk = (await import('@clerk/clerk-js')).default as any;
      const clerk = new Clerk(key);
      await clerk.load();
      this.clerkLoaded = true;

      if (clerk.user) {
        const token = await clerk.session?.getToken();
        this.onAuthChange({
          id: clerk.user.id,
          name: clerk.user.firstName || clerk.user.username || 'Abyssal Diver',
          token: token || '',
        });
      } else {
        this.onAuthChange(null);
      }

      this.renderClerkButton(clerk);
    } catch (e) {
      console.error('Clerk init failed:', e);
      this.renderGuestButton();
    }
  }

  private renderClerkButton(clerk: any) {
    const el = document.createElement('div');
    el.id = 'authBtn';
    el.style.cssText = `position:fixed;top:14px;right:14px;z-index:30;pointer-events:auto;`;
    
    const btn = document.createElement('button');
    btn.style.cssText = `background:rgba(0,15,40,0.85);border:1px solid rgba(80,180,255,0.3);color:rgba(140,220,255,0.9);font-family:'Orbitron',monospace;font-size:11px;padding:8px 16px;border-radius:20px;cursor:pointer;letter-spacing:2px;`;
    
    if (clerk.user) {
      btn.textContent = clerk.user.firstName || 'Account';
      btn.addEventListener('click', () => {
        clerk.openUserProfile();
      });
    } else {
      btn.textContent = 'SIGN IN';
      btn.addEventListener('click', () => {
        clerk.openSignIn({
          afterSignInUrl: window.location.href,
          redirectUrl: window.location.href,
        });
      });
    }
    
    el.appendChild(btn);
    document.body.appendChild(el);
  }

  private renderGuestButton() {
    const el = document.createElement('div');
    el.id = 'authBtn';
    el.style.cssText = `position:fixed;top:14px;right:14px;z-index:30;pointer-events:auto;`;
    
    const btn = document.createElement('button');
    btn.textContent = 'GUEST';
    btn.style.cssText = `background:rgba(0,15,40,0.85);border:1px solid rgba(80,180,255,0.3);color:rgba(140,220,255,0.9);font-family:'Orbitron',monospace;font-size:11px;padding:8px 16px;border-radius:20px;cursor:pointer;letter-spacing:2px;`;
    btn.addEventListener('click', () => {
      this.onAuthChange({ id: 'guest-' + Math.random().toString(36).slice(2), name: 'Guest', token: '' });
    });
    
    el.appendChild(btn);
    document.body.appendChild(el);
  }
}
