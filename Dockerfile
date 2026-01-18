# syntax=docker/dockerfile:1

# ============================================================================
# MedFlash - Ultra-lightweight Docker Image
# Optimized for smallest possible size with Alpine + Bun
# ============================================================================

# -----------------------------------------------------------------------------
# Stage 1: Dependencies
# -----------------------------------------------------------------------------
FROM oven/bun:1.2-alpine AS deps

WORKDIR /app

# Install native deps for sharp & pdf2pic
RUN apk add --no-cache \
    vips-dev \
    poppler-utils \
    cairo-dev \
    pango-dev \
    giflib-dev

COPY package.json bun.lock ./

# Bun + Alpine fix: disable progress & use single network thread
# This prevents the hanging issue with musl libc
ENV BUN_RUNTIME_TRANSPILER_CACHE_PATH=0
RUN bun install --frozen-lockfile --no-progress --concurrent-scripts 1

# -----------------------------------------------------------------------------
# Stage 2: Build
# -----------------------------------------------------------------------------
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

RUN apk add --no-cache \
    vips-dev \
    poppler-utils \
    cairo-dev \
    pango-dev \
    giflib-dev

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
RUN bun run build

# Prune dev dependencies after build
RUN bun install --production --frozen-lockfile --no-progress --concurrent-scripts 1

# -----------------------------------------------------------------------------
# Stage 3: Production (minimal runtime)
# -----------------------------------------------------------------------------
FROM alpine:3.21 AS runner

WORKDIR /app

# Install ONLY runtime essentials (no Bun dev tools, no -dev packages)
# - Bun binary only
# - Minimal native libs for sharp/pdf2pic
RUN apk add --no-cache \
    libstdc++ \
    vips \
    poppler-utils \
    cairo \
    pango \
    giflib \
    && addgroup -S -g 1001 medflash \
    && adduser -S -u 1001 -G medflash medflash

# Copy Bun binary from official image (much smaller than full bun image)
COPY --from=oven/bun:1.2-alpine /usr/local/bin/bun /usr/local/bin/bun

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000

# Copy ONLY what's needed to run
COPY --from=builder --chown=medflash:medflash /app/dist ./dist
COPY --from=builder --chown=medflash:medflash /app/server.ts ./server.ts
COPY --from=builder --chown=medflash:medflash /app/node_modules ./node_modules
COPY --from=builder --chown=medflash:medflash /app/package.json ./

USER medflash
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/ || exit 1

CMD ["bun", "run", "server.ts"]
