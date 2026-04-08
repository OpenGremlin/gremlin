import { defineConfig } from "vitest/config";

export default defineConfig({
  define: {
    __DEV__: false,
  },
  // Use the automatic JSX runtime so tests can import .tsx components
  // without needing `import React` in scope. Mobile inherits this from
  // expo/tsconfig.base, but vitest uses esbuild which needs it set here.
  esbuild: {
    jsx: "automatic",
  },
  test: {
    environment: "node",
    alias: {
      "react-native": new URL("./__mocks__/react-native.ts", import.meta.url)
        .pathname,
      "expo-constants": new URL(
        "./__mocks__/expo-constants.ts",
        import.meta.url,
      ).pathname,
      "expo-secure-store": new URL(
        "./__mocks__/expo-secure-store.ts",
        import.meta.url,
      ).pathname,
      "@react-native-community/netinfo": new URL(
        "./__mocks__/@react-native-community/netinfo.ts",
        import.meta.url,
      ).pathname,
    },
  },
});
