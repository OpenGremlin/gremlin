import { ChatTable } from "./chatTable.js";
import { AgentEntity } from "./schema/agent.js";
import { AgentJobEntity } from "./schema/agentJob.js";
import { AgentLogEntity } from "./schema/agentLog.js";
import { AgentSkillEntity } from "./schema/agentSkill.js";
import { CanvasSessionEntity } from "./schema/canvasSession.js";
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
import { WebhookEntity } from "./schema/webhook.js";
import { WebhookEventEntity } from "./schema/webhookEvent.js";
import { WebhookKeyEntity } from "./schema/webhookKey.js";
import { SecretsTable } from "./secretsTable.js";
import { GremlinTable } from "./table.js";

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
    CanvasSession: CanvasSessionEntity,
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
    Webhook: WebhookEntity,
    WebhookKey: WebhookKeyEntity,
    WebhookEvent: WebhookEventEntity,
  },
} as const;

export type DDBResource = typeof ddb;
