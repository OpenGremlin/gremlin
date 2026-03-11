# Development

## Setup

```
pnpm install
cp .env.example .env
docker compose up -d
pnpm --filter server db:seed
pnpm dev
```

## Testing

```
pnpm --filter @gremlin/server test
```

## Linting & Formatting

```
pnpm lint          # check
pnpm lint:fix      # fix
```

Typecheck the server:

```
cd apps/server && pnpm exec tsc --noEmit
```

## Deploying

Infrastructure is managed with AWS CDK:

```
cd packages/infra
pnpm run diff      # preview changes
pnpm run deploy    # deploy all stacks
```

## Project Structure

| Path | What it is |
|---|---|
| `apps/server` | Node.js backend — Express, GraphQL, DynamoDB, SQS |
| `apps/desktop-auth` | Electron app for desktop OAuth flows (Gremlin Connect) |
| `packages/lib` | Shared services and business logic |
| `packages/sandbox` | EC2 sandbox agent and WebSocket handler |
| `packages/infra` | AWS CDK infrastructure stacks |

## Desktop Auth App

The `apps/desktop-auth` Electron app handles OAuth connections from your machine. OAuth client secrets and authorization codes never touch the server — the entire flow happens locally, and only the resulting access tokens are submitted.

```
cd apps/desktop-auth
pnpm install
pnpm dev            # starts Vite + Electron
pnpm build          # builds main process + renderer
```

## Conventions

**Prompts** — All LLM prompts live in `packages/lib/src/services/prompts/`. Templates use Handlebars. The `renderPrompt(key, data)` function is the single entry point. Never inline prompts in implementation files.

**DynamoDB** — Single-table design with `pk`/`sk` keys and `_et` for entity type discrimination.

**Services** — Organized by domain under `packages/lib/src/services/`. Each service exports from a barrel `index.ts` and is accessed via `ctx.services.<name>`.

**Logging** — `createLogger("namespace")` from `logger.js` (pino-based). Set `ENABLE_FILE_LOGS=true` to write structured JSON logs to `logs/`.

**Formatting** — Biome must pass before commit. Run `pnpm lint:fix` to auto-format.
