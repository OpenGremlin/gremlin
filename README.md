<p align="center">
  <img src="gremlin_logo.svg" width="120" alt="Gremlin" />
</p>

<h1 align="center">Gremlin</h1>

<p align="center">
  Manage a team of AI agents that remember, learn, and get things done.
</p>

<p align="center">
  <a href="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml"><img src="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
</p>

---

Gremlin is a platform for running persistent AI agents that do real work. Each agent has long-term memory, can search the web, write documents, delegate tasks, and execute code in a fully isolated sandbox — like OpenClaw, but with a team you manage through a clean dashboard and a mobile app.

### Tenets

1. **You own everything** — Your AWS account, your infrastructure, your API keys. Nothing phones home. No vendor holds your data or your agent memory. Deploy with CDK and it's yours.

2. **Safety and security** — Every agent runs in its own isolated EC2 sandbox. Connections use short-lived access tokens. Sensitive actions require explicit approval. No trust by default — defense in depth at every layer.

3. **Clear mental model** — Three concepts: **Agents** (persistent AI workers with memory and personality), **Connections** (authenticated integrations to services like Google, Slack, Spotify), and **Skills** (installable packages that extend capabilities via MCP). That's it.

4. **Delightful UX** — Agents have names and character. The dashboard is fast and uncluttered. The phone app puts control in your pocket. Background tasks run while you move on.

### What agents can do

- Search the web and fetch pages
- Read and write documents to a shared workspace
- Run shell commands in an isolated sandbox
- Delegate subtasks to background workers
- Remember things about you across conversations
- Connect to services and act on your behalf
- Install skills for specialized capabilities

### Use cases

- **Email triage** — An agent reads your inbox, summarizes what matters, drafts replies, and flags action items.
- **On-demand reports** — Ask for a competitive analysis or market summary and get a researched document back.
- **Bulk media processing** — Upload a dozen images, have an agent resize, tag, and organize them.
- **Scheduled briefings** — A morning agent that pulls your calendar, weather, and top news into a daily digest.
- **Research assistant** — Point an agent at a topic and let it search, compile notes, and produce a writeup.
- **Code tasks** — Spin up a sandbox, run scripts, install packages, and get results back — all from chat.

### Quick start

```
pnpm install
pnpm dev
```

### Deploy

Gremlin is AWS-native — DynamoDB, SQS, EC2 sandboxes, CloudFront, all managed through CDK.

```
cd packages/infra
pnpm run diff      # preview changes
pnpm run deploy    # deploy all stacks
```

See [DEVELOPMENT.md](DEVELOPMENT.md) for conventions and more.
