import { GremlinTable } from "./table.js";
import { AgentEntity } from "./schema/agent.js";
import { AgentJobEntity } from "./schema/agentJob.js";
import { FeedItemEntity } from "./schema/feedItem.js";
import { IntegrationEntity } from "./schema/integration.js";
import { NotificationEntity } from "./schema/notification.js";
import { ProfileEntity } from "./schema/profile.js";
import { SkillEntity } from "./schema/skill.js";

export const ddb = {
  table: GremlinTable,
  entities: {
    Agent: AgentEntity,
    AgentJob: AgentJobEntity,
    FeedItem: FeedItemEntity,
    Integration: IntegrationEntity,
    Notification: NotificationEntity,
    Profile: ProfileEntity,
    Skill: SkillEntity,
  },
} as const;

export type DDBResource = typeof ddb;
