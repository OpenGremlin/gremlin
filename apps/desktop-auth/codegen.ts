import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../server/schema.graphql",
  documents: ["src/renderer/graphql/queries/**/*.ts"],
  generates: {
    "./src/renderer/graphql/generated/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: false,
      },
      config: {
        documentMode: "string",
        scalars: {
          ID: { input: "string", output: "string" },
        },
      },
    },
  },
};

export default config;
