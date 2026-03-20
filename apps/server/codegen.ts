import type { CodegenConfig } from "@graphql-codegen/cli";
import { allTypeDefs } from "./src/gql/schema/mergedTypeDefs.js";

const config: CodegenConfig = {
  schema: allTypeDefs,
  generates: {
    "src/gql/resolverTypes.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "./context.js#GremlinContext",
        enumValues: {
          NotificationStatus: "@gremlin/lib/enums.js#NotificationStatus",
          ToolName: "@gremlin/lib/enums.js#ToolName",
        },
        mappers: {
          Agent: "@gremlin/lib/resources/ddb/schema/agent.js#AgentItem",
          AgentJob:
            "@gremlin/lib/resources/ddb/schema/agentJob.js#AgentJobItem",
          AgentLog:
            "@gremlin/lib/resources/ddb/schema/agentLog.js#AgentLogItem",
          AgentLogConnection:
            "@gremlin/lib/services/agentLogs/pagination.js#AgentLogConnectionModel",
          AgentLogEdge:
            "@gremlin/lib/services/agentLogs/pagination.js#AgentLogEdgeModel",
          AgentLogPageInfo:
            "@gremlin/lib/services/agentLogs/pagination.js#PageInfoModel",
          Avatar: "./schema/Avatar/resolvers.js#AvatarModel",
          IntegrationProvider:
            "@gremlin/lib/services/integrations/providers.js#IntegrationProviderDef",
          IntegrationConnection:
            "@gremlin/lib/services/integrations/getConnections.js#SafeIntegrationConnection",
          DefaultModel:
            "@gremlin/lib/services/integrations/getDefaultModel.js#DefaultModelResult",
          Notification:
            "@gremlin/lib/resources/ddb/schema/notification.js#NotificationItem",
          Profile: "@gremlin/lib/resources/ddb/schema/profile.js#ProfileItem",
          AgentSkill:
            "@gremlin/lib/resources/ddb/schema/agentSkill.js#AgentSkillItem",
          SkillTemplate:
            "@gremlin/lib/services/skills/registry.js#SkillTemplate as SkillTemplateModel",
          Task: "@gremlin/lib/resources/ddb/schema/task.js#TaskItem",
          TaskConnection:
            "@gremlin/lib/services/tasks/pagination.js#TaskConnectionModel",
          TaskEdge: "@gremlin/lib/services/tasks/pagination.js#TaskEdgeModel",
          TaskPageInfo:
            "@gremlin/lib/services/tasks/pagination.js#TaskPageInfoModel",
        },
      },
    },
  },
};

export default config;
