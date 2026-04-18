#!/usr/bin/env bash
set -euo pipefail

# Build the Canvas Vite app for S3/CloudFront deployment.
# Called by CDK's asset bundling inside a node:20-slim container.
#
# Usage: build-web.sh <repo-root> <output-dir>

REPO_ROOT="${1:?Usage: build-web.sh <repo-root> <output-dir>}"
OUTPUT_DIR="${2:?Usage: build-web.sh <repo-root> <output-dir>}"

corepack enable
cd "$REPO_ROOT"

npx --yes turbo prune @opengremlin/canvas --out-dir /tmp/pruned

cd /tmp/pruned
cp "$REPO_ROOT"/tsconfig.base.json .

pnpm install --frozen-lockfile --ignore-scripts
pnpm --filter @opengremlin/canvas run build

cp -r apps/canvas/dist/. "$OUTPUT_DIR/"
