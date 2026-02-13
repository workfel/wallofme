# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**WallOfMe** — "The Metaverse of the Athlete." A mobile app where athletes capture race photos, auto-extract results via AI, and display achievements in a 3D virtual "Pain Cave" room with medals, bibs, and trophies.

## Monorepo Structure

npm workspaces monorepo:

```
apps/frontend-ionic/   Angular 21 + Ionic 8 + Capacitor 6 mobile app
apps/backend/          Hono API server running on Bun
assets/models/         3D GLB models (Bicycle, Kettlebell, Treadmill)
specs/                 Architecture specs and planning docs
```

## Commands

### Frontend (`apps/frontend-ionic`)
```bash
npm run start               # Dev server on port 8100 (ng serve)
npm run build               # Build for development
npm run build:prod          # Production build
npm run lint                # Run Angular linter
npm run test                # Run tests (ng test)
npm run cap:sync            # Sync web build to native projects
npm run cap:ios             # Open Xcode for iOS
npm run cap:android         # Open Android Studio
npm run cap:build:ios       # Production build + sync iOS
npm run cap:build:android   # Production build + sync Android
```

### Backend (`apps/backend`)
```bash
bun run dev                 # Start with hot reload (port 3333)
bun run db:generate         # Generate Drizzle migration files from schema changes
bun run db:migrate          # Run pending migrations
bun run db:push             # Push schema directly to DB (dev shortcut)
bun run db:studio           # Open Drizzle Studio GUI
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
| `BETTER_AUTH_URL` | Backend base URL (e.g. `http://localhost:3333`) |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth |
| `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` | Apple OAuth |
| `R2_ENDPOINT` | Cloudflare R2 S3-compatible endpoint |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 credentials |
| `R2_BUCKET_NAME` / `R2_PUBLIC_URL` | R2 bucket and public URL prefix |
| `AI_PROVIDER` | AI provider: `mistral` \| `openai` \| `google` |
| `AI_VISION_MODEL` / `AI_TEXT_MODEL` | Optional model overrides |
| `MISTRAL_API_KEY` / `OPENAI_API_KEY` / `GOOGLE_GENERATIVE_AI_API_KEY` | API key for chosen provider |

### Frontend (`apps/frontend-ionic/src/environments/environment.ts`)
- `apiUrl` — Backend URL (default: `http://localhost:3333`). For native device testing, use your machine's network IP instead of localhost.

## Tech Stack

- **Frontend:** Angular 21 + Ionic 8 + Capacitor 6, angular-three + three.js (3D rendering), @ngx-translate (i18n), Angular signals for state, TypeScript strict mode
- **Backend:** Hono 4 on Bun runtime, Drizzle ORM + PostgreSQL 16, BetterAuth (email/password + Google + Apple OAuth) with Capacitor plugin, Cloudflare R2 (via AWS S3 SDK), Sharp image processing, ai-sdk (multi-provider: OpenAI/Google/Mistral), @imgly/background-removal-node, TypeScript strict mode

## Architecture

### Authentication Flow (BetterAuth)

**Server** (`src/lib/auth.ts`): BetterAuth configured with Drizzle adapter, email/password + Google/Apple social providers, Capacitor plugin. Custom user fields: `displayName`, `isPro`, `locale`, `firstName`, `lastName`, `country`. Trusted origins include `wallofme://` scheme.

**Middleware** (`src/middleware/auth.ts`):
- `sessionMiddleware` — Global, runs on every request. Populates `c.get("user")` / `c.get("session")` (null if unauthenticated).
- `requireAuth` — Per-route guard. Returns 401 if no user in context.

**BetterAuth handler**: `app.on(["POST", "GET"], "/api/auth/*", ...)` in `src/index.ts` forwards all auth requests to BetterAuth.

**Client** (`core/services/auth.service.ts`): `createAuthClient` with `withCapacitor` plugin, `wallofme` URL scheme. Uses Angular signals (`signal()`, `computed()`) for reactive state. Auth token handling differs per platform: cookies on web, bearer token from Capacitor Preferences on native.

