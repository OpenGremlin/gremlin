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
pnpm --filter @gremlin/admin test
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
| `apps/admin` | React dashboard |
| `packages/lib` | Shared services and business logic |
| `packages/sandbox` | EC2 sandbox agent and WebSocket handler |
| `packages/infra` | AWS CDK infrastructure stacks |

## Conventions

**Prompts** — All LLM prompts live in `packages/lib/src/services/prompts/`. Templates use Handlebars. The `renderPrompt(key, data)` function is the single entry point. Never inline prompts in implementation files.

**Pagination** — The admin UI uses backward cursor-based pagination via `usePaginatedQuery()`. Fetches the most recent page first (`last`/`before`), with `loadMore()` for older pages. Page size is 20.

**DynamoDB** — Single-table design with `pk`/`sk` keys and `_et` for entity type discrimination.

**Services** — Organized by domain under `packages/lib/src/services/`. Each service exports from a barrel `index.ts` and is accessed via `ctx.services.<name>`.

**Logging** — `createLogger("namespace")` from `logger.js` (pino-based). Set `ENABLE_FILE_LOGS=true` to write structured JSON logs to `logs/`.

**Formatting** — Biome must pass before commit. Run `pnpm lint:fix` to auto-format.
