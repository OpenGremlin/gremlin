<p align="center">
  <img src="apps/mobile/assets/gremlin_logo_wings.svg" width="200" alt="OpenGremlin" />
</p>

<h1 align="center">OpenGremlin</h1>

<p align="center">
  Safer cloud-native CLI agents. Self-hosted on your AWS account with isolated sandboxes and access controls.
</p>

<p align="center">
  <a href="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml"><img src="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License: MIT" /></a>
</p>


> 🚧 **Work in progress** — OpenGremlin is under active development.Feedback and contributions are welcome!

OpenGremlin deploys to your AWS account. Your keys, your data, your infrastructure. Agents persist across sessions, have long-term memory, and run in isolated EC2 sandboxes.

### Features

- **Self-hosted** — Deploys via CDK to your AWS account. No SaaS, no data leaving your infra.
- **Safe-ish by design** — Least privilege by default. Humans authenticate and authorize. Agents get short-lived access tokens. Sandboxed instances limit the blast radius.
- **Isolated sandboxes** — Each agent gets its own EC2 instance for code execution, file operations, and tool use.
- **Long-term memory** — Agents remember context across conversations.
- **Local credential management** — OAuth flows run on the mobile app. Credentials are stored securely in your cloud. Agents only receive short-lived access tokens.
- **Three core concepts** — **Agents** (personality, memory, and a sandbox), **Connections** (OAuth credentials and API keys — you pick the account, the scopes, and which agents get access), **Skills** (CLI tools an agent can use — a Gmail skill needs a Google connection, a browser skill needs nothing).
- **Async tasks** — Agents delegate work to background workers. Scheduled jobs run on cron.
- **Multi-model** — Claude, GPT, Gemini, Llama, Mistral via Bedrock, or any provider you connect.
- **Mobile app** — React Native / Expo client for iOS, Android, and web. Chat with agents, manage connections, and approve auth on the go.

### How connections work

OAuth flows run on the **mobile app** (`apps/mobile`):

1. Enter your OAuth client ID in the mobile app.
2. The app opens a browser for the consent screen.
3. The browser redirects back to the app.
4. The app exchanges the auth code for tokens locally.
5. Tokens are sent to your server over HTTPS.

Agents only get short-lived access tokens for the current task. They can't mint new tokens or access services you haven't connected.

### Getting started

#### Prerequisites

- **Node.js** (v20+)
- **pnpm 9** — install with `corepack enable && corepack prepare pnpm@9 --activate`
- **Docker** — [install Docker Desktop](https://docs.docker.com/get-docker/)
- **AWS CLI** — [install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS account** with credentials configured (see below)

#### AWS credentials

The installer needs AWS credentials to deploy. Configure them using one of:

```bash
# Option 1: SSO (recommended)
aws configure sso
aws sso login --profile your-profile
export AWS_PROFILE=your-profile

# Option 2: IAM access keys
aws configure
# Enter your Access Key ID, Secret Access Key, and region (us-east-1)
```

Verify your credentials are working:

```bash
aws sts get-caller-identity
```

#### Deploy

```bash
git clone https://github.com/OpenGremlin/gremlin.git
cd gremlin
pnpm install
pnpm gremlin init
```

The installer walks you through AWS setup, creates your admin account, and deploys all infrastructure (server, database, admin dashboard, auth, and sandboxes). At the end it outputs your admin URL.

#### Connect services

1. Open the **mobile app** (`apps/mobile`) on your device or in a browser
2. Enter your server URL and log in
3. Add a provider with your OAuth credentials, select scopes, and authorize
4. The connection appears in the admin dashboard — agents can now use it

#### Local development

```
pnpm install
cp .env.example .env
# Add your LocalStack auth token to .env (get one at https://app.localstack.cloud/settings/auth-tokens)
docker compose up -d          # LocalStack (DynamoDB, SQS)
pnpm --filter server db:seed  # seed sample data
pnpm dev                      # server
pnpm mobile                   # Expo app (Web, iOS, Android)
```

> **Note:** AWS credentials are still needed for Bedrock (LLM calls) — LocalStack handles DynamoDB and SQS only. A free [LocalStack account](https://www.localstack.cloud/pricing) is required for the local DynamoDB/SQS emulator.

See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture and conventions.
