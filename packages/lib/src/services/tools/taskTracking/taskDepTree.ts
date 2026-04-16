import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import { toolOk, wrapExecute } from "../toolResult.js";

export function taskDepTree(ctx: ServiceContext) {
  return tool({
    description:
      "Show the full transitive dependency tree for a task — all tasks it depends on, recursively.",
    inputSchema: z.object({
      taskId: z
        .string()
        .describe("The task ID to show the dependency tree for"),
    }),
    execute: wrapExecute("taskDepTree", async ({ taskId }) => {
      const tree = await ctx.services.tasks.getTaskDepTree(ctx, taskId);
      return toolOk({ taskId, dependencies: tree });
    }),
  });
}
