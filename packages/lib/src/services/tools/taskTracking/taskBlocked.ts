import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import { toolOk, wrapExecute } from "../toolResult.js";

export function taskBlocked(ctx: ServiceContext) {
  return tool({
    description:
      "List tasks that are blocked — they have at least one dependency that is not yet closed.",
    inputSchema: z.object({
      parentId: z
        .string()
        .optional()
        .describe("Filter to children of a specific parent task"),
      assignee: z.string().optional().describe("Filter by assignee agent ID"),
    }),
    execute: wrapExecute("taskBlocked", async ({ parentId, assignee }) => {
      const tasks = await ctx.services.tasks.getBlockedTasks(ctx, {
        parentId,
        assignee,
      });
      return toolOk(tasks);
    }),
  });
}
