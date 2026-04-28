export class SpriteLoader {
  private cache = new Map<string, HTMLImageElement>();
  private loaded = false;

  async loadAll(): Promise<void> {
    const manifest = await fetch('/sprites/manifest.json').then(r => r.json());
    const sprites: string[] = [];
    
    if (manifest.sprites.player) sprites.push(`/sprites/${manifest.sprites.player}`);
    if (manifest.sprites.boss) sprites.push(`/sprites/${manifest.sprites.boss}`);
    if (manifest.sprites.ink) sprites.push(`/sprites/${manifest.sprites.ink}`);
    if (manifest.sprites.lure) sprites.push(`/sprites/${manifest.sprites.lure}`);
    
    Object.values(manifest.sprites.creatures || {}).forEach((name: any) => {
      sprites.push(`/sprites/${name}`);
    });

    await Promise.all(sprites.map(url => this.load(url)));
    this.loaded = true;
  }

  private load(url: string): Promise<void> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => { this.cache.set(url, img); resolve(); };
      img.onerror = () => resolve();
      img.src = url;
    });
  }

  get(name: string): HTMLImageElement | null {
    return this.cache.get(`/sprites/${name}`) || null;
  }

  isReady() { return this.loaded; }
}
