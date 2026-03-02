import { GremlinTable } from "./table.js";
import { AgentEntity } from "./schema/agent.js";
import { AgentJobEntity } from "./schema/agentJob.js";
import { AgentLogEntity } from "./schema/agentLog.js";
import { CronJobTriggerEntity } from "./schema/cronJobTrigger.js";
import { IntegrationEntity } from "./schema/integration.js";
import { NotificationEntity } from "./schema/notification.js";
import { ProfileEntity } from "./schema/profile.js";
import { SkillEntity } from "./schema/skill.js";
import { TaskEntity } from "./schema/task.js";
import { DocumentEntity } from "./schema/document.js";
import { GoogleOAuthTokenEntity } from "./schema/googleOAuthToken.js";
import { SandboxVolumeEntity } from "./schema/sandboxVolume.js";
import { TaskFollowUpEntity } from "./schema/taskFollowUp.js";

export const ddb = {
  table: GremlinTable,
  entities: {
    CronJobTrigger: CronJobTriggerEntity,
    Document: DocumentEntity,
    GoogleOAuthToken: GoogleOAuthTokenEntity,
    Agent: AgentEntity,
    AgentJob: AgentJobEntity,
    AgentLog: AgentLogEntity,
    Integration: IntegrationEntity,
    Notification: NotificationEntity,
    Profile: ProfileEntity,
    SandboxVolume: SandboxVolumeEntity,
    Skill: SkillEntity,
    Task: TaskEntity,
    TaskFollowUp: TaskFollowUpEntity,
  },
} as const;

export type DDBResource = typeof ddb;
