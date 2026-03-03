import { GremlinTable } from "./table.js";
import { AgentEntity } from "./schema/agent.js";
import { AgentJobEntity } from "./schema/agentJob.js";
import { AgentLogEntity } from "./schema/agentLog.js";
import { CronJobTriggerEntity } from "./schema/cronJobTrigger.js";
import { NotificationEntity } from "./schema/notification.js";
import { OAuthTokenEntity } from "./schema/oauthToken.js";
import { ProfileEntity } from "./schema/profile.js";
import { SkillEntity } from "./schema/skill.js";
import { TaskEntity } from "./schema/task.js";
import { DocumentEntity } from "./schema/document.js";
import { MemoryTopicEntity } from "./schema/memoryTopic.js";
import { TaskFollowUpEntity } from "./schema/taskFollowUp.js";

export const ddb = {
  table: GremlinTable,
  entities: {
    CronJobTrigger: CronJobTriggerEntity,
    Document: DocumentEntity,
    OAuthToken: OAuthTokenEntity,
    Agent: AgentEntity,
    AgentJob: AgentJobEntity,
    AgentLog: AgentLogEntity,
    MemoryTopic: MemoryTopicEntity,
    Notification: NotificationEntity,
    Profile: ProfileEntity,
    Skill: SkillEntity,
    Task: TaskEntity,
    TaskFollowUp: TaskFollowUpEntity,
  },
} as const;

export type DDBResource = typeof ddb;
