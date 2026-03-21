# Stage 1: install all dependencies
FROM node:20-slim AS deps
WORKDIR /workspace
RUN corepack enable
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY packages/lib/package.json packages/lib/
COPY packages/providers/package.json packages/providers/
COPY packages/logos/package.json packages/logos/
COPY packages/infra/package.json packages/infra/
RUN pnpm install --frozen-lockfile --ignore-scripts

# Stage 2: build lib + server
FROM deps AS build
COPY packages/logos/ packages/logos/
COPY packages/providers/ packages/providers/
COPY packages/lib/ packages/lib/
COPY apps/server/ apps/server/
COPY tsconfig.base.json ./
RUN pnpm --filter @gremlin/providers build && pnpm --filter @gremlin/lib build && pnpm --filter @gremlin/server build

# Stage 3: production dependencies only
FROM deps AS prod-deps
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Stage 4: runtime
FROM node:20-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /workspace/packages/lib/dist/ packages/lib/dist/
COPY --from=build /workspace/packages/lib/package.json packages/lib/
COPY --from=build /workspace/apps/server/dist/ apps/server/dist/
COPY --from=build /workspace/apps/server/package.json apps/server/
COPY --from=prod-deps /workspace/node_modules/ node_modules/
COPY --from=prod-deps /workspace/apps/server/node_modules/ apps/server/node_modules/
COPY --from=prod-deps /workspace/packages/lib/node_modules/ packages/lib/node_modules/
COPY package.json pnpm-workspace.yaml ./

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --retries=3 --start-period=30s \
  CMD curl -f http://localhost:3001/api/health || exit 1
CMD ["node", "apps/server/dist/index.js"]
