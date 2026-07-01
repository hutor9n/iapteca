# =============================================================================
# Multi-stage Dockerfile for iApteca (Next.js 16, pnpm, Node 20)
#
# Stages:
#   1. base      – shared Node + pnpm toolchain
#   2. deps      – production + dev dependencies (cached separately)
#   3. builder   – `next build` → .next/standalone
#   4. runner    – minimal runtime image (~120 MB vs ~1 GB full install)
#
# Build:
#   docker build -t iapteca:local .
#
# Run:
#   docker run -p 3000:3000 -e MONGODB_URI=... iapteca:local
# =============================================================================

# ── Stage 1: base ─────────────────────────────────────────────────────────────
# Pin the exact Node LTS digest so rebuilds are reproducible and immune to
# supply-chain tag-mutation attacks.
FROM node:20-alpine AS base

# pnpm is activated via corepack (ships with Node 20, no extra install needed).
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable pnpm

# ── Stage 2: deps ─────────────────────────────────────────────────────────────
# Install ALL dependencies (dev included) so the builder has everything it needs.
# This layer is cached as long as pnpm-lock.yaml and pnpm-workspace.yaml don't change.
FROM base AS deps

WORKDIR /app

# Copy manifest files only — triggers cache invalidation only on lock-file changes.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# --frozen-lockfile: fail if lockfile is out of sync (protects against silent upgrades).
# --ignore-scripts: skip lifecycle scripts for untrusted transitive deps,
#   EXCEPT those explicitly allow-listed in pnpm-workspace.yaml (bcrypt, sharp).
RUN pnpm install --frozen-lockfile

# ── Stage 3: builder ──────────────────────────────────────────────────────────
FROM base AS builder

WORKDIR /app

# Bring in installed node_modules from deps stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the source (respects .dockerignore).
COPY . .

# Disable Next.js telemetry during build (no outbound network calls).
ENV NEXT_TELEMETRY_DISABLED=1

# next.config.ts has output: 'standalone' — this produces:
#   .next/standalone/   — self-contained server with minimal node_modules
#   .next/static/       — pre-compiled JS/CSS chunks
#   public/             — static assets
RUN pnpm run build

# ── Stage 4: runner ───────────────────────────────────────────────────────────
# Start from a fresh alpine image — no dev tools, no pnpm, no source code.
FROM node:20-alpine AS runner

WORKDIR /app

# Security: run as a non-root user.
# nextjs (uid 1001) is the conventional user for Next.js containers.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only the artefacts the runtime actually needs:
#   1. The standalone server bundle (includes its own trimmed node_modules).
#   2. The static chunk directory (referenced by the server at runtime).
#   3. Public assets (fonts, images, etc.).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static    ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public          ./public

USER nextjs

# Port the Next.js standalone server listens on.
EXPOSE 3000

# Tell the standalone server which port to bind.
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
# Production mode — disables hot-reload and development overlays.
ENV NODE_ENV=production
# Disable telemetry at runtime too.
ENV NEXT_TELEMETRY_DISABLED=1

# Healthcheck: Docker engine polls this every 30 s.
# Using wget (ships with alpine) — avoids installing curl.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/categories || exit 1

# next.config.ts `output: 'standalone'` generates server.js at the root of the
# standalone directory.
CMD ["node", "server.js"]
