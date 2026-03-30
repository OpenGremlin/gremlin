# Webhooks

Event-driven system that lets agent tasks react to external events (email replies, calendar updates, etc.) delivered via webhook.

## Motivation

Agents need to react to external events without polling. A car negotiation task should wake up when a dealer replies, not check every 5 minutes. The webhook system connects external event sources (Gmail, Slack, etc.) to the existing inbox architecture.

## Architecture

External services push enriched events to Gremlin through an AWS-native ingest pipeline. The Gremlin server routes events to the owning task via a claim table, or to the agent if unclaimed.

```
 External Source (GCP)                    AWS Ingest                     Gremlin Server
 ─────────────────────                    ──────────                     ──────────────

 Gmail Pub/Sub notification
       ↓
 Cloud Function
   (calls history.list,             API Gateway (HTTP API, IAM auth)
    enriches with threadId,    →      ↓ (SigV4 signed via WIF)
    messageId, labels)              SQS queue (webhook-ingest)
                                           ↓
                                    Server polls SQS
                                    → look up entity claim
                                    → claimed: enqueueWork() to task
                                    → unclaimed: enqueueWork() to agent
                                    → agent/task wakes up
```

### Why this shape

- **GCP side enriches** — Gmail Pub/Sub notifications are minimal (`emailAddress` + `historyId` only). A Cloud Function calls `history.list` to hydrate events with threadId, messageId, and labels before pushing to Gremlin. This keeps Gremlin source-agnostic with no Gmail API credentials needed.
- **API Gateway → SQS** — native AWS integration, no compute on ingest. Absorbs bursts without touching the server.
- **IAM auth via WIF** — GCP Cloud Function assumes an AWS IAM role using Workload Identity Federation. API Gateway validates SigV4 signatures natively. No Lambda authorizer, no secrets, full CloudTrail audit trail.
- **Server polls SQS** — a dedicated polling loop for the `webhook-ingest` queue, separate from the existing doorbell poller. Same long-polling pattern (`WaitTimeSeconds: 20`), batch size of 10. Runs alongside the doorbell poller in the same server process.

## Event Format

What arrives from external sources after enrichment:

```json
{
  "topic": "gmail",
  "account": "me@example.com",
  "entityId": "thread456",
  "events": [
    {
      "type": "messageAdded",
      "messageId": "msg123",
      "threadId": "thread456",
      "labelIds": ["INBOX", "UNREAD"]
    }
  ]
}
```

The enrichment layer (Cloud Function, Slack handler, etc.) is responsible for setting `entityId` from the source-specific payload — `threadId` for Gmail, channel ID for Slack, etc. Gremlin uses `topic` + `entityId` for claim lookup and passes the full `events` array through to the task without interpreting it.

## Routing Model: Account Bindings + Entity Claims

Inspired by Kafka's partition ownership model. Instead of a subscription system with filters and matching, routing uses two simple primitives:

### Account bindings (static config)

Maps an external account to an agent. This is the only configuration needed.

```
gmail:me@example.com → agent:car-buyer
```

When an event arrives for `me@example.com`, the system knows which agent owns that account. Set up once when connecting the integration.

### Entity claims (dynamic, managed by tasks)

A task claims ownership of specific entities. The entity key depends on the topic — for Gmail it's a thread ID, for Slack it could be a channel ID, for GitHub an issue number. Claims are created naturally during task execution.

```
CLAIM#gmail#thread456     → { agentId: "car-buyer", taskId: "xyz" }
CLAIM#slack#C04ABCDEF     → { agentId: "support",   taskId: "abc" }
CLAIM#github#issue/42     → { agentId: "maintainer", taskId: "def" }
```

Claims are just rows in DynamoDB. A single `GetItem` resolves routing — no queries, no filter matching, no glob patterns. The system doesn't know or care what the entity key represents; it's opaque.

Claims use a conditional write (`attribute_not_exists(pk)`) to prevent one task from silently overwriting another's claim. If a task tries to claim an entity already owned by another task, the write fails and the tool returns an error explaining who owns it.

### Routing flow

For each event in the webhook payload:

1. Look up `CLAIM#<topic>#<entityId>` — single `GetItem`
2. **Claimed** → `enqueueWork()` to `task:<taskId>` lane. Task wakes up with full context.
3. **Unclaimed** → look up account binding → `enqueueWork()` to agent's `main` lane. Agent decides what to do (typically spawns a new task, which claims the entity).