**Guards**: `authGuard` redirects unauthenticated users to `/auth`. `onboardingGuard` redirects users without `firstName` to `/onboarding`.

### Frontend Architecture (Angular + Ionic)

**Routing** (`app.routes.ts`): Config-based lazy-loaded routes with guards.

```
/auth/*          Login, register, OTP, OAuth callback
/onboarding      Profile completion (firstName, lastName, country)
/tabs/*          Bottom tabs: Home, Explore, Trophies, Profile
/trophy/scan     Camera capture (modal)
/trophy/review   AI analysis + review (modal)
/trophy/:id      Trophy detail
/tokens          Token store
/room/edit       Edit Pain Cave room
/room/share/:slug  Shared room (public, no auth)
/room/:userId    View user's room
```

**Project layout:**
```
src/app/
  core/           Injectable services (auth, api, scan, room, trophy, upload, i18n) + route guards
  features/       Feature pages organized by domain (auth, onboarding, tabs, trophy, room)
  shared/         Shared components (step-indicator, result-card, image-reveal) + utilities
  types/          API type definitions
```

**API Client** (`core/services/api.service.ts`): Wraps Hono `hc<AppType>` client with platform-aware auth fetch. Imports `AppType` directly from backend via `@backend/*` path alias for end-to-end type safety with zero codegen.

**Path Aliases** (tsconfig):
- `@app/*` → `./src/app/*`
- `@env/*` → `./src/environments/*`
- `@backend/*` → `../backend/src/*` (cross-workspace type import)

**3D Rendering**: angular-three (not React Three Fiber) for isometric Pain Cave room rendering. Components in `features/room/components/`.

**i18n**: @ngx-translate with JSON files in `src/assets/i18n/{en,fr}.json`. Configured in `app.config.ts`.

### Backend API Architecture

**Route endpoint map** (all prefixed with `/api`):

| Route file | Endpoints |
|---|---|
| `trophies.routes.ts` | `GET /trophies`, `GET /trophies/:id`, `POST /trophies`, `PATCH /trophies/:id`, `DELETE /trophies/:id` |
| `races.routes.ts` | `GET /races`, `GET /races/:id`, `POST /races` (auth), `POST /races/results` (auth), `GET /races/results/me` (auth) |
| `rooms.routes.ts` | `GET /rooms/me` (auth, auto-creates), `GET /rooms/user/:id` (public), `PATCH /rooms/me` (auth), `POST /rooms/items` (auth), `PATCH /rooms/items/:id` (auth), `DELETE /rooms/items/:id` (auth) |
| `decorations.routes.ts` | `GET /decorations`, `GET /decorations/:id`, `GET /decorations/inventory/me` (auth), `POST /decorations/:id/acquire` (auth) |
| `upload.routes.ts` | `POST /upload/presigned-url` (auth), `POST /upload/confirm/:id` (auth) |
| `scan.routes.ts` | `POST /scan/analyze` (auth), `POST /scan/remove-background` (auth), `POST /scan/validate` (auth), `POST /scan/search-results` (auth) |
| `users.routes.ts` | `GET /users/me` (auth), `POST /users/onboarding` (auth) |
| `tokens.routes.ts` | Token economy endpoints (auth) |
| `themes.routes.ts` | Theme catalog and acquisition endpoints |
| `webhooks.routes.ts` | External webhook handlers (e.g., RevenueCat) |
| `social.routes.ts` | Room likes, views, and social interactions |

**Variables type**: Every route file must declare the Hono `Variables` type locally:
```ts
type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};
```

**Validation pattern**: `zValidator("json" | "param" | "query", schema)`. Common schemas in `validators/common.validator.ts` (`paginationSchema`, `idParamSchema`). Domain schemas in `validators/{domain}.validator.ts`.

**Auth ownership check**: Fetch resource, compare `userId` to `c.get("user")!.id`, return 404 (not 403) if mismatch.

**Error handling**: Global `errorHandler` middleware (`src/middleware/error-handler.ts`). Includes error details conditionally based on `NODE_ENV`.

### API Communication Pattern (Hono RPC)

