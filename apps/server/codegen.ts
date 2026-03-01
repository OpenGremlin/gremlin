import type { CodegenConfig } from "@graphql-codegen/cli";
import { allTypeDefs } from "./src/gql/schema/mergedTypeDefs.js";

const config: CodegenConfig = {
  schema: allTypeDefs,
  generates: {
    "src/gql/resolverTypes.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "./context.js#Context",
        mappers: {
          Agent: "./schema/Agent/resolvers.js#AgentModel",
          FeedItem: "./schema/Feed/resolvers.js#FeedItemModel",
          Notification: "./schema/Notification/resolvers.js#NotificationModel",
        },
      },
    },
  },
};

export default config;
