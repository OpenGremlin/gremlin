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
          Avatar: "./schema/Avatar/resolvers.js#AvatarModel",
          Status: "../resources/ddb/schema/status.js#StatusItem",
          Integration:
            "../resources/ddb/schema/integration.js#IntegrationItem",
          Notification:
            "../resources/ddb/schema/notification.js#NotificationItem",
          Profile: "../resources/ddb/schema/profile.js#ProfileItem",
          Skill: "../resources/ddb/schema/skill.js#SkillItem",
        },
      },
    },
  },
};

export default config;
