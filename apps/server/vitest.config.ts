import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    passWithNoTests: true,
    include: ["src/**/*.test.ts", "../../packages/lib/src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/cdk.out/**", "**/dist/**"],
  },
});
