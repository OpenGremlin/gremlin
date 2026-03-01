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
          AgentLogPageInfo:
            "../services/agentLogs/pagination.js#PageInfoModel",
          Avatar: "./schema/Avatar/resolvers.js#AvatarModel",
          Status: "../resources/ddb/schema/status.js#StatusItem",
          Integration:
            "../resources/ddb/schema/integration.js#IntegrationItem",
          Notification:
            "../resources/ddb/schema/notification.js#NotificationItem",
          Profile: "../resources/ddb/schema/profile.js#ProfileItem",
          Skill: "../resources/ddb/schema/skill.js#SkillItem",
          Task: "../resources/ddb/schema/task.js#TaskItem",
          TaskFollowUp:
            "../resources/ddb/schema/taskFollowUp.js#TaskFollowUpItem",
        },
      },
    },
  },
};

export default config;
