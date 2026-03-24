<p align="center">
  <img src="apps/mobile/assets/gremlin_logo_wings.svg" width="200" alt="OpenGremlin" />
</p>

<h1 align="center">OpenGremlin</h1>

<p align="center">
  Safer cloud-native CLI agents. Self-hosted on your AWS account with isolated sandboxes and access controls.
</p>

<p align="center">
  <a href="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml"><img src="https://github.com/OpenGremlin/gremlin/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="License: AGPL-3.0" /></a>
</p>


> 🚧 **Work in progress** — OpenGremlin is under active development and is not yet ready for use. Key features are still being implemented and you should expect breaking changes. Feedback and contributions are welcome!

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
- **AWS CLI** — [install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS account** with credentials configured (see below)

#### AWS credentials

CDK needs AWS credentials to deploy. Configure them using one of:

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

If this is the first time using CDK in your AWS account/region, bootstrap it:

```bash
cd packages/infra
npx cdk bootstrap
```

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

1. Open the **mobile app** (`apps/mobile`) on your device or in a browser
2. Enter your server URL and log in
3. Add a provider with your OAuth credentials, select scopes, and authorize
4. The connection appears in the admin dashboard — agents can now use it

#### Local development

```
pnpm install
cp .env.example .env
docker compose up -d          # LocalStack (DynamoDB, SQS)
pnpm --filter server db:seed  # seed sample data
pnpm dev                      # server
pnpm mobile                   # Expo app (Web, iOS, Android)
```

> **Note:** AWS credentials are still needed for Bedrock (LLM calls) — LocalStack handles DynamoDB and SQS only.

See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture and conventions.
