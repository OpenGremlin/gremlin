import { GremlinTable } from "./table.js";
import { AgentEntity } from "./schema/agent.js";
import { AgentJobEntity } from "./schema/agentJob.js";
import { AgentLogEntity } from "./schema/agentLog.js";
import { StatusEntity } from "./schema/status.js";
import { IntegrationEntity } from "./schema/integration.js";
import { NotificationEntity } from "./schema/notification.js";
import { ProfileEntity } from "./schema/profile.js";
import { SkillEntity } from "./schema/skill.js";
import { TaskEntity } from "./schema/task.js";
import { TaskFollowUpEntity } from "./schema/taskFollowUp.js";

export const ddb = {
  table: GremlinTable,
  entities: {
    Agent: AgentEntity,
    AgentJob: AgentJobEntity,
    AgentLog: AgentLogEntity,
    Status: StatusEntity,
    Integration: IntegrationEntity,
    Notification: NotificationEntity,
    Profile: ProfileEntity,
    Skill: SkillEntity,
    Task: TaskEntity,
    TaskFollowUp: TaskFollowUpEntity,
  },
} as const;

export type DDBResource = typeof ddb;
