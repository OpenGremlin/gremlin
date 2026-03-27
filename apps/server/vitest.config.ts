import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    conditions: ["import", "module", "default"],
  },
  test: {
    environment: "node",
    passWithNoTests: true,
    include: ["src/**/*.test.ts", "../../packages/lib/src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/cdk.out/**", "**/dist/**"],
  },
});
