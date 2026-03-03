import { GremlinTable } from "./table.js";
import { SecretsTable } from "./secretsTable.js";
import { AgentEntity } from "./schema/agent.js";
import { AgentJobEntity } from "./schema/agentJob.js";
import { AgentLogEntity } from "./schema/agentLog.js";
import { CronJobTriggerEntity } from "./schema/cronJobTrigger.js";
import { IntegrationConnectionEntity } from "./schema/integrationConnection.js";
import { ModelProviderKeyEntity } from "./schema/modelProviderKey.js";
import { NotificationEntity } from "./schema/notification.js";
import { ProfileEntity } from "./schema/profile.js";
import { SettingEntity } from "./schema/setting.js";
import { SkillEntity } from "./schema/skill.js";
import { TaskEntity } from "./schema/task.js";
import { DocumentEntity } from "./schema/document.js";
import { MemoryTopicEntity } from "./schema/memoryTopic.js";
import { TaskFollowUpEntity } from "./schema/taskFollowUp.js";

export const ddb = {
  table: GremlinTable,
  secretsTable: SecretsTable,
  entities: {
    CronJobTrigger: CronJobTriggerEntity,
    Document: DocumentEntity,
    IntegrationConnection: IntegrationConnectionEntity,
    ModelProviderKey: ModelProviderKeyEntity,
    Agent: AgentEntity,
    AgentJob: AgentJobEntity,
    AgentLog: AgentLogEntity,
    MemoryTopic: MemoryTopicEntity,
    Notification: NotificationEntity,
    Profile: ProfileEntity,
    Setting: SettingEntity,
    Skill: SkillEntity,
    Task: TaskEntity,
    TaskFollowUp: TaskFollowUpEntity,
  },
} as const;

export type DDBResource = typeof ddb;
