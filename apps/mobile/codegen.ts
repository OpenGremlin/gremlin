import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "../server/schema.graphql",
  documents: ["src/graphql/queries/**/*.ts"],
  generates: {
    "./src/graphql/generated/": {
      preset: "client",
      presetConfig: {
        fragmentMasking: false,
      },
      config: {
        scalars: {
          ID: { input: "string", output: "string" },
        },
      },
    },
  },
};

export default config;
