<p align="center">
  <img src="branding/gremlin_logo.svg" width="200" alt="OpenGremlin" />
</p>

<h1 align="center">OpenGremlin</h1>

<p align="center">
  Self-hosted AI agents with long-term memory, isolated sandboxes, and CLI tool use. Runs on AWS.
</p>

<p align="center">
  <a href="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml"><img src="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" /></a>
</p>


> 🚧 **Work in progress** — OpenGremlin is under active development and is not yet ready for use. Key features are still being implemented and you should expect breaking changes. Feedback and contributions are welcome!

OpenGremlin deploys to your AWS account. Your keys, your data, your infrastructure. Agents persist across sessions, have long-term memory, and run in isolated EC2 sandboxes.

### Features

- **Self-hosted** — Deploys via CDK to your AWS account. No SaaS, no data leaving your infra.
- **Isolated sandboxes** — Each agent gets its own EC2 instance for code execution, file operations, and tool use.
- **Long-term memory** — Agents remember context across conversations.
- **Local credential management** — OAuth flows run on your client. Credentials are stored securely in your cloud. Agents only receive short-lived access tokens.
- **Three core concepts** — **Agents** (personality + memory), **Connections** (service auth), **Skills** (capabilities via CLI).
- **Async tasks** — Agents delegate work to background workers. Scheduled jobs run on cron.
- **Multi-model** — Claude, GPT, Llama, Mistral via Bedrock, or any provider you connect.

### How connections work

> 🚧 **Migrating to mobile client** — Auth flow is moving to mobile client, Gremlin Connect will be removed.

**Gremlin Connect** is a desktop app (Electron) that handles OAuth on your machine:

1. You enter your OAuth app credentials (client ID and secret) in Gremlin Connect.
2. The app opens your browser for the consent screen.
3. Your browser redirects back to `localhost`.
4. Gremlin Connect exchanges the auth code for tokens locally.
5. Tokens are sent to your server over HTTPS.

Agents only get short-lived access tokens for the current task. They can't mint new tokens or access services you haven't connected.

### Getting started

#### 1. Deploy the server

```
pnpm install

cd packages/infra
pnpm run deploy
```

This deploys the server, database, admin dashboard, auth, and sandboxes. The deploy outputs your admin URL and server IP.

#### 2. Create your account

1. Open the admin URL from the deploy output
2. Sign up on the Cognito login page
3. Add yourself to the `admins` group:
   ```
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id <your-pool-id> \
     --username <your-email> \
     --group-name admins
   ```
4. Log in again

#### 3. Connect services

1. Open the **Gremlin Connect** desktop app (`apps/desktop-auth`)
2. Enter your server URL and log in
3. Add a provider with your OAuth credentials, select scopes, and authorize
4. The connection appears in the admin dashboard — agents can now use it

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
