# Design Brief: DynamoDB + Services Architecture

## Overview

The Gremlin server uses a three-layer architecture for data access and business logic:

1. **Resources** — DynamoDB table and entity definitions via DynamoDB Toolbox
2. **Services** — Domain-organized business logic functions
3. **Resolvers** — Thin GraphQL wrappers that delegate to services

## Key Decisions

- **Single-table design**: One DynamoDB table (`gremlin`) with PK/SK patterns per entity; sensitive entities use a separate `SecretsTable`
- **Normalized references**: Entities store IDs (e.g., `agentId`), service layer fetches related entities
- **Avatars stay static**: No DDB entity — avatar list is a compile-time constant

## Table Schema

Table name: `gremlin`

| Key | Type | Description |
|-----|------|-------------|
| `pk` | String | Partition key |
| `sk` | String | Sort key |
| `gsi1pk` | String | GSI1 partition key |
| `gsi1sk` | String | GSI1 sort key |
| `gsi2pk` | String | GSI2 partition key |
| `gsi2sk` | String | GSI2 sort key |

### Entity Key Patterns

| Entity | PK | SK | GSI1 PK | GSI1 SK | GSI2 PK | GSI2 SK |
|--------|----|----|---------|---------|---------|---------|
| Agent | `AGENT` | `AGENT#{id}` | — | — | — | — |
| AgentJob | `AGENT_JOB` | `AGENT_JOB#{id}` | — | — | — | — |
| AgentLog | `AGENT_LOG` | `AGENT_LOG#{id}` | `LOG_AGENT#{agentId}` or `LOG_TASK#{taskId}` | `{createdAt}#{id}` | — | — |
| CronJobTrigger | `AGENT_JOB#{jobId}` | `TRIGGER#{triggerTimeMs}` | — | — | — | — |
| InboxItem | `AGENT_INBOX#{agentId}` | `ITEM#{createdAt}#{id}` | — | — | `INBOX_UNREAD` | `{agentId}#{createdAt}#{id}` |
| IntegrationConnection* | `INTEGRATION_CONNECTION` | `INTEGRATION_CONNECTION#{id}` | — | — | — | — |
| ModelProviderKey* | `MODEL_PROVIDER_KEY` | `MODEL_PROVIDER_KEY#{providerId}` | — | — | — | — |
| Notification | `NOTIFICATION` | `NOTIFICATION#{id}` | `NOTIF_STATUS#{status}` | `{createdAt}` | — | — |
| Profile | `PROFILE` | `PROFILE#{name}` | — | — | — | — |
| Setting | `SETTING` | `SETTING#{key}` | — | — | — | — |
| Skill | `SKILL` | `SKILL#{id}` | — | — | — | — |
| Task | `TASK` | `TASK#{id}` | `TASK_AGENT#{agentId}` | `{createdAt}` | `TASK_ALL` | `{createdAt}#{id}` |

\* Stored in `SecretsTable`

## Directory Structure

```
packages/lib/src/
├── resources/
│   ├── index.ts              # Resources interface + createResources()
│   └── ddb/
│       ├── index.ts          # Exports table + all entities
│       ├── table.ts          # DynamoDB table definition
│       └── schema/
│           ├── agent.ts
│           ├── agentJob.ts
│           ├── agentLog.ts
│           ├── cronJobTrigger.ts
│           ├── inboxItem.ts
│           ├── integrationConnection.ts
│           ├── modelProviderKey.ts
│           ├── notification.ts
│           ├── profile.ts
│           ├── setting.ts
│           ├── skill.ts
│           └── task.ts
├── services/
│   ├── index.ts              # Services interface + createServices()
│   ├── context.ts            # ServiceContext type
│   ├── agents/
│   ├── agentLogs/
│   ├── inbox/
│   ├── integrations/
│   ├── jobs/
│   ├── media/
│   ├── memory/
│   ├── modelProviders/
│   ├── notifications/
│   ├── oauth/
│   ├── orchestrator/
│   ├── profile/
│   ├── prompts/
│   ├── sandbox/
│   ├── skills/
│   ├── tasks/
│   ├── tools/
│   └── workspace/
└── gql/
    ├── context.ts            # GremlinContext (replaces old Context)
    └── schema/
        └── */resolvers.ts    # Thin wrappers calling services
```

## Context Flow

```
Server startup
  ├── createResources() → { ddb }
  ├── createServices()  → { agents, jobs, inbox, ... }
  └── Yoga context factory
        └── Per request: { user, mediaCdnUrl, resources, services }
```

### GremlinContext

```ts
interface GremlinContext {
  user?: AuthUser;
  mediaCdnUrl: string;
  resources: Resources;
  services: Services;
}
```

### ServiceContext

```ts
interface ServiceContext {
  resources: Resources;
  services: Services;
  user?: AuthUser;
  mediaCdnUrl: string;
}
```

`GremlinContext` satisfies `ServiceContext`, so resolvers pass `ctx` directly to service functions.

## Resolver Pattern

Resolvers contain no business logic. They extract args and delegate:

```ts
const agents: QueryResolvers["agents"] = (_parent, _args, ctx) =>
  ctx.services.agents.getAgents(ctx);
```

Field resolvers for cross-entity references (e.g., `Task.agent`) call the agent service:

```ts
const agent: TaskResolvers["agent"] = async (parent, _args, ctx) => {
  const a = await ctx.services.agents.getAgent(ctx, parent.agentId);
  if (!a) throw new Error(`Agent ${parent.agentId} not found`);
  return a;
};
```

## Codegen Mappers

GraphQL codegen uses DDB entity types as mappers so resolver parent types match what DDB returns:

```ts
mappers: {
  Agent: "../resources/ddb/schema/agent.js#AgentItem",
  AgentJob: "../resources/ddb/schema/agentJob.js#AgentJobItem",
  AgentLog: "../resources/ddb/schema/agentLog.js#AgentLogItem",
  InboxItem: "../resources/ddb/schema/inboxItem.js#InboxItemItem",
  IntegrationConnection: "../resources/ddb/schema/integrationConnection.js#IntegrationConnectionItem",
  ModelProviderKey: "../resources/ddb/schema/modelProviderKey.js#ModelProviderKeyItem",
  Notification: "../resources/ddb/schema/notification.js#NotificationItem",
  Profile: "../resources/ddb/schema/profile.js#ProfileItem",
  Setting: "../resources/ddb/schema/setting.js#SettingItem",
  Skill: "../resources/ddb/schema/skill.js#SkillItem",
  Task: "../resources/ddb/schema/task.js#TaskItem",
  Avatar: "./schema/Avatar/resolvers.js#AvatarModel",  // static, no DDB
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_REGION` | Yes | AWS region for DynamoDB client |
| `MAIN_TABLE_NAME` | No | Table name (default: `gremlin`) |
