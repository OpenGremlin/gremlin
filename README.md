<p align="center">
  <img src="gremlin_logo.svg" width="200" alt="OpenGremlin" />
</p>

<h1 align="center">OpenGremlin</h1>

<p align="center">
  Self-hosted AI agents with long-term memory, isolated sandboxes, and real tool use.
</p>

<p align="center">
  <a href="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml"><img src="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
</p>

---

OpenGremlin runs on your AWS account. Your keys, your data, your infrastructure — nothing leaves your control. Deploy a team of AI agents that persist across sessions, remember what matters, and operate in fully isolated sandboxes where they can search, write, code, and connect to the services you use.

### Why OpenGremlin

- **Your cloud, your rules** — Deploys to your AWS account via CDK. No SaaS middleman, no vendor lock-in, no data leaving your infra. You own the compute, the storage, and the agent memory.
- **Real isolation** — Each agent gets its own EC2 sandbox. Code execution, file operations, and tool use happen in a container you control. Short-lived access tokens, explicit approval for sensitive actions.
- **Agents that remember** — Long-term memory persists across conversations. Agents recall relevant context automatically — no re-explaining, no lost threads.
- **Three concepts, that's it** — **Agents** have personality and memory. **Connections** authenticate to services (Google, Slack, Spotify, etc.). **Skills** extend capabilities via MCP. Simple to reason about, powerful to compose.
- **Async by design** — Agents delegate subtasks to background workers. Kick off a research task and come back to a finished document. Scheduled jobs run on cron.
- **Bring your models** — Claude, GPT, Llama, Mistral via Bedrock, or any provider you connect.

### Use cases

**Email triage** · **Research and reports** · **Bulk image processing** · **Scheduled digests** · **Code execution** · **Data pipeline tasks**

### Quick start

```
pnpm install
pnpm dev
```

### Deploy

AWS-native — DynamoDB, SQS, EC2 sandboxes, CloudFront, managed through CDK.

```
cd packages/infra
pnpm run diff      # preview changes
pnpm run deploy    # deploy all stacks
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture and conventions.