### Why entity-level partitioning

The partition key should be the natural ownership boundary for the topic. For Gmail, that's thread ID — the same person can have multiple conversations (warranty issue vs sales inquiry), and those should be separate tasks. For Slack, it might be a channel or thread. One task can claim multiple entities, but each entity has exactly one owner.

### Example: car negotiation

```
Account binding:
  gmail:me@example.com → agent:car-buyer

Agent receives task: "negotiate price on a 2024 Civic under $25k"
```

The task emails 5 dealerships. Each sent email creates a thread. The task claims all 5:

```
CLAIM#gmail#aaa → { agentId: "car-buyer", taskId: "xyz" }  ← Honda
CLAIM#gmail#bbb → { agentId: "car-buyer", taskId: "xyz" }  ← Toyota
CLAIM#gmail#ccc → { agentId: "car-buyer", taskId: "xyz" }  ← Ford
CLAIM#gmail#ddd → { agentId: "car-buyer", taskId: "xyz" }  ← Chevy
CLAIM#gmail#eee → { agentId: "car-buyer", taskId: "xyz" }  ← Mazda
```

Honda replies → `GetItem` on `CLAIM#gmail#aaa` → claimed by task `xyz` → deliver to `task:xyz` lane. Task has full negotiation context, knows all offers, responds accordingly.

New email from unknown sender → no claim exists → deliver to agent's main lane → agent spawns a new task → task claims the thread.

When the task completes (bought the car), it deletes its 5 claim rows. Future emails to those threads go to the agent's main lane.

### Generalizing beyond email

The claim model works for any event source with an entity key:

| Topic | Entity key | Example |
|-------|-----------|---------|
| `gmail` | Thread ID | Email conversation |
| `slack` | Channel or thread TS | Slack conversation |
| `github` | `repo/issue/42` | Issue or PR |
| `calendar` | Event ID | Calendar event |

The system is topic-agnostic. The enrichment layer (GCP Cloud Function, Slack event handler, GitHub webhook) is responsible for extracting the entity key from the source-specific payload. Gremlin just sees `topic` + `entityId` and does a claim lookup.

### Why this is simpler than subscriptions

The earlier design used a subscription model with topic filters, glob matching, and precedence rules. The claim model eliminates all of that:

| Subscription model | Claim model |
|---|---|
| Query all subscriptions for topic | Single `GetItem` by entity ID |
| AND filter matching + glob patterns | No matching logic |
| Precedence rules for task vs catch-all | Claimed → task, unclaimed → agent |
| Subscription CRUD (create, update, delete, list) | Claim/release (put, delete) |
| `WebhookSubscription` entity with filters, enabled flag | Single claim row |

The ownership question that plagued the subscription model ("what if both a task and catch-all match?") doesn't exist. An entity is either claimed or it isn't.

## DynamoDB Model

### EntityClaim

| Key | Value | Description |
|-----|-------|-------------|
| pk | `CLAIM#<topic>#<entityId>` | Direct lookup by entity |
| sk | `CLAIM` | Fixed sort key |
| gsi1pk | `TASK#<taskId>` | List all claims for a task (cleanup) |
| gsi1sk | `CLAIM#<topic>#<entityId>` | |

Fields: `agentId`, `taskId`, `topic`, `entityId`, `createdAt`.

**Primary access pattern:** `GetItem` on webhook event arrival. O(1), no queries.

**Secondary access pattern:** query GSI1 `gsi1pk = TASK#<taskId>` to list/delete all claims when a task completes.

### AccountBinding

| Key | Value | Description |
|-----|-------|-------------|
| pk | `ACCOUNT_BINDING#<topic>#<account>` | Direct lookup by account |
| sk | `BINDING` | Fixed sort key |
| gsi1pk | `AGENT#<agentId>` | List bindings for an agent |
| gsi1sk | `ACCOUNT_BINDING#<topic>#<account>` | |

Fields: `agentId`, `topic`, `account`, `createdAt`.

**Access pattern:** `GetItem` when a thread is unclaimed — look up which agent owns the account. GSI1 for admin UI listing.

### WebhookEvent (idempotency)

| Key | Value |
|-----|-------|
| pk | `WEBHOOK_EVENT#<messageId>` | Spread across partitions to avoid hot key |
| sk | `EVENT` |

