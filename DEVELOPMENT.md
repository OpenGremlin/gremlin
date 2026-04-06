# Development

## Setup

```
pnpm install
cp .env.example .env
# Add your LocalStack auth token to .env (get one at https://app.localstack.cloud/settings/auth-tokens)
docker compose up -d
pnpm --filter server db:seed
pnpm dev
pnpm mobile
```

## Mobile App

The web frontend is the Expo mobile app (`apps/mobile`) running in web mode. It also targets iOS and Android via Expo.

```
cd apps/mobile
pnpm start              # Expo dev server (all platforms)
pnpm web                # web only
npx expo export --platform web  # production web build
```

### GraphQL Codegen

After changing GraphQL queries or the server schema, regenerate types:

```
pnpm --filter @opengremlin/mobile codegen
```

### Typecheck

```
cd apps/mobile && npx tsc --noEmit
```

## Local Sandbox

In production, each agent gets a dedicated EC2 instance running the sandbox relay (`packages/sandbox`). The relay is a WebSocket server (port 8080) that spawns PTY shells and executes commands inside the container. The main server connects to it over WebSocket to run agent tool calls (shell commands, file operations, etc.).

For local development, `docker compose up -d` starts a sandbox container alongside LocalStack. To route the server to it instead of trying to launch EC2 instances:

1. Set `SANDBOX_LOCAL=true` in your `.env`
2. The server will connect to `ws://localhost:8080` (override with `SANDBOX_LOCAL_WS_URL` if needed)

The relevant code path is in `packages/lib/src/services/sandbox/launchSandbox.ts` — when `SANDBOX_LOCAL` is set, `tryQuickConnect()` skips EC2 entirely and returns a session pointing at the local URL.

The sandbox container includes Go, Rust, Python, and standard dev tools. It runs commands as a non-root `sandbox` user inside a `/workspace` directory.

## Testing

```
pnpm --filter @opengremlin/server test
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

Infrastructure is managed with AWS CDK via the CLI:

```
pnpm gremlin init      # first-time setup
pnpm gremlin update    # deploy changes after pulling new code
pnpm gremlin status    # check what's configured
pnpm gremlin destroy   # tear down everything
```

## Project Structure

| Path | What it is |
|---|---|
| `apps/mobile` | React Native / Expo app — web, iOS, and Android |
| `apps/server` | Node.js backend — Express, GraphQL, DynamoDB, SQS |
| `packages/lib` | Shared services and business logic |
| `packages/sandbox` | EC2 sandbox agent and WebSocket handler |
| `packages/infra` | AWS CDK infrastructure stacks |
| `packages/functions` | Lambda functions (EventBridge schedule targets, etc.) |
| `packages/media-server` | Lambda-based media server for file serving |
| `packages/logos` | Integration provider logos and brand assets |

## Conventions

**Prompts** — All LLM prompts live in `packages/lib/src/services/prompts/`. Templates use Handlebars. The `renderPrompt(key, data)` function is the single entry point. Never inline prompts in implementation files.

**DynamoDB** — Single-table design with `pk`/`sk` keys and `_et` for entity type discrimination.

**Services** — Organized by domain under `packages/lib/src/services/`. Each service exports from a barrel `index.ts` and is accessed via `ctx.services.<name>`.

**Logging** — `createLogger("namespace")` from `logger.js` (pino-based). Set `ENABLE_FILE_LOGS=true` to write structured JSON logs to `logs/`.

**Formatting** — Biome must pass before commit. Run `pnpm lint:fix` to auto-format.
