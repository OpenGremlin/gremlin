import type { CodegenConfig } from "@graphql-codegen/cli";
import { allTypeDefs } from "./src/gql/schema/mergedTypeDefs.js";

const config: CodegenConfig = {
  schema: allTypeDefs,
  generates: {
    "src/gql/resolverTypes.ts": {
      plugins: ["typescript", "typescript-resolvers"],
      config: {
        contextType: "./context.js#Context",
      },
    },
  },
};

export default config;
