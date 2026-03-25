#!/usr/bin/env bash
set -euo pipefail

# Build the Expo web app for S3/CloudFront deployment.
# Called by CDK's asset bundling inside a node:20-slim container.
#
# Usage: build-web.sh <repo-root> <output-dir>

REPO_ROOT="${1:?Usage: build-web.sh <repo-root> <output-dir>}"
OUTPUT_DIR="${2:?Usage: build-web.sh <repo-root> <output-dir>}"

corepack enable
cd "$REPO_ROOT"

# turbo prune creates a minimal monorepo subset for the target package
npx --yes turbo prune @gremlin/mobile --out-dir /tmp/pruned

cd /tmp/pruned
# Copy files turbo prune doesn't track
cp "$REPO_ROOT"/tsconfig.base.json .

pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @gremlin/mobile run build:web

cp -r apps/mobile/dist/. "$OUTPUT_DIR/"
