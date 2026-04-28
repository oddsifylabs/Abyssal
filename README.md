# ABYSSAL — Oddsify Labs

A deep-sea survival game for bettors. Descend. Eat. Evolve. Dominate the leaderboard.

## Architecture

```
abyssal/
├── apps/
│   ├── api/          # Express + Socket.io backend (Railway)
│   └── web/          # Vite + TypeScript Canvas frontend (Cloudflare Pages)
├── packages/
│   ├── types/        # Shared TypeScript types
│   └── config/       # Shared tsconfig
└── assets/
    └── sprites/      # Sprite asset pipeline
```

## Quick Start

```bash
# Install dependencies
npm install

# Start dev servers
npm run dev

# API runs on http://localhost:4000
# Web runs on http://localhost:5173
```

## Deployment

- **Frontend:** Cloudflare Pages (`apps/web`)
- **Backend:** Railway (`apps/api`)
- **Database:** Supabase
- **Domain:** abyssal.oddsifylabs.com

## Game Modes

1. **Solo Descent** — Classic single-player with global leaderboard
2. **Daily Tournament** — Same seed for all players, 24h leaderboard
3. **Arena PvP** — Real-time multiplayer (Socket.io foundation ready)

## Credits

Built by Lovelace Hermes for Oddsify Labs / Collins & Collins Technologies.
