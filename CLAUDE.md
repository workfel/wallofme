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
bun run db:generate         # Generate Drizzle migration files from schema changes
bun run db:migrate          # Run pending migrations against the database
bun run db:push             # Push schema directly to DB (dev shortcut, skips migration files)
bun run db:studio           # Open Drizzle Studio GUI for browsing data
```

### Database (root)
```bash
docker-compose up -d        # Start PostgreSQL 16 (port 5432, user/pass/db: wallofme)
```

### Root
```bash
npm install                 # Install all workspace dependencies
```

## Environment Variables

### Backend (`apps/backend/.env`) — see `.env.example`
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `BETTER_AUTH_SECRET` | BetterAuth signing secret |
| `BETTER_AUTH_URL` | Backend base URL (e.g. `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` | Apple OAuth |
| `R2_ENDPOINT` | Cloudflare R2 S3-compatible endpoint |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 credentials |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public URL prefix for R2 objects |

### Frontend (`apps/frontend/.env`)
| Variable | Purpose |
|---|---|
| `EXPO_PUBLIC_API_URL` | Backend URL (e.g. `http://localhost:3000`) |

## Tech Stack

- **Frontend:** Expo 54 + React 19 + React Native 0.81, Expo Router 6 (file-based routing), Tamagui 2, React Native Reanimated 4, i18n-js + expo-localization, TypeScript strict mode
- **Backend:** Hono 4 on Bun runtime, Drizzle ORM + PostgreSQL 16, BetterAuth (email/password + Google + Apple OAuth), Cloudflare R2 (via AWS S3 SDK), Sharp image processing, TypeScript strict mode
- **Planned:** React Three Fiber (3D rendering), ai-sdk, RevenueCat

## Architecture

### Authentication Flow (BetterAuth)

**Server** (`src/lib/auth.ts`): BetterAuth configured with Drizzle adapter, email/password + Google/Apple social providers, Expo plugin. Custom user fields: `displayName`, `isPro`, `locale`. Trusted origins include `wallofme://` scheme and Expo dev URLs.

**Middleware** (`src/middleware/auth.ts`):
- `sessionMiddleware` — Global, runs on every request. Calls `auth.api.getSession()` and populates `c.get("user")` / `c.get("session")` (null if unauthenticated).
- `requireAuth` — Per-route guard. Returns 401 if no user in context.

**BetterAuth handler**: `app.on(["POST", "GET"], "/api/auth/*", ...)` in `src/index.ts` forwards all auth requests to BetterAuth.

**Client** (`lib/auth.ts`): `createAuthClient` with `expoClient` plugin, uses `expo-secure-store` for token persistence, `wallofme` URL scheme.

**AuthGate** (root `_layout.tsx`): Watches `authClient.useSession()`. Redirects unauthenticated users to `/(auth)/login` and authenticated users out of the `(auth)` group.

### Frontend Routing (Expo Router — file-based)

Routes live in `apps/frontend/app/`. `unstable_settings.anchor` is `"(tabs)"`.

```
_layout.tsx                Root layout — TamaguiProvider + ThemeProvider + AuthGate + Stack
(auth)/
  _layout.tsx              Stack (headerShown: false)
  login.tsx
  register.tsx
  otp.tsx
(tabs)/
  _layout.tsx              Bottom tab navigator (Home, Explore, Trophies, Profile)
  index.tsx                Home tab
  explore.tsx              Explore tab
  trophies.tsx             Trophies tab
  profile.tsx              Profile tab
trophy/
  [id].tsx                 Trophy detail (push)
  scan.tsx                 Scan trophy (presentation: "modal")
room/
  edit.tsx                 Edit room (presentation: "modal")
  [userId].tsx             View user's Pain Cave (push)
```

Components live in `apps/frontend/components/`, **not** co-located in `app/` directory.

### Backend API Architecture

**Route endpoint map** (all prefixed with `/api`):

| Route file | Endpoints |
|---|---|
| `trophies.routes.ts` | `GET /trophies`, `GET /trophies/:id`, `POST /trophies`, `PATCH /trophies/:id`, `DELETE /trophies/:id` |
| `races.routes.ts` | `GET /races`, `GET /races/:id`, `POST /races` (auth), `POST /races/results` (auth), `GET /races/results/me` (auth) |
| `rooms.routes.ts` | `GET /rooms/me` (auth, auto-creates), `GET /rooms/user/:id` (public), `PATCH /rooms/me` (auth), `POST /rooms/items` (auth), `PATCH /rooms/items/:id` (auth), `DELETE /rooms/items/:id` (auth) |
| `decorations.routes.ts` | `GET /decorations`, `GET /decorations/:id`, `GET /decorations/inventory/me` (auth), `POST /decorations/:id/acquire` (auth) |
| `upload.routes.ts` | `POST /upload/presigned-url` (auth), `POST /upload/confirm/:id` (auth) |

