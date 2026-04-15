import { AgentEntity } from "./schema/agent.js";
import { AgentJobEntity } from "./schema/agentJob.js";
import { AgentLogEntity } from "./schema/agentLog.js";
import { AgentSkillEntity } from "./schema/agentSkill.js";
import { ChatLaneEntity } from "./schema/chatLane.js";
import { CommandApprovalEntity } from "./schema/commandApproval.js";
import { CronJobTriggerEntity } from "./schema/cronJobTrigger.js";
import { DefaultModelEntity } from "./schema/defaultModel.js";
import { EnabledModelsEntity } from "./schema/enabledModels.js";
import { GlobalSettingsEntity } from "./schema/globalSettings.js";
import { InboxItemEntity } from "./schema/inboxItem.js";
import { IntegrationConnectionEntity } from "./schema/integrationConnection.js";
import { ModelProviderKeyEntity } from "./schema/modelProviderKey.js";
import { PostEntity } from "./schema/post.js";
import { ProfileEntity } from "./schema/profile.js";
import { SettingEntity } from "./schema/setting.js";
import { SkillEntity } from "./schema/skill.js";
import { TaskEntity } from "./schema/task.js";
import { TaskAttachmentEntity } from "./schema/taskAttachment.js";
import { TaskCommentEntity } from "./schema/taskComment.js";
import { TaskDependencyEntity } from "./schema/taskDependency.js";
import { UserInputRequestEntity } from "./schema/userInputRequest.js";

import { ChatTable } from "./chatTable.js";
import { GremlinTable } from "./table.js";
import { SecretsTable } from "./secretsTable.js";

export const ddb = {
  table: GremlinTable,
  chatTable: ChatTable,
  secretsTable: SecretsTable,
  entities: {
    CronJobTrigger: CronJobTriggerEntity,
    DefaultModel: DefaultModelEntity,
    EnabledModels: EnabledModelsEntity,
    GlobalSettings: GlobalSettingsEntity,
    InboxItem: InboxItemEntity,
    IntegrationConnection: IntegrationConnectionEntity,
    ModelProviderKey: ModelProviderKeyEntity,
    Agent: AgentEntity,
    AgentJob: AgentJobEntity,
    AgentLog: AgentLogEntity,
    AgentSkill: AgentSkillEntity,
    ChatLane: ChatLaneEntity,

    CommandApproval: CommandApprovalEntity,
    Post: PostEntity,
    UserInputRequest: UserInputRequestEntity,
    Profile: ProfileEntity,
    Setting: SettingEntity,
    Skill: SkillEntity,
    Task: TaskEntity,
    TaskAttachment: TaskAttachmentEntity,
    TaskComment: TaskCommentEntity,
    TaskDependency: TaskDependencyEntity,
  },
} as const;

export type DDBResource = typeof ddb;
