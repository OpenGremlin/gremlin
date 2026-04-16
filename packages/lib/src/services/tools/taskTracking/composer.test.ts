import { beforeEach, describe, expect, it } from "vitest";
import type { DeepMockProxy } from "vitest-mock-extended";
import { createMockContext } from "../../__testing__/mockContext.js";
import type { ServiceContext } from "../../context.js";
import { buildTaskLaneTools, buildTaskTrackingTools } from "./index.js";

describe("taskTracking composers", () => {
  let ctx: DeepMockProxy<ServiceContext>;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it("buildTaskLaneTools exposes worker-safe tools only", () => {
    const tools = buildTaskLaneTools(ctx);
    expect(Object.keys(tools).sort()).toEqual(
      ["taskCreate", "taskList", "taskReady", "taskShow", "taskUpdate"].sort(),
    );
  });

  it("buildTaskTrackingTools adds dependency management tools", () => {
    const tools = buildTaskTrackingTools(ctx);
    expect(Object.keys(tools).sort()).toEqual(
      [
        "taskCreate",
        "taskList",
        "taskReady",
        "taskShow",
        "taskUpdate",
        "taskDep",
        "taskDepTree",
        "taskBlocked",
      ].sort(),
    );
  });

  it("every tool has an execute function", () => {
    for (const [name, t] of Object.entries(buildTaskTrackingTools(ctx))) {
      expect(typeof t.execute, `${name}.execute should be a function`).toBe(
        "function",
      );
    }
  });
});