Fields: `messageId`, `topic`, `processedAt`, `ttl` (DynamoDB TTL, 24-48 hours).

Prevents duplicate processing from at-least-once delivery. Before processing, `GetItem` on the message ID — if it exists, delete the SQS message and skip. Otherwise, write the event record and proceed.

## Security: Workload Identity Federation

The webhook endpoint must only accept requests from trusted GCP workloads. No shared secrets, no long-lived API keys.

### GCP → AWS IAM via WIF

The GCP Cloud Function assumes an AWS IAM role via Workload Identity Federation, then calls API Gateway with IAM auth (SigV4). AWS handles all verification natively.

```
GCP Cloud Function
  → gets GCP OIDC token (automatic, from metadata server)
  → calls AWS STS AssumeRoleWithWebIdentity
    (passes OIDC token, gets temporary AWS credentials)
  → calls API Gateway with SigV4 auth
  → API Gateway IAM authorizer validates credentials
  → request reaches SQS
```

**AWS setup (CDK):**

1. **IAM OIDC Identity Provider** — trust Google's issuer:
   ```
   Issuer: https://accounts.google.com
   Audience: <GCP service account unique ID>
   ```

2. **IAM Role** — assumable only by the specific GCP service account:
   ```
   Trust policy:
     Principal: { Federated: arn:aws:iam::<account>:oidc-provider/accounts.google.com }
     Condition:
       StringEquals:
         accounts.google.com:sub: <GCP service account unique ID>
         accounts.google.com:aud: <GCP service account unique ID>
     Action: sts:AssumeRoleWithWebIdentity

   Permissions:
     execute-api:Invoke on the webhook API Gateway
   ```

3. **API Gateway** — IAM authorization on the webhook route. Only callers with valid AWS credentials (from the federated role) can invoke it.

**GCP setup:**

The Cloud Function uses its default service account identity. Google's metadata server provides OIDC tokens automatically. The function exchanges the token for AWS credentials via STS, then signs the request.

```typescript
// In GCP Cloud Function
import { STSClient, AssumeRoleWithWebIdentityCommand } from "@aws-sdk/client-sts";

const gcpToken = await getGcpIdToken(targetAudience);
const sts = new STSClient({ region: "us-east-1" });
const { Credentials } = await sts.send(new AssumeRoleWithWebIdentityCommand({
  RoleArn: "arn:aws:iam::<account>:role/gremlin-webhook-pusher",
  WebIdentityToken: gcpToken,
  RoleSessionName: "gcp-webhook",
}));
// Use Credentials to sign API Gateway request with SigV4
```

**Why this is better:**
- No secrets to manage or rotate — identity is cryptographic
- AWS IAM policies control who can invoke what — standard AWS authorization
- The Lambda authorizer is eliminated — API Gateway IAM auth is built-in, faster, cheaper
- Audit trail in CloudTrail — every webhook call is logged with the federated identity
- Principle of least privilege — the GCP role can only invoke the webhook endpoint, nothing else

### Why not OIDC verification in a Lambda authorizer?

A simpler alternative is having the GCP function send its OIDC token directly and verifying it in a Lambda authorizer against Google's JWKS. This works but requires custom verification code, JWKS caching, a Lambda to maintain, and produces no CloudTrail audit trail. The WIF approach is more work up front but is the standard cross-cloud authentication pattern — no secrets, native IAM, full auditability.

## Inbox Integration

New `InboxItemType`: `"webhook_event"`.

Delivery follows the existing pattern:

```typescript
// Claimed entity — deliver to task
await enqueueWork(ctx, claim.agentId, `task:${claim.taskId}`, {
  type: "webhook_event",
  payload: { topic, entityId, events },
});

// Unclaimed entity — deliver to agent main lane
await enqueueWork(ctx, binding.agentId, "main", {
  type: "webhook_event",
  payload: { topic, entityId, events },
});
```

The consumer handles `webhook_event` items the same way as other inbox items — writes context to the conversation, runs inference.

## Agent Tools

Tasks manage claims through tools:

- `claimEntity({ topic, entityId })` — claim an entity for the current task
- `releaseEntity({ topic, entityId })` — release a claim
- `releaseAllClaims()` — release all claims for the current task (cleanup on completion, queries GSI1)

