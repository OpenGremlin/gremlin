import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import { ToolErrorCode, toolErr, toolOk, wrapExecute } from "../toolResult.js";

export function taskShow(ctx: ServiceContext) {
  return tool({
    description:
      "Show full details of a single task including dependencies, children, and latest comment.",
    inputSchema: z.object({
      taskId: z.string().describe("The task ID to look up"),
    }),
    execute: wrapExecute("taskShow", async ({ taskId }) => {
      const details = await ctx.services.tasks.showTask(ctx, taskId);
      if (!details) {
        return toolErr(
          ToolErrorCode.NotFound,
          `Task ${taskId} not found`,
          "Use `taskList` to discover valid task IDs before calling `taskShow`.",
        );
      }
      return toolOk(details);
    }),
  });
}
