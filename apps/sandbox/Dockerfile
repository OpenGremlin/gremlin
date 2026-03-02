# Stage 1: install dependencies
FROM node:20-slim AS deps
WORKDIR /build
RUN corepack enable
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/sandbox/package.json apps/sandbox/
RUN pnpm install --frozen-lockfile

# Stage 2: build TypeScript
FROM deps AS build
COPY apps/sandbox/ apps/sandbox/
COPY tsconfig.base.json ./
RUN pnpm --filter @gremlin/sandbox build

# Stage 3: runtime with Playwright/Chromium
FROM mcr.microsoft.com/playwright:v1.52.0-noble AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
      jq curl git python3 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /build/apps/sandbox/dist/ apps/sandbox/dist/
COPY --from=build /build/apps/sandbox/package.json apps/sandbox/
COPY --from=deps /build/node_modules/ node_modules/
COPY --from=deps /build/apps/sandbox/node_modules/ apps/sandbox/node_modules/
COPY package.json pnpm-workspace.yaml ./

RUN mkdir -p /workspace
EXPOSE 8080 8081
CMD ["node", "apps/sandbox/dist/index.js"]
