import type { CodegenConfig } from "@graphql-codegen/cli";
import { allTypeDefs } from "./src/gql/schema/mergedTypeDefs.js";

const config: CodegenConfig = {
  schema: allTypeDefs,
  generates: {
    "src/gql/resolverTypes.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "./context.js#GremlinContext",
        mappers: {
          Agent: "../resources/ddb/schema/agent.js#AgentItem",
          AgentJob: "../resources/ddb/schema/agentJob.js#AgentJobItem",
          AgentLog: "../resources/ddb/schema/agentLog.js#AgentLogItem",
          AgentLogConnection:
            "../services/agentLogs/pagination.js#AgentLogConnectionModel",
          AgentLogEdge: "../services/agentLogs/pagination.js#AgentLogEdgeModel",
          AgentLogPageInfo: "../services/agentLogs/pagination.js#PageInfoModel",
          Document: "../resources/ddb/schema/document.js#DocumentItem",
          Avatar: "./schema/Avatar/resolvers.js#AvatarModel",
          IntegrationProvider:
            "../services/integrations/providers.js#IntegrationProviderDef",
          IntegrationConnection:
            "../services/integrations/getConnections.js#SafeIntegrationConnection",
          DefaultModel:
            "../services/integrations/getDefaultModel.js#DefaultModelResult",
          Notification:
            "../resources/ddb/schema/notification.js#NotificationItem",
          Profile: "../resources/ddb/schema/profile.js#ProfileItem",
          Skill: "../resources/ddb/schema/skill.js#SkillItem",
          Task: "../resources/ddb/schema/task.js#TaskItem",
          TaskConnection: "../services/tasks/pagination.js#TaskConnectionModel",
          TaskEdge: "../services/tasks/pagination.js#TaskEdgeModel",
          TaskPageInfo: "../services/tasks/pagination.js#TaskPageInfoModel",
          InboxItem: "../resources/ddb/schema/inboxItem.js#InboxItemItem",
        },
      },
    },
  },
};

export default config;
