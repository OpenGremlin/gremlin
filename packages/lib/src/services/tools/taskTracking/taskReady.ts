import { tool } from "ai";
import { z } from "zod";
import type { ServiceContext } from "../../context.js";
import { toolOk, wrapExecute } from "../toolResult.js";

export function taskReady(ctx: ServiceContext) {
  return tool({
    description:
      "List tasks ready to work on — unblocked, not deferred, and not closed. Use this to find the next actionable items.",
    inputSchema: z.object({
      assignee: z.string().optional().describe("Filter by assignee agent ID"),
      parentId: z
        .string()
        .optional()
        .describe("Filter to children of a specific parent task"),
      priority: z
        .number()
        .int()
        .min(0)
        .max(4)
        .optional()
        .describe("Filter by priority level"),
      limit: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe("Max results to return"),
    }),
    execute: wrapExecute(
      "taskReady",
      async ({ assignee, parentId, priority, limit }) => {
        const tasks = await ctx.services.tasks.getReadyWork(ctx, {
          assignee,
          parentId,
          priority,
        });
        return toolOk(tasks.slice(0, limit));
      },
    ),
  });
}
