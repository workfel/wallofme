# ── Stage 1: Install dependencies ───────────────────────────────
FROM oven/bun:1-debian AS deps
WORKDIR /app

# Install Node.js (needed to rebuild native addons that Bun can't handle)
RUN apt-get update && apt-get install -y nodejs npm python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy workspace root files
COPY package.json bun.lock ./

# Copy backend package.json for workspace resolution
COPY apps/backend/package.json apps/backend/

# Install all dependencies
RUN cd apps/backend && bun install

# Rebuild sharp native binaries (the nested copy inside @imgly/background-removal-node)
RUN cd /app/node_modules/@imgly/background-removal-node/node_modules/sharp && npm install
RUN npm rebuild sharp --platform=linux --arch=x64

# ── Stage 2: Production image ──────────────────────────────────
FROM oven/bun:1-debian AS runner
WORKDIR /app

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

CMD ["bun", "run", "src/index.ts"]
