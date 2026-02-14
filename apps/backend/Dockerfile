# ── Stage 1: Install dependencies ───────────────────────────────
FROM oven/bun:1-alpine AS deps
WORKDIR /app

# Native dependencies needed by sharp
RUN apk add --no-cache python3 make g++ vips-dev

# Copy workspace root files
COPY package.json bun.lock ./

# Copy backend package.json for workspace resolution
COPY apps/backend/package.json apps/backend/

# Install all dependencies
RUN cd apps/backend && bun install

# ── Stage 2: Production image ──────────────────────────────────
FROM oven/bun:1-alpine AS runner
WORKDIR /app

# Runtime dependency for sharp
RUN apk add --no-cache vips

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/backend/node_modules ./apps/backend/node_modules

# Copy backend source code
COPY apps/backend/src apps/backend/src
COPY apps/backend/drizzle apps/backend/drizzle
COPY apps/backend/drizzle.config.ts apps/backend/
COPY apps/backend/tsconfig.json apps/backend/
COPY apps/backend/package.json apps/backend/

# Copy root package.json (needed for workspace resolution at runtime)
COPY package.json ./

WORKDIR /app/apps/backend

ENV NODE_ENV=production
EXPOSE 3333

# Run migrations then start the server
CMD ["bun", "run", "src/index.ts"]
