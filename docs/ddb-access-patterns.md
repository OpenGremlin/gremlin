# DynamoDB Access Patterns

Single-table design on `GremlinTable` with two GSIs. Sensitive entities (`IntegrationConnection`, `ModelProviderKey`) use a separate `SecretsTable`.

## Entity Key Patterns

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
| AgentSkill | `AGENT#{agentId}` | `AGENT_SKILL#{skillId}` | — | — | — | — |

\* Stored in `SecretsTable`

## Access Patterns

| Pattern | Index | Key Condition |
|---------|-------|---------------|
| Get agent by ID | Table | `pk = AGENT, sk = AGENT#{id}` |
| List all agents | Table | `pk = AGENT` |
| Get job by ID | Table | `pk = AGENT_JOB, sk = AGENT_JOB#{id}` |
| List all jobs | Table | `pk = AGENT_JOB` |
| Get log by ID | Table | `pk = AGENT_LOG, sk = AGENT_LOG#{id}` |
| Logs by agent (paginated) | GSI1 | `gsi1pk = LOG_AGENT#{agentId}`, sort by `gsi1sk` |
| Logs by task (paginated) | GSI1 | `gsi1pk = LOG_TASK#{taskId}`, sort by `gsi1sk` |
| Dedup cron trigger | Table | `pk = AGENT_JOB#{jobId}, sk = TRIGGER#{ms}` with condition check |
| Inbox items by agent | Table | `pk = AGENT_INBOX#{agentId}`, sort by SK |
| All unread inbox items | GSI2 | `gsi2pk = INBOX_UNREAD` (sparse index) |
| Notifications by status | GSI1 | `gsi1pk = NOTIF_STATUS#{status}`, sort by `gsi1sk` |
| Tasks by agent (paginated) | GSI1 | `gsi1pk = TASK_AGENT#{agentId}`, sort by `gsi1sk` |
| All tasks (paginated) | GSI2 | `gsi2pk = TASK_ALL`, sort by `gsi2sk` |
| Skills assigned to agent | Table | `pk = AGENT#{agentId}`, `sk begins_with AGENT_SKILL#` |
| Get skill/profile/setting | Table | Direct PK+SK lookup |

## Notes

- GSI attributes are written via raw `PutCommand` since dynamodb-toolbox v2 `computeKey()` doesn't support GSI projection.
- InboxItem GSI2 is sparse: entries are removed when marked read; TTL auto-cleanup after 7 days.
- Notification status transitions update GSI1 PK (e.g., `NOTIF_STATUS#Pending` to `NOTIF_STATUS#Resolved`).
- CronJobTrigger uses transactional writes with `attribute_not_exists(pk)` for deduplication.
