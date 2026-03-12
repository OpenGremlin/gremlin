import { AgentEntity } from "./schema/agent.js";
import { AgentJobEntity } from "./schema/agentJob.js";
import { AgentLogEntity } from "./schema/agentLog.js";
import { AgentSkillEntity } from "./schema/agentSkill.js";
import { CronJobTriggerEntity } from "./schema/cronJobTrigger.js";
import { InboxItemEntity } from "./schema/inboxItem.js";
import { IntegrationConnectionEntity } from "./schema/integrationConnection.js";
import { ModelProviderKeyEntity } from "./schema/modelProviderKey.js";
import { NotificationEntity } from "./schema/notification.js";
import { ProfileEntity } from "./schema/profile.js";
import { SettingEntity } from "./schema/setting.js";
import { SkillEntity } from "./schema/skill.js";
import { TaskEntity } from "./schema/task.js";
import { SecretsTable } from "./secretsTable.js";
import { GremlinTable } from "./table.js";

export const ddb = {
  table: GremlinTable,
  secretsTable: SecretsTable,
  entities: {
    CronJobTrigger: CronJobTriggerEntity,
    InboxItem: InboxItemEntity,
    IntegrationConnection: IntegrationConnectionEntity,
    ModelProviderKey: ModelProviderKeyEntity,
    Agent: AgentEntity,
    AgentJob: AgentJobEntity,
    AgentLog: AgentLogEntity,
    AgentSkill: AgentSkillEntity,

    Notification: NotificationEntity,
    Profile: ProfileEntity,
    Setting: SettingEntity,
    Skill: SkillEntity,
    Task: TaskEntity,
  },
} as const;

export type DDBResource = typeof ddb;
