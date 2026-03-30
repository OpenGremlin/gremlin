# Stage 1: prune monorepo to only what @opengremlin/server needs
FROM node:20-slim AS prune
WORKDIR /workspace
RUN corepack enable && npm install -g turbo
COPY . .
RUN turbo prune @opengremlin/server --out-dir /pruned

# Stage 2: install dependencies + build
FROM node:20-slim AS build
WORKDIR /workspace
RUN apt-get update && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN corepack enable
COPY --from=prune /pruned/ .
COPY tsconfig.base.json .
RUN pnpm install --frozen-lockfile --ignore-scripts
RUN pnpm turbo build --filter=@opengremlin/server

# Stage 3: bundle with pnpm deploy
FROM build AS deploy
RUN pnpm --filter @opengremlin/server deploy --prod --ignore-scripts /deploy

# Stage 4: runtime
FROM node:20-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deploy /deploy .

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=30s \
  CMD curl -f http://localhost:3001/api/health || exit 1
CMD ["node", "dist/index.js"]