These are used naturally during task execution. The negotiation task sends an email, gets a threadId back, and claims it. A GitHub task opens an issue and claims it. Same workflow a human would follow.

## GraphQL API

Minimal — account bindings are the main admin-facing config:

```graphql
type AccountBinding {
  agentId: ID!
  topic: String!
  account: String!
  createdAt: String!
}

type EntityClaim {
  agentId: ID!
  taskId: ID!
  topic: String!
  entityId: String!
  createdAt: String!
}

extend type Query {
  accountBindings(agentId: ID): [AccountBinding!]!
  entityClaims(agentId: ID, taskId: ID): [EntityClaim!]!
}

extend type Mutation {
  createAccountBinding(agentId: ID!, topic: String!, account: String!): AccountBinding!
  deleteAccountBinding(topic: String!, account: String!): Boolean!
}
```

Entity claims are managed by agent tools, not the admin UI. The GraphQL API exposes them read-only for visibility.

## Connections vs Event Sources

These are separate concepts that build on each other:

| | Connections (existing) | Event Sources (new) |
|---|---|---|
| Direction | Agent → Service | Service → Agent |
| What it gives you | OAuth credentials to call APIs | Event pipeline that wakes up agents |
| Setup | OAuth consent flow in Gremlin UI | Connection + infrastructure deployment + account binding |
| Runtime | Agent calls API with access token | Events pushed to agent via webhook pipeline |
| Example | Agent reads email via Gmail API | Agent wakes up when new email arrives |

An event source depends on a connection (needs the OAuth token for `users.watch` and enrichment). You can have a connection without an event source (agent calls APIs on demand), but not an event source without a connection.

## Infrastructure

Two pieces deployed separately: AWS (via CDK, alongside existing infra) and source-specific adapters (user deploys into their own cloud).

### AWS side (CDK)

Additions to existing CDK stacks in `packages/infra`:

- SQS queue (`webhook-ingest`) + DLQ
- API Gateway HTTP API with IAM authorization + SQS integration
- IAM OIDC Identity Provider for `accounts.google.com`
- IAM Role for GCP workload (trust policy scoped to specific GCP service account, permissions scoped to `execute-api:Invoke`)
- IAM role for API Gateway → SQS

Deployed with the existing `pnpm run deploy` in `packages/infra`.

### Source adapters (user-deployed)

Each event source that requires external infrastructure gets a self-contained deployment module. Gmail requires GCP; other sources (Slack, GitHub) POST directly to the API Gateway and need no adapter.

```
Ingest paths:

Gmail → GCP Cloud Function → API Gateway → SQS    (adapter required)
Slack/GitHub/etc → API Gateway → SQS               (direct, no adapter)
```

Both paths land in the same SQS queue, same claim lookup, same routing.

## Gmail Adapter

### Overview

A Terraform module at `packages/integrations/gmail/` that the user deploys into their own GCP project. Keeps the self-hosted model — Gremlin doesn't touch their cloud, but makes it easy.

### What it creates

