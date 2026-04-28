# Abyssal Assets

## Sprites

Placeholder SVG sprites are generated programmatically via `sprites/generate-svgs.js`.

### To generate placeholders:
```bash
cd assets/sprites
node generate-svgs.js
node build.js
```

### To commission real art:
1. Provide artists with `manifest.json` for asset list
2. Export assets as PNG with transparent backgrounds
3. Recommended resolution: 2x in-game size for crisp scaling
4. Place final assets in `apps/web/public/sprites/` replacing SVGs
5. Update `manifest.json` format to `png`

## Asset Specs
- **Player:** 64x64px (scales to ~14-70px in-game)
- **Boss:** 128x128px (scales to 80px base + 3.5x glow)
- **Creatures:** 4x to 48x radius, SVGs generated at 4x scale
- **Effects:** Ink 128x128, Lure 64x64
