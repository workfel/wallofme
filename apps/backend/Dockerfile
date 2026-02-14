# ── Stage 1: Install dependencies with Node/npm ────────────────
# npm handles native addon compilation properly (sharp, onnxruntime)
FROM node:22 AS deps
WORKDIR /app

# Install backend as standalone project (not workspace)
COPY apps/backend/package.json ./package.json

# --ignore-scripts skips the postinstall symlink hack (workspace-only)
RUN npm install --ignore-scripts

# Ensure native modules are properly compiled
RUN npm rebuild

# ── Stage 2: Production image with Bun ─────────────────────────
FROM oven/bun:1-debian AS runner
WORKDIR /app

# Copy node_modules (with properly compiled native binaries)
COPY --from=deps /app/node_modules ./node_modules

# Copy backend source code
COPY apps/backend/src ./src
COPY apps/backend/drizzle ./drizzle
COPY apps/backend/drizzle.config.ts ./
COPY apps/backend/tsconfig.json ./
COPY apps/backend/package.json ./

ENV NODE_ENV=production
EXPOSE 3333

CMD ["bun", "run", "src/index.ts"]