- Pub/Sub topic + push subscription (pushes to the user's Gremlin API Gateway endpoint)
- Cloud Function (enrichment — receives notification, calls `history.list`, pushes enriched event)
- Service account with minimal permissions (`gmail.readonly` for history, `pubsub.subscriber`)
- WIF setup (allows the Cloud Function's service account to assume the AWS IAM role for SigV4-signed calls)

### User inputs (3 variables)

```hcl
variable "gcp_project_id" {}           # Their GCP project
variable "gremlin_webhook_url" {}       # Their API Gateway endpoint (from CDK output)
variable "aws_webhook_role_arn" {}      # IAM role ARN for WIF (from CDK output)
```

### Outputs

```hcl
output "service_account_email" {}       # Plug into Gremlin connection settings
output "pubsub_topic_name" {}           # Used by users.watch
```

### Setup flow

```
1. cd packages/infra && pnpm run deploy
   → outputs: webhook API Gateway URL, IAM role ARN

2. cd packages/integrations/gmail && terraform apply
   → inputs: GCP project ID, webhook URL, role ARN
   → outputs: service account email, topic name

3. Connect Google in Gremlin UI (OAuth — existing flow)

4. Enable event source: Gremlin calls users.watch(topicName) with stored OAuth token

5. Bind account to agent in UI (creates AccountBinding row)
```

Steps 1-2 are one-time infrastructure. Steps 3-5 are per-account.

### Cloud Function code

Lives in `packages/integrations/gmail/function/` alongside the Terraform. Updates ship with repo updates — user re-deploys after pulling.

The function:

1. Receives Gmail Pub/Sub notification (`{ emailAddress, historyId }`)
2. Looks up stored OAuth token for the account (from a GCP Secret Manager secret, synced from Gremlin's connection)
3. Calls `history.list(historyId)` → gets `{ messageId, threadId, labelIds }` per change
4. Sets `entityId` from `threadId`
5. Assumes AWS IAM role via WIF (STS `AssumeRoleWithWebIdentity`)
6. Pushes enriched event to Gremlin API Gateway with SigV4 auth

### Personal accounts

Gmail Pub/Sub watch (`users.watch`) works for personal Gmail accounts, not just Workspace. Requirements:

- OAuth consent screen in the GCP project (external user type)
- User grants `gmail.readonly` scope (or `gmail.modify` if the agent sends replies)
- Google requires OAuth app verification for sensitive scopes — until verified, limited to 100 test users

### Watch expiry and renewal

`users.watch` expires after **7 days**. Notifications stop silently if not renewed. A scheduled job (existing EventBridge cron) must call `users.watch` again for every connected Gmail account before expiry.

```
Cron: every 6 days
  → for each connected Gmail account with an active event source:
    → call users.watch(userId, topicName) with stored OAuth token
    → update stored expiration timestamp
```

If renewal fails (revoked token, etc.), mark the event source as unhealthy and notify the user.

## Error Handling

- **Duplicate delivery** — idempotency table keyed on `messageId` with TTL. Duplicates are detected via `GetItem`, the SQS message is deleted, and processing is skipped.
- **No claim and no binding** — delete SQS message, log warning. The event is for an account nobody owns.
- **Ordering** — not guaranteed by Pub/Sub. Each event is independent. Tasks should check state rather than rely on event order.
- **Claim cleanup** — tasks release claims on completion via `releaseAllClaims()` (GSI1 query on `TASK#<taskId>`). Consider a TTL or periodic sweep for orphaned claims (task crashed without cleanup).
- **Stale claims** — if a task is no longer active but still has claims, the agent will never see those entities. The sweep job should release claims for completed/failed tasks.

## Prior Art

### Event routing

Research into how other platforms handle multi-subscriber event routing:

- **AutoGen** (Microsoft) — native topic-based pub/sub with `TopicId(type, source)` and `TypeSubscription`. Fan-out to all subscribers is built in. Subscriptions are in-memory only — don't survive restarts.
- **Temporal** — Signals send messages to running workflows by ID. No built-in subscription matching — you build a coordinator. Durable execution is a strength.
- **LangGraph** — `interrupt()` pauses execution, external system resumes by `thread_id`. No routing layer.
- **CrewAI** — `@listen()` decorator for intra-flow event wiring. Designed for pipeline orchestration, not external events.
- **OpenClaw** — Gateway + bindings model. 1:1 routing (one channel message → one agent).
- **n8n** — each workflow has its own webhook URL. Fan-out via parent workflow spawning sub-workflows.

No platform provides a complete out-of-the-box solution for durable, filtered, multi-subscriber webhook routing.

### Event ownership

When multiple subscribers could handle the same event, how do systems decide who owns the response?

- **Temporal Entity Workflow** — route to a single workflow keyed by entity ID. Atomic uniqueness enforced.
- **Orleans Virtual Actor** — at most one grain activation per ID in the cluster. Single-owner semantics at the infrastructure level.
- **Kafka Consumer Groups** — partition assignment is the ownership mechanism. Key by entity ID, all events for that entity hit one consumer. **This inspired our claim model** — the entity ID is the partition key, and exactly one task owns each entity.
- **DynamoDB Conditional Write** — competing consumers each attempt `PutItem` with `attribute_not_exists(pk)`. One wins.
- **Zendesk / Front / Freshdesk** — ownership primitive is **assignment**. A ticket has one assignee. Assignment happens before work begins.
- **OpenAI Agents SDK** — triage-then-handoff. Single triage agent decides which specialist handles it.

The overarching principle: **ownership is determined at write time, not at processing time.** The claim model enforces this — a thread is claimed by a task at send time, and all future events for that thread route to that task with a single `GetItem`.
