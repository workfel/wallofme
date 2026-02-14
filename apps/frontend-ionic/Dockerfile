# ── Stage 1: Build Angular ──────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app

# Copy root workspace files (needed for monorepo dependency resolution)
COPY package.json package-lock.json ./

# Copy frontend package.json for workspace install
COPY apps/frontend-ionic/package.json apps/frontend-ionic/

# Install all dependencies (workspace-aware)
RUN npm ci

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
