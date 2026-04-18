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
          UserInputRequestStatus:
            "@opengremlin/lib/enums.js#UserInputRequestStatus",
          ToolName: "@opengremlin/lib/enums.js#ToolName",
        },
        mappers: {
          Agent: "@opengremlin/lib/resources/ddb/schema/agent.js#AgentItem",
          AgentJob:
            "@opengremlin/lib/resources/ddb/schema/agentJob.js#AgentJobItem",
          AgentLog:
            "@opengremlin/lib/resources/ddb/schema/agentLog.js#AgentLogItem",
          AgentLogConnection:
            "@opengremlin/lib/services/agentLogs/pagination.js#AgentLogConnectionModel",
          AgentLogEdge:
            "@opengremlin/lib/services/agentLogs/pagination.js#AgentLogEdgeModel",
          AgentLogPageInfo:
            "@opengremlin/lib/services/agentLogs/pagination.js#PageInfoModel",
          Avatar: "./schema/Avatar/resolvers.js#AvatarModel",
          Logo: "./schema/Logo/resolvers.js#LogoModel",
          IntegrationProvider:
            "@opengremlin/lib/services/integrations/providers.js#IntegrationProviderDef",
          IntegrationConnection:
            "@opengremlin/lib/services/integrations/getConnections.js#SafeIntegrationConnection",
          DefaultModel:
            "@opengremlin/lib/services/integrations/getDefaultModel.js#DefaultModelResult",
          UserInputRequest:
            "@opengremlin/lib/resources/ddb/schema/userInputRequest.js#UserInputRequestItem",
          Profile:
            "@opengremlin/lib/resources/ddb/schema/profile.js#ProfileItem",
          AgentSkill:
            "@opengremlin/lib/resources/ddb/schema/agentSkill.js#AgentSkillItem",
          SkillTemplate:
            "@opengremlin/lib/services/skills/registry.js#SkillTemplate as SkillTemplateModel",
          Task: "@opengremlin/lib/resources/ddb/schema/task.js#TaskItem",
          Webhook:
            "@opengremlin/lib/resources/ddb/schema/webhook.js#WebhookItem",
          WebhookKey:
            "@opengremlin/lib/resources/ddb/schema/webhookKey.js#WebhookKeyItem",
          TaskConnection:
            "@opengremlin/lib/services/tasks/pagination.js#TaskConnectionModel",
          TaskEdge:
            "@opengremlin/lib/services/tasks/pagination.js#TaskEdgeModel",
          TaskPageInfo:
            "@opengremlin/lib/services/tasks/pagination.js#TaskPageInfoModel",
        },
      },
    },
  },
};

export default config;
