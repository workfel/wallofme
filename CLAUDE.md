# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WallOfMe** — "The Metaverse of the Athlete." A mobile app where athletes capture race photos, auto-extract results via AI, and display achievements in a 3D virtual "Pain Cave" room with medals, bibs, and trophies.

## Monorepo Structure

npm workspaces monorepo with two apps:

```
apps/frontend/   Expo (React Native) mobile app
apps/backend/    Hono API server running on Bun
assets/models/   3D GLB models (Bicycle, Kettlebell, Treadmill)
```

## Commands

### Frontend (apps/frontend)
```bash
npx expo start              # Start dev server (use Expo Go first, custom builds only when needed)
npx expo start --ios        # Start on iOS simulator
npx expo start --android    # Start on Android emulator
npx expo start --web        # Start web version
npx expo lint               # Run ESLint
```

### Backend (apps/backend)
```bash
bun run dev                 # Start with hot reload (bun run --hot src/index.ts)
```

### Root
```bash
npm install                 # Install all workspace dependencies
```

## Tech Stack

- **Frontend:** Expo 54 + React 19 + React Native 0.81, Expo Router 6 (file-based routing), React Native Reanimated 4, TypeScript strict mode
- **Backend:** Hono 4 on Bun runtime, TypeScript strict mode
- **Planned:** React Three Fiber (3D rendering), Drizzle ORM + Postgres, BetterAuth, Cloudflare R2, ai-sdk, RevenueCat, Tamagui

## Architecture

### Frontend Routing (Expo Router — file-based)

Routes live in `apps/frontend/app/`. Key layout:
- `_layout.tsx` — Root layout with theme provider and Stack navigator
- `(tabs)/_layout.tsx` — Bottom tab navigator (Home, Explore)
- `modal.tsx` — Modal presentation screen

Components live in `apps/frontend/components/`, **not** co-located in `app/` directory.

### API Communication Pattern (Hono RPC)

The backend exports `AppType` from Hono route definitions. The frontend consumes it via Hono's `hc` client for end-to-end type safety with zero codegen. Validation uses `@hono/zod-validator`. See the `hono-rpc` skill for detailed patterns.

### Path Aliases

Frontend uses `@/*` mapped to the project root via tsconfig.

## Conventions

- **File naming:** kebab-case for all files (e.g., `themed-text.tsx`, `use-color-scheme.ts`)
- **Theming:** Dark/light mode via `constants/theme.ts` — uses `Colors.light`/`Colors.dark` and platform-aware `Fonts`
- **Platform code:** Use `.ios.tsx`/`.web.ts` suffixes for platform-specific implementations
- **Expo Go first:** Always test in Expo Go before creating custom native builds. Only use `npx expo run:ios/android` when custom native modules are required.
- **New Architecture:** Enabled in app.json (`newArchEnabled: true`)
- **React Compiler:** Enabled in app.json
- **Typed routes:** Enabled in app.json

## Agent Skills

Three skills are configured in `.agents/skills/`:

- **building-native-ui** — Expo Router patterns, animations, controls, gradients, SF Symbols, media, storage, tabs, search, sheets, visual effects, 3D/WebGPU
- **hono-rpc** — Type-safe API client with `hc` client, Zod validation, status-aware responses
- **r3f-best-practices** — React Three Fiber performance rules, Drei helpers, Zustand patterns, asset loading. Key rules: never setState in useFrame, use Zustand selectors, preload assets, use Suspense for loading
