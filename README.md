<p align="center">
  <img src="branding/gremlin_logo.svg" width="200" alt="OpenGremlin" />
</p>

<h1 align="center">OpenGremlin</h1>

<p align="center">
  Self-hosted AI agents with long-term memory, isolated sandboxes, and real tool use.
</p>

<p align="center">
  <a href="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml"><img src="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" /></a>
</p>

---

OpenGremlin runs on your AWS account. Your keys, your data, your infrastructure — nothing leaves your control. Deploy a team of AI agents that persist across sessions, remember what matters, and operate in fully isolated sandboxes where they can search, write, code, and connect to the services you use.

### Why OpenGremlin

- **Your cloud, your rules** — Deploys to your AWS account via CDK. No SaaS middleman, no vendor lock-in, no data leaving your infra. You own the compute, the storage, and the agent memory.
- **Your credentials never touch the server** — When you connect services like Google, GitHub, or Spotify, the OAuth flow happens entirely on your machine through the Gremlin Connect desktop app. Your client secrets and long-lived tokens are exchanged locally and sent directly to your server — they're never routed through a third party, and they're never exposed to the AI agents themselves. Agents get short-lived access to act on your behalf, but they never see or store the keys that grant that access.
- **Real isolation** — Each agent gets its own EC2 sandbox. Code execution, file operations, and tool use happen in a container you control — not a shared runtime with other users' workloads.
- **Agents that remember** — Long-term memory persists across conversations. Agents recall relevant context automatically — no re-explaining, no lost threads.
- **Three concepts, that's it** — **Agents** have personality and memory. **Connections** authenticate to services. **Skills** extend capabilities via MCP. Simple to reason about, powerful to compose.
- **Async by design** — Agents delegate subtasks to background workers. Kick off a research task and come back to a finished document. Scheduled jobs run on cron.
- **Bring your models** — Claude, GPT, Llama, Mistral via Bedrock, or any provider you connect.

### How connections work

Most agent platforms ask you to hand over your OAuth credentials to a central server, or route your login flows through infrastructure you don't control. OpenGremlin takes a different approach.

**Gremlin Connect** is a lightweight desktop app (Electron) that runs on your machine. When you want to connect a service — say, Google or GitHub — here's what happens:

1. You enter your own OAuth app credentials (client ID and secret) in Gremlin Connect
2. The app opens your browser for the standard OAuth consent screen
3. Your browser redirects back to `localhost` — your machine, not a remote server
4. Gremlin Connect exchanges the authorization code for tokens locally
5. The resulting access token is sent to your deployed server over HTTPS

This means:

- **Your OAuth client secrets stay on your machine.** The server never sees them, stores them, or needs them. There's no secrets vault to manage, no credentials to rotate on the server side.
- **The AI agents only get access tokens.** They can read your Gmail or create a Linear issue, but they can't mint new tokens, escalate their own permissions, or access services you haven't explicitly connected.
- **You don't need to trust anyone's redirect URI.** The OAuth callback goes to `localhost:19284` on your own computer. No DNS hijacking, no shared callback endpoints, no hoping that someone else's server is handling your auth codes correctly.

This is the difference between giving someone a house key and letting them in through the front door while you watch. The agents work for you, but the locks are still yours.

### Use cases

**Email triage** &middot; **Research and reports** &middot; **Bulk image processing** &middot; **Scheduled digests** &middot; **Code execution** &middot; **Data pipeline tasks**

### Getting started

#### 1. Deploy the server

```
pnpm install

cd packages/infra
pnpm run deploy
```

This deploys everything to your AWS account: the server, database, admin dashboard, auth, and sandboxes. The deploy outputs your admin URL and server IP.

#### 2. Create your account

1. Open the admin URL from the deploy output
2. Sign up with email and password on the Cognito login page
3. Add yourself to the `admins` group:
   ```
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id <your-pool-id> \
     --username <your-email> \
     --group-name admins
   ```
4. Log in again — you now have full access

#### 3. Connect services

1. Open the **Gremlin Connect** desktop app (`apps/desktop-auth`)
2. Enter your server URL and log in
3. Click a provider, enter your OAuth app credentials, select scopes, and authorize
4. The connection appears in the admin dashboard — your agents can now use it

#### Local development

```
pnpm install
cp .env.example .env
docker compose up -d          # LocalStack (DynamoDB, SQS)
pnpm --filter server db:seed  # seed sample data
pnpm dev                      # server + admin UI
```

> **Note:** AWS credentials are still needed for Bedrock (LLM calls) — LocalStack handles DynamoDB and SQS only.

See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture and conventions.