**Middleware pattern**: `sessionMiddleware` applied globally via `app.use("*", ...)`. Route handlers add `requireAuth` as needed per-endpoint.

**Variables type**: Every route file must declare the Hono `Variables` type locally:
```ts
type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
```

**Validation pattern**: `zValidator("json" | "param" | "query", schema)`. Common schemas in `validators/common.validator.ts` (`paginationSchema`, `idParamSchema`). Domain schemas in `validators/{domain}.validator.ts`.

**Auth ownership check**: Fetch resource, compare `userId` to `c.get("user")!.id`, return 404 if mismatch.

### API Communication Pattern (Hono RPC)

The backend exports `AppType` from chained route definitions in `src/index.ts`. The frontend consumes it via Hono's `hc` client (`lib/api.ts`) for end-to-end type safety with zero codegen. Validation uses `@hono/zod-validator`. See the `hono-rpc` skill for detailed patterns.

### Database (Drizzle ORM + PostgreSQL)

**Schema**: `src/db/schema.ts`. **Connection**: `src/db/index.ts` (node-postgres Pool). **Config**: `drizzle.config.ts`.

**BetterAuth-managed tables** (text PKs): `user`, `session`, `account`, `verification`
**Custom user fields**: `displayName`, `isPro` (boolean, default false), `locale` (default "en")

**Domain tables** (UUID PKs with `defaultRandom()`): `race`, `race_result`, `trophy`, `room` (one per user, unique userId), `decoration`, `room_item`, `user_decoration`

**Enums**: `sport`, `trophy_type` (medal/bib), `trophy_status` (pending/processing/ready/error), `result_source` (manual/ai/scraped), `wall` (left/right)

**Relations** defined via Drizzle `relations()` API — enables `db.query.*.findMany({ with: { ... } })` relational queries.

### File Upload Flow (Cloudflare R2)

Two-step presigned URL pattern:
1. `POST /api/upload/presigned-url` with `{ type, contentType }` → returns `{ url, key }`
2. Client uploads directly to R2 using the presigned URL
3. `POST /api/upload/confirm/:id` with `{ key }` → links the uploaded file to a trophy and triggers processing

**Key format**: `{type}/{userId}/{nanoid}.{ext}` (e.g. `trophy-photo/abc123/V1StGXR8_Z5jdHi6B-myT.webp`)

Upload types: `trophy-photo`, `avatar`. Accepted content types: `image/jpeg`, `image/png`, `image/webp`.

**Image processing** (`src/lib/image-processor.ts`): Sharp-based — `processTextureImage` (resize to 1024x1024, webp) and `generateThumbnail` (256x256 cover crop, webp).

### Localization (i18n-js + expo-localization)

Config in `lib/i18n.ts`. Translation files in `translations/{en,fr}.json`. Device locale auto-detected via `getLocales()`, falls back to `"en"`. Import as `import i18n from "@/lib/i18n"` and use `i18n.t("key")`.

### Tamagui

`TamaguiProvider` wraps the app in root `_layout.tsx`. Config at `tamagui.config.ts` using `@tamagui/config/v4` defaults. Theme follows device color scheme. Type augmentation declared in config file.

### Path Aliases

Frontend uses `@/*` mapped to the project root via tsconfig.

## Conventions

- **File naming:** kebab-case for all files (e.g., `themed-text.tsx`, `use-color-scheme.ts`)
- **Backend file naming:** `{domain}.routes.ts` for routes, `{domain}.validator.ts` for validators
- **Theming:** Dark/light mode via `constants/theme.ts` — uses `Colors.light`/`Colors.dark` and platform-aware `Fonts`
- **Platform code:** Use `.ios.tsx`/`.web.ts` suffixes for platform-specific implementations
- **Expo Go first:** Always test in Expo Go before creating custom native builds. Only use `npx expo run:ios/android` when custom native modules are required.
- **New Architecture:** Enabled in app.json (`newArchEnabled: true`)
- **React Compiler:** Enabled in app.json
- **Typed routes:** Enabled in app.json
- **Auth ownership:** Always verify `resource.userId === c.get("user")!.id` before mutations; return 404 (not 403) on mismatch

## Agent Skills

Three skills are configured in `.agents/skills/`:

- **building-native-ui** — Expo Router patterns, animations, controls, gradients, SF Symbols, media, storage, tabs, search, sheets, visual effects, 3D/WebGPU
- **hono-rpc** — Type-safe API client with `hc` client, Zod validation, status-aware responses
- **r3f-best-practices** — React Three Fiber performance rules, Drei helpers, Zustand patterns, asset loading. Key rules: never setState in useFrame, use Zustand selectors, preload assets, use Suspense for loading
