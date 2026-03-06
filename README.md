# Gremlin

AI agent platform with long-term memory, task delegation, and tool use.

## Structure

```
apps/
  server/       GraphQL API, orchestrator, memory, agent runtime
  admin/        Admin UI
  phone/        Mobile app (Expo)
  media-server/ Media handling
  sandbox/      Sandboxed code execution environment
packages/
  infra/        AWS CDK infrastructure
```

## Development

```
pnpm install
pnpm dev
```

### Logs

Set `ENABLE_FILE_LOGS=true` in your root `.env` to write structured JSON logs to disk. Files are written to `logs/{server,sandbox}/{YYYY-MM-DDTHH}.log`, organized by app and hour. The `logs/` directory is gitignored.

## Conventions

**Prompts**: All LLM prompts live in `apps/server/src/services/prompts/`. Templates go in the `templates/` subfolder as Handlebars strings. The `renderPrompt(key, data)` function is the single entry point — add new prompts by extending the `PromptRegistry` type and adding a corresponding template. Never inline prompts in implementation files.

**Pagination**: The admin UI uses backward cursor-based pagination via `usePaginatedQuery(query, connectionSelector, variables?)` in `apps/admin/src/usePaginatedQuery.ts`. It fetches the most recent page first (`last`/`before`), with `loadMore()` fetching older pages. Returns `{ nodes, loading, loadingMore, error, hasMore, loadMore, appendNode }`. Nodes are in chronological order (oldest first). Use `appendNode` for subscription dedup. The hook does not include UI concerns (IntersectionObserver, scroll) — those stay in the component. Page size is 20.
