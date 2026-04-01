# Lightweight sandbox relay for EC2 (no Playwright/Chromium needed)
# Builds natively on ARM64

# Stage 1: install dependencies
FROM node:20-slim AS deps
WORKDIR /build
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ git && rm -rf /var/lib/apt/lists/*
RUN corepack enable
RUN git init
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/sandbox/package.json packages/sandbox/
RUN pnpm install --frozen-lockfile \
    && test -f node_modules/.pnpm/node-pty@*/node_modules/node-pty/build/Release/pty.node \
    || (echo "FATAL: node-pty native build missing" && exit 1)

# Stage 2: build TypeScript
FROM deps AS build
COPY packages/sandbox/ packages/sandbox/
COPY tsconfig.base.json ./
RUN pnpm --filter @opengremlin/sandbox build

# Stage 3: runtime
FROM node:20-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
      jq curl wget git python3 python3-pip python3-venv \
      build-essential pkg-config libssl-dev \
      iputils-ping dnsutils procps \
    && rm -rf /var/lib/apt/lists/*

# Go
ENV GOLANG_VERSION=1.22.5
RUN ARCH=$(dpkg --print-architecture) && \
    curl -fsSL "https://go.dev/dl/go${GOLANG_VERSION}.linux-${ARCH}.tar.gz" \
    | tar -C /usr/local -xz
ENV PATH="/usr/local/go/bin:${PATH}"

# Rust
ENV RUSTUP_HOME=/usr/local/rustup CARGO_HOME=/usr/local/cargo
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \
    | sh -s -- -y --no-modify-path
ENV PATH="/usr/local/cargo/bin:${PATH}"

# AWS CLI
RUN ARCH=$(dpkg --print-architecture) && \
    curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-$(uname -m).zip" -o /tmp/awscliv2.zip && \
    unzip -qo /tmp/awscliv2.zip -d /tmp && \
    /tmp/aws/install && \
    rm -rf /tmp/aws /tmp/awscliv2.zip

# MCPorter – CLI bridge for MCP servers (used by MCP-based skills)
RUN npm install -g mcporter

WORKDIR /app
COPY --from=build /build/packages/sandbox/dist/ packages/sandbox/dist/
COPY --from=build /build/packages/sandbox/package.json packages/sandbox/
COPY --from=deps /build/node_modules/ node_modules/
COPY --from=deps /build/packages/sandbox/node_modules/ packages/sandbox/node_modules/
COPY package.json pnpm-workspace.yaml ./

COPY packages/sandbox/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Non-root user for agent shell (relay stays root to protect /app)
RUN apt-get update && apt-get install -y --no-install-recommends sudo && rm -rf /var/lib/apt/lists/* \
    && (userdel -r node 2>/dev/null || true) \
    && useradd -m -s /bin/bash -u 1000 sandbox \
    && echo "sandbox ALL=(root) NOPASSWD: /usr/bin/apt-get, /usr/bin/apt" > /etc/sudoers.d/sandbox \
    && mkdir -p /workspace \
    && chown sandbox:sandbox /workspace
EXPOSE 8080 8083
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["node", "packages/sandbox/dist/index.js"]