The backend exports `AppType` from chained route definitions in `src/index.ts`. The frontend consumes it via Hono's `hc` client (`core/services/api.service.ts`) imported through `@backend/*` path alias for end-to-end type safety with zero codegen. See the `hono-rpc` skill for detailed patterns.

### Trophy Scan Pipeline

1. User captures photo → `POST /upload/presigned-url` → direct upload to R2 → `POST /upload/confirm/:id` creates trophy
2. `POST /scan/analyze` — AI vision model extracts race name, sport, type (medal/bib), location, date
3. `POST /scan/remove-background` — @imgly background removal + Sharp processing (texture 1024x1024, thumbnail 256x256)
4. `POST /scan/validate` — User confirms/edits AI analysis → creates race + race_result, links to trophy
5. `POST /scan/search-results` — AI-powered web search for official race results using user's name

### Database (Drizzle ORM + PostgreSQL)

**Schema**: `src/db/schema.ts`. **Connection**: `src/db/index.ts` (node-postgres Pool). **Config**: `drizzle.config.ts`.

**BetterAuth-managed tables** (text PKs): `user`, `session`, `account`, `verification`
**Custom user fields**: `displayName`, `isPro` (boolean), `locale`, `firstName`, `lastName`, `country`, `tokenBalance` (integer)

**Domain tables** (UUID PKs with `defaultRandom()`): `race`, `race_result`, `trophy`, `room` (one per user, unique userId), `decoration`, `room_item`, `user_decoration`, `theme`, `user_theme`, `token_transaction`, `room_like` (unique per room+user), `room_view`, `device_token`, `notification`

**Enums**: `sport`, `trophy_type` (medal/bib), `trophy_status` (pending/processing/ready/error), `result_source` (manual/ai/scraped), `wall` (left/right), `token_transaction_type` (purchase/rewarded_video/spend_decoration/spend_theme/refund/bonus), `device_platform` (ios/android/web), `notification_type` (room_liked)

**Relations** defined via Drizzle `relations()` API — enables `db.query.*.findMany({ with: { ... } })` relational queries.

### File Upload Flow (Cloudflare R2)

Two-step presigned URL pattern:
1. `POST /api/upload/presigned-url` with `{ type, contentType }` → returns `{ url, key }`
2. Client uploads directly to R2 using the presigned URL
3. `POST /api/upload/confirm/:id` with `{ key }` → links the uploaded file to a trophy

**Key format**: `{type}/{userId}/{nanoid}.{ext}`

Upload types: `trophy-photo`, `avatar`. Accepted content types: `image/jpeg`, `image/png`, `image/webp`.

## Conventions

- **File naming:** kebab-case for all files (e.g., `auth.service.ts`, `trophy-scan.page.ts`)
- **Backend file naming:** `{domain}.routes.ts` for routes, `{domain}.validator.ts` for validators
- **Frontend components:** Standalone components (no NgModules). Feature pages use `.page.ts` suffix.
- **Frontend services:** `@Injectable({ providedIn: 'root' })` with Angular signals for state management
- **Frontend state:** Use `signal()` for mutable state, `computed()` for derived state, `.asReadonly()` for public exposure
- **Platform code:** Ionic `mode: 'ios'` set globally in `app.config.ts`
- **Capacitor config:** `capacitor.config.ts` — app ID `com.wallofme.app`, URL scheme `wallofme`
- **Auth ownership:** Always verify `resource.userId === c.get("user")!.id` before mutations; return 404 (not 403) on mismatch

## Agent Skills

Skills are configured in `.agents/skills/`:

- **ionic-design** — Ionic Framework component usage, theming, platform-specific styling, mobile UI patterns
- **hono-rpc** — Type-safe API client with `hc` client, Zod validation, status-aware responses
- **r3f-best-practices** — React Three Fiber / three.js performance rules, Drei helpers, Zustand patterns, asset loading
- **building-native-ui** — Expo Router patterns (legacy reference)
- **frontend-design** — Production-grade UI design methodology, avoids generic AI aesthetics
- **ui-ux-pro-max** — Comprehensive UI/UX design intelligence: styles, palettes, font pairings, accessibility
