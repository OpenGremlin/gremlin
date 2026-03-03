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

## Conventions

**Prompts**: All LLM prompts live in `apps/server/src/services/prompts/`. Templates go in the `templates/` subfolder as Handlebars strings. The `renderPrompt(key, data)` function is the single entry point — add new prompts by extending the `PromptRegistry` type and adding a corresponding template. Never inline prompts in implementation files.
