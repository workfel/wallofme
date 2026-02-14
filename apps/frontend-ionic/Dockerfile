# ── Stage 1: Build Angular ──────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Copy root workspace files (needed for monorepo dependency resolution)
COPY package.json package-lock.json ./

# Copy BOTH workspace package.json files (npm ci needs them to install all deps)
COPY apps/frontend-ionic/package.json apps/frontend-ionic/
COPY apps/backend/package.json apps/backend/

# Install all workspace dependencies (frontend + backend for type resolution)
RUN npm ci

# Copy backend source (needed for @backend/* type imports via Hono RPC)
COPY apps/backend/src apps/backend/src
COPY apps/backend/tsconfig.json apps/backend/

# Copy frontend source code
COPY apps/frontend-ionic/ apps/frontend-ionic/

# Build the Angular app in production mode
WORKDIR /app/apps/frontend-ionic
RUN npx ng build --configuration production

# ── Stage 2: Serve with Nginx ───────────────────────────────────
FROM nginx:alpine

# Copy built static files
COPY --from=build /app/apps/frontend-ionic/www/browser /usr/share/nginx/html

# Copy custom Nginx config (SPA routing)
COPY apps/frontend-ionic/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
