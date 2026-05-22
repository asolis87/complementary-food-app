# ── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Vite build-time env vars — must be passed as build args
ARG VITE_STRIPE_PRICE_MONTHLY
ARG VITE_STRIPE_PRICE_ANNUAL
ARG VITE_API_URL=/api
ARG VITE_APP_ENV=production

ENV VITE_STRIPE_PRICE_MONTHLY=${VITE_STRIPE_PRICE_MONTHLY}
ENV VITE_STRIPE_PRICE_ANNUAL=${VITE_STRIPE_PRICE_ANNUAL}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_ENV=${VITE_APP_ENV}

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/
COPY tsconfig.json ./

# Build shared package first, then PWA
RUN pnpm --filter @pakulab/shared build
RUN pnpm --filter web build

# ── Stage 2: Serve with nginx ────────────────────────────────────────────────
FROM nginx:1.25-alpine AS runner

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config for SPA (history mode routing)
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built PWA assets
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
