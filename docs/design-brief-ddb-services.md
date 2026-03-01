# Design Brief: DynamoDB + Services Architecture

## Overview

The Gremlin server uses a three-layer architecture for data access and business logic:

1. **Resources** — DynamoDB table and entity definitions via DynamoDB Toolbox
2. **Services** — Domain-organized business logic functions
3. **Resolvers** — Thin GraphQL wrappers that delegate to services

## Key Decisions

- **Single-table design**: One DynamoDB table (`gremlin`) with PK/SK patterns per entity
- **Normalized references**: Entities store IDs (e.g., `agentId`), service layer fetches related entities
- **Avatars stay static**: No DDB entity — avatar list is a compile-time constant
- **No seed script**: Data is seeded manually in cloud DDB; local dev connects to cloud

## Table Schema

Table name: `gremlin`

| Key | Type | Description |
|-----|------|-------------|
| `pk` | String | Partition key |
| `sk` | String | Sort key |
| `gsi1pk` | String | GSI1 partition key |
| `gsi1sk` | String | GSI1 sort key |

### Entity Key Patterns

| Entity | PK | SK | GSI1PK | GSI1SK |
|--------|----|----|--------|--------|
| Agent | `AGENT` | `AGENT#<id>` | — | — |
| AgentJob | `AGENT_JOB` | `AGENT_JOB#<id>` | — | — |
| FeedItem | `FEED_ITEM` | `FEED_ITEM#<id>` | `FEED_AGENT#<agentId>` | `<completedAt>` |
| Integration | `INTEGRATION` | `INTEGRATION#<id>` | — | — |
| Notification | `NOTIFICATION` | `NOTIFICATION#<id>` | `NOTIF_STATUS#<status>` | `<createdAt>` |
| Profile | `PROFILE` | `PROFILE#<name>` | — | — |
| Skill | `SKILL` | `SKILL#<id>` | — | — |

## Directory Structure

```
apps/server/src/
├── resources/
│   ├── index.ts              # Resources interface + createResources()
│   └── ddb/
│       ├── index.ts          # Exports table + all entities
│       ├── table.ts          # DynamoDB table definition
│       └── schema/
│           ├── agent.ts
│           ├── agentJob.ts
│           ├── feedItem.ts
│           ├── integration.ts
│           ├── notification.ts
│           ├── profile.ts
│           └── skill.ts
├── services/
│   ├── index.ts              # Services interface + createServices()
│   ├── context.ts            # ServiceContext type
│   ├── agents/
│   │   ├── index.ts
│   │   ├── getAgents.ts
│   │   ├── getAgent.ts
│   │   └── updateAgentStatus.ts
│   ├── jobs/index.ts
│   ├── feed/index.ts
│   ├── integrations/index.ts
│   ├── notifications/index.ts
│   ├── profile/index.ts
│   ├── skills/index.ts
│   └── media/index.ts
└── gql/
    ├── context.ts            # GremlinContext (replaces old Context)
    └── schema/
        └── */resolvers.ts    # Thin wrappers calling services
```

## Context Flow

```
Server startup
  ├── createResources() → { ddb }
  ├── createServices()  → { agents, jobs, feed, ... }
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

Field resolvers for cross-entity references (e.g., `FeedItem.agent`) call the agent service:

```ts
const agent: FeedItemResolvers["agent"] = async (parent, _args, ctx) => {
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
  FeedItem: "../resources/ddb/schema/feedItem.js#FeedItemItem",
  Integration: "../resources/ddb/schema/integration.js#IntegrationItem",
  Notification: "../resources/ddb/schema/notification.js#NotificationItem",
  Profile: "../resources/ddb/schema/profile.js#ProfileItem",
  Skill: "../resources/ddb/schema/skill.js#SkillItem",
  Avatar: "./schema/Avatar/resolvers.js#AvatarModel",  // static, no DDB
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_REGION` | Yes | AWS region for DynamoDB client |
| `DYNAMODB_TABLE_NAME` | No | Table name (default: `gremlin`) |
